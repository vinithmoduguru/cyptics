#!/bin/bash

# Crypto Dashboard API Startup Script

echo "🚀 Starting Crypto Dashboard API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file with default configuration..."
    cat > .env << EOL
# Backend Configuration
DATABASE_URL=sqlite:///./crypto_dashboard.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CoinGecko API (optional - add your API key if you have one)
# COINGECKO_API_KEY=your_api_key_here
EOL
    echo "✏️  .env file created with default settings"
fi

# Start the application
echo "🎯 Starting the API server..."
echo "📖 API Documentation will be available at: http://localhost:8000/docs"
echo "🏥 Health Check: http://localhost:8000/health"
echo ""

python3 run.py