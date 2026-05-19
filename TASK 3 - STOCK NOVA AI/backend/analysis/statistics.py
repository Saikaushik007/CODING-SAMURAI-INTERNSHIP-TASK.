import pandas as pd
import numpy as np

def calc_volatility(series: pd.Series, window: int = 30) -> float:
    returns = series.pct_change().dropna()
    return float(returns.rolling(window).std().iloc[-1] * np.sqrt(252) * 100)

def calc_sharpe_ratio(series: pd.Series, risk_free_rate: float = 0.05) -> float:
    returns = series.pct_change().dropna()
    if returns.empty: return 0.0
    ann_return = returns.mean() * 252
    ann_std = returns.std() * np.sqrt(252)
    return float((ann_return - risk_free_rate) / ann_std) if ann_std > 0 else 0.0

def calc_max_drawdown(series: pd.Series) -> float:
    rolling_max = series.cummax()
    drawdown = (series - rolling_max) / rolling_max
    return float(drawdown.min() * 100)

def get_summary_stats(df: pd.DataFrame) -> dict:
    close = df['Close']
    
    current_price = float(close.iloc[-1])
    first_price = float(close.iloc[0])
    total_return = ((current_price - first_price) / first_price) * 100
    
    pos_days = (close.pct_change() > 0).sum()
    total_days = len(close) - 1
    
    return {
        'week_52_high': float(df['High'].max()),
        'week_52_low': float(df['Low'].min()),
        'current_price': current_price,
        'avg_volume_30d': int(df['Volume'].iloc[-30:].mean()),
        'volatility_30d': round(calc_volatility(close), 2),
        'total_return_pct': round(total_return, 2),
        'max_drawdown': round(calc_max_drawdown(close), 2),
        'sharpe_ratio': round(calc_sharpe_ratio(close), 2),
        'avg_daily_range': round(float(((df['High'] - df['Low']) / close).mean() * 100), 2),
        'positive_days_pct': round(float((pos_days / total_days) * 100), 2)
    }
