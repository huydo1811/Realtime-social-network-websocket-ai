# run-local.ps1 — Windows PowerShell helper to start ai-service.
# Mirrors the Bash snippet in ai-service/README.md.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root
Write-Host "==> Python executable: $((Get-Command python).Source)"
python -c "import sys; print('==> Python version:', sys.version)"

# 1. Copy the fine-tuned model into ai-service/artifacts if missing.
$modelDir = Join-Path $root "artifacts\phobert_v1"
$imageDir = Join-Path $root "artifacts\image"
$imageModelPath = Join-Path $imageDir "best_pet_nonpet_efficientnet_b0.pth"
$imageMetaPath = Join-Path $imageDir "pet_filter_metadata.json"
$trainSrc = Join-Path $root "..\results_train_profanity_phoBERT\artifacts\phobert_v1"
if (-not (Test-Path $modelDir)) {
    if (Test-Path $trainSrc) {
        Write-Host "==> Copying model artifacts from $trainSrc"
        New-Item -ItemType Directory -Force -Path (Join-Path $root "artifacts") | Out-Null
        Copy-Item -Recurse -Force $trainSrc $modelDir
    } else {
        Write-Warning "No model artifacts found at $modelDir or $trainSrc."
        Write-Warning "Service will start but /predict will return 503 until model is provided."
    }
} else {
    Write-Host "==> Model artifacts already present at $modelDir"
}

if (-not (Test-Path $imageModelPath)) {
    Write-Warning "Image model not found at $imageModelPath."
    Write-Warning "POST /predict-image will return 503 until the file is provided."
} else {
    Write-Host "==> Image model found at $imageModelPath"
}

# 2. Install dependencies (no virtualenv to keep the dev loop simple).
Write-Host "==> Installing requirements..."
$env:PIP_DISABLE_PIP_VERSION_CHECK = "1"
$env:PIP_NO_CACHE_DIR = "1"
python -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }

# 3. Start uvicorn.
Write-Host "==> Starting FastAPI on http://localhost:8000"
$env:MODEL_DIR = $modelDir
$env:IMAGE_MODEL_PATH = $imageModelPath
$env:IMAGE_METADATA_PATH = $imageMetaPath
$env:PORT = "8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000