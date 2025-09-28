"""Pydantic schemas for cryptocurrency data."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CryptocurrencyBase(BaseModel):
    """Base schema for cryptocurrency."""
    id: str
    symbol: str
    name: str
    image: Optional[str] = None


class CryptocurrencyCreate(CryptocurrencyBase):
    """Schema for creating cryptocurrency."""
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    market_cap_rank: Optional[int] = None
    fully_diluted_valuation: Optional[float] = None
    total_volume: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_percentage_24h: Optional[float] = None
    market_cap_change_24h: Optional[float] = None
    market_cap_change_percentage_24h: Optional[float] = None
    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None
    max_supply: Optional[float] = None
    ath: Optional[float] = None
    ath_change_percentage: Optional[float] = None
    ath_date: Optional[datetime] = None
    atl: Optional[float] = None
    atl_change_percentage: Optional[float] = None
    atl_date: Optional[datetime] = None


class CryptocurrencyUpdate(BaseModel):
    """Schema for updating cryptocurrency."""
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    market_cap_rank: Optional[int] = None
    fully_diluted_valuation: Optional[float] = None
    total_volume: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_percentage_24h: Optional[float] = None
    market_cap_change_24h: Optional[float] = None
    market_cap_change_percentage_24h: Optional[float] = None
    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None
    max_supply: Optional[float] = None
    ath: Optional[float] = None
    ath_change_percentage: Optional[float] = None
    ath_date: Optional[datetime] = None
    atl: Optional[float] = None
    atl_change_percentage: Optional[float] = None
    atl_date: Optional[datetime] = None


class Cryptocurrency(CryptocurrencyBase):
    """Full cryptocurrency schema with all fields."""
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    market_cap_rank: Optional[int] = None
    fully_diluted_valuation: Optional[float] = None
    total_volume: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_percentage_24h: Optional[float] = None
    market_cap_change_24h: Optional[float] = None
    market_cap_change_percentage_24h: Optional[float] = None
    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None
    max_supply: Optional[float] = None
    ath: Optional[float] = None
    ath_change_percentage: Optional[float] = None
    ath_date: Optional[datetime] = None
    atl: Optional[float] = None
    atl_change_percentage: Optional[float] = None
    atl_date: Optional[datetime] = None
    is_active: Optional[bool] = True
    is_watchlisted: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PriceHistoryBase(BaseModel):
    """Base schema for price history."""
    crypto_id: str
    price: float
    market_cap: Optional[float] = None
    total_volume: Optional[float] = None
    timestamp: datetime


class PriceHistoryCreate(PriceHistoryBase):
    """Schema for creating price history."""
    pass


class PriceHistory(PriceHistoryBase):
    """Full price history schema."""
    id: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TopCoinsResponse(BaseModel):
    """Response schema for top coins endpoint."""
    coins: List[Cryptocurrency]
    total_count: int


class PriceTrendPoint(BaseModel):
    """Schema for a single price trend point."""
    timestamp: datetime
    price: float
    market_cap: Optional[float] = None
    total_volume: Optional[float] = None


class PriceTrendResponse(BaseModel):
    """Response schema for price trend endpoint."""
    crypto_id: str
    crypto_name: str
    crypto_symbol: str
    data_points: List[PriceTrendPoint]
    period_days: int


class CryptocurrencySearch(BaseModel):
    """Schema for cryptocurrency search results."""
    id: str
    name: str
    symbol: str
    market_cap_rank: Optional[int] = None
    image: Optional[str] = None


class SearchResponse(BaseModel):
    """Response schema for search endpoint."""
    results: List[CryptocurrencySearch]
    total_count: int


class WatchlistResponse(BaseModel):
    """Response schema for watchlist endpoint."""
    watchlist: List[Cryptocurrency]
    total_count: int
    max_capacity: int = 10


class WatchlistAddRequest(BaseModel):
    """Request schema for adding to watchlist."""
    crypto_id: str = Field(..., description="CoinGecko cryptocurrency ID")
    fetch_history_days: int = Field(default=30, ge=1, le=365, description="Days of price history to fetch")


class WatchlistOperationResponse(BaseModel):
    """Response schema for watchlist add/remove operations."""
    success: bool
    message: str
    crypto_id: str
    watchlist_count: int