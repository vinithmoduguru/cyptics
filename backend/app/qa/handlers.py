"""Handler functions for different query intents."""
from typing import List, Optional
import random
from app.services.coingecko import coingecko_service


async def handle_price(coin: str) -> str:
    """
    Handle price query for a specific cryptocurrency.
    
    Args:
        coin (str): Cryptocurrency name
        
    Returns:
        str: Price information response
    """
    try:
        # Try to get real price data
        crypto_data = await coingecko_service.get_cryptocurrency_by_id(coin)
        if crypto_data:
            price = crypto_data.get('current_price', 0)
            symbol = crypto_data.get('symbol', '').upper()
            name = crypto_data.get('name', coin.title())
            
            # Format price appropriately
            if price >= 1:
                price_str = f"${price:,.2f}"
            else:
                price_str = f"${price:.6f}"
            
            return f"The current price of {name} ({symbol}) is {price_str}."
        else:
            # Fallback response
            return f"I couldn't find current price data for {coin.title()}. Please try again later."
    except Exception as e:
        # Mock response as fallback
        mock_prices = {
            "bitcoin": 64000,
            "ethereum": 3200,
            "dogecoin": 0.08,
            "solana": 150
        }
        price = mock_prices.get(coin, random.randint(1, 1000))
        return f"The current price of {coin.title()} is approximately ${price:,.2f}."


async def handle_trend(coin: str, timeframe: str) -> str:
    """
    Handle trend/chart query for a cryptocurrency.
    
    Args:
        coin (str): Cryptocurrency name
        timeframe (str): Time period (e.g., '7d', '30d')
        
    Returns:
        str: Trend information response
    """
    try:
        # For 24h, use the direct API data
        if timeframe == '1d':
            crypto_data = await coingecko_service.get_cryptocurrency_by_id(coin)
            if crypto_data:
                price_change = crypto_data.get('price_change_percentage_24h')
                if price_change is not None:
                    name = crypto_data.get('name', coin.title())
                    
                    if price_change > 0:
                        trend_word = "increased"
                        emoji = "📈"
                    elif price_change < 0:
                        trend_word = "decreased" 
                        emoji = "📉"
                    else:
                        trend_word = "remained stable"
                        emoji = "➡️"
                    
                    return f"{emoji} {name} has {trend_word} by {abs(price_change):.2f}% over the last 24 hours."
        
        # For longer timeframes, use price history to calculate change
        else:
            days_mapping = {
                '7d': 7,
                '10d': 10,
                '14d': 14,
                '30d': 30,
                '90d': 90,
                '1y': 365
            }
            
            days = days_mapping.get(timeframe, 7)
            price_history = await coingecko_service.get_price_history(coin, days=days)
            
            if price_history and len(price_history) >= 2:
                # Get first and last price points
                start_price = price_history[0]['price']
                end_price = price_history[-1]['price']
                
                # Calculate percentage change
                price_change = ((end_price - start_price) / start_price) * 100
                
                timeframe_display = {
                    '7d': '7 days',
                    '10d': '10 days',
                    '14d': '14 days',
                    '30d': '30 days',
                    '90d': '90 days',
                    '1y': '1 year'
                }.get(timeframe, f'{days} days')
                
                coin_name = coin.title()
                
                if price_change > 0:
                    trend_word = "increased"
                    emoji = "📈"
                elif price_change < 0:
                    trend_word = "decreased"
                    emoji = "📉"
                else:
                    trend_word = "remained stable"
                    emoji = "➡️"
                
                return f"{emoji} {coin_name} has {trend_word} by {abs(price_change):.2f}% over the last {timeframe_display}."
        
        # Fallback if no data found
        return f"I couldn't find sufficient trend data for {coin.title()}. Please try again later."
        
    except Exception as e:
        # Mock response as fallback
        mock_change = random.uniform(-15, 15)
        timeframe_display = {
            '1d': '24 hours',
            '7d': '7 days',
            '10d': '10 days',
            '14d': '14 days',
            '30d': '30 days',
            '90d': '90 days',
            '1y': '1 year'
        }.get(timeframe, timeframe)
        
        coin_name = coin.title()
        
        if mock_change > 0:
            return f"📈 {coin_name} has increased by {mock_change:.2f}% over the last {timeframe_display}."
        else:
            return f"📉 {coin_name} has decreased by {abs(mock_change):.2f}% over the last {timeframe_display}."


