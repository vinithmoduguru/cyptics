# Crypto Dashboard API Backend

A FastAPI-based backend service for a cryptocurrency dashboard that integrates
with the CoinGecko API.

## Features

- 🚀 **FastAPI**: High-performance, modern Python web framework
- 📊 **CoinGecko Integration**: Fetches real-time cryptocurrency data
- 🗄️ **SQLAlchemy**: Async database operations with SQLite/PostgreSQL support
- 📈 **Price History**: Stores and retrieves historical price data
- 🔄 **Background Tasks**: Asynchronous data synchronization
- 📚 **Auto Documentation**: Interactive API docs with Swagger UI
- ⚡ **Caching**: Intelligent data caching for better performance

## API Endpoints

### Cryptocurrency Data

- `GET /api/v1/crypto/top/{limit}` - Get top N cryptocurrencies by market cap
- `GET /api/v1/crypto/{crypto_id}` - Get detailed information about a specific
  cryptocurrency
- `GET /api/v1/crypto/{crypto_id}/price-trend` - Get historical price trends

### Data Management

- `POST /api/v1/crypto/sync-top-cryptos` - Manually sync top cryptocurrencies
- `DELETE /api/v1/crypto/cleanup-old-data` - Clean up old price history data

### Health & Status

- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation
- `GET /redoc` - ReDoc API documentation

## Quick Start

### 1. Setup Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.template .env

# Edit .env file with your settings (optional)
```

### 3. Run the Application

```bash
# Development server
python run.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- **API Base**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration settings
│   │   └── database.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── cryptocurrency.py  # Cryptocurrency model
│   │   └── price_history.py   # Price history model
│   ├── routes/
│   │   ├── __init__.py
│   │   └── crypto.py        # Cryptocurrency routes
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── crypto.py        # Pydantic schemas
│   └── services/
│       ├── __init__.py
│       ├── coingecko.py     # CoinGecko API service
│       └── crud.py          # Database CRUD operations
├── requirements.txt         # Python dependencies
├── .env.template           # Environment variables template
├── .gitignore             # Git ignore rules
└── run.py                 # Application entry point
```

## Usage Examples

### Get Top 10 Cryptocurrencies

```bash
curl "http://localhost:8000/api/v1/crypto/top/10"
```

### Get Bitcoin Price Trend (Last 30 Days)

```bash
curl "http://localhost:8000/api/v1/crypto/bitcoin/price-trend?days=30"
```

### Get Specific Cryptocurrency Details

```bash
curl "http://localhost:8000/api/v1/crypto/ethereum"
```

### Sync Fresh Data from CoinGecko

```bash
curl -X POST "http://localhost:8000/api/v1/crypto/sync-top-cryptos?limit=10"
```

## Configuration

### Environment Variables

| Variable                         | Description                  | Default                          |
| -------------------------------- | ---------------------------- | -------------------------------- |
| `APP_NAME`                       | Application name             | "Crypto Dashboard API"           |
| `DEBUG`                          | Debug mode                   | false                            |
| `DATABASE_URL`                   | Database connection URL      | SQLite file                      |
| `COINGECKO_API_URL`              | CoinGecko API base URL       | https://api.coingecko.com/api/v3 |
| `COINGECKO_API_KEY`              | CoinGecko API key (optional) | None                             |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | API rate limit               | 30                               |
| `CACHE_TTL_SECONDS`              | Cache TTL                    | 300                              |

### Database Options

#### SQLite (Default)

```bash
DATABASE_URL="sqlite+aiosqlite:///./crypto_dashboard.db"
```

#### PostgreSQL (Production)

```bash
DATABASE_URL="postgresql+asyncpg://username:password@localhost/crypto_dashboard"
```

## Data Flow

1. **API Request**: Client requests cryptocurrency data
2. **Database Check**: System checks local database first
3. **CoinGecko Fallback**: If data is missing/stale, fetches from CoinGecko API
4. **Background Sync**: Updates local database asynchronously
5. **Response**: Returns data to client immediately

## Key Features Explained

### Smart Caching

- Data is cached in the local database
- Fresh data is fetched from CoinGecko when needed
- Background synchronization keeps data up-to-date

### Error Handling

- Graceful fallbacks when APIs are unavailable
- Comprehensive error logging
- User-friendly error messages

### Performance Optimization

- Async/await throughout for non-blocking operations
- Database connection pooling
- Efficient database queries with proper indexing

## Development

### Running Tests

```bash
pytest
```

### Code Quality

The codebase follows Python best practices:

- Type hints throughout
- Comprehensive docstrings
- Async/await patterns
- Proper error handling
- Clean architecture with separation of concerns

## Production Deployment

### Using Gunicorn

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## API Rate Limits

- CoinGecko API: 30 requests/minute (free tier)
- Upgrade to CoinGecko Pro for higher limits
- Local database reduces API calls through caching

## Support

For issues or questions about the API, please check:

1. API documentation at `/docs`
2. Health endpoint at `/health`
3. Logs for error details

## License

MIT License - see LICENSE file for details.
