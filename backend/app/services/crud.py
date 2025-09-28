"""CRUD operations for cryptocurrency data."""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.schemas.crypto import CryptocurrencyCreate, CryptocurrencyUpdate, PriceHistoryCreate


class CryptoCRUD:
    """CRUD operations for cryptocurrency data."""
    
    @staticmethod
    async def create_cryptocurrency(db: AsyncSession, crypto_data: CryptocurrencyCreate) -> Cryptocurrency:
        """Create a new cryptocurrency record."""
        db_crypto = Cryptocurrency(**crypto_data.dict())
        db.add(db_crypto)
        await db.commit()
        await db.refresh(db_crypto)
        return db_crypto
    
    @staticmethod
    async def get_cryptocurrency(db: AsyncSession, crypto_id: str) -> Optional[Cryptocurrency]:
        """Get a cryptocurrency by ID."""
        result = await db.execute(select(Cryptocurrency).filter(Cryptocurrency.id == crypto_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_cryptocurrencies(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10,
        active_only: bool = True
    ) -> List[Cryptocurrency]:
        """Get list of cryptocurrencies."""
        query = select(Cryptocurrency)
        
        if active_only:
            query = query.filter(Cryptocurrency.is_active == True)
        
        query = query.order_by(
            Cryptocurrency.market_cap_rank.asc().nulls_last(),
            Cryptocurrency.market_cap.desc().nulls_last()
        ).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_top_cryptocurrencies(
        db: AsyncSession,
        limit: int = 10
    ) -> List[Cryptocurrency]:
        """Get top cryptocurrencies by market cap rank."""
        query = select(Cryptocurrency).filter(
            and_(
                Cryptocurrency.is_active == True,
                Cryptocurrency.market_cap_rank.isnot(None)
            )
        ).order_by(Cryptocurrency.market_cap_rank.asc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_cryptocurrency(
        db: AsyncSession,
        crypto_id: str,
        crypto_update: CryptocurrencyUpdate
    ) -> Optional[Cryptocurrency]:
        """Update a cryptocurrency record."""
        update_data = crypto_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await db.execute(
            update(Cryptocurrency)
            .filter(Cryptocurrency.id == crypto_id)
            .values(**update_data)
        )
        await db.commit()
        
        return await CryptoCRUD.get_cryptocurrency(db, crypto_id)
    
    @staticmethod
    async def upsert_cryptocurrency(
        db: AsyncSession,
        crypto_data: CryptocurrencyCreate
    ) -> Cryptocurrency:
        """Create or update a cryptocurrency record."""
        existing = await CryptoCRUD.get_cryptocurrency(db, crypto_data.id)
        
        if existing:
            # Update existing
            update_data = CryptocurrencyUpdate(**crypto_data.dict(exclude={"id"}))
            return await CryptoCRUD.update_cryptocurrency(db, crypto_data.id, update_data)
        else:
            # Create new
            return await CryptoCRUD.create_cryptocurrency(db, crypto_data)
    
    @staticmethod
    async def delete_cryptocurrency(db: AsyncSession, crypto_id: str) -> bool:
        """Delete a cryptocurrency record."""
        result = await db.execute(
            delete(Cryptocurrency).filter(Cryptocurrency.id == crypto_id)
        )
        await db.commit()
        return result.rowcount > 0
    
    @staticmethod
    async def create_price_history(db: AsyncSession, price_data: PriceHistoryCreate) -> PriceHistory:
        """Create a price history record."""
        # Generate ID from crypto_id and timestamp
        price_data_dict = price_data.dict()
        price_data_dict["id"] = f"{price_data.crypto_id}_{int(price_data.timestamp.timestamp())}"
        
        db_price = PriceHistory(**price_data_dict)
        db.add(db_price)
        await db.commit()
        await db.refresh(db_price)
        return db_price
    
    @staticmethod
    async def get_price_history(
        db: AsyncSession,
        crypto_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[PriceHistory]:
        """Get price history for a cryptocurrency."""
        query = select(PriceHistory).filter(PriceHistory.crypto_id == crypto_id)
        
        if start_date:
            query = query.filter(PriceHistory.timestamp >= start_date)
        
        if end_date:
            query = query.filter(PriceHistory.timestamp <= end_date)
        
        query = query.order_by(PriceHistory.timestamp.asc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_latest_price_history(
        db: AsyncSession,
        crypto_id: str
    ) -> Optional[PriceHistory]:
        """Get the latest price history record for a cryptocurrency."""
        query = select(PriceHistory).filter(
            PriceHistory.crypto_id == crypto_id
        ).order_by(PriceHistory.timestamp.desc()).limit(1)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def bulk_create_price_history(
        db: AsyncSession,
        price_data_list: List[PriceHistoryCreate]
    ) -> int:
        """Bulk create price history records."""
        price_objects = []
        
        for price_data in price_data_list:
            price_dict = price_data.dict()
            price_dict["id"] = f"{price_data.crypto_id}_{int(price_data.timestamp.timestamp())}"
            price_objects.append(PriceHistory(**price_dict))
        
        db.add_all(price_objects)
        await db.commit()
        
        return len(price_objects)
    
    @staticmethod
    async def cleanup_old_price_history(
        db: AsyncSession,
        older_than_days: int = 90
    ) -> int:
        """Clean up old price history records."""
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        
        result = await db.execute(
            delete(PriceHistory).filter(PriceHistory.timestamp < cutoff_date)
        )
        await db.commit()
        
        return result.rowcount
    
    @staticmethod
    async def get_cryptocurrency_with_latest_price(
        db: AsyncSession,
        crypto_id: str
    ) -> Optional[Cryptocurrency]:
        """Get cryptocurrency with its latest price history."""
        query = select(Cryptocurrency).options(
            selectinload(Cryptocurrency.price_history)
        ).filter(Cryptocurrency.id == crypto_id)
        
        result = await db.execute(query)
        crypto = result.scalar_one_or_none()
        
        if crypto and crypto.price_history:
            # Sort price history by timestamp descending to get latest first
            crypto.price_history.sort(key=lambda x: x.timestamp, reverse=True)
        
        return crypto

    @staticmethod
    async def get_watchlist_cryptocurrencies(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10
    ) -> List[Cryptocurrency]:
        """Get cryptocurrencies in the watchlist."""
        query = select(Cryptocurrency).filter(
            and_(
                Cryptocurrency.is_active == True,
                Cryptocurrency.is_watchlisted == True
            )
        ).order_by(
            Cryptocurrency.market_cap_rank.asc().nulls_last(),
            Cryptocurrency.market_cap.desc().nulls_last()
        ).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def count_watchlist_cryptocurrencies(db: AsyncSession) -> int:
        """Count cryptocurrencies in the watchlist."""
        query = select(Cryptocurrency).filter(
            and_(
                Cryptocurrency.is_active == True,
                Cryptocurrency.is_watchlisted == True
            )
        )
        result = await db.execute(query)
        return len(result.scalars().all())
    
    @staticmethod
    async def add_to_watchlist(
        db: AsyncSession,
        crypto_id: str,
        crypto_data: CryptocurrencyCreate
    ) -> Cryptocurrency:
        """Add cryptocurrency to watchlist."""
        # Check if watchlist is at capacity (10 max)
        watchlist_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
        if watchlist_count >= 10:
            raise ValueError("Watchlist is at maximum capacity (10 cryptocurrencies)")
        
        # Check if crypto already exists
        existing_crypto = await crypto_crud.get_cryptocurrency(db, crypto_id)
        
        if existing_crypto:
            # Update existing crypto to be watchlisted
            update_data = crypto_data.dict()
            update_data.update({
                'is_watchlisted': True,
                'is_active': True,
                'updated_at': datetime.utcnow()
            })
            
            await db.execute(
                update(Cryptocurrency)
                .filter(Cryptocurrency.id == crypto_id)
                .values(**update_data)
            )
            await db.refresh(existing_crypto)
        else:
            # Create new crypto and add to watchlist
            crypto_dict = crypto_data.dict()
            crypto_dict['is_watchlisted'] = True
            existing_crypto = Cryptocurrency(**crypto_dict)
            db.add(existing_crypto)
        
        await db.commit()
        await db.refresh(existing_crypto)
        return existing_crypto
    
    @staticmethod
    async def remove_from_watchlist(
        db: AsyncSession,
        crypto_id: str
    ) -> bool:
        """Remove cryptocurrency from watchlist and database."""
        crypto = await crypto_crud.get_cryptocurrency(db, crypto_id)
        if not crypto:
            return False
        
        # Delete the cryptocurrency and all its price history (cascade delete)
        await db.delete(crypto)
        await db.commit()
        return True


# Create global CRUD instance
crypto_crud = CryptoCRUD()