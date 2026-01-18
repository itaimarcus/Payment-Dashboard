#!/bin/bash

# Payment Dashboard Setup Script
# This script helps you configure the environment variables needed to run the application

echo "=================================="
echo "Payment Dashboard Setup Wizard"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose command not found. Checking for docker compose plugin..."
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose:"
        echo "   https://docs.docker.com/compose/install/"
        exit 1
    else
        echo "✅ Docker Compose plugin is available"
        COMPOSE_CMD="docker compose"
    fi
else
    echo "✅ docker-compose is installed"
    COMPOSE_CMD="docker-compose"
fi

echo ""
echo "=================================="
echo "Auth0 Configuration"
echo "=================================="
echo ""
echo "You need an Auth0 account to continue."
echo "If you don't have one, create it here: https://auth0.com"
echo ""

read -p "Enter your Auth0 Domain (e.g., dev-xxxxx.auth0.com): " AUTH0_DOMAIN
read -p "Enter your Auth0 Client ID: " AUTH0_CLIENT_ID

echo ""
echo "=================================="
echo "TrueLayer Configuration"
echo "=================================="
echo ""
echo "You need a TrueLayer Sandbox account to continue."
echo "If you don't have one, create it here: https://console.truelayer.com"
echo ""

read -p "Enter your TrueLayer Client ID: " TRUELAYER_CLIENT_ID
read -p "Enter your TrueLayer Client Secret: " TRUELAYER_CLIENT_SECRET

echo ""
echo "=================================="
echo "Creating Configuration Files"
echo "=================================="
echo ""

# Create client .env file
cat > client/.env << EOF
VITE_AUTH0_DOMAIN=${AUTH0_DOMAIN}
VITE_AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://localhost:3001
EOF

echo "✅ Created client/.env"

# Create server .env file
cat > server/.env << EOF
PORT=3001
NODE_ENV=development

# Auth0
AUTH0_DOMAIN=${AUTH0_DOMAIN}
AUTH0_AUDIENCE=https://${AUTH0_DOMAIN}/api/v2/

# TrueLayer
TRUELAYER_CLIENT_ID=${TRUELAYER_CLIENT_ID}
TRUELAYER_CLIENT_SECRET=${TRUELAYER_CLIENT_SECRET}
TRUELAYER_SANDBOX_URL=https://api.truelayer-sandbox.com

# DynamoDB Local
DYNAMODB_ENDPOINT=http://dynamodb:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
EOF

echo "✅ Created server/.env"

echo ""
echo "=================================="
echo "Auth0 Configuration Checklist"
echo "=================================="
echo ""
echo "Please make sure you have configured the following in your Auth0 dashboard:"
echo ""
echo "1. Application Type: Single Page Application"
echo "2. Allowed Callback URLs: http://localhost:5173/callback"
echo "3. Allowed Logout URLs: http://localhost:5173"
echo "4. Allowed Web Origins: http://localhost:5173"
echo ""
read -p "Have you configured these settings? (y/n): " AUTH0_CONFIGURED

if [[ ! $AUTH0_CONFIGURED =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please configure Auth0 settings before running the application."
    echo "   Visit: https://manage.auth0.com/dashboard"
    echo ""
fi

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start the application, run:"
echo ""
echo "  ${COMPOSE_CMD} up"
echo ""
echo "Then open your browser to: http://localhost:5173"
echo ""
echo "To stop the application, press Ctrl+C and run:"
echo "  ${COMPOSE_CMD} down"
echo ""
echo "=================================="
