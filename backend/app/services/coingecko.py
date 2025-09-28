"""CoinGecko API service for fetching cryptocurrency data."""
import asyncio
import aiohttp
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CoinGeckoService:
    """Service for interacting with CoinGecko API."""
    
    def __init__(self):
        self.base_url = settings.COINGECKO_API_URL
        self.api_key = settings.COINGECKO_API_KEY
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self.session is None or self.session.closed:
            headers = {
                "Accept": "application/json",
                "User-Agent": "Crypto-Dashboard/1.0"
            }
            if self.api_key:
                headers["x-cg-demo-api-key"] = self.api_key
            
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                headers=headers,
                timeout=timeout,
                connector=aiohttp.TCPConnector(limit=10, limit_per_host=5)
            )
        return self.session
    
    async def close(self):
        """Close aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a request to CoinGecko API with error handling."""
        session = await self._get_session()
        url = f"{self.base_url}/{endpoint}"
        
        try:
            async with session.get(url, params=params or {}) as response:
                if response.status == 429:  # Rate limited
                    logger.warning("Rate limited by CoinGecko API")
                    raise Exception("Rate limited by CoinGecko API")
                
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"CoinGecko API error: {response.status} - {error_text}")
                    raise Exception(f"CoinGecko API error: {response.status}")
                
                return await response.json()
        
        except aiohttp.ClientError as e:
            logger.error(f"Network error while calling CoinGecko API: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
    
    async def get_top_cryptocurrencies(self, limit: int = 10, vs_currency: str = "usd") -> List[Dict[str, Any]]:
        """
        Fetch top cryptocurrencies by market cap.
        
        Args:
            limit: Number of cryptocurrencies to fetch
            vs_currency: Currency to get prices in (default: usd)
            
        Returns:
            List of cryptocurrency data
        """
        params = {
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "per_page": min(limit, 250),  # CoinGecko API limit
            "page": 1,
            "sparkline": "false",
            "price_change_percentage": "24h"
        }
        
        endpoint = "coins/markets"
        data = await self._make_request(endpoint, params)
        
        # Transform data to match our schema
        return self._transform_market_data(data)
    
    async def get_cryptocurrency_by_id(self, coin_id: str, vs_currency: str = "usd") -> Dict[str, Any]:
        """
        Fetch detailed information about a specific cryptocurrency.
        
        Args:
            coin_id: CoinGecko coin ID
            vs_currency: Currency to get prices in
            
        Returns:
            Cryptocurrency data
        """
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false"
        }
        
        endpoint = f"coins/{coin_id}"
        data = await self._make_request(endpoint, params)
        
        return self._transform_coin_detail(data, vs_currency)
    
    async def get_price_history(
        self, 
        coin_id: str, 
        vs_currency: str = "usd", 
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical price data for a cryptocurrency.
        
        Args:
            coin_id: CoinGecko coin ID
            vs_currency: Currency to get prices in
            days: Number of days of history to fetch
            
        Returns:
            List of price history data points
        """
        params = {
            "vs_currency": vs_currency,
            "days": days,
            "interval": "daily" if days > 1 else "hourly"
        }
        
        endpoint = f"coins/{coin_id}/market_chart"
        data = await self._make_request(endpoint, params)
        return self._transform_price_history(coin_id, data)
    
    async def search_cryptocurrencies(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for cryptocurrencies by name or symbol.
        
        Args:
            query: Search term (name or symbol)
            
        Returns:
            List of matching cryptocurrencies
        """
        try:
            endpoint = "search"
            params = {"query": query}
            data = await self._make_request(endpoint, params)
            
            # Transform search results
            coins = data.get("coins", [])
            if not coins:
                logger.warning(f"No search results found for query: {query}")
                return []
            
            return [{
                "id": coin["id"],
                "name": coin["name"],
                "symbol": coin.get("symbol", coin.get("api_symbol", "")).upper(),
                "market_cap_rank": coin.get("market_cap_rank"),
                "image": coin.get("thumb") or coin.get("large") or coin.get("small")
            } for coin in coins[:50]]  # Limit to top 50 results
            
        except Exception as e:
            logger.error(f"Search failed for query '{query}': {str(e)}")
            # Return empty list instead of raising exception
            return []
    
    async def get_cryptocurrency_with_history(
        self, 
        coin_id: str, 
        vs_currency: str = "usd", 
        days: int = 30
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Fetch cryptocurrency data along with its price history.
        
        Args:
            coin_id: CoinGecko coin ID
            vs_currency: Currency to get prices in
            days: Number of days of history to fetch
            
        Returns:
            Tuple of (cryptocurrency_data, price_history_data)
        """
        # Fetch both current data and price history concurrently
        crypto_task = self.get_cryptocurrency_by_id(coin_id, vs_currency)
        history_task = self.get_price_history(coin_id, vs_currency, days)
        
        crypto_data, price_history = await asyncio.gather(crypto_task, history_task)
        return crypto_data, price_history
    
    def _transform_market_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform CoinGecko market data to our format."""
        transformed = []
        
        for coin in data:
            try:
                # Ensure datetime fields are naive UTC
                ath_date = self._parse_date(coin.get("ath_date"))
                atl_date = self._parse_date(coin.get("atl_date"))
                transformed_coin = {
                    "id": coin["id"],
                    "symbol": coin["symbol"],
                    "name": coin["name"],
                    "image": coin["image"],
                    "current_price": coin.get("current_price"),
                    "market_cap": coin.get("market_cap"),
                    "market_cap_rank": coin.get("market_cap_rank"),
                    "fully_diluted_valuation": coin.get("fully_diluted_valuation"),
                    "total_volume": coin.get("total_volume"),
                    "high_24h": coin.get("high_24h"),
                    "low_24h": coin.get("low_24h"),
                    "price_change_24h": coin.get("price_change_24h"),
                    "price_change_percentage_24h": coin.get("price_change_percentage_24h"),
                    "market_cap_change_24h": coin.get("market_cap_change_24h"),
                    "market_cap_change_percentage_24h": coin.get("market_cap_change_percentage_24h"),
                    "circulating_supply": coin.get("circulating_supply"),
                    "total_supply": coin.get("total_supply"),
                    "max_supply": coin.get("max_supply"),
                    "ath": coin.get("ath"),
                    "ath_change_percentage": coin.get("ath_change_percentage"),
                    "ath_date": ath_date,
                    "atl": coin.get("atl"),
                    "atl_change_percentage": coin.get("atl_change_percentage"),
                    "atl_date": atl_date,
                }
                transformed.append(transformed_coin)
            except Exception as e:
                logger.error(f"Error transforming coin data for {coin.get('id', 'unknown')}: {str(e)}")
                continue
        
        return transformed
    
    def _transform_coin_detail(self, data: Dict[str, Any], vs_currency: str) -> Dict[str, Any]:
        """Transform CoinGecko coin detail data to our format."""
        market_data = data.get("market_data", {})
        
        def get_currency_value(field_data, vs_currency: str):
            """Helper to safely get currency-specific values."""
            if field_data is None:
                return None
            if isinstance(field_data, dict):
                return field_data.get(vs_currency)
            return field_data  # Return directly if it's not a dict
        
        return {
            "id": data["id"],
            "symbol": data["symbol"],
            "name": data["name"],
            "image": data.get("image", {}).get("large"),
            "current_price": get_currency_value(market_data.get("current_price"), vs_currency),
            "market_cap": get_currency_value(market_data.get("market_cap"), vs_currency),
            "market_cap_rank": market_data.get("market_cap_rank"),
            "fully_diluted_valuation": get_currency_value(market_data.get("fully_diluted_valuation"), vs_currency),
            "total_volume": get_currency_value(market_data.get("total_volume"), vs_currency),
            "high_24h": get_currency_value(market_data.get("high_24h"), vs_currency),
            "low_24h": get_currency_value(market_data.get("low_24h"), vs_currency),
            "price_change_24h": get_currency_value(market_data.get("price_change_24h"), vs_currency),
            "price_change_percentage_24h": market_data.get("price_change_percentage_24h"),  # This is always a direct float
            "market_cap_change_24h": get_currency_value(market_data.get("market_cap_change_24h"), vs_currency),
            "market_cap_change_percentage_24h": market_data.get("market_cap_change_percentage_24h"),  # This is always a direct float
            "circulating_supply": market_data.get("circulating_supply"),
            "total_supply": market_data.get("total_supply"),
            "max_supply": market_data.get("max_supply"),
            "ath": get_currency_value(market_data.get("ath"), vs_currency),
            "ath_change_percentage": get_currency_value(market_data.get("ath_change_percentage"), vs_currency),
            "ath_date": self._parse_date(get_currency_value(market_data.get("ath_date"), vs_currency)),
            "atl": get_currency_value(market_data.get("atl"), vs_currency),
            "atl_change_percentage": get_currency_value(market_data.get("atl_change_percentage"), vs_currency),
            "atl_date": self._parse_date(get_currency_value(market_data.get("atl_date"), vs_currency)),
        }
    
    def _transform_price_history(self, coin_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform CoinGecko price history data to our format."""
        prices = data.get("prices", [])
        market_caps = data.get("market_caps", [])
        total_volumes = data.get("total_volumes", [])
        
        # Create lookup dictionaries for market caps and volumes
        market_cap_lookup = {item[0]: item[1] for item in market_caps}
        volume_lookup = {item[0]: item[1] for item in total_volumes}
        
        transformed = []
        for price_point in prices:
            timestamp_ms, price = price_point
            timestamp = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).replace(tzinfo=None)
            
            transformed.append({
                "id": f"{coin_id}_{int(timestamp_ms)}",
                "crypto_id": coin_id,
                "price": price,
                "market_cap": market_cap_lookup.get(timestamp_ms),
                "total_volume": volume_lookup.get(timestamp_ms),
                "timestamp": timestamp
            })
        
        return transformed
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string from CoinGecko API."""
        if not date_str:
            return None
        
        try:
            # CoinGecko returns dates in ISO format
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            # Normalize to naive UTC (PostgreSQL column defined as TIMESTAMP WITHOUT TIME ZONE)
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        except Exception as e:
            logger.warning(f"Could not parse date '{date_str}': {str(e)}")
            return None


# Global service instance
coingecko_service = CoinGeckoService()