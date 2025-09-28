"""Test script for Q/A Assistant functionality."""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.qa import process_query

async def test_qa_system():
    """Test the Q/A system with various query types."""
    
    test_queries = [
        # Price queries
        "What is the price of Bitcoin?",
        "How much does Ethereum cost?",
        "Current price of Solana",
        
        # Trend queries
        "Show me Bitcoin's 7-day trend",
        "How has Ethereum performed over the last month?", 
        "Bitcoin performance in 24 hours",
        
        # Market cap queries
        "What is Bitcoin's market cap?",
        "Ethereum market capitalization",
        
        # Comparison queries
        "Compare Bitcoin and Ethereum",
        "Bitcoin vs Solana performance",
        
        # Info queries
        "Tell me about Dogecoin",
        "What is Solana?",
        
        # Unknown queries
        "How to cook pasta?",
    ]
    
    print("🧪 Testing Q/A Assistant System\n")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Test {i}: {query}")
        print("-" * 40)
        
        try:
            result = await process_query(query)
            
            print(f"🎯 Intent: {result['intent']}")
            print(f"🎲 Confidence: {result['confidence']:.1%}")
            print(f"📊 Entities: {result['entities']}")
            print(f"💬 Answer: {result['answer']}")
            print("✅ SUCCESS")
            
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎉 Q/A System testing completed!")

if __name__ == "__main__":
    asyncio.run(test_qa_system())