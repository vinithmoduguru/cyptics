"""Q/A Assistant module for cryptocurrency queries."""
from .pipeline import process_query, get_sample_queries
from .intents import detect_intent, get_intent_confidence
from .entities import extract_entities, extract_coin, extract_timeframe, extract_multiple_coins
from .handlers import (
    handle_price,
    handle_trend,
    handle_market_cap,
    handle_comparison,
    handle_generic_info,
    handle_unknown
)

__all__ = [
    "process_query",
    "get_sample_queries",
    "detect_intent",
    "get_intent_confidence",
    "extract_entities",
    "extract_coin",
    "extract_timeframe", 
    "extract_multiple_coins",
    "handle_price",
    "handle_trend",
    "handle_market_cap",
    "handle_comparison",
    "handle_generic_info",
    "handle_unknown"
]