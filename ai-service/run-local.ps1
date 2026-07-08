# run-local.ps1 — Windows PowerShell helper to start ai-service.
# Mirrors the Bash snippet in ai-service/README.md.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

# 1. Copy the fine-tuned model into ai-service/artifacts if missing.
$modelDir = Join-Path $root "artifacts\phobert_v1"
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

# 2. Install dependencies (no virtualenv to keep the dev loop simple).
Write-Host "==> Installing requirements..."
$env:PIP_DISABLE_PIP_VERSION_CHECK = "1"
$env:PIP_NO_CACHE_DIR = "1"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }

# 3. Start uvicorn.
Write-Host "==> Starting FastAPI on http://localhost:8000"
$env:MODEL_DIR = $modelDir
$env:PORT = "8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000