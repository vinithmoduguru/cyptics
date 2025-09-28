#!/bin/bash

# Crypto Dashboard Backend Development Script
# Optimized for development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Crypto Dashboard Backend...${NC}"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
echo -e "${YELLOW}📚 Installing dependencies...${NC}"
pip install -r requirements.txt > /dev/null 2>&1

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
    cat > .env << EOL
# Backend Configuration
DATABASE_URL=sqlite:///./crypto_dashboard.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CoinGecko API (optional - add your API key if you have one)
# COINGECKO_API_KEY=your_api_key_here
EOL
    echo -e "${GREEN}✏️  .env file created with default configuration${NC}"
fi

# Initialize database if needed
if [ ! -f "crypto_dashboard.db" ]; then
    echo -e "${YELLOW}🗄️  Initializing database...${NC}"
fi

# Start the application
echo ""
echo -e "${GREEN}🎯 Starting the API server...${NC}"
echo -e "${BLUE}📖 API Documentation: http://localhost:8000/docs${NC}"
echo -e "${BLUE}🏥 Health Check: http://localhost:8000/health${NC}"
echo -e "${BLUE}🔍 Interactive API: http://localhost:8000/redoc${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Run with auto-reload for development
python3 run.py