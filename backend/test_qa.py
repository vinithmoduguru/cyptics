"""
Test script for Q/A Assistant functionality
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.qa import process_query, get_sample_queries


async def test_qa_pipeline():
    """Test the Q/A pipeline with various queries."""
    
    print("🧠 Testing Crypto Q/A Assistant Pipeline")
    print("=" * 50)
    
    # Test queries
    test_queries = [
        "What is the price of Bitcoin?",
        "Show me the 7-day trend of Ethereum",
        "What is Bitcoin's market cap?",
        "Compare Bitcoin and Ethereum",
        "Tell me about Dogecoin",
        "How much does Solana cost?",
        "Invalid query that should fail gracefully"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Testing query: '{query}'")
        print("-" * 40)
        
        try:
            result = await process_query(query)
            print(f"Intent: {result['intent']}")
            print(f"Confidence: {result['confidence']:.2f}")
            print(f"Entities: {result['entities']}")
            print(f"Answer: {result['answer']}")
            
        except Exception as e:
            print(f"Error: {e}")
    
    # Test sample queries
    print(f"\n\n📝 Sample Queries")
    print("=" * 50)
    samples = get_sample_queries()
    for category, queries in samples.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for query in queries[:2]:  # Show first 2 examples
            print(f"  • {query}")


if __name__ == "__main__":
    asyncio.run(test_qa_pipeline())