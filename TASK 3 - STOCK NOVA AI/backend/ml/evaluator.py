from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

def evaluate_model(y_true, y_pred) -> dict:
    """
    Calculate performance metrics.
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    
    # Direction Accuracy (did we guess the movement right?)
    actual_diff = np.diff(y_true)
    pred_diff = np.diff(y_pred)
    direction_accuracy = np.mean((actual_diff > 0) == (pred_diff > 0)) * 100
    
    # Strategy Backtesting (Alpha)
    # Simple strategy: If pred says UP, buy/hold. If DOWN, sell/flat.
    # We will simulate daily returns based on signals
    daily_returns = actual_diff / y_true[:-1]
    signals = pred_diff > 0
    strategy_returns = daily_returns * signals
    
    buyhold_return = (y_true[-1] - y_true[0]) / y_true[0] * 100
    strategy_return = np.sum(strategy_returns) * 100
    strategy_alpha = strategy_return - buyhold_return
    
    # Residual Analysis
    residuals = y_true - y_pred
    res_mean = np.mean(residuals)
    res_std = np.std(residuals)
    max_over = np.min(residuals) # Most negative residual
    max_under = np.max(residuals) # Most positive residual
    
    # Verdict logic
    if r2 >= 0.85:
        verdict = 'STRONG FIT'
    elif r2 >= 0.70:
        verdict = 'GOOD FIT'
    elif r2 >= 0.50:
        verdict = 'MODERATE FIT'
    else:
        verdict = 'WEAK FIT'
        
    return {
        'mae': round(float(mae), 2),
        'rmse': round(float(rmse), 2),
        'r2': round(float(r2), 4),
        'mape': round(float(mape), 2),
        'direction_accuracy': round(float(direction_accuracy), 2),
        'strategy_alpha': round(float(strategy_alpha), 2),
        'res_mean': round(float(res_mean), 2),
        'res_std': round(float(res_std), 2),
        'max_over': round(float(abs(max_over)), 2),
        'max_under': round(float(max_under), 2),
        'verdict': verdict
    }

def compare_models(results: dict) -> dict:
    """Compare multiple model results and find the best one."""
    best_model = None
    best_r2 = -float('inf')
    
    for name, metrics in results.items():
        if metrics['r2'] > best_r2:
            best_r2 = metrics['r2']
            best_model = name
            
    return {
        'best_model': best_model,
        'all_metrics': results
    }
