"""Cryptocurrency API routes."""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.coingecko import coingecko_service
from app.services.crud import crypto_crud
from app.schemas.crypto import (
    Cryptocurrency,
    CryptocurrencyCreate,
    PriceHistory,
    PriceHistoryCreate,
    TopCoinsResponse,
    PriceTrendResponse,
    PriceTrendPoint,
    CryptocurrencySearch,
    SearchResponse,
    WatchlistResponse,
    WatchlistAddRequest,
    WatchlistOperationResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


async def sync_cryptocurrency_data(crypto_data: dict, db: AsyncSession):
    """Background task to sync cryptocurrency data to database."""
    try:
        crypto_create = CryptocurrencyCreate(**crypto_data)
        await crypto_crud.upsert_cryptocurrency(db, crypto_create)
    except Exception as e:
        logger.error(f"Error syncing cryptocurrency data: {str(e)}")


async def sync_price_history_data(price_data_list: List[dict], db: AsyncSession):
    """Background task to sync price history data to database."""
    try:
        price_history_objects = [PriceHistoryCreate(**data) for data in price_data_list]
        await crypto_crud.bulk_create_price_history(db, price_history_objects)
    except Exception as e:
        logger.error(f"Error syncing price history data: {str(e)}")


@router.get("/top/{limit}", response_model=TopCoinsResponse)
async def get_top_cryptocurrencies(
    limit: int = Path(ge=1, le=100, description="Number of cryptocurrencies to return"),
    force_refresh: bool = Query(default=False, description="Force refresh from CoinGecko API"),
    use_watchlist: bool = Query(default=True, description="Return watchlist cryptocurrencies first"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top N cryptocurrencies. By default returns watchlist cryptocurrencies.
    
    - **limit**: Number of cryptocurrencies to return (1-100)
    - **force_refresh**: Whether to fetch fresh data from CoinGecko API
    - **use_watchlist**: Whether to prioritize watchlist cryptocurrencies
    """
    try:
        if use_watchlist and not force_refresh:
            # First try to get watchlist cryptocurrencies
            db_cryptos = await crypto_crud.get_watchlist_cryptocurrencies(db, 0, limit)
            
            if db_cryptos:
                cryptocurrencies = [Cryptocurrency.model_validate(crypto) for crypto in db_cryptos]
                return TopCoinsResponse(
                    coins=cryptocurrencies,
                    total_count=len(cryptocurrencies)
                )
        
        if force_refresh:
            # Fetch fresh data from CoinGecko API
            logger.info(f"Fetching top {limit} cryptocurrencies from CoinGecko API")
            api_data = await coingecko_service.get_top_cryptocurrencies(limit)
            
            # Sync data to database in background
            for crypto_data in api_data:
                background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
            
            # Convert to Pydantic models
            cryptocurrencies = [Cryptocurrency(**data) for data in api_data]
        else:
            # Get data from database (fallback to top cryptos if no watchlist)
            db_cryptos = await crypto_crud.get_top_cryptocurrencies(db, limit)
            
            if not db_cryptos:
                # Fallback to API if no data in database
                logger.info("No cryptocurrency data in database, fetching from API")
                api_data = await coingecko_service.get_top_cryptocurrencies(limit)
                
                # Sync data to database in background
                for crypto_data in api_data:
                    background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
                
                cryptocurrencies = [Cryptocurrency(**data) for data in api_data]
            else:
                cryptocurrencies = [Cryptocurrency.model_validate(crypto) for crypto in db_cryptos]
        
        return TopCoinsResponse(
            coins=cryptocurrencies,
            total_count=len(cryptocurrencies)
        )
    
    except Exception as e:
        logger.error(f"Error fetching top cryptocurrencies: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching cryptocurrency data")


@router.get("/{crypto_id}/price-trend", response_model=PriceTrendResponse)
async def get_price_trend(
    crypto_id: str,
    days: int = Query(default=30, ge=1, le=365, description="Number of days of history"),
    force_refresh: bool = Query(default=False, description="Force refresh from CoinGecko API"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Get historical price trends for a specific cryptocurrency.
    
    - **crypto_id**: CoinGecko cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
    - **days**: Number of days of history to return (1-365)
    - **force_refresh**: Whether to fetch fresh data from CoinGecko API
    """
    try:
        # Get cryptocurrency info
        crypto = await crypto_crud.get_cryptocurrency(db, crypto_id)
        
        if force_refresh or not crypto:
            # Fetch fresh data from CoinGecko API
            logger.info(f"Fetching price history for {crypto_id} from CoinGecko API")
            
            # Fetch cryptocurrency details if not in database
            if not crypto:
                crypto_data = await coingecko_service.get_cryptocurrency_by_id(crypto_id)
                background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
                crypto_name = crypto_data.get("name", crypto_id)
                crypto_symbol = crypto_data.get("symbol", "")
            else:
                crypto_name = crypto.name
                crypto_symbol = crypto.symbol
            
            # Fetch price history
            api_price_data = await coingecko_service.get_price_history(crypto_id, days=days)
            
            # Sync price history to database in background
            background_tasks.add_task(sync_price_history_data, api_price_data, db)
            
            # Convert to response format
            data_points = [
                PriceTrendPoint(
                    timestamp=datetime.fromisoformat(point["timestamp"].isoformat()) if isinstance(point["timestamp"], datetime) else point["timestamp"],
                    price=point["price"],
                    market_cap=point.get("market_cap"),
                    total_volume=point.get("total_volume")
                )
                for point in api_price_data
            ]
        else:
            # Get data from database
            crypto_name = crypto.name
            crypto_symbol = crypto.symbol
            
            start_date = datetime.utcnow() - timedelta(days=days)
            db_price_history = await crypto_crud.get_price_history(
                db, crypto_id, start_date=start_date
            )
            
            if not db_price_history:
                # Fallback to API if no data in database
                logger.info(f"No price history in database for {crypto_id}, fetching from API")
                api_price_data = await coingecko_service.get_price_history(crypto_id, days=days)
                
                # Sync price history to database in background
                background_tasks.add_task(sync_price_history_data, api_price_data, db)
                
                data_points = [
                    PriceTrendPoint(
                        timestamp=datetime.fromisoformat(point["timestamp"].isoformat()) if isinstance(point["timestamp"], datetime) else point["timestamp"],
                        price=point["price"],
                        market_cap=point.get("market_cap"),
                        total_volume=point.get("total_volume")
                    )
                    for point in api_price_data
                ]
            else:
                data_points = [
                    PriceTrendPoint(
                        timestamp=price.timestamp,
                        price=price.price,
                        market_cap=price.market_cap,
                        total_volume=price.total_volume
                    )
                    for price in db_price_history
                ]
        
        return PriceTrendResponse(
            crypto_id=crypto_id,
            crypto_name=crypto_name,
            crypto_symbol=crypto_symbol,
            data_points=data_points,
            period_days=days
        )
    
    except Exception as e:
        logger.error(f"Error fetching price trend for {crypto_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching price trend data")


@router.get("/search", response_model=SearchResponse)
async def search_cryptocurrencies(
    q: str = Query(..., min_length=2, description="Search query (name or symbol)"),
    limit: int = Query(default=20, ge=1, le=50, description="Number of results to return")
):
    """
    Search for cryptocurrencies by name or symbol using CoinGecko API.
    
    - **q**: Search query (minimum 2 characters)
    - **limit**: Number of results to return (1-50)
    """
    try:
        search_results = await coingecko_service.search_cryptocurrencies(q)
        
        # Limit results
        limited_results = search_results[:limit]
        
        # Convert to schema format
        results = [CryptocurrencySearch(**result) for result in limited_results]
        
        return SearchResponse(
            results=results,
            total_count=len(results)
        )
    
    except Exception as e:
        logger.error(f"Error during cryptocurrency search: {str(e)}")
        # Return empty results instead of 404 to handle rate limiting gracefully
        return SearchResponse(
            results=[],
            total_count=0
        )


# Watchlist endpoints


@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=10, ge=1, le=10, description="Number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get cryptocurrencies in the user's watchlist.
    
    - **skip**: Number of records to skip for pagination
    - **limit**: Number of records to return (max 10)
    """
    try:
        watchlist_cryptos = await crypto_crud.get_watchlist_cryptocurrencies(db, skip, limit)
        total_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
        
        # Convert to Pydantic models safely
        watchlist_data = []
        
        def safe_datetime_to_iso(dt):
            """Safely convert datetime to ISO string."""
            if dt is None:
                return None
            try:
                return dt.isoformat() if hasattr(dt, 'isoformat') else None
            except:
                return None
        
        for crypto in watchlist_cryptos:
            try:
                # Create a dictionary from the SQLAlchemy object
                crypto_dict = {
                    "id": crypto.id,
                    "symbol": crypto.symbol,
                    "name": crypto.name,
                    "image": crypto.image,
                    "current_price": crypto.current_price or 0,
                    "market_cap": crypto.market_cap or 0,
                    "market_cap_rank": crypto.market_cap_rank,
                    "fully_diluted_valuation": crypto.fully_diluted_valuation,
                    "total_volume": crypto.total_volume or 0,
                    "high_24h": crypto.high_24h,
                    "low_24h": crypto.low_24h,
                    "price_change_24h": crypto.price_change_24h,
                    "price_change_percentage_24h": crypto.price_change_percentage_24h or 0,
                    "market_cap_change_24h": crypto.market_cap_change_24h,
                    "market_cap_change_percentage_24h": crypto.market_cap_change_percentage_24h,
                    "circulating_supply": crypto.circulating_supply,
                    "total_supply": crypto.total_supply,
                    "max_supply": crypto.max_supply,
                    "ath": crypto.ath,
                    "ath_change_percentage": crypto.ath_change_percentage,
                    "ath_date": safe_datetime_to_iso(getattr(crypto, 'ath_date', None)),
                    "atl": crypto.atl,
                    "atl_change_percentage": crypto.atl_change_percentage,
                    "atl_date": safe_datetime_to_iso(getattr(crypto, 'atl_date', None)),
                    "last_updated": safe_datetime_to_iso(getattr(crypto, 'updated_at', None)) or "",
                    "is_active": getattr(crypto, 'is_active', True),
                    "is_watchlisted": getattr(crypto, 'is_watchlisted', False),
                    "created_at": safe_datetime_to_iso(getattr(crypto, 'created_at', None)),
                    "updated_at": safe_datetime_to_iso(getattr(crypto, 'updated_at', None)),
                }
                watchlist_data.append(Cryptocurrency(**crypto_dict))
            except Exception as model_error:
                logger.error(f"Error converting crypto {crypto.id} to Pydantic model: {str(model_error)}")
                continue
        
        return WatchlistResponse(
            watchlist=watchlist_data,
            total_count=total_count,
            max_capacity=10
        )
    
    except Exception as e:
        logger.error(f"Error getting watchlist: {str(e)}")
        # Return empty watchlist instead of 404
        return WatchlistResponse(
            watchlist=[],
            total_count=0,
            max_capacity=10
        )


@router.post("/watchlist/add", response_model=WatchlistOperationResponse)
async def add_to_watchlist(
    request: WatchlistAddRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Add a cryptocurrency to the user's watchlist with historical data.
    
    - **crypto_id**: CoinGecko cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
    - **fetch_history_days**: Days of price history to fetch (1-365, default: 30)
    """
    try:
        # Check current watchlist count
        current_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
        if current_count >= 10:
            return WatchlistOperationResponse(
                success=False,
                message="Watchlist is at maximum capacity (10 cryptocurrencies). Remove some cryptocurrencies to add new ones.",
                crypto_id=request.crypto_id,
                watchlist_count=current_count
            )
        
        # Check if crypto already in watchlist
        existing_crypto = await crypto_crud.get_cryptocurrency(db, request.crypto_id)
        if existing_crypto and getattr(existing_crypto, 'is_watchlisted', False):
            return WatchlistOperationResponse(
                success=False,
                message="Cryptocurrency is already in your watchlist",
                crypto_id=request.crypto_id,
                watchlist_count=current_count
            )
        
        # Fetch cryptocurrency data and historical data from CoinGecko
        crypto_data, price_history = await coingecko_service.get_cryptocurrency_with_history(
            request.crypto_id, days=request.fetch_history_days
        )
        
        # Add to watchlist
        crypto_create = CryptocurrencyCreate(**crypto_data)
        crypto = await crypto_crud.add_to_watchlist(db, request.crypto_id, crypto_create)
        
        # Add historical data in background
        if price_history:
            background_tasks.add_task(sync_price_history_data, 
                                    [data.dict() for data in [PriceHistoryCreate(**data) for data in price_history]], 
                                    db)
        
        new_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
        
        return WatchlistOperationResponse(
            success=True,
            message=f"Successfully added {crypto.name} to your watchlist",
            crypto_id=request.crypto_id,
            watchlist_count=new_count
        )
    
    except ValueError as ve:
        # Handle watchlist capacity error
        current_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
        return WatchlistOperationResponse(
            success=False,
            message=str(ve),
            crypto_id=request.crypto_id,
            watchlist_count=current_count
        )
    
    except Exception as e:
        logger.error(f"Error adding to watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding cryptocurrency to watchlist")


@router.delete("/watchlist/remove/{crypto_id}", response_model=WatchlistOperationResponse)
async def remove_from_watchlist(
    crypto_id: str = Path(..., description="CoinGecko cryptocurrency ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a cryptocurrency from the user's watchlist and delete its data.
    
    - **crypto_id**: CoinGecko cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
    """
    try:
        # Check if crypto exists in watchlist
        crypto = await crypto_crud.get_cryptocurrency(db, crypto_id)
        if not crypto or not getattr(crypto, 'is_watchlisted', False):
            current_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
            return WatchlistOperationResponse(
                success=False,
                message="Cryptocurrency is not in your watchlist",
                crypto_id=crypto_id,
                watchlist_count=current_count
            )
        
        crypto_name = crypto.name
        
        # Remove from watchlist and delete data
        success = await crypto_crud.remove_from_watchlist(db, crypto_id)
        
        if success:
            new_count = await crypto_crud.count_watchlist_cryptocurrencies(db)
            return WatchlistOperationResponse(
                success=True,
                message=f"Successfully removed {crypto_name} from your watchlist",
                crypto_id=crypto_id,
                watchlist_count=new_count
            )
        else:
            raise Exception("Failed to remove cryptocurrency from watchlist")
    
    except Exception as e:
        logger.error(f"Error removing from watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Error removing cryptocurrency from watchlist")


@router.get("/{crypto_id}", response_model=Cryptocurrency)
async def get_cryptocurrency(
    crypto_id: str,
    force_refresh: bool = Query(default=False, description="Force refresh from CoinGecko API"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific cryptocurrency.
    
    - **crypto_id**: CoinGecko cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
    - **force_refresh**: Whether to fetch fresh data from CoinGecko API
    """
    try:
        if force_refresh:
            # Fetch fresh data from CoinGecko API
            logger.info(f"Fetching cryptocurrency {crypto_id} from CoinGecko API")
            crypto_data = await coingecko_service.get_cryptocurrency_by_id(crypto_id)
            
            # Sync data to database in background
            background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
            
            return Cryptocurrency(**crypto_data)
        else:
            # Get data from database
            crypto = await crypto_crud.get_cryptocurrency(db, crypto_id)
            
            if not crypto:
                # Fallback to API if not found in database
                logger.info(f"Cryptocurrency {crypto_id} not found in database, fetching from API")
                crypto_data = await coingecko_service.get_cryptocurrency_by_id(crypto_id)
                
                # Sync data to database in background
                background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
                
                return Cryptocurrency(**crypto_data)
            
            return Cryptocurrency.from_orm(crypto)
    
    except Exception as e:
        logger.error(f"Error fetching cryptocurrency {crypto_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Cryptocurrency not found")


@router.post("/sync-top-cryptos")
async def sync_top_cryptocurrencies(
    limit: int = Query(default=10, ge=1, le=100),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger synchronization of top cryptocurrencies from CoinGecko API.
    This endpoint is useful for periodic data updates.
    
    - **limit**: Number of top cryptocurrencies to sync
    """
    try:
        logger.info(f"Starting manual sync of top {limit} cryptocurrencies")
        
        # Fetch data from CoinGecko API
        api_data = await coingecko_service.get_top_cryptocurrencies(limit)
        
        # Sync each cryptocurrency in background
        for crypto_data in api_data:
            background_tasks.add_task(sync_cryptocurrency_data, crypto_data, db)
        
        # Also fetch and sync price history for each crypto
        for crypto_data in api_data:
            crypto_id = crypto_data["id"]
            try:
                price_history_data = await coingecko_service.get_price_history(crypto_id, days=30)
                background_tasks.add_task(sync_price_history_data, price_history_data, db)
            except Exception as e:
                logger.error(f"Error fetching price history for {crypto_id}: {str(e)}")
                continue
        
        return {
            "message": f"Started synchronization of {len(api_data)} cryptocurrencies",
            "synced_count": len(api_data)
        }
    
    except Exception as e:
        logger.error(f"Error during manual sync: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during synchronization")


@router.delete("/cleanup-old-data")
async def cleanup_old_data(
    older_than_days: int = Query(default=90, ge=30, le=365),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean up old price history data.
    
    - **older_than_days**: Delete price history older than this many days (30-365)
    """
    try:
        deleted_count = await crypto_crud.cleanup_old_price_history(db, older_than_days)
        
        return {
            "message": f"Cleaned up price history data older than {older_than_days} days",
            "deleted_records": deleted_count
        }
    
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during cleanup")


# @router.post("/sync-crypto/{crypto_id}")
# async def sync_crypto_data(
#     crypto_id: str = Path(description="CoinGecko cryptocurrency ID"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Sync a specific cryptocurrency's data to the database for historical storage.
#     This endpoint allows storing any cryptocurrency without watchlist limits.
#     """
#     try:
#         # Fetch the cryptocurrency data from CoinGecko
#         crypto_data = await coingecko_service.get_cryptocurrency_by_id(crypto_id)
        
#         if not crypto_data:
#             raise HTTPException(status_code=404, detail=f"Cryptocurrency {crypto_id} not found")
        
#         # Sync to database directly
#         await sync_cryptocurrency_data(crypto_data, db)
        
#         return {"message": f"Cryptocurrency {crypto_id} synced successfully", "crypto_id": crypto_id}
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error syncing cryptocurrency {crypto_id}: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error syncing cryptocurrency: {str(e)}")

