"""Cryptocurrency model."""
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Cryptocurrency(Base):
    """Cryptocurrency model."""
    
    __tablename__ = "cryptocurrencies"
    
    id = Column(String, primary_key=True)  # CoinGecko ID
    symbol = Column(String(10), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    image = Column(Text)
    
    # Current market data
    current_price = Column(Float)
    market_cap = Column(Float)
    market_cap_rank = Column(Integer, index=True)
    fully_diluted_valuation = Column(Float)
    total_volume = Column(Float)
    high_24h = Column(Float)
    low_24h = Column(Float)
    price_change_24h = Column(Float)
    price_change_percentage_24h = Column(Float)
    market_cap_change_24h = Column(Float)
    market_cap_change_percentage_24h = Column(Float)
    circulating_supply = Column(Float)
    total_supply = Column(Float)
    max_supply = Column(Float)
    ath = Column(Float)  # All time high
    ath_change_percentage = Column(Float)
    ath_date = Column(DateTime)
    atl = Column(Float)  # All time low
    atl_change_percentage = Column(Float)
    atl_date = Column(DateTime)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_watchlisted = Column(Boolean, default=False, index=True)  # Track if crypto is in user's watchlist
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    price_history = relationship("PriceHistory", back_populates="cryptocurrency", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Cryptocurrency(id='{self.id}', name='{self.name}', symbol='{self.symbol}')>"