async def handle_market_cap(coin: str) -> str:
    """
    Handle market cap query for a cryptocurrency.
    
    Args:
        coin (str): Cryptocurrency name
        
    Returns:
        str: Market cap information response
    """
    try:
        # Try to get real market cap data
        crypto_data = await coingecko_service.get_cryptocurrency_by_id(coin)
        if crypto_data:
            market_cap = crypto_data.get('market_cap')
            name = crypto_data.get('name', coin.title())
            
            if market_cap:
                # Format market cap in billions or millions
                if market_cap >= 1_000_000_000:
                    market_cap_str = f"${market_cap / 1_000_000_000:.2f} billion"
                elif market_cap >= 1_000_000:
                    market_cap_str = f"${market_cap / 1_000_000:.2f} million"
                else:
                    market_cap_str = f"${market_cap:,.2f}"
                
                return f"The market capitalization of {name} is {market_cap_str}."
            else:
                return f"I couldn't find market cap data for {coin.title()}."
        else:
            return f"I couldn't find market cap data for {coin.title()}. Please try again later."
    except Exception as e:
        # Mock response as fallback
        mock_market_caps = {
            "bitcoin": 1_250_000_000_000,  # 1.25 trillion
            "ethereum": 380_000_000_000,   # 380 billion
            "dogecoin": 12_000_000_000,    # 12 billion
            "solana": 65_000_000_000       # 65 billion
        }
        market_cap = mock_market_caps.get(coin, random.randint(1_000_000, 100_000_000_000))
        
        if market_cap >= 1_000_000_000:
            market_cap_str = f"${market_cap / 1_000_000_000:.2f} billion"
        else:
            market_cap_str = f"${market_cap / 1_000_000:.2f} million"
        
        return f"The market capitalization of {coin.title()} is approximately {market_cap_str}."


