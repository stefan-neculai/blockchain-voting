# Blockchain Voting Project - Start Script
# Run this from the project root: .\start-project.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blockchain Voting Project Launcher   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exist
if (-not (Test-Path ".\packages\hardhat\node_modules")) {
    Write-Host "[1/4] Installing Hardhat dependencies..." -ForegroundColor Yellow
    Set-Location ".\packages\hardhat"
    npm install
    Set-Location "..\..\"
} else {
    Write-Host "[1/4] Hardhat dependencies OK" -ForegroundColor Green
}

if (-not (Test-Path ".\react-app\node_modules")) {
    Write-Host "[2/4] Installing React dependencies..." -ForegroundColor Yellow
    Set-Location ".\react-app"
    npm install
    Set-Location "..\"
} else {
    Write-Host "[2/4] React dependencies OK" -ForegroundColor Green
}

# Start Hardhat node in new terminal
Write-Host "[3/4] Starting Hardhat local blockchain..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\packages\hardhat'; Write-Host 'Starting Hardhat Node...' -ForegroundColor Cyan; npx hardhat node"

# Wait for node to start
Write-Host "     Waiting for blockchain to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Deploy contracts in new terminal
Write-Host "[4/4] Deploying contracts..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\packages\hardhat'; Write-Host 'Deploying contracts...' -ForegroundColor Cyan; npx hardhat run scripts/deployAnonymousVoting.ts --network localhost; Write-Host 'Contracts deployed! You can close this window.' -ForegroundColor Green; Read-Host 'Press Enter to close'"

# Wait for deployment
Start-Sleep -Seconds 8

# Start React app
Write-Host ""
Write-Host "Starting React frontend..." -ForegroundColor Yellow
Write-Host "Opening http://localhost:3000 in browser..." -ForegroundColor Gray
Write-Host ""

Set-Location ".\react-app"
Start-Process "http://localhost:3000"
npm start
