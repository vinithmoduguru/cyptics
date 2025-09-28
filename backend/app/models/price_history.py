"""Price history model."""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PriceHistory(Base):
    """Price history model for storing historical cryptocurrency prices."""
    
    __tablename__ = "price_history"
    
    id = Column(String, primary_key=True)  # We'll generate this as crypto_id + timestamp
    crypto_id = Column(String, ForeignKey("cryptocurrencies.id"), nullable=False)
    
    # Price data
    price = Column(Float, nullable=False)
    market_cap = Column(Float)
    total_volume = Column(Float)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    cryptocurrency = relationship("Cryptocurrency", back_populates="price_history")
    
    # Composite indexes for efficient querying
    __table_args__ = (
        Index("idx_crypto_timestamp", "crypto_id", "timestamp"),
        Index("idx_timestamp_crypto", "timestamp", "crypto_id"),
    )
    
    def __repr__(self):
        return f"<PriceHistory(crypto_id='{self.crypto_id}', price={self.price}, timestamp='{self.timestamp}')>"