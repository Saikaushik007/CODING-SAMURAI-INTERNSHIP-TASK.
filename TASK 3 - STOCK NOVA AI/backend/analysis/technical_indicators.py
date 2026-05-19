import pandas as pd
import numpy as np

def calc_sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window=window).mean()

def calc_ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()

def calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calc_macd(series: pd.Series):
    ema12 = calc_ema(series, 12)
    ema26 = calc_ema(series, 26)
    macd = ema12 - ema26
    signal = calc_ema(macd, 9)
    histogram = macd - signal
    return macd, signal, histogram

def calc_bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0):
    middle = calc_sma(series, window)
    std = series.rolling(window).std()
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    return upper, middle, lower

def get_all_indicators(df: pd.DataFrame) -> dict:
    """
    Calculate indicators for the last 90 days of data.
    """
    # Use full data for calculation to avoid initial NaNs, then slice
    close = df['Close']
    
    sma20 = calc_sma(close, 20)
    sma50 = calc_sma(close, 50)
    ema12 = calc_ema(close, 12)
    ema26 = calc_ema(close, 26)
    rsi = calc_rsi(close)
    macd, macd_signal, macd_hist = calc_macd(close)
    bb_upper, bb_middle, bb_lower = calc_bollinger_bands(close)
    
    # Take last 90 entries
    limit = 90
    df_slice = df.iloc[-limit:]
    
    def clean(series):
        return [float(x) if not np.isnan(x) else None for x in series.iloc[-limit:]]

    return {
        'dates': df_slice['Date'].dt.strftime('%Y-%m-%d').tolist(),
        'sma_20': clean(sma20),
        'sma_50': clean(sma50),
        'ema_12': clean(ema12),
        'ema_26': clean(ema26),
        'rsi': clean(rsi),
        'macd': clean(macd),
        'macd_signal': clean(macd_signal),
        'macd_histogram': clean(macd_hist),
        'bb_upper': clean(bb_upper),
        'bb_middle': clean(bb_middle),
        'bb_lower': clean(bb_lower),
        'rsi_overbought': 70,
        'rsi_oversold': 30
    }
