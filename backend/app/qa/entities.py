"""Entity extraction module for cryptocurrency Q/A Assistant."""
from rapidfuzz import process
from typing import List, Optional, Dict, Any
import re

# Supported cryptocurrencies
SUPPORTED_COINS = [
    "bitcoin", "btc",
    "ethereum", "eth", "ether",
    "dogecoin", "doge",
    "solana", "sol",
    "cardano", "ada",
    "polygon", "matic",
    "chainlink", "link",
    "ripple", "xrp",
    "litecoin", "ltc",
    "avalanche", "avax",
    "polkadot", "dot",
    "shiba inu", "shib"
]

# Coin aliases mapping to canonical names
COIN_ALIASES = {
    "btc": "bitcoin",
    "eth": "ethereum", 
    "ether": "ethereum",
    "doge": "dogecoin",
    "sol": "solana",
    "ada": "cardano",
    "matic": "polygon",
    "link": "chainlink",
    "xrp": "ripple",
    "ltc": "litecoin",
    "avax": "avalanche",
    "dot": "polkadot",
    "shib": "shiba inu"
}

# Timeframe patterns and mappings
TIMEFRAME_PATTERNS = {
    # Specific multi-day patterns first (to avoid conflicts)
    "10 day": "10d", "10 days": "10d", "10-day": "10d", "10-days": "10d", "10d": "10d",
    "14 day": "14d", "14 days": "14d", "14-day": "14d", "14-days": "14d", "14d": "14d",
    "30 day": "30d", "30 days": "30d", "30-day": "30d", "30-days": "30d",
    "90 day": "90d", "90 days": "90d", "90-day": "90d", "90-days": "90d", "90d": "90d",
    "365 days": "1y",
    
    # 7 day patterns
    "7 day": "7d", "7 days": "7d", "7-day": "7d", "7-days": "7d", "7d": "7d",
    "week": "7d", "weekly": "7d", "1 week": "7d", "one week": "7d",
    
    # 2 weeks patterns
    "2 weeks": "14d", "two weeks": "14d", "2 week": "14d",
    
    # Monthly patterns
    "month": "30d", "monthly": "30d", "1 month": "30d", "one month": "30d", "30d": "30d",
    "3 months": "90d", "three months": "90d", "quarter": "90d", "quarterly": "90d",
    "12 months": "1y", "12 month": "1y",
    
    # Year patterns
    "1 year": "1y", "year": "1y", "yearly": "1y", "1y": "1y",
    
    # Single day patterns (put at end to avoid conflicts)
    "1 day": "1d", "one day": "1d", "daily": "1d",
    "today": "1d", "24 hours": "1d", "24h": "1d", "1d": "1d"
}


def normalize_coin_name(coin: str) -> str:
    """
    Normalize coin name to canonical form.
    
    Args:
        coin (str): Coin name or symbol
        
    Returns:
        str: Canonical coin name
    """
    coin_lower = coin.lower().strip()
    return COIN_ALIASES.get(coin_lower, coin_lower)


def extract_coin(query: str, default: str = "bitcoin") -> str:
    """
    Extract cryptocurrency name from query using fuzzy matching.
    
    Args:
        query (str): Natural language query
        default (str): Default coin if none found
        
    Returns:
        str: Extracted coin name
    """
    query_lower = query.lower()
    
    # First try exact matches
    for coin in SUPPORTED_COINS:
        if coin in query_lower:
            return normalize_coin_name(coin)
    
    # Try fuzzy matching
    result = process.extractOne(
        query_lower,
        SUPPORTED_COINS,
        score_cutoff=70
    )
    
    if result:
        matched_coin, score, _ = result
        return normalize_coin_name(matched_coin)
    
    return default


def extract_multiple_coins(query: str, min_coins: int = 2) -> List[str]:
    """
    Extract multiple cryptocurrency names for comparison queries.
    
    Args:
        query (str): Natural language query
        min_coins (int): Minimum number of coins required
        
    Returns:
        List[str]: List of extracted coin names
    """
    query_lower = query.lower()
    found_coins = []
    
    # Find all exact matches
    for coin in SUPPORTED_COINS:
        if coin in query_lower and normalize_coin_name(coin) not in found_coins:
            found_coins.append(normalize_coin_name(coin))
    
    # Remove duplicates while preserving order
    unique_coins = []
    seen = set()
    for coin in found_coins:
        if coin not in seen:
            unique_coins.append(coin)
            seen.add(coin)
    
    # If we don't have enough coins, add defaults
    if len(unique_coins) < min_coins:
        defaults = ["bitcoin", "ethereum", "dogecoin", "solana"]
        for default in defaults:
            if default not in unique_coins:
                unique_coins.append(default)
                if len(unique_coins) >= min_coins:
                    break
    
    return unique_coins[:min_coins]  # Return only the required number


def extract_timeframe(query: str, default: str = "7d") -> str:
    """
    Extract timeframe from query using pattern matching.
    
    Args:
        query (str): Natural language query
        default (str): Default timeframe if none found
        
    Returns:
        str: Extracted timeframe
    """
    query_lower = query.lower()
    
    # Find all matching patterns and their lengths
    matches = []
    for pattern, timeframe in TIMEFRAME_PATTERNS.items():
        if pattern in query_lower:
            matches.append((pattern, timeframe, len(pattern)))
    
    # If we have matches, return the longest one (most specific)
    if matches:
        # Sort by pattern length (descending) to get most specific match
        matches.sort(key=lambda x: x[2], reverse=True)
        return matches[0][1]
    
    # Try fuzzy matching if no exact matches
    result = process.extractOne(
        query_lower,
        TIMEFRAME_PATTERNS.keys(),
        score_cutoff=70
    )
    
    if result:
        matched_pattern, score, _ = result
        return TIMEFRAME_PATTERNS[matched_pattern]
    
    return default


def extract_entities(query: str) -> Dict[str, Any]:
    """
    Extract all entities from query.
    
    Args:
        query (str): Natural language query
        
    Returns:
        Dict: Dictionary containing extracted entities
    """
    return {
        "coin": extract_coin(query),
        "coins": extract_multiple_coins(query),
        "timeframe": extract_timeframe(query),
        "query_lower": query.lower()
    }