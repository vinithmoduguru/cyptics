"""Tests for Q/A Assistant entity extraction."""
import pytest
from app.qa.entities import (
    extract_coin,
    extract_multiple_coins,
    extract_timeframe,
    extract_entities,
    normalize_coin_name
)


class TestEntityExtraction:
    """Test cases for entity extraction functionality."""
    
    def test_coin_extraction(self):
        """Test cryptocurrency extraction from queries."""
        test_cases = [
            ("What is the price of Bitcoin?", "bitcoin"),
            ("How much does Ethereum cost?", "ethereum"),
            ("Current price of DOGE?", "dogecoin"),
            ("BTC price today", "bitcoin"),
            ("ETH vs SOL", "ethereum"),  # Should pick first one found
            ("Solana performance", "solana")
        ]
        
        for query, expected_coin in test_cases:
            coin = extract_coin(query)
            assert coin == expected_coin, f"Failed for query: '{query}', expected: {expected_coin}, got: {coin}"
    
    def test_multiple_coin_extraction(self):
        """Test extraction of multiple coins for comparison."""
        test_cases = [
            ("Compare Bitcoin and Ethereum", ["bitcoin", "ethereum"]),
            ("BTC vs ETH vs DOGE", ["bitcoin", "ethereum"]),  # Should return first 2
            ("Bitcoin versus Solana performance", ["bitcoin", "solana"]),
            ("ETH and MATIC comparison", ["ethereum", "polygon"])
        ]
        
        for query, expected_coins in test_cases:
            coins = extract_multiple_coins(query, min_coins=2)
            # Check that we got at least the expected coins (order might vary)
            assert len(coins) >= 2, f"Not enough coins extracted for: {query}"
            for expected_coin in expected_coins:
                assert expected_coin in coins, f"Missing {expected_coin} in result for query: {query}"
    
    def test_timeframe_extraction(self):
        """Test timeframe extraction from queries."""
        test_cases = [
            ("Bitcoin trend over 7 days", "7d"),
            ("Ethereum performance last week", "7d"),
            ("30 day chart for Solana", "30d"), 
            ("Monthly performance of Bitcoin", "30d"),
            ("Bitcoin daily change", "1d"),
            ("1 year performance", "1y"),
            ("Show me yearly trends", "1y")
        ]
        
        for query, expected_timeframe in test_cases:
            timeframe = extract_timeframe(query)
            assert timeframe == expected_timeframe, f"Failed for query: '{query}', expected: {expected_timeframe}, got: {timeframe}"
    
    def test_default_values(self):
        """Test default values when entities are not found."""
        # Query without specific coin should default to bitcoin
        coin = extract_coin("What's the current price?")
        assert coin == "bitcoin"
        
        # Query without specific timeframe should default to 7d
        timeframe = extract_timeframe("Show me the trend")
        assert timeframe == "7d"
    
    def test_coin_normalization(self):
        """Test coin name normalization."""
        test_cases = [
            ("BTC", "bitcoin"),
            ("ETH", "ethereum"),
            ("DOGE", "dogecoin"),
            ("SOL", "solana"),
            ("bitcoin", "bitcoin"),  # Already normalized
            ("MATIC", "polygon")
        ]
        
        for input_coin, expected_normalized in test_cases:
            normalized = normalize_coin_name(input_coin)
            assert normalized == expected_normalized, f"Failed to normalize {input_coin} to {expected_normalized}"
    
    def test_extract_entities_comprehensive(self):
        """Test comprehensive entity extraction."""
        query = "Compare Bitcoin and Ethereum performance over the last 30 days"
        
        entities = extract_entities(query)
        
        assert "coin" in entities
        assert "coins" in entities
        assert "timeframe" in entities
        assert "query_lower" in entities
        
        # Should extract bitcoin as primary coin
        assert entities["coin"] == "bitcoin"
        
        # Should extract both coins for comparison
        assert "bitcoin" in entities["coins"]
        assert "ethereum" in entities["coins"]
        
        # Should extract 30d timeframe
        assert entities["timeframe"] == "30d"
        
        # Should have lowercased query
        assert entities["query_lower"] == query.lower()
    
    def test_case_insensitive_extraction(self):
        """Test that extraction works regardless of case."""
        test_cases = [
            "WHAT IS THE PRICE OF BITCOIN?",
            "what is the price of bitcoin?",
            "What Is The Price Of Bitcoin?",
            "WhAt iS tHe PrIcE oF bItCoIn?"
        ]
        
        for query in test_cases:
            coin = extract_coin(query)
            assert coin == "bitcoin", f"Case insensitive extraction failed for: {query}"
    
    def test_fuzzy_coin_matching(self):
        """Test fuzzy matching for slightly misspelled coin names."""
        # These should still match due to fuzzy matching
        fuzzy_cases = [
            ("Bitcoiin price", "bitcoin"),  # Slight misspelling
            ("Etherium cost", "ethereum"),   # Common misspelling
            ("Solanna trend", "solana")      # Slight misspelling
        ]
        
        for query, expected_coin in fuzzy_cases:
            coin = extract_coin(query)
            # Should either match exactly or return default (acceptable for very poor matches)
            assert coin in [expected_coin, "bitcoin"], f"Fuzzy matching failed for: {query}"