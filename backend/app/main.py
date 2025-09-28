"""Main FastAPI application module."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.routes import crypto, qa

# Create FastAPI instance
app = FastAPI(
    title="Crypto Dashboard API",
    description="A FastAPI backend for cryptocurrency dashboard with CoinGecko integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(crypto.router, prefix="/api/v1/crypto", tags=["Crypto"])
app.include_router(qa.router, prefix="/api/v1/qa", tags=["Q/A Assistant"])
app.include_router(qa.router, prefix="/api/v1/qa", tags=["Q&A Assistant"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await init_db()


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Crypto Dashboard API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "crypto-dashboard-api"}