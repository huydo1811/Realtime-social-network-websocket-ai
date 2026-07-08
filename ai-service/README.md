# Hype Moderation AI Service

Vietnamese profanity classifier wrapping a fine-tuned **phoBERT-base-v2** binary classifier (`clean` vs `profanity`). Exposes a small FastAPI HTTP API consumed by the Java moderation module.

## Layout

```
ai-service/
├── app/
│   └── main.py             # FastAPI app + lazy-loaded Predictor
├── artifacts/
│   └── phobert_v1/         # copied from results_train_profanity_phoBERT/artifacts/phobert_v1
│       ├── model.safetensors
│       ├── vocab.txt
│       ├── bpe.codes
│       ├── tokenizer.json / tokenizer_config.json
│       ├── config.json
│       ├── serving_config.json
│       └── label_mapping.json
├── requirements.txt
└── README.md
```

## Local dev (sidecar)

### Windows (PowerShell)

```powershell
# From repo root, copy model artifacts once
mkdir ai-service\artifacts
Copy-Item -Recurse results_train_profanity_phoBERT\artifacts\phobert_v1 ai-service\artifacts\

# Install + run
cd ai-service
pip install -r requirements.txt
$env:MODEL_DIR = "$PWD\artifacts\phobert_v1"
$env:PYTHONIOENCODING = "utf-8"     # so the server can log Vietnamese text
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000  (GET /healthz to verify)

# Or just run the bundled helper:
.\run-local.ps1
```

> **Note:** PowerShell does not support `&&`. Use `;` or run each command on its own line. Use `.\run-local.ps1` for a one-shot start.

### macOS / Linux (bash)

```bash
# 1. From repo root, copy model artifacts
mkdir -p ai-service/artifacts
cp -r results_train_profanity_phoBERT/artifacts/phobert_v1 ai-service/artifacts/

# 2. Install + run
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export MODEL_DIR=$PWD/artifacts/phobert_v1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

> **Why no `underthesea`?** Its `underthesea-core` distribution only ships as source and needs the Rust toolchain (`maturin`) to build wheels on Windows + Python 3.13. Training still uses `underthesea.word_tokenize` (see `../results_train_profanity_phoBERT/`), but inference only needs a cheap normalizer (lowercase + collapse leet separators) before the phoBERT tokenizer — no Rust, no NLTK, no CRF suite.

## API

### `GET /healthz`

```json
{ "status": "ok", "model": "phobert_v1", "threshold": 0.24, "model_loaded": true }
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Đ.m mày nhìn cái c|ờ_|_ gì thế?"}'
```

```json
{
  "violation": true,
  "score": 0.91,
  "threshold": 0.24,
  "model": "phobert_v1",
  "reason": "profanity"
}
```

`threshold` (optional) lets the caller override the model's training-time threshold for experimentation; default uses the value from `serving_config.json`.

## Docker

```bash
docker build -f docker/moderation.Dockerfile -t hype-moderation .
docker run --rm -p 8000:8000 hype-moderation
```

## Train / retrain

Refer to `../results_train_profanity_phoBERT/train.py` for the offline training pipeline. After training, copy the new `phobert_v1` folder over `ai-service/artifacts/` and (optionally) bump the version folder name; update `MODEL_DIR` env var accordingly.

## Java client contract

The Spring `HttpTextModerationService` calls `POST /predict` and expects the JSON above. It treats any non-200 response (including 503 model_unavailable) as a fail-open condition.