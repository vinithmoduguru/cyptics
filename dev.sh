#!/bin/bash

# Cyptics Development Script
# Starts both backend and frontend for development

set -e

echo "🚀 Starting Cyptics Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"
    jobs -p | xargs -r kill
    exit 0
}

# Set up signal handling for clean shutdown
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Setting up backend...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    echo -e "${YELLOW}📚 Installing Python dependencies...${NC}"
    if ! pip install -r requirements.txt; then
        echo -e "${RED}❌ Failed to install Python dependencies${NC}"
        echo -e "${YELLOW}🔄 Trying to recreate virtual environment...${NC}"
        cd ..
        rm -rf backend/venv
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
        echo "# Backend Configuration" > .env
        echo "DATABASE_URL=sqlite:///./crypto_dashboard.db" >> .env
        echo "API_HOST=0.0.0.0" >> .env
        echo "API_PORT=8000" >> .env
        echo "DEBUG=True" >> .env
    fi
    
    # Start backend server
    echo -e "${GREEN}🚀 Starting backend server on http://localhost:8000${NC}"
    python3 run.py &
    BACKEND_PID=$!
    
    cd ..
    return 0
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🔧 Setting up frontend...${NC}"
    cd webapp
    
    # Install npm dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
        npm install
    fi
    
    # Start frontend server
    echo -e "${GREEN}🚀 Starting frontend server on http://localhost:5173${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    return 0
}

# Start both services
echo -e "${YELLOW}Starting services in parallel...${NC}"
echo ""

start_backend
sleep 2  # Give backend a moment to start

start_frontend
sleep 2  # Give frontend a moment to start

echo ""
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo -e "${BLUE}📖 Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}📖 API Docs: http://localhost:8000/docs${NC}"
echo -e "${BLUE}🌐 Frontend: http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for background processes
wait