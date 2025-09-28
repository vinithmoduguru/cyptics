#!/usr/bin/env python3
"""
Test script to check CoinGecko API directly
"""

import asyncio
import aiohttp
import json

async def test_coingecko_api():
    """Test CoinGecko API endpoints."""
    
    base_url = "https://api.coingecko.com/api/v3"
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Check if API is accessible
        print("Testing CoinGecko API accessibility...")
        try:
            async with session.get(f"{base_url}/ping") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ API Ping successful: {data}")
                else:
                    print(f"❌ API Ping failed with status: {response.status}")
        except Exception as e:
            print(f"❌ API Ping failed with error: {e}")
        
        # Test 2: Test search endpoint
        print("\nTesting search endpoint...")
        try:
            params = {"query": "bitcoin"}
            async with session.get(f"{base_url}/search", params=params) as response:
                print(f"Search response status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    coins = data.get("coins", [])
                    print(f"✅ Search successful: Found {len(coins)} results")
                    if coins:
                        print(f"First result: {coins[0]}")
                else:
                    error_text = await response.text()
                    print(f"❌ Search failed: {error_text}")
        except Exception as e:
            print(f"❌ Search failed with error: {e}")
        
        # Test 3: Test market data endpoint
        print("\nTesting market data endpoint...")
        try:
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 5,
                "page": 1,
                "sparkline": "false"
            }
            async with session.get(f"{base_url}/coins/markets", params=params) as response:
                print(f"Markets response status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Markets successful: Found {len(data)} results")
                    if data:
                        print(f"First coin: {data[0]['id']} - {data[0]['name']}")
                else:
                    error_text = await response.text()
                    print(f"❌ Markets failed: {error_text}")
        except Exception as e:
            print(f"❌ Markets failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_coingecko_api())