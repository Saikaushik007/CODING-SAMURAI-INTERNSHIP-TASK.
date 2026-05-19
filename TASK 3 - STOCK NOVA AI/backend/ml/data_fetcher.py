import yfinance as yf
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

def generate_synthetic_data(ticker: str, period: str = '2y') -> pd.DataFrame:
    """
    Generate synthetic OHLCV data using Geometric Brownian Motion if Yahoo Finance fails.
    """
    days = 500 if period == '2y' else 250
    dates = [datetime.now() - timedelta(days=x) for x in range(days)]
    dates.reverse()

    np.random.seed(sum(ord(c) for c in ticker))  # Seed based on ticker name for consistency
    S0 = np.random.uniform(50, 500) # Initial price
    mu = 0.1 / 252 # Daily drift
    sigma = 0.3 / np.sqrt(252) # Daily volatility
    
    closes = [S0]
    for _ in range(1, days):
        closes.append(closes[-1] * np.exp((mu - 0.5 * sigma**2) + sigma * np.random.normal()))
        
    closes = np.array(closes)
    highs = closes * (1 + np.abs(np.random.normal(0, 0.015, days)))
    lows = closes * (1 - np.abs(np.random.normal(0, 0.015, days)))
    opens = closes * (1 + np.random.normal(0, 0.01, days))
    
    # Fix H/L bounds
    highs = np.maximum(highs, np.maximum(opens, closes))
    lows = np.minimum(lows, np.minimum(opens, closes))
    
    df = pd.DataFrame({
        'Date': dates,
        'Open': opens,
        'High': highs,
        'Low': lows,
        'Close': closes,
        'Volume': np.random.randint(1000000, 50000000, days)
    })
    return df

def fetch_stock_data(ticker: str, period: str = '2y') -> pd.DataFrame:
    """
    Fetch stock data from yfinance with local CSV caching.
    Falls back to synthetic data if yfinance raises a 429 error.
    """
    cache_path = os.path.join(CACHE_DIR, f"{ticker}_{period}.csv")
    
    if os.path.exists(cache_path):
        mtime = datetime.fromtimestamp(os.path.getmtime(cache_path))
        if datetime.now() - mtime < timedelta(minutes=60):
            df = pd.read_csv(cache_path)
            df['Date'] = pd.to_datetime(df['Date'])
            return df

    try:
        df = yf.download(ticker, period=period, auto_adjust=True)
        if df.empty:
            raise Exception("yfinance returned empty data")
        
        df = df.reset_index()
        df = df.dropna()
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        
        df.to_csv(cache_path, index=False)
        return df
    except Exception as e:
        print(f"yfinance failed for {ticker}: {e}. Falling back to synthetic data.")
        df = generate_synthetic_data(ticker, period)
        df.to_csv(cache_path, index=False)
        return df

def get_stock_info(ticker: str) -> dict:
    """
    Fetch general stock information using yfinance.
    Falls back to synthetic info if rate limited.
    """
    try:
        t = yf.Ticker(ticker)
        # We only try to get fast_info to minimize 429s, or catch it instantly
        info = t.info
        if not info or 'regularMarketPrice' not in info and 'currentPrice' not in info:
            raise Exception("No standard info available")
            
        current = info.get('currentPrice') or info.get('regularMarketPrice')
        prev_close = info.get('previousClose', current)
        change = current - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0

        return {
            'name': info.get('longName', ticker),
            'symbol': info.get('symbol', ticker),
            'currentPrice': current,
            'previousClose': prev_close,
            'change': round(change, 2),
            'changePct': round(change_pct, 2),
            'marketCap': info.get('marketCap'),
            'volume': info.get('volume'),
            'week52High': info.get('fiftyTwoWeekHigh'),
            'week52Low': info.get('fiftyTwoWeekLow'),
            'sector': info.get('sector', 'Technology'),
            'industry': info.get('industry', 'Consumer Electronics'),
            'marketStatus': 'OPEN' if info.get('marketState') == 'REGULAR' else 'CLOSED',
            'isSynthetic': False
        }
    except Exception as e:
        print(f"Info fetch failed for {ticker}: {e}. Generating synthetic info.")
        # Generate synthetic info based on the synthetic dataframe
        df = fetch_stock_data(ticker, '1y')
        current = float(df.iloc[-1]['Close'])
        prev_close = float(df.iloc[-2]['Close'])
        change = current - prev_close
        change_pct = (change / prev_close) * 100
        
        return {
            'name': f"{ticker} Corporation (Synthetic Demo)",
            'symbol': ticker,
            'currentPrice': current,
            'previousClose': prev_close,
            'change': round(change, 2),
            'changePct': round(change_pct, 2),
            'marketCap': np.random.randint(100, 2000) * 1000000000,
            'volume': int(df.iloc[-1]['Volume']),
            'week52High': float(df['High'].max()),
            'week52Low': float(df['Low'].min()),
            'sector': 'Simulated Market',
            'industry': 'AI Simulation',
            'marketStatus': 'OPEN',
            'isSynthetic': True
        }

def get_available_tickers() -> list:
    return [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC",
        "BTC-USD", "ETH-USD"
    ]
