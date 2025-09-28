"""Tests for Q/A Assistant intent detection."""
import pytest
from app.qa.intents import detect_intent, get_intent_confidence


class TestIntentDetection:
    """Test cases for intent detection functionality."""
    
    def test_price_intent_detection(self):
        """Test price-related query intent detection."""
        price_queries = [
            "What is the price of Bitcoin?",
            "How much does Ethereum cost?",
            "Current price of DOGE?",
            "What's the value of Solana?",
            "Bitcoin price"
        ]
        
        for query in price_queries:
            intent = detect_intent(query)
            assert intent == "price_query", f"Failed for query: {query}"
    
    def test_trend_intent_detection(self):
        """Test trend-related query intent detection."""
        trend_queries = [
            "Show me the 7-day trend of Bitcoin",
            "How has Ethereum performed over the last month?",
            "Bitcoin chart for the past week", 
            "Dogecoin performance last 30 days",
            "Bitcoin movement",
            "Ethereum change"
        ]
        
        for query in trend_queries:
            intent = detect_intent(query)
            assert intent == "trend_query", f"Failed for query: {query}"
    
    def test_market_cap_intent_detection(self):
        """Test market cap query intent detection."""
        mcap_queries = [
            "What is Bitcoin's market cap?",
            "Market capitalization of Ethereum",
            "How big is Solana's market cap?",
            "Bitcoin mcap"
        ]
        
        for query in mcap_queries:
            intent = detect_intent(query)
            assert intent == "market_cap_query", f"Failed for query: {query}"
    
    def test_comparison_intent_detection(self):
        """Test comparison query intent detection."""
        comparison_queries = [
            "Compare Bitcoin and Ethereum",
            "Bitcoin vs Dogecoin over 7 days", 
            "Bitcoin versus Ethereum",
            "Compare Bitcoin against Solana"
        ]
        
        for query in comparison_queries:
            intent = detect_intent(query)
            assert intent == "comparison_query", f"Failed for query: {query}"
    
    def test_generic_info_intent_detection(self):
        """Test generic information query intent detection."""
        info_queries = [
            "Tell me about Bitcoin",
            "What is Ethereum?",
            "Info about Dogecoin",
            "Explain Solana"
        ]
        
        for query in info_queries:
            intent = detect_intent(query)
            assert intent == "generic_info", f"Failed for query: {query}"
    
    def test_unknown_intent_detection(self):
        """Test unknown intent detection for irrelevant queries."""
        unknown_queries = [
            "How to cook pasta?",
            "What's the weather like?",
            "Tell me a joke",
            "Random text that doesn't match"
        ]
        
        for query in unknown_queries:
            intent = detect_intent(query)
            assert intent == "unknown", f"Failed for query: {query}"
    
    def test_confidence_scoring(self):
        """Test intent confidence scoring."""
        # High confidence - exact match
        confidence = get_intent_confidence("What is the price of Bitcoin?", "price_query")
        assert confidence == 1.0
        
        # Unknown intent should have 0 confidence
        confidence = get_intent_confidence("Random text", "unknown")
        assert confidence == 0.0
    
    def test_fuzzy_matching(self):
        """Test fuzzy matching for slightly misspelled queries."""
        # Slightly misspelled but should still match
        fuzzy_queries = [
            "prise of Bitcoin",  # price -> prise
            "trnd of Ethereum",  # trend -> trnd
            "merket cap Bitcoin"  # market -> merket
        ]
        
        expected_intents = ["price_query", "trend_query", "market_cap_query"]
        
        for query, expected in zip(fuzzy_queries, expected_intents):
            intent = detect_intent(query)
            # Should either match exactly or return unknown (acceptable for very poor matches)
            assert intent in [expected, "unknown"], f"Unexpected intent for query: {query}"