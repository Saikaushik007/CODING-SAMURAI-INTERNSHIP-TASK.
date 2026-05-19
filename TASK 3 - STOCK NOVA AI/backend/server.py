import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.predict import predict_bp
from routes.stocks import stocks_bp
from routes.analysis import analysis_bp

# Initialize Flask app
# Point static_folder to the frontend directory
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Register Blueprints
app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(stocks_bp, url_prefix='/api')
app.register_blueprint(analysis_bp, url_prefix='/api')

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/ping')
def ping():
    return "OK", 200

if __name__ == '__main__':
    # Ensure cache directory exists
    os.makedirs('cache', exist_ok=True)
    
    print("STOCKNOVA Backend Intelligence Engine Starting...")
    print("Local Terminal: http://localhost:5000")
    app.run(debug=True, port=5000)
