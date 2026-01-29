$ErrorActionPreference = "Stop"

# Run Backend (npm start) and Frontend (npx expo start -c) in separate PowerShell windows.
# Run this script from the project root: codeZoneMobile/

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "Backend"
$frontendDir = Join-Path $root "Frontend"

if (-not (Test-Path $backendDir)) { throw "Backend folder not found: $backendDir" }
if (-not (Test-Path $frontendDir)) { throw "Frontend folder not found: $frontendDir" }

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$backendDir`"; npm start"
)

Start-Sleep -Seconds 1

Write-Host "Starting Frontend (Expo)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$frontendDir`"; npx expo start -c"
)

Write-Host "Done. Two terminals should be open (Backend + Frontend)." -ForegroundColor Green

