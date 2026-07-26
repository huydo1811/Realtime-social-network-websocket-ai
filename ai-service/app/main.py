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
import time
from io import BytesIO
from pathlib import Path
from typing import Optional

import requests
import torch
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from torchvision import transforms
from torchvision.models import efficientnet_b0
import torch.nn as nn

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


class ImagePredictor:
    """
    Lightweight image moderation classifier (pet vs non_pet).
    The model is loaded from a .pth state_dict plus optional metadata json.
    """

    def __init__(self, model_path: Path, metadata_path: Optional[Path] = None) -> None:
        self._model_path = model_path
        self._metadata_path = metadata_path
        self._lock = threading.Lock()
        self._model = None
        self._transform = None
        self._load_error: Optional[BaseException] = None
        self._img_size = 224
        self._mean = [0.485, 0.456, 0.406]
        self._std = [0.229, 0.224, 0.225]
        self._classes = ["non_pet", "pet"]
        self._threshold = float(os.getenv("IMAGE_MODERATION_THRESHOLD", "0.60"))
        self._model_name = "best_pet_nonpet_efficientnet_b0.pth"

    def warmup(self) -> None:
        try:
            self._ensure_loaded()
            log.info("Image predictor ready (model=%s, threshold=%.2f)", self._model_name, self._threshold)
        except Exception as exc:
            self._load_error = exc
            log.exception("Failed to warmup image predictor: %s", exc)

    def _load_metadata(self) -> None:
        if self._metadata_path is None or not self._metadata_path.exists():
            return
        cfg = json.loads(self._metadata_path.read_text(encoding="utf-8"))
        self._img_size = int(cfg.get("img_size", self._img_size))
        self._mean = list(cfg.get("normalize_mean", self._mean))
        self._std = list(cfg.get("normalize_std", self._std))
        classes = cfg.get("classes")
        if isinstance(classes, list) and len(classes) >= 2:
            self._classes = [str(x) for x in classes]
        model_name = cfg.get("weights_file")
        if isinstance(model_name, str) and model_name.strip():
            self._model_name = model_name.strip()
        threshold = cfg.get("non_pet_threshold")
        if isinstance(threshold, (int, float)):
            self._threshold = float(threshold)

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._transform is not None:
            return
        with self._lock:
            if self._model is not None and self._transform is not None:
                return
            if not self._model_path.exists():
                raise FileNotFoundError(f"image_model_not_found:{self._model_path}")
            self._load_metadata()
            num_classes = max(2, len(self._classes))
            model = efficientnet_b0(weights=None)
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
            state_dict = torch.load(str(self._model_path), map_location="cpu")
            model.load_state_dict(state_dict)
            model.eval()
            if torch.cuda.is_available():
                model.to("cuda")
            self._model = model
            self._transform = transforms.Compose([
                transforms.Resize((self._img_size, self._img_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=self._mean, std=self._std),
            ])

    def _class_index(self, choices: list[str]) -> Optional[int]:
        lowered = [x.strip().lower() for x in self._classes]
        for choice in choices:
            if choice in lowered:
                return lowered.index(choice)
        return None

    def _resolve_non_pet_score(self, probs: torch.Tensor) -> float:
        non_pet_idx = self._class_index(["non_pet", "nonpet", "not_pet", "other"])
        pet_idx = self._class_index(["pet"])
        if non_pet_idx is not None:
            return float(probs[non_pet_idx].item())
        if pet_idx is not None:
            return float(1.0 - probs[pet_idx].item())
        # fallback for unknown labels
        top_idx = int(torch.argmax(probs).item())
        top_label = self._classes[top_idx].strip().lower()
        if "non" in top_label and "pet" in top_label:
            return float(probs[top_idx].item())
        return float(1.0 - probs[top_idx].item())

    @staticmethod
    def _download_url(image_url: str) -> str:
        """Prefer a small Cloudinary derivative so download + decode stay fast."""
        url = image_url.strip()
        marker = "/upload/"
        if "res.cloudinary.com" in url and marker in url and "/w_" not in url:
            return url.replace(marker, f"{marker}w_256,h_256,c_fill,f_jpg,q_auto/", 1)
        return url

    def predict(self, image_url: str) -> dict:
        if self._load_error is not None:
            raise self._load_error
        self._ensure_loaded()
        if not isinstance(image_url, str) or not image_url.strip():
            return {
                "violation": False,
                "score": 0.0,
                "threshold": self._threshold,
                "model": self._model_name,
                "reason": "empty_url",
                "predicted_label": "unknown",
            }
        wall_started = time.perf_counter()
        started = torch.cuda.Event(enable_timing=True) if torch.cuda.is_available() else None
        ended = torch.cuda.Event(enable_timing=True) if torch.cuda.is_available() else None
        try:
            download_url = self._download_url(image_url)
            res = requests.get(download_url, timeout=(3, 12))
            res.raise_for_status()
            image = Image.open(BytesIO(res.content)).convert("RGB")
            x = self._transform(image).unsqueeze(0)
            if torch.cuda.is_available():
                x = x.to("cuda")
            if started is not None and ended is not None:
                started.record()
            with torch.no_grad():
                logits = self._model(x)
            probs = torch.softmax(logits[0], dim=0)
            if started is not None and ended is not None:
                ended.record()
                torch.cuda.synchronize()
                inference_ms = int(started.elapsed_time(ended))
            else:
                inference_ms = int((time.perf_counter() - wall_started) * 1000)
            top_idx = int(torch.argmax(probs).item())
            top_label = self._classes[top_idx] if top_idx < len(self._classes) else "unknown"
            non_pet_score = self._resolve_non_pet_score(probs)
            violation = non_pet_score >= self._threshold
            return {
                "violation": violation,
                "score": non_pet_score,
                "threshold": self._threshold,
                "model": self._model_name,
                "reason": "non_pet_detected" if violation else "pet_or_uncertain",
                "predicted_label": top_label,
                "inference_ms": inference_ms,
            }
        except Exception as exc:
            raise RuntimeError(f"image_predict_failed:{exc}") from exc


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/workspace/artifacts/phobert_v1")).resolve()
IMAGE_MODEL_PATH = Path(
    os.getenv("IMAGE_MODEL_PATH", "/workspace/artifacts/image/best_pet_nonpet_efficientnet_b0.pth")
).resolve()
IMAGE_METADATA_PATH_RAW = os.getenv(
    "IMAGE_METADATA_PATH", "/workspace/artifacts/image/pet_filter_metadata.json"
).strip()
IMAGE_METADATA_PATH = Path(IMAGE_METADATA_PATH_RAW).resolve() if IMAGE_METADATA_PATH_RAW else None

app = FastAPI(
    title="Hype Moderation Service",
    version="1.0.0",
    description="Vietnamese profanity classifier powered by phoBERT-base-v2.",
)
predictor = Predictor(MODEL_DIR)
image_predictor = ImagePredictor(IMAGE_MODEL_PATH, IMAGE_METADATA_PATH)


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    violation: bool
    score: float
    threshold: float
    model: str
    reason: str


class PredictImageRequest(BaseModel):
    imageUrl: str = Field(..., min_length=1, max_length=2048)
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class PredictImageResponse(BaseModel):
    violation: bool
    score: float
    threshold: float
    model: str
    reason: str
    predicted_label: str


class HealthResponse(BaseModel):
    status: str
    model: str
    threshold: float
    model_loaded: bool
    image_model: str
    image_threshold: float
    image_model_loaded: bool


@app.on_event("startup")
def _startup() -> None:
    try:
        predictor.warmup()
    except Exception:
        log.warning("Service started without model; predict() will return errors.")
    image_predictor.warmup()


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    degraded = predictor._load_error is not None or image_predictor._load_error is not None
    return HealthResponse(
        status="ok" if not degraded else "degraded",
        model=predictor._model_name,
        threshold=predictor._threshold,
        model_loaded=predictor._model is not None,
        image_model=image_predictor._model_name,
        image_threshold=image_predictor._threshold,
        image_model_loaded=image_predictor._model is not None,
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


@app.post("/predict-image", response_model=PredictImageResponse)
def predict_image(req: PredictImageRequest) -> PredictImageResponse:
    try:
        result = image_predictor.predict(req.imageUrl)
    except Exception as exc:
        log.exception("Predict image failed: %s", exc)
        raise HTTPException(status_code=503, detail=f"image_model_unavailable: {exc}") from exc
    if req.threshold is not None:
        result = {**result, "threshold": req.threshold, "violation": result["score"] >= req.threshold}
    return PredictImageResponse(**result)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)