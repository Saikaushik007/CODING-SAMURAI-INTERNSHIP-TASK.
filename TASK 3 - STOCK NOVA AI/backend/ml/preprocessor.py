import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from statsmodels.tsa.stattools import adfuller

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create technical features and lags for the ML models.
    """
    if df.empty:
        return df
    
    df = df.copy()
    
    # 1. Day Index (Primary for regression)
    df['Day_Index'] = np.arange(len(df))
    
    # Time features
    if 'Date' in df.columns:
        df['Day_of_Week'] = df['Date'].dt.dayofweek
        df['Month'] = df['Date'].dt.month
    else:
        df['Day_of_Week'] = 0
        df['Month'] = 1
    
    # 2. Moving Averages
    df['SMA_5'] = df['Close'].rolling(window=5).mean()
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
    
    # 3. Price Variations & Log Returns
    df['Price_Change'] = df['Close'].diff()
    df['Log_Return'] = np.log(df['Close'] / df['Close'].shift(1))
    df['High_Low_Range'] = df['High'] - df['Low']
    
    # Rolling Statistics
    df['Rolling_Std_20'] = df['Close'].rolling(window=20).std()
    df['Rolling_Max_10'] = df['Close'].rolling(window=10).max()
    df['Price_Momentum_5'] = df['Close'] / df['Close'].shift(5)
    
    # 4. Volume Features
    df['Volume_MA5'] = df['Volume'].rolling(window=5).mean()
    df['Volume_Surge'] = df['Volume'] / df['Volume'].rolling(window=20).mean()
    df['Volume_Surge'].fillna(1.0, inplace=True)
    
    # 5. Lags
    df['Lag_1'] = df['Close'].shift(1)
    df['Lag_3'] = df['Close'].shift(3)
    df['Lag_5'] = df['Close'].shift(5)
    
    # Drop rows with NaN created by indicators/lags
    df = df.dropna().copy()
    
    # Outlier Clipping on Log Returns (3 std)
    mean_lr = df['Log_Return'].mean()
    std_lr = df['Log_Return'].std()
    df['Log_Return'] = df['Log_Return'].clip(lower=mean_lr - 3*std_lr, upper=mean_lr + 3*std_lr)
    
    return df

def check_stationarity(series: pd.Series) -> bool:
    """Run ADF test. Returns True if stationary (p < 0.05)."""
    if len(series) < 20: return False
    try:
        result = adfuller(series.dropna())
        return result[1] < 0.05
    except:
        return False

def prepare_data(df: pd.DataFrame, feature_set: str = 'technical', test_size: float = 0.2):
    """
    Prepare X and y, perform time-series split and scaling.
    """
    feature_map = {
        'basic': ['Day_Index'],
        'technical': ['Day_Index', 'SMA_5', 'SMA_20', 'EMA_12', 'High_Low_Range', 'Day_of_Week', 'Month'],
        'full': [
            'Day_Index', 'SMA_5', 'SMA_20', 'EMA_12', 'High_Low_Range', 
            'Volume_MA5', 'Lag_1', 'Lag_3', 'Lag_5',
            'Day_of_Week', 'Month', 'Rolling_Std_20', 'Rolling_Max_10', 
            'Price_Momentum_5', 'Volume_Surge'
        ]
    }
    
    feature_cols = feature_map.get(feature_set, feature_map['technical'])
    
    # Ensure columns exist (in case of basic tests)
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    X = df[feature_cols].values
    
    # Determine stationarity to choose target variable
    is_stationary = check_stationarity(df['Close'])
    target_col = 'Log_Return' # Using log return by default for better ML properties
    y = df[target_col].values
    
    # Time-series split
    split_idx = int(len(df) * (1 - test_size))
    
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Base prices for converting log returns back to raw prices (use Lag_1 which is already clean)
    base_prices = df['Lag_1'].values
    base_train, base_test = base_prices[:split_idx], base_prices[split_idx:]
    
    # Scaling X
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, split_idx, feature_cols, base_train, base_test, is_stationary

def prepare_future_features(df: pd.DataFrame, scaler, feature_set: str, feature_cols: list, n_days: int = 7):
    """
    Generate feature rows for future n_days using iterative price simulation.
    Each predicted price is fed back into the rolling indicators for the next row,
    giving realistic feature evolution instead of static last-row copies.
    """
    # Build a rolling price window from the last 25 actual prices
    price_history = list(df['Close'].tail(25).values)
    volume_history = list(df['Volume'].tail(20).values)
    last_day_index = int(df['Day_Index'].iloc[-1])
    last_date = df['Date'].iloc[-1]
    
    future_rows = []
    
    for i in range(n_days):
        # Compute rolling features from current price history
        prices = np.array(price_history)
        
        sma5  = float(np.mean(prices[-5:]))   if len(prices) >= 5  else prices[-1]
        sma20 = float(np.mean(prices[-20:])) if len(prices) >= 20 else prices[-1]
        
        # EMA_12: approximate via last 12 prices
        weights = np.exp(np.linspace(-1, 0, min(12, len(prices))))
        weights /= weights.sum()
        ema12 = float(np.dot(weights, prices[-len(weights):]))
        
        # Rolling std and max
        rolling_std20 = float(np.std(prices[-20:])) if len(prices) >= 20 else float(np.std(prices))
        rolling_max10 = float(np.max(prices[-10:])) if len(prices) >= 10 else float(np.max(prices))
        
        # Momentum (price / price 5 days ago)
        price_momentum5 = float(prices[-1] / prices[-6]) if len(prices) >= 6 else 1.0
        
        # Lag features
        lag1 = float(prices[-1])
        lag3 = float(prices[-3]) if len(prices) >= 3 else prices[-1]
        lag5 = float(prices[-5]) if len(prices) >= 5 else prices[-1]
        
        # Volume features (assume flat volume for future)
        vol_ma5 = float(np.mean(volume_history[-5:])) if len(volume_history) >= 5 else volume_history[-1]
        vol_surge = 1.0  # no future volume data available
        
        # Date-based features for this future day
        future_date = last_date + pd.Timedelta(days=i+1)
        # Skip weekends
        while future_date.weekday() >= 5:
            future_date += pd.Timedelta(days=1)
        
        day_of_week = future_date.weekday()
        month = future_date.month
        day_index = last_day_index + i + 1
        
        # High-low range: approximate using rolling std
        hl_range = rolling_std20 * 1.5
        
        # Build feature row in same order as training
        feature_map_full = {
            'Day_Index': day_index,
            'SMA_5': sma5,
            'SMA_20': sma20,
            'EMA_12': ema12,
            'High_Low_Range': hl_range,
            'Volume_MA5': vol_ma5,
            'Lag_1': lag1,
            'Lag_3': lag3,
            'Lag_5': lag5,
            'Day_of_Week': day_of_week,
            'Month': month,
            'Rolling_Std_20': rolling_std20,
            'Rolling_Max_10': rolling_max10,
            'Price_Momentum_5': price_momentum5,
            'Volume_Surge': vol_surge,
        }
        
        row = [feature_map_full.get(col, 0.0) for col in feature_cols]
        future_rows.append(row)
        
        # Predict approximate next price by assuming log return near recent mean
        # (This is updated by the actual model prediction in model_manager.py)
        recent_log_returns = np.log(prices[-5:] / prices[-6:-1]) if len(prices) >= 6 else np.array([0.0])
        mean_lr = float(np.mean(recent_log_returns))
        next_price = prices[-1] * np.exp(mean_lr)
        price_history.append(next_price)
    
    future_X = np.array(future_rows, dtype=np.float64)
    return scaler.transform(future_X)
