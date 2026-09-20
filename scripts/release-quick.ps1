param(
  [string]$Message = "Update assistant and voice recognition"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Type-checking"
npm run lint

Write-Host "==> Building web assets"
npm run build

Write-Host "==> Staging project changes"
git add -u
git add package.json electron\requirements-whisper.txt electron\whisper_worker.py scripts\release-quick.ps1

if (-not (git diff --cached --quiet)) {
  Write-Host "==> Committing"
  git commit -m $Message -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
}

Write-Host "==> Pushing main"
git push origin main

Write-Host "==> Packaging portable Windows executable"
npx electron-builder --win portable --x64

$exe = Join-Path (Get-Location) "release\Magic AI Assistant 1.0.0.exe"
if (-not (Test-Path $exe)) {
  throw "Portable executable was not created: $exe"
}

Write-Host "==> Launching $exe"
Start-Process -FilePath $exe
Write-Host "Release complete."
