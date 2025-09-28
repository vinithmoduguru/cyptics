"""Debug entity extraction for timeframe queries."""
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.qa.entities import extract_timeframe, extract_entities
from app.qa.intents import detect_intent

def test_timeframe_extraction():
    """Test timeframe extraction for various queries."""
    
    test_queries = [
        "Show 10 days trend of bitcoin",
        "Show me the 7-day trend of Bitcoin", 
        "Bitcoin trend over 7 days",
        "How has Bitcoin performed over the last 10 days?",
        "Bitcoin 7-day performance",
        "Show me Bitcoin's 10-day chart"
    ]
    
    print("🔍 Testing Timeframe Extraction\n")
    print("=" * 60)
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        print("-" * 40)
        
        intent = detect_intent(query)
        timeframe = extract_timeframe(query)
        entities = extract_entities(query)
        
        print(f"🎯 Intent: {intent}")
        print(f"⏰ Timeframe: {timeframe}")
        print(f"🪙 Coin: {entities['coin']}")
        print(f"📊 All entities: {entities}")

if __name__ == "__main__":
    test_timeframe_extraction()