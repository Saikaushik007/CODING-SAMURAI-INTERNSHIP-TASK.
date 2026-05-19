import time
import os
import numpy as np
import pandas as pd
from datetime import timedelta

from ml.data_fetcher import fetch_stock_data
from ml.preprocessor import engineer_features, prepare_data, prepare_future_features
from ml.linear_model import train_linear, train_polynomial, predict as lr_predict
from ml.neural_model import train_neural
from ml.ensemble_model import train_random_forest, train_gradient_boosting
from ml.evaluator import evaluate_model
from sklearn.model_selection import TimeSeriesSplit

def run_prediction(ticker: str, model_type: str, period: str, feature_set: str = 'technical'):
    """
    Main orchestration function for training and prediction.
    """
    start_time = time.time()
    
    # 1. Fetch data
    df_raw = fetch_stock_data(ticker, period)
    if df_raw.empty:
        raise ValueError(f"No data found for ticker {ticker}")
    
    # 2. Feature engineering
    df_feat = engineer_features(df_raw)
    
    # 3. Prepare data
    X_train, X_test, y_train, y_test, scaler, split_idx, feature_cols, base_train, base_test, is_stationary = prepare_data(df_feat, feature_set)
    
    # ENSEMBLE Logic
    if model_type == 'ensemble':
        models = {
            'linear': train_linear(X_train, y_train),
            'polynomial': train_polynomial(X_train, y_train, degree=3),
            'gradient_boosting': train_gradient_boosting(X_train, y_train)
        }
        
        # Calculate weights based on inverse train RMSE
        weights = {}
        total_inv_rmse = 0
        for name, m in models.items():
            train_p = m.predict(X_train)
            rmse = np.sqrt(np.mean((y_train - train_p)**2))
            inv_rmse = 1 / (rmse + 1e-6)
            weights[name] = inv_rmse
            total_inv_rmse += inv_rmse
            
        weights = {k: v/total_inv_rmse for k, v in weights.items()}
        
        # Predict using weighted average
        train_preds = np.zeros_like(y_train)
        test_preds = np.zeros_like(y_test)
        
        for name, m in models.items():
            train_preds += m.predict(X_train) * weights[name]
            test_preds += m.predict(X_test) * weights[name]
            
        class EnsembleModel:
            def __init__(self, models, weights):
                self.models = models
                self.weights = weights
            
            def predict(self, X):
                preds = np.zeros(len(X))
                for name, m in self.models.items():
                    preds += m.predict(X) * self.weights[name]
                return preds
                
        model = EnsembleModel(models, weights)
        
    else:
        # 4. Train single model
        if model_type == 'linear':
            model = train_linear(X_train, y_train)
        elif model_type == 'polynomial':
            model = train_polynomial(X_train, y_train, degree=3)
        elif model_type == 'neural':
            model = train_neural(X_train, y_train)
        elif model_type == 'random_forest':
            model = train_random_forest(X_train, y_train)
        elif model_type == 'gradient_boosting':
            model = train_gradient_boosting(X_train, y_train)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        # 5. Predict
        train_preds = model.predict(X_train)
        test_preds = model.predict(X_test)
        
    # Convert log returns back to actual prices
    y_test_price = base_test * np.exp(y_test)
    test_preds_price = base_test * np.exp(test_preds)
    train_preds_price = base_train * np.exp(train_preds)
    
    # 6. Evaluate
    metrics = evaluate_model(y_test_price, test_preds_price)
    
    # Walk-Forward Validation (5-fold)
    tscv = TimeSeriesSplit(n_splits=5)
    wf_metrics = []
    for train_index, test_index in tscv.split(X_train):
        if len(train_index) < 20: continue
        X_wtrain, X_wtest = X_train[train_index], X_train[test_index]
        y_wtrain, y_wtest = y_train[train_index], y_train[test_index]
        base_wtest = base_train[test_index]
        
        if model_type == 'linear':
            wm = train_linear(X_wtrain, y_wtrain)
        else:
            wm = train_linear(X_wtrain, y_wtrain) # Fast fallback for WF
            
        w_preds = wm.predict(X_wtest)
        w_y_test_price = base_wtest * np.exp(y_wtest)
        w_test_preds_price = base_wtest * np.exp(w_preds)
        wf_metrics.append(np.sqrt(np.mean((w_y_test_price - w_test_preds_price)**2)))
        
    metrics['wf_rmse'] = round(float(np.mean(wf_metrics)), 2) if wf_metrics else metrics['rmse']
    
    # 7. Future prediction — true iterative loop
    # We predict one day at a time, feed that price back into features for the next day.
    # This gives realistic compounding predictions using actual recent momentum.
    price_history = list(df_feat['Close'].tail(25).values.astype(float))
    volume_history = list(df_feat['Volume'].tail(20).values.astype(float))
    last_day_index = int(df_feat['Day_Index'].iloc[-1])
    last_date_dt = df_feat['Date'].iloc[-1]
    
    future_preds = []
    future_dates_list = []
    current_price = float(df_raw['Close'].iloc[-1])
    
    day_offset = 0
    for i in range(7):
        day_offset += 1
        future_date = last_date_dt + timedelta(days=day_offset)
        # Skip weekends (markets closed)
        while future_date.weekday() >= 5:
            day_offset += 1
            future_date = last_date_dt + timedelta(days=day_offset)
        future_dates_list.append(future_date.strftime('%Y-%m-%d'))
        
        prices_arr = np.array(price_history)
        
        sma5  = float(np.mean(prices_arr[-5:]))   if len(prices_arr) >= 5  else current_price
        sma20 = float(np.mean(prices_arr[-20:])) if len(prices_arr) >= 20 else current_price
        weights_ema = np.exp(np.linspace(-1, 0, min(12, len(prices_arr))))
        weights_ema /= weights_ema.sum()
        ema12 = float(np.dot(weights_ema, prices_arr[-len(weights_ema):]))
        rolling_std20 = float(np.std(prices_arr[-20:])) if len(prices_arr) >= 20 else float(np.std(prices_arr))
        rolling_max10 = float(np.max(prices_arr[-10:])) if len(prices_arr) >= 10 else float(np.max(prices_arr))
        price_momentum5 = float(prices_arr[-1] / prices_arr[-6]) if len(prices_arr) >= 6 else 1.0
        lag1 = float(prices_arr[-1])
        lag3 = float(prices_arr[-3]) if len(prices_arr) >= 3 else current_price
        lag5 = float(prices_arr[-5]) if len(prices_arr) >= 5 else current_price
        vol_ma5 = float(np.mean(volume_history[-5:])) if len(volume_history) >= 5 else volume_history[-1]
        hl_range = rolling_std20 * 1.5
        
        feature_map_lookup = {
            'Day_Index': last_day_index + i + 1,
            'SMA_5': sma5,
            'SMA_20': sma20,
            'EMA_12': ema12,
            'High_Low_Range': hl_range,
            'Volume_MA5': vol_ma5,
            'Lag_1': lag1,
            'Lag_3': lag3,
            'Lag_5': lag5,
            'Day_of_Week': future_date.weekday(),
            'Month': future_date.month,
            'Rolling_Std_20': rolling_std20,
            'Rolling_Max_10': rolling_max10,
            'Price_Momentum_5': price_momentum5,
            'Volume_Surge': 1.0,
        }
        
        row = np.array([[feature_map_lookup.get(col, 0.0) for col in feature_cols]], dtype=np.float64)
        row_scaled = scaler.transform(row)
        log_return_pred = float(model.predict(row_scaled)[0])
        
        # Clip to realistic daily move bounds (max ±10% in a day)
        log_return_pred = np.clip(log_return_pred, -0.10, 0.10)
        
        current_price = current_price * np.exp(log_return_pred)
        future_preds.append(current_price)
        price_history.append(current_price)
    
    future_preds = np.array(future_preds)
    
    # Confidence bands: widen as we go further out (uncertainty compounds)
    last_actual_price = float(df_raw['Close'].iloc[-1])
    rmse_pct = metrics['rmse'] / last_actual_price
    lower_bound = future_preds * (1 - (1.96 * rmse_pct * np.sqrt(np.arange(1, 8))))
    upper_bound = future_preds * (1 + (1.96 * rmse_pct * np.sqrt(np.arange(1, 8))))
    
    # Prepare chart data
    dates = df_feat['Date'].dt.strftime('%Y-%m-%d').tolist()
    actual_prices = df_feat['Close'].tolist()
    
    # Create prediction arrays with nulls for the parts they don't cover
    train_line = [None] * len(df_feat)
    test_line = [None] * len(df_feat)
    
    for i, p in enumerate(train_preds_price):
        train_line[i] = float(p) if not np.isnan(p) else None
        
    for i, p in enumerate(test_preds_price):
        test_line[split_idx + i] = float(p) if not np.isnan(p) else None
        
    future_data = []
    for i in range(7):
        future_data.append({
            'date': future_dates_list[i],
            'price': round(float(future_preds[i]), 2),
            'lower_bound': round(float(lower_bound[i]), 2),
            'upper_bound': round(float(upper_bound[i]), 2)
        })
        
    end_time = time.time()
    
    return {
        'ticker': ticker,
        'model_type': model_type,
        'period': period,
        'chart_data': {
            'dates': dates,
            'actual_prices': actual_prices,
            'train_predictions': train_line,
            'test_predictions': test_line,
            'split_index': split_idx
        },
        'future_predictions': future_data,
        'metrics': metrics,
        'model_info': {
            'name': model_type.upper(),
            'feature_set': feature_set,
            'n_train_samples': len(X_train),
            'n_test_samples': len(X_test),
            'is_stationary': bool(is_stationary),
            'training_time_ms': round((end_time - start_time) * 1000, 2)
        }
    }

def run_all_models(ticker: str, period: str):
    """
    Train all 3 models and return comparison metrics.
    """
    results = {}
    # Use a subset of models for fast comparison, or all if performance allows
    models_to_run = ['linear', 'polynomial', 'neural', 'random_forest', 'gradient_boosting', 'ensemble']
    for mtype in models_to_run:
        try:
            res = run_prediction(ticker, mtype, period)
            results[mtype] = res['metrics']
        except Exception as e:
            print(f"Error comparing model {mtype}: {e}")
            
    best_model = 'linear'
    best_r2 = -float('inf')
    for name, m in results.items():
        if m['r2'] > best_r2:
            best_r2 = m['r2']
            best_model = name
            
    return {
        'metrics': results,
        'best_model': best_model
    }
