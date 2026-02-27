"""
API Routes for Vercel Serverless Functions
Auto-detected by Vercel in /api directory
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Simple data loader
class SimpleDataLoader:
    def __init__(self, artifacts_dir='artifacts_profitpulse'):
        self.artifacts_dir = artifacts_dir
        self._cache = {}
    
    def _load_json(self, filename):
        if filename not in self._cache:
            # Vercel puts files relative to /var/task
            possible_paths = [
                os.path.join(self.artifacts_dir, filename),
                os.path.join('/var/task', self.artifacts_dir, filename),
                os.path.join(os.path.dirname(__file__), '..', self.artifacts_dir, filename)
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    with open(path, 'r', encoding='utf-8') as f:
                        self._cache[filename] = json.load(f)
                    break
            else:
                self._cache[filename] = {}
        return self._cache[filename]
    
    def get_metadata(self):
        methodology = self._load_json('methodology_snapshot.json')
        metrics = self._load_json('model_metrics.json')
        data_info = methodology.get('data_info', {})
        
        return {
            'firms': data_info.get('firms', []),
            'firms_count': data_info.get('firm_count', 0),
            'years': data_info.get('years', []),
            'year_range': {
                'min': data_info.get('year_min', 2018),
                'max': data_info.get('year_max', 2023)
            },
            'model_metrics': metrics,
            'feature_cols': list(methodology.get('features', {}).keys()),
            'record_count': data_info.get('record_count', 0)
        }
    
    def get_summary(self):
        methodology = self._load_json('methodology_snapshot.json')
        metrics = self._load_json('model_metrics.json')
        
        return {
            'model_metrics': metrics,
            'methodology': methodology.get('methodology', {}),
            'data_info': methodology.get('data_info', {})
        }

data_loader = SimpleDataLoader()

def error_response(message: str, status_code: int = 400):
    return jsonify({'error': message}), status_code

def success_response(data: dict):
    return jsonify({'success': True, **data})

@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
@app.route('/api/', methods=['GET'])
def home():
    return success_response({
        'message': 'ProfitPulse API - Financial Analysis & Prediction',
        'version': '2.0.0 (Optimized)',
        'status': 'active',
        'endpoints': {
            'GET /api/meta': 'Dataset metadata',
            'GET /api/summary': 'Summary statistics',
            'GET /api/health': 'Health check'
        }
    })

@app.route('/api/health', methods=['GET'])
def health():
    return success_response({'status': 'healthy', 'version': '2.0.0'})

@app.route('/api/meta', methods=['GET'])
def get_meta():
    try:
        metadata = data_loader.get_metadata()
        return success_response(metadata)
    except Exception as e:
        return error_response(f'Error loading metadata: {str(e)}', 500)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        summary = data_loader.get_summary()
        return success_response(summary)
    except Exception as e:
        return error_response(f'Error loading summary: {str(e)}', 500)

@app.route('/api/screener', methods=['GET'])
def screener():
    return success_response({'message': 'Screener endpoint - under development', 'results': []})

@app.route('/api/company/<ticker>', methods=['GET'])
def get_company(ticker):
    return success_response({'ticker': ticker.upper(), 'message': 'Company detail endpoint - under development', 'data': []})

@app.route('/api/compare', methods=['POST'])
def compare():
    data = request.get_json() or {}
    tickers = data.get('tickers', [])
    return success_response({'tickers': tickers, 'message': 'Compare endpoint - under development', 'data': []})

@app.route('/api/alerts/top-risk', methods=['GET'])
def top_risk():
    return success_response({'message': 'Alerts endpoint - under development', 'alerts': []})

@app.errorhandler(404)
def not_found(e):
    return error_response('Endpoint not found', 404)

@app.errorhandler(500)
def internal_error(e):
    return error_response('Internal server error', 500)

# Vercel serverless function handler
def handler(request):
    with app.request_context(request.environ):
        return app.full_dispatch_request()

# For local testing
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
