# Payment Dashboard Setup Script for Windows (PowerShell)
# This script helps you configure the environment variables needed to run the application

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Payment Dashboard Setup Wizard" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker first:" -ForegroundColor Red
    Write-Host "   https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if docker-compose is available
$composeCmd = "docker-compose"
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ docker-compose is installed: $composeVersion" -ForegroundColor Green
} catch {
    try {
        $composeVersion = docker compose version
        Write-Host "✅ Docker Compose plugin is available: $composeVersion" -ForegroundColor Green
        $composeCmd = "docker compose"
    } catch {
        Write-Host "❌ Docker Compose is not installed. Please install Docker Compose:" -ForegroundColor Red
        Write-Host "   https://docs.docker.com/compose/install/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Auth0 Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need an Auth0 account to continue." -ForegroundColor Yellow
Write-Host "If you don't have one, create it here: https://auth0.com" -ForegroundColor Yellow
Write-Host ""

$AUTH0_DOMAIN = Read-Host "Enter your Auth0 Domain (e.g., dev-xxxxx.auth0.com)"
$AUTH0_CLIENT_ID = Read-Host "Enter your Auth0 Client ID"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TrueLayer Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need a TrueLayer Sandbox account to continue." -ForegroundColor Yellow
Write-Host "If you don't have one, create it here: https://console.truelayer.com" -ForegroundColor Yellow
Write-Host ""

$TRUELAYER_CLIENT_ID = Read-Host "Enter your TrueLayer Client ID"
$TRUELAYER_CLIENT_SECRET = Read-Host "Enter your TrueLayer Client Secret"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Creating Configuration Files" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Create client .env file
$clientEnvContent = @"
VITE_AUTH0_DOMAIN=$AUTH0_DOMAIN
VITE_AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://localhost:3001
"@

Set-Content -Path "client\.env" -Value $clientEnvContent
Write-Host "✅ Created client\.env" -ForegroundColor Green

# Create server .env file
$serverEnvContent = @"
PORT=3001
NODE_ENV=development

# Auth0
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=https://$AUTH0_DOMAIN/api/v2/

# TrueLayer
TRUELAYER_CLIENT_ID=$TRUELAYER_CLIENT_ID
TRUELAYER_CLIENT_SECRET=$TRUELAYER_CLIENT_SECRET
TRUELAYER_SANDBOX_URL=https://api.truelayer-sandbox.com

# DynamoDB Local
DYNAMODB_ENDPOINT=http://dynamodb:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
"@

Set-Content -Path "server\.env" -Value $serverEnvContent
Write-Host "✅ Created server\.env" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Auth0 Configuration Checklist" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please make sure you have configured the following in your Auth0 dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Application Type: Single Page Application"
Write-Host "2. Allowed Callback URLs: http://localhost:5173/callback"
Write-Host "3. Allowed Logout URLs: http://localhost:5173"
Write-Host "4. Allowed Web Origins: http://localhost:5173"
Write-Host ""

$AUTH0_CONFIGURED = Read-Host "Have you configured these settings? (y/n)"

if ($AUTH0_CONFIGURED -notmatch "^[Yy]$") {
    Write-Host ""
    Write-Host "⚠️  Please configure Auth0 settings before running the application." -ForegroundColor Yellow
    Write-Host "   Visit: https://manage.auth0.com/dashboard" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $composeCmd up" -ForegroundColor White
Write-Host ""
Write-Host "Then open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the application, press Ctrl+C and run:" -ForegroundColor Yellow
Write-Host "  $composeCmd down" -ForegroundColor White
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
