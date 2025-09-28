"""Application configuration."""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # App settings
    APP_NAME: str = "Crypto Dashboard API"
    DEBUG: bool = False
    
    # Database settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./crypto_dashboard.db"
    
    # CoinGecko API settings
    COINGECKO_API_URL: str = "https://api.coingecko.com/api/v3"
    COINGECKO_API_KEY: Optional[str] = None
    
    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 30
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 300  # 5 minutes
    
    # CORS settings
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"  # Comma-separated list
    
    @property
    def allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()