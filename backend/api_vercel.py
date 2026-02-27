"""
Optimized API Server for Vercel
Minimal dependencies - No pandas, no scikit-learn, no ML models
Uses pre-computed JSON artifacts
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

# Simple data loader without heavy dependencies
class SimpleDataLoader:
    def __init__(self, artifacts_dir='artifacts_profitpulse'):
        self.artifacts_dir = artifacts_dir
        self._cache = {}
    
    def _load_json(self, filename):
        """Load JSON with caching"""
        if filename not in self._cache:
            path = os.path.join(self.artifacts_dir, filename)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    self._cache[filename] = json.load(f)
            else:
                self._cache[filename] = {}
        return self._cache[filename]
    
    def get_metadata(self):
        """Get metadata"""
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
        """Get summary statistics"""
        methodology = self._load_json('methodology_snapshot.json')
        metrics = self._load_json('model_metrics.json')
        
        return {
            'model_metrics': metrics,
            'methodology': methodology.get('methodology', {}),
            'data_info': methodology.get('data_info', {})
        }

# Initialize data loader
data_loader = SimpleDataLoader()

# ============================================================
# Helper Functions
# ============================================================

def error_response(message: str, status_code: int = 400):
    """Helper to create error response"""
    return jsonify({'error': message}), status_code

def success_response(data: dict):
    """Helper to create success response"""
    return jsonify({'success': True, **data})

# ============================================================
# API Endpoints
# ============================================================

@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
def home():
    """API Home"""
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
    """Health check endpoint"""
    return success_response({
        'status': 'healthy',
        'version': '2.0.0'
    })

@app.route('/api/meta', methods=['GET'])
def get_meta():
    """Get metadata about dataset"""
    try:
        metadata = data_loader.get_metadata()
        return success_response(metadata)
    except Exception as e:
        print(f"Error in /api/meta: {e}")
        return error_response(f'Error loading metadata: {str(e)}', 500)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get summary statistics"""
    try:
        summary = data_loader.get_summary()
        return success_response(summary)
    except Exception as e:
        print(f"Error in /api/summary: {e}")
        return error_response(f'Error loading summary: {str(e)}', 500)

@app.route('/api/screener', methods=['GET'])
def screener():
    """Screener endpoint - placeholder for now"""
    return success_response({
        'message': 'Screener endpoint - under development',
        'results': []
    })

@app.route('/api/company/<ticker>', methods=['GET'])
def get_company(ticker):
    """Get company details - placeholder"""
    return success_response({
        'ticker': ticker.upper(),
        'message': 'Company detail endpoint - under development',
        'data': []
    })

@app.route('/api/compare', methods=['POST'])
def compare():
    """Compare companies - placeholder"""
    data = request.get_json() or {}
    tickers = data.get('tickers', [])
    
    return success_response({
        'tickers': tickers,
        'message': 'Compare endpoint - under development',
        'data': []
    })

@app.route('/api/alerts/top-risk', methods=['GET'])
def top_risk():
    """Top risk companies - placeholder"""
    return success_response({
        'message': 'Alerts endpoint - under development',
        'alerts': []
    })

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return error_response('Endpoint not found', 404)

@app.errorhandler(500)
def internal_error(e):
    return error_response('Internal server error', 500)

# For local testing
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
