Write-Host "Starting AEGIS Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn main:app --port 8000"

Write-Host "Starting AEGIS Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --open"

Write-Host "AEGIS Systems Online." -ForegroundColor Green
