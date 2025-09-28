"""Main Q/A pipeline for cryptocurrency queries."""
from typing import Dict, Any, List
from .intents import detect_intent, get_intent_confidence
from .entities import extract_entities
from .handlers import (
    handle_price,
    handle_trend,
    handle_market_cap,
    handle_comparison,
    handle_generic_info,
    handle_unknown
)


async def process_query(query: str) -> Dict[str, Any]:
    """
    Process a natural language cryptocurrency query.
    
    Args:
        query (str): Natural language query
        
    Returns:
        Dict[str, Any]: Response containing answer and metadata
    """
    if not query or not query.strip():
        return {
            "answer": "Please provide a question about cryptocurrencies.",
            "intent": "empty_query",
            "confidence": 0.0,
            "entities": {}
        }
    
    # Detect intent
    intent = detect_intent(query)
    confidence = get_intent_confidence(query, intent)
    
    # Extract entities
    entities = extract_entities(query)
    
    # Route to appropriate handler
    try:
        if intent == "price_query":
            answer = await handle_price(entities["coin"])
        elif intent == "trend_query":
            answer = await handle_trend(entities["coin"], entities["timeframe"])
        elif intent == "market_cap_query":
            answer = await handle_market_cap(entities["coin"])
        elif intent == "comparison_query":
            answer = await handle_comparison(entities["coins"], entities["timeframe"])
        elif intent == "generic_info":
            answer = await handle_generic_info(entities["coin"])
        else:
            answer = await handle_unknown()
    except Exception as e:
        # Fallback error handling
        answer = "I'm sorry, I encountered an error while processing your query. Please try again."
    
    return {
        "answer": answer,
        "intent": intent,
        "confidence": confidence,
        "entities": entities
    }


def get_sample_queries() -> Dict[str, List[str]]:
    """
    Get sample queries for testing and documentation.
    
    Returns:
        Dict[str, str]: Sample queries organized by intent
    """
    return {
        "price_queries": [
            "What is the price of Bitcoin?",
            "How much does Ethereum cost?",
            "Current price of DOGE?",
            "What's the value of Solana?"
        ],
        "trend_queries": [
            "Show me the 7-day trend of Bitcoin",
            "How has Ethereum performed over the last month?",
            "Bitcoin chart for the past week",
            "Dogecoin performance last 30 days"
        ],
        "market_cap_queries": [
            "What is Bitcoin's market cap?",
            "Market capitalization of Ethereum",
            "How big is Solana's market cap?"
        ],
        "comparison_queries": [
            "Compare Bitcoin and Ethereum",
            "Bitcoin vs Dogecoin over 7 days",
            "Compare Bitcoin, Ethereum, and Solana performance",
            "Ethereum versus Solana last month"
        ],
        "info_queries": [
            "Tell me about Bitcoin",
            "What is Ethereum?",
            "Info about Dogecoin",
            "Explain Solana"
        ]
    }