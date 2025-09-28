# Cyptics - Crypto Dashboard

A full-stack cryptocurrency dashboard application built with FastAPI (backend)
and React + TypeScript (frontend). Features real-time crypto data, watchlist
management, and interactive Q&A assistant.

**🚀 Live Demo**: https://cryptics-webapp.netlify.app **📚 API Docs**:
https://cyptics.onrender.com/docs

## Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **Git** (for version control)

### 🚀 One-Command Development

Start both backend and frontend servers with a single command:

```bash
# Make sure you're in the root directory
./dev.sh
```

or if you have npm installed:

```bash
npm run dev
```

This will:

- ✅ Set up Python virtual environment (if needed)
- ✅ Install backend dependencies
- ✅ Install frontend dependencies (if needed)
- ✅ Start backend server on `http://localhost:8000`
- ✅ Start frontend dev server on `http://localhost:5173`

Press `Ctrl+C` to stop both servers.

## Manual Development

### Backend Only

```bash
cd backend
./dev.sh
# or
./start.sh
```

**Backend URLs:**

- 🌐 API: http://localhost:8000
- 📖 API Docs: http://localhost:8000/docs
- 🔍 ReDoc: http://localhost:8000/redoc
- 🏥 Health Check: http://localhost:8000/health

**Production URLs:**

- 🌐 API: https://cyptics.onrender.com/api/v1
- 📖 API Docs: https://cyptics.onrender.com/docs
- 🔍 ReDoc: https://cyptics.onrender.com/redoc
- 🏥 Health Check: https://cyptics.onrender.com/health
- 🌐 Frontend App: https://cryptics-webapp.netlify.app

### Frontend Only

```bash
cd webapp
npm install  # first time only
npm run dev
```

**Frontend URL:**

- 🌐 App: http://localhost:5173

## Available Scripts

### Root Directory Commands

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start both backend & frontend |
| `npm run dev:backend`  | Start backend only            |
| `npm run dev:frontend` | Start frontend only           |
| `npm run install:all`  | Install all dependencies      |
| `npm run build`        | Build frontend for production |
| `npm run test`         | Run backend tests             |
| `npm run clean`        | Clean all build artifacts     |

### Backend Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `./dev.sh`          | Start development server     |
| `./start.sh`        | Start production-like server |
| `python3 run.py`    | Direct server start          |
| `python3 -m pytest` | Run tests                    |

### Frontend Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run lint`    | Run ESLint               |
| `npm run preview` | Preview production build |

## Project Structure

```
cyptics/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── core/     # Configuration & database
│   │   ├── models/   # SQLAlchemy models
│   │   ├── routes/   # API endpoints
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   ├── .env          # Environment variables (gitignored)
│   ├── .env.example  # Example environment variables
│   ├── .env.template # Environment template
│   ├── dev.sh        # Development startup script
│   ├── start.sh      # Production startup script
│   └── requirements.txt
├── webapp/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── .env          # Frontend environment variables
│   └── package.json
├── dev.sh           # Main development script
└── package.json     # Root package.json
```

## Development Features

### Backend Features

- 🔄 **Auto-reload** on code changes
- 🗄️ **SQLite database** with automatic setup
- 📊 **Interactive API documentation** (Swagger/OpenAPI)
- 🔍 **Alternative docs** (ReDoc)
- 🏥 **Health check** endpoint
- 🌍 **CORS enabled** for frontend integration

### Frontend Features

- ⚡ **Vite** for fast development
- 🔄 **Hot reload** on code changes
- 🎨 **Tailwind CSS** for styling
- 📱 **Responsive design** components
- 🔧 **TypeScript** for type safety

## Configuration

### Environment Variables

The backend uses a `.env` file for configuration. It's automatically created
with defaults:

```bash
# Backend Configuration
DATABASE_URL=sqlite:///./crypto_dashboard.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# Production Database (PostgreSQL)
# DATABASE_URL=postgresql://username:password@host:port/database

# CoinGecko API (optional)
# COINGECKO_API_KEY=your_api_key_here

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://cryptics-webapp.netlify.app
```

### Frontend Environment Variables

The frontend uses environment variables for API configuration:

```bash
# Frontend Configuration (.env in webapp/)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Production API URL
# VITE_API_BASE_URL=https://cyptics.onrender.com/api/v1
```

### Port Configuration

- **Backend**: Port 8000 (configurable via `API_PORT`)
- **Frontend**: Port 5173 (Vite default)

## Deployment

### Production URLs

The application is deployed and available at:

- **Frontend**: https://cryptics-webapp.netlify.app
- **Backend API**: https://cyptics.onrender.com/api/v1
- **API Documentation**: https://cyptics.onrender.com/docs

### Environment Setup

For production deployment:

1. **Backend**: Configure PostgreSQL database URL in `.env`
2. **Frontend**: Set `VITE_API_BASE_URL` to production API URL
3. **CORS**: Update `ALLOWED_ORIGINS` to include production frontend URL

## Troubleshooting

### Common Issues

**Command not found: ./dev.sh**

```bash
chmod +x dev.sh
```

**Python virtual environment issues**

```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend dependencies issues**

```bash
cd webapp
rm -rf node_modules package-lock.json
npm install
```

**Port already in use**

```bash
# Kill processes using the ports
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Clean Start

```bash
npm run clean
npm run install:all
npm run dev
```

## API Integration

The frontend is configured to communicate with the backend API. The API base URL
is configured via environment variables:

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://cyptics.onrender.com/api/v1`

The main API service is located in `webapp/src/services/api.ts`.

---

**Happy coding! 🚀**
