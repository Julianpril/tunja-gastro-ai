$rootPath = Get-Location

Write-Host "Iniciando Tunja Gastro AI..." -ForegroundColor Green

# 1. Iniciar Backend (FastAPI) en una nueva ventana
Write-Host "Lanzando Backend (Puerto 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$rootPath'; .\.venv\Scripts\Activate.ps1; uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 }"

# 2. Iniciar Frontend (Expo) en una nueva ventana
Write-Host "Lanzando Frontend (Expo)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$rootPath\app'; npx expo start }"

Write-Host "¡Todo listo! Revisa las nuevas ventanas de PowerShell. VIVA PETRO!!!!" -ForegroundColor Green
    