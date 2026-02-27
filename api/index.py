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
        self._mock_mode = False
    
    def _load_json(self, filename):
        if filename not in self._cache:
            # Vercel puts files relative to /var/task
            possible_paths = [
                os.path.join(self.artifacts_dir, filename),
                os.path.join('/var/task', self.artifacts_dir, filename),
                os.path.join(os.path.dirname(__file__), '..', self.artifacts_dir, filename)
            ]
            
            loaded = False
            for path in possible_paths:
                if os.path.exists(path):
                    try:
                        with open(path, 'r', encoding='utf-8') as f:
                            self._cache[filename] = json.load(f)
                        loaded = True
                        break
                    except Exception as e:
                        print(f"Error loading {path}: {e}")
            
            if not loaded:
                print(f"Warning: {filename} not found, using mock data")
                self._mock_mode = True
                self._cache[filename] = self._get_mock_data(filename)
        
        return self._cache[filename]
    
    def _get_mock_data(self, filename):
        """Return mock data when files are not available"""
        if filename == 'methodology_snapshot.json':
            return {
                'data_info': {
                    'firms': ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'],
                    'firm_count': 5,
                    'years': [2020, 2021, 2022, 2023],
                    'year_min': 2020,
                    'year_max': 2023,
                    'record_count': 20,
                    'total_firms': 5,
                    'high_risk_count': 2,
                    'low_risk_count': 3
                },
                'features': {
                    'X1_ROA': 'Return on Assets',
                    'X2_ROE': 'Return on Equity',
                    'X3_ROC': 'Return on Capital',
                    'X4_EPS': 'Earnings per Share',
                    'X5_NPM': 'Net Profit Margin'
                },
                'methodology': {
                    'model': 'Demo Model',
                    'description': 'This is demo data. Please upload artifacts to see real data.'
                }
            }
        elif filename == 'model_metrics.json':
            return {
                'accuracy': 0.85,
                'precision': 0.82,
                'recall': 0.88,
                'f1_score': 0.85,
                'note': 'Demo metrics - upload artifacts for real metrics'
            }
        return {}
    
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
        # Return data directly without wrapping in success_response
        return jsonify(metadata)
    except Exception as e:
        print(f"Error in /api/meta: {e}")
        return error_response(f'Error loading metadata: {str(e)}', 500)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        year = request.args.get('year')
        summary = data_loader.get_summary()
        
        # Mock chart data for now
        chart_data = {
            'risk_distribution': [
                {'name': 'Low Risk', 'value': 45},
                {'name': 'Medium Risk', 'value': 35},
                {'name': 'High Risk', 'value': 20}
            ],
            'year_stats': []
        }
        
        return jsonify({
            'summary': summary.get('data_info', {}),
            'chart_data': chart_data,
            'model_metrics': summary.get('model_metrics', {})
        })
    except Exception as e:
        print(f"Error in /api/summary: {e}")
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
    try:
        n = request.args.get('n', 10, type=int)
        # Mock data for now
        return jsonify({
            'results': [],
            'message': 'No risk alerts at the moment'
        })
    except Exception as e:
        print(f"Error in /api/alerts/top-risk: {e}")
        return error_response(f'Error loading alerts: {str(e)}', 500)

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
