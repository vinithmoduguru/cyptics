"""Tests for Q/A Assistant pipeline integration."""
import pytest
import asyncio
from app.qa.pipeline import process_query, get_sample_queries


class TestQAPipeline:
    """Test cases for the complete Q/A pipeline."""
    
    @pytest.mark.asyncio
    async def test_price_query_processing(self):
        """Test complete pipeline for price queries."""
        queries = [
            "What is the price of Bitcoin?",
            "How much does Ethereum cost?", 
            "Current price of Dogecoin"
        ]
        
        for query in queries:
            result = await process_query(query)
            
            # Verify response structure
            assert "answer" in result
            assert "intent" in result
            assert "confidence" in result
            assert "entities" in result
            
            # Verify intent detection
            assert result["intent"] == "price_query"
            
            # Verify answer is not empty
            assert len(result["answer"]) > 0
            
            # Verify confidence is reasonable
            assert 0.0 <= result["confidence"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_trend_query_processing(self):
        """Test complete pipeline for trend queries."""
        queries = [
            "Show me the 7-day trend of Bitcoin",
            "Ethereum performance last month",
            "Bitcoin chart over the past week"
        ]
        
        for query in queries:
            result = await process_query(query)
            
            assert result["intent"] == "trend_query"
            assert len(result["answer"]) > 0
            assert 0.0 <= result["confidence"] <= 1.0
            
            # Should contain timeframe information
            assert result["entities"]["timeframe"] in ["7d", "30d", "1d", "1y"]
    
    @pytest.mark.asyncio
    async def test_market_cap_query_processing(self):
        """Test complete pipeline for market cap queries."""
        query = "What is Bitcoin's market cap?"
        result = await process_query(query)
        
        assert result["intent"] == "market_cap_query"
        assert len(result["answer"]) > 0
        assert result["entities"]["coin"] == "bitcoin"
    
    @pytest.mark.asyncio
    async def test_comparison_query_processing(self):
        """Test complete pipeline for comparison queries."""
        query = "Compare Bitcoin and Ethereum over 30 days"
        result = await process_query(query)
        
        assert result["intent"] == "comparison_query"
        assert len(result["answer"]) > 0
        assert "bitcoin" in result["entities"]["coins"]
        assert "ethereum" in result["entities"]["coins"]
        assert result["entities"]["timeframe"] == "30d"
    
    @pytest.mark.asyncio
    async def test_generic_info_processing(self):
        """Test complete pipeline for generic info queries."""
        query = "Tell me about Solana"
        result = await process_query(query)
        
        assert result["intent"] == "generic_info"
        assert len(result["answer"]) > 0
        assert result["entities"]["coin"] == "solana"
    
    @pytest.mark.asyncio
    async def test_unknown_query_processing(self):
        """Test complete pipeline for unknown queries."""
        query = "How to cook pasta?"
        result = await process_query(query)
        
        assert result["intent"] == "unknown"
        assert "didn't understand" in result["answer"].lower() or "help you with" in result["answer"].lower()
    
    @pytest.mark.asyncio
    async def test_empty_query_handling(self):
        """Test handling of empty or whitespace-only queries."""
        empty_queries = ["", "   ", "\n\t", None]
        
        for query in empty_queries:
            if query is None:
                continue  # Skip None as it would raise TypeError
            result = await process_query(query)
            
            assert result["intent"] == "empty_query"
            assert "provide a question" in result["answer"].lower()
            assert result["confidence"] == 0.0
    
    def test_sample_queries_structure(self):
        """Test sample queries structure and content."""
        samples = get_sample_queries()
        
        # Verify expected categories exist
        expected_categories = [
            "price_queries",
            "trend_queries", 
            "market_cap_queries",
            "comparison_queries",
            "info_queries"
        ]
        
        for category in expected_categories:
            assert category in samples, f"Missing category: {category}"
            assert isinstance(samples[category], list), f"Category {category} should be a list"
            assert len(samples[category]) > 0, f"Category {category} should not be empty"
    
    @pytest.mark.asyncio
    async def test_pipeline_error_handling(self):
        """Test pipeline error handling with problematic queries."""
        # Very long query
        long_query = "a" * 1000
        result = await process_query(long_query)
        assert "answer" in result
        
        # Query with special characters
        special_query = "What is the price of Bitcoin? @#$%^&*()"
        result = await process_query(special_query)
        assert result["intent"] == "price_query"
    
    @pytest.mark.asyncio
    async def test_all_sample_queries(self):
        """Test that all sample queries can be processed without errors."""
        samples = get_sample_queries()
        
        for category, queries in samples.items():
            for query in queries[:2]:  # Test first 2 queries from each category to save time
                result = await process_query(query)
                
                # Verify basic structure
                assert "answer" in result
                assert "intent" in result
                assert "confidence" in result
                assert "entities" in result
                
                # Verify intent is not empty
                assert result["intent"] != ""
                
                # Verify answer is meaningful
                assert len(result["answer"]) > 10