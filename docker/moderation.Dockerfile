# Picked for size (slim) and reasonable wheels for torch/transformers.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    MODEL_DIR=/workspace/artifacts/phobert_v1 \
    IMAGE_MODEL_PATH=/workspace/artifacts/image/best_pet_nonpet_efficientnet_b0.pth \
    IMAGE_METADATA_PATH=/workspace/artifacts/image/pet_filter_metadata.json \
    PORT=8000

WORKDIR /workspace

# System deps for torch CPU wheels and curl for healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY artifacts ./artifacts

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fsS http://localhost:8000/healthz || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]