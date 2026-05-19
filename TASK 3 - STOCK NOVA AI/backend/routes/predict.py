from flask import Blueprint, request, jsonify
from ml.model_manager import run_prediction, run_all_models

predict_bp = Blueprint('predict', __name__)

@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    ticker = data.get('ticker')
    model_type = data.get('model_type', 'linear')
    period = data.get('period', '1y')
    feature_set = data.get('feature_set', 'technical')
    
    if not ticker:
        return jsonify({'error': 'Ticker is required'}), 400
        
    try:
        response = run_prediction(ticker, model_type, period, feature_set)
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@predict_bp.route('/compare', methods=['POST'])
def compare():
    data = request.get_json()
    ticker = data.get('ticker')
    period = data.get('period', '1y')
    
    if not ticker:
        return jsonify({'error': 'Ticker is required'}), 400
        
    try:
        response = run_all_models(ticker, period)
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
