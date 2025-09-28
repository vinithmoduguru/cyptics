"""Intent detection module for cryptocurrency Q/A Assistant."""
from rapidfuzz import process
from typing import Dict, Optional

# Intent keywords mapping
INTENT_RULES = {
    "price": "price_query",
    "current price": "price_query",
    "cost": "price_query",
    "value": "price_query",
    "worth": "price_query",
    
    "trend": "trend_query", 
    "chart": "trend_query",
    "graph": "trend_query",
    "performance": "trend_query",
    "movement": "trend_query",
    "change": "trend_query",
    
    "market cap": "market_cap_query",
    "market capitalization": "market_cap_query",
    "mcap": "market_cap_query",
    
    "compare": "comparison_query",
    "vs": "comparison_query",
    "versus": "comparison_query",
    "comparison": "comparison_query",
    "against": "comparison_query",
    
    "about": "generic_info",
    "info": "generic_info",
    "information": "generic_info",
    "what is": "generic_info",
    "tell me": "generic_info",
    "explain": "generic_info"
}


def detect_intent(query: str) -> str:
    """
    Detect intent from query using fuzzy matching.
    
    Args:
        query (str): Natural language query
        
    Returns:
        str: Detected intent or 'unknown' if no match
    """
    query_lower = query.lower()
    
    # First try exact substring matching for better accuracy
    for keyword, intent in INTENT_RULES.items():
        if keyword in query_lower:
            return intent
    
    # Fallback to fuzzy matching
    result = process.extractOne(
        query_lower,
        INTENT_RULES.keys(),
        score_cutoff=60  # Minimum similarity score
    )
    
    if result:
        matched_keyword, score, _ = result
        return INTENT_RULES[matched_keyword]
    
    return "unknown"


def get_intent_confidence(query: str, detected_intent: str) -> float:
    """
    Get confidence score for the detected intent.
    
    Args:
        query (str): Original query
        detected_intent (str): Detected intent
        
    Returns:
        float: Confidence score between 0 and 1
    """
    if detected_intent == "unknown":
        return 0.0
    
    # Find the keyword that led to this intent
    target_keywords = [k for k, v in INTENT_RULES.items() if v == detected_intent]
    query_lower = query.lower()
    
    # Check for exact matches first
    for keyword in target_keywords:
        if keyword in query_lower:
            return 1.0
    
    # Get fuzzy match score
    result = process.extractOne(query_lower, target_keywords)
    if result:
        _, score, _ = result
        return score / 100.0
    
    return 0.0