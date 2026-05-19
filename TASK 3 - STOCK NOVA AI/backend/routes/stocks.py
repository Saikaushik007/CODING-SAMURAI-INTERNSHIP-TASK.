from flask import Blueprint, request, jsonify
from ml.data_fetcher import fetch_stock_data, get_stock_info, get_available_tickers

stocks_bp = Blueprint('stocks', __name__)

@stocks_bp.route('/stock/history', methods=['GET'])
def stock_history():
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1y')
    
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
        
    df = fetch_stock_data(ticker, period)
    if df.empty:
        return jsonify({'error': 'No data found'}), 404
        
    data = df.to_dict(orient='records')
    # Convert dates to string
    for item in data:
        item['Date'] = item['Date'].strftime('%Y-%m-%d')
        
    return jsonify({
        'ticker': ticker,
        'period': period,
        'data': data
    })

@stocks_bp.route('/stock/info', methods=['GET'])
def stock_info():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
    
    info = get_stock_info(ticker)
    return jsonify(info)

@stocks_bp.route('/stock/tickers', methods=['GET'])
def available_tickers():
    return jsonify({'tickers': get_available_tickers()})
