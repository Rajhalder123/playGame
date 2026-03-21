# ============================================================
#  PlayAdda Backend — One-Click Setup Script for Windows
#  Run this in PowerShell as Administrator
# ============================================================
# HOW TO RUN:
#   Right-click PowerShell → "Run as Administrator"
#   cd c:\Users\aitra\Desktop\raj\playadda\playadda-backend
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup-local.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " PlayAdda Backend — Local Setup" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ──────────────────────────────────────────────
# 1. CHOCOLATEY (package manager for Windows)
# ──────────────────────────────────────────────
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "✅ Chocolatey installed" -ForegroundColor Green
} else {
    Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 2. POSTGRESQL
# ──────────────────────────────────────────────
$pgRunning = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "`n🐘 Installing PostgreSQL 15..." -ForegroundColor Yellow
    choco install postgresql15 --params "/Password:playadda_secret" -y
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Start-Service postgresql-x64-15 -ErrorAction SilentlyContinue
    Start-Sleep 3
    Write-Host "✅ PostgreSQL installed and running" -ForegroundColor Green
} else {
    Write-Host "✅ PostgreSQL already running on port 5432" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 3. CREATE DATABASE
# ──────────────────────────────────────────────
Write-Host "`n🗄️  Creating database 'playadda_db'..." -ForegroundColor Yellow
$pgBin = "C:\Program Files\PostgreSQL\15\bin"
if (Test-Path "$pgBin\psql.exe") {
    $env:PGPASSWORD = "playadda_secret"
    & "$pgBin\psql.exe" -U postgres -c "CREATE USER playadda WITH PASSWORD 'playadda_secret';" 2>&1 | Out-Null
    & "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE playadda_db OWNER playadda;" 2>&1 | Out-Null
    & "$pgBin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE playadda_db TO playadda;" 2>&1
    Write-Host "✅ Database 'playadda_db' ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  psql.exe not found at $pgBin — check PostgreSQL install path" -ForegroundColor Red
}

# ──────────────────────────────────────────────
# 4. REDIS (via Memurai — Redis for Windows)
# ──────────────────────────────────────────────
$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if (-not $redisRunning) {
    Write-Host "`n🔴 Installing Memurai (Redis for Windows)..." -ForegroundColor Yellow
    choco install memurai-developer -y
    Start-Sleep 3
    Write-Host "✅ Redis (Memurai) installed and running on port 6379" -ForegroundColor Green
} else {
    Write-Host "✅ Redis already running on port 6379" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 5. UPDATE .env
# ──────────────────────────────────────────────
Write-Host "`n⚙️  Updating .env..." -ForegroundColor Yellow
$envContent = @"
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=playadda
DB_PASSWORD=playadda_secret
DB_NAME=playadda_db
DB_SYNC=true
DB_LOGGING=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DISABLED=false

JWT_SECRET=playadda_super_secret_jwt_key_change_in_production_32chars
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

THROTTLE_TTL=60000
THROTTLE_LIMIT=100
"@
$envContent | Out-File -FilePath ".env" -Encoding utf8 -Force
Write-Host "✅ .env updated" -ForegroundColor Green

# ──────────────────────────────────────────────
# 6. START THE BACKEND
# ──────────────────────────────────────────────
Write-Host "`n🚀 Starting PlayAdda backend..." -ForegroundColor Cyan
Write-Host "   Swagger UI will open at: http://localhost:3000/api/docs`n" -ForegroundColor White

# Open browser after 5 seconds
Start-Job -ScriptBlock {
    Start-Sleep 7
    Start-Process "http://localhost:3000/api/docs"
}

npm run start:dev