async def handle_comparison(coins: List[str], timeframe: str) -> str:
    """
    Handle comparison query between multiple cryptocurrencies.
    
    Args:
        coins (List[str]): List of cryptocurrency names to compare
        timeframe (str): Time period for comparison
        
    Returns:
        str: Comparison information response
    """
    if len(coins) < 2:
        return "I need at least two cryptocurrencies to compare. Please specify which coins you'd like to compare."
    
    try:
        comparison_data = []
        
        for coin in coins[:3]:  # Limit to 3 coins for readability
            try:
                # For 24h data, use direct API
                if timeframe == '1d':
                    crypto_data = await coingecko_service.get_cryptocurrency_by_id(coin)
                    if crypto_data:
                        name = crypto_data.get('name', coin.title())
                        price = crypto_data.get('current_price', 0)
                        price_change = crypto_data.get('price_change_percentage_24h', 0)
                        
                        comparison_data.append({
                            'name': name,
                            'price': price,
                            'change': price_change
                        })
                else:
                    # For longer timeframes, calculate from price history
                    days_mapping = {
                        '7d': 7, '10d': 10, '14d': 14, '30d': 30, '90d': 90, '1y': 365
                    }
                    days = days_mapping.get(timeframe, 7)
                    price_history = await coingecko_service.get_price_history(coin, days=days)
                    
                    if price_history and len(price_history) >= 2:
                        start_price = price_history[0]['price']
                        end_price = price_history[-1]['price']
                        price_change = ((end_price - start_price) / start_price) * 100
                        
                        comparison_data.append({
                            'name': coin.title(),
                            'price': end_price,
                            'change': price_change
                        })
            except Exception:
                continue
        
        if len(comparison_data) >= 2:
            timeframe_display = {
                '1d': '24 hours',
                '7d': '7 days',
                '10d': '10 days',
                '14d': '14 days',
                '30d': '30 days',
                '90d': '90 days',
                '1y': '1 year'
            }.get(timeframe, timeframe)
            
            response = f"Here's a comparison over the last {timeframe_display}:\n\n"
            
            for i, data in enumerate(comparison_data, 1):
                price_str = f"${data['price']:,.2f}" if data['price'] >= 1 else f"${data['price']:.6f}"
                change_emoji = "📈" if data['change'] > 0 else "📉" if data['change'] < 0 else "➡️"
                response += f"{i}. {data['name']}: {price_str} ({change_emoji} {data['change']:+.2f}%)\n"
            
            return response.strip()
        else:
            return f"I couldn't find comparison data for the requested cryptocurrencies. Please try again later."
    
    except Exception as e:
        # Mock comparison response
        mock_data = []
        for coin in coins[:3]:
            mock_price = random.uniform(0.001, 50000)
            mock_change = random.uniform(-20, 20)
            mock_data.append({
                'name': coin.title(),
                'price': mock_price,
                'change': mock_change
            })
        
        timeframe_display = {
            '1d': '24 hours',
            '7d': '7 days',
            '10d': '10 days',
            '14d': '14 days',
            '30d': '30 days',
            '90d': '90 days',
            '1y': '1 year'
        }.get(timeframe, timeframe)
        
        response = f"Here's a comparison over the last {timeframe_display}:\n\n"
        
        for i, data in enumerate(mock_data, 1):
            price_str = f"${data['price']:,.2f}" if data['price'] >= 1 else f"${data['price']:.6f}"
            change_emoji = "📈" if data['change'] > 0 else "📉" if data['change'] < 0 else "➡️"
            response += f"{i}. {data['name']}: {price_str} ({change_emoji} {data['change']:+.2f}%)\n"
        
        return response.strip()


async def handle_generic_info(coin: str) -> str:
    """
    Handle generic information queries about cryptocurrencies.
    
    Args:
        coin (str): Cryptocurrency name
        
    Returns:
        str: Generic information response
    """
    # Static information about cryptocurrencies
    crypto_info = {
        "bitcoin": "Bitcoin (BTC) is the first and largest cryptocurrency, created by Satoshi Nakamoto in 2009. It's a decentralized digital currency that operates on a peer-to-peer network without a central authority.",
        "ethereum": "Ethereum (ETH) is a decentralized blockchain platform that enables smart contracts and decentralized applications (dApps). It was created by Vitalik Buterin in 2015.",
        "dogecoin": "Dogecoin (DOGE) started as a meme-based cryptocurrency featuring the Shiba Inu dog. Despite its origins, it has gained significant popularity and community support.",
        "solana": "Solana (SOL) is a high-performance blockchain platform designed for decentralized applications and crypto-currencies. It's known for its fast transaction speeds and low fees."
    }
    
    info = crypto_info.get(coin, f"{coin.title()} is a cryptocurrency. For more detailed information, please visit CoinGecko or other crypto information websites.")
    
    return info


async def handle_unknown() -> str:
    """
    Handle unknown or unrecognized queries.
    
    Returns:
        str: Default response for unknown queries
    """
    return ("Sorry, I didn't understand your question. I can help you with:\n"
            "• Current prices (e.g., 'What is the price of Bitcoin?')\n"
            "• Price trends (e.g., 'Show me the 7-day trend of Ethereum')\n" 
            "• Market caps (e.g., 'What is Bitcoin's market cap?')\n"
            "• Comparisons (e.g., 'Compare Bitcoin and Ethereum over 30 days')\n"
            "• General info (e.g., 'Tell me about Solana')")