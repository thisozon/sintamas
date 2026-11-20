# Membuat arsip ZIP deploy Sintamas Masjid Fatkhurrohmah.
# Jalankan dari dalam folder proyek: powershell -ExecutionPolicy Bypass -File .\build_sintamas_zip.ps1

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StageDir = Join-Path $ProjectRoot 'sintamas-app'
$ZipPath = Join-Path $ProjectRoot 'Sintamas-Masjid-Fatkhurrohmah.zip'

if (Test-Path $StageDir) { Remove-Item $StageDir -Recurse -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
New-Item -ItemType Directory -Path $StageDir | Out-Null

Copy-Item (Join-Path $ProjectRoot 'index.html') $StageDir
Copy-Item (Join-Path $ProjectRoot 'Code.gs') $StageDir
Copy-Item (Join-Path $ProjectRoot 'vercel.json') $StageDir
Copy-Item (Join-Path $ProjectRoot 'README.md') $StageDir

Compress-Archive -Path (Join-Path $StageDir '*') -DestinationPath $ZipPath

Remove-Item $StageDir -Recurse -Force

Write-Output "ZIP dibuat: $ZipPath"
