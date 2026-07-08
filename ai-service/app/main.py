"""
Vietnamese profanity classification service.

Wraps a fine-tuned phoBERT-base-v2 binary classifier (clean vs profanity)
and exposes a small HTTP API consumable by the Java moderation module.
"""
from __future__ import annotations

import json
import logging
import os
import re
import threading
from pathlib import Path
from typing import Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("moderation")


# ---------------------------------------------------------------------------
# Lightweight Vietnamese tokenization (replaces underthesea.word_tokenize)
# ---------------------------------------------------------------------------
#
# Why no underthesea:
#   - underthesea-core 1.0.x ships only as a source distribution that needs
#     the Rust toolchain (maturin) to build wheels on Python 3.13 / Windows.
#   - At *inference* time the phoBERT tokenizer already handles sub-word
#     tokenization; we only need a cheap normalization that collapses
#     separator characters (leet/teencode: đ.m, c|ờ_|_) so the base tokenizer
#     can still recover reasonable word pieces.
#
# This keeps the deployable footprint tiny (no Rust toolchain, no NLTK, no
# python-crfsuite) and the cold start fast. Training still uses
# `underthesea.word_tokenize` in train.py — that path is offline and is
# already resolved by the existing `requirements.txt` shipped with the
# training folder.

_VI_ACCENTED_VOWELS = (
    "aáàảãạăắằẳẵặâấầẩẫậ"
    "eéèẻẽẹêếềểễệ"
    "iíìỉĩị"
    "oóòỏõọôốồổỗộơớờởỡợ"
    "uúùủũụưứừửữự"
    "yýỳỷỹỳ"
    "AÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ"
    "EÉÈẺẼẸÊẾỀỂỄỆ"
    "IÍÌỈĨỊ"
    "OÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ"
    "UÚÙỦŨỤƯỨỪỬỮỰ"
    "YÝỲỶỸỴ"
)
# Characters commonly inserted between syllables in Vietnamese teencode / leet.
# These get collapsed to a space so the base tokenizer can join them.
_INSERTED_SEPARATORS = re.compile(
    r"[\u200b\u200c\u200d._\*\|\-–—~^`´'\"\\\/\?!\(\)\[\]\{\}<>@#\$%\^&\+=]"
)
# Repeated punctuation, used to truncate runs.
_REDUNDANT_RUN = re.compile(r"([\W_])\1{2,}", re.UNICODE)


def normalize_vi_comment(text: str) -> str:
    """Pure-Python Vietnamese text normalizer (lowercase + collapse leet/teencode)."""
    if not isinstance(text, str):
        return ""
    # NFC so accent composition is canonical for the tokenizer.
    text = text.strip().lower()
    text = _INSERTED_SEPARATORS.sub(" ", text)
    text = _REDUNDANT_RUN.sub(r"\1", text)
    # Collapse any run of whitespace into a single space.
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Predictor (singleton, lazy-loaded)
# ---------------------------------------------------------------------------

class Predictor:
    def __init__(self, model_dir: Path) -> None:
        self._model_dir = model_dir
        self._lock = threading.Lock()
        self._tokenizer = None
        self._model = None
        self._max_length = 160
        self._threshold = 0.24
        self._model_name = model_dir.name
        self._load_error: Optional[BaseException] = None

    def warmup(self) -> None:
        try:
            self._ensure_loaded()
            log.info("Predictor ready (model=%s, threshold=%.2f)", self._model_name, self._threshold)
        except Exception as exc:
            self._load_error = exc
            log.exception("Failed to warmup predictor: %s", exc)
            raise

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._tokenizer is not None:
            return
        with self._lock:
            if self._model is not None and self._tokenizer is not None:
                return
            serving_cfg_path = self._model_dir / "serving_config.json"
            if serving_cfg_path.exists():
                cfg = json.loads(serving_cfg_path.read_text(encoding="utf-8"))
                self._max_length = int(cfg.get("max_length", 160))
                self._threshold = float(cfg.get("threshold", 0.24))
                self._model_name = cfg.get("model_name", self._model_name)

            self._tokenizer = AutoTokenizer.from_pretrained(str(self._model_dir))
            self._model = AutoModelForSequenceClassification.from_pretrained(str(self._model_dir))
            self._model.eval()
            if torch.cuda.is_available():
                self._model.to("cuda")

    def predict(self, text: str) -> dict:
        if self._load_error is not None:
            raise self._load_error
        self._ensure_loaded()
        clean = normalize_vi_comment(text)
        if not clean:
            return {
                "violation": False,
                "score": 0.0,
                "threshold": self._threshold,
                "model": self._model_name,
                "reason": "empty",
            }
        inputs = self._tokenizer(
            clean,
            return_tensors="pt",
            truncation=True,
            max_length=self._max_length,
            padding="max_length",
        )
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            logits = self._model(**inputs).logits
        probs = torch.softmax(logits, dim=1)
        score = float(probs[0][1].item())
        violation = score >= self._threshold
        return {
            "violation": violation,
            "score": score,
            "threshold": self._threshold,
            "model": self._model_name,
            "reason": "profanity" if violation else "clean",
        }


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/workspace/artifacts/phobert_v1")).resolve()

app = FastAPI(
    title="Hype Moderation Service",
    version="1.0.0",
    description="Vietnamese profanity classifier powered by phoBERT-base-v2.",
)
predictor = Predictor(MODEL_DIR)


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    violation: bool
    score: float
    threshold: float
    model: str
    reason: str


class HealthResponse(BaseModel):
    status: str
    model: str
    threshold: float
    model_loaded: bool


@app.on_event("startup")
def _startup() -> None:
    try:
        predictor.warmup()
    except Exception:
        log.warning("Service started without model; predict() will return errors.")


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    return HealthResponse(
        status="ok" if predictor._load_error is None else "degraded",
        model=predictor._model_name,
        threshold=predictor._threshold,
        model_loaded=predictor._model is not None,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    try:
        result = predictor.predict(req.text)
    except Exception as exc:
        log.exception("Predict failed: %s", exc)
        raise HTTPException(status_code=503, detail=f"model_unavailable: {exc}") from exc
    if req.threshold is not None:
        result = {**result, "threshold": req.threshold, "violation": result["score"] >= req.threshold}
    return PredictResponse(**result)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)