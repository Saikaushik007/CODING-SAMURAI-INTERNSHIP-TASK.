from flask import Blueprint, request, jsonify
from ml.data_fetcher import fetch_stock_data
from analysis.technical_indicators import get_all_indicators
from analysis.statistics import get_summary_stats

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analysis', methods=['GET'])
def get_analysis():
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1y')
    
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
        
    df = fetch_stock_data(ticker, period)
    if df.empty:
        return jsonify({'error': 'No data found'}), 404
        
    try:
        indicators = get_all_indicators(df)
        stats = get_summary_stats(df)
        
        return jsonify({
            'indicators': indicators,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
