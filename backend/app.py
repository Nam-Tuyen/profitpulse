"""
ProfitPulse Backend API
Flask API connected to Supabase database
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from database import get_db
from dotenv import load_dotenv

# Load environment
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection
db = get_db()


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def error_response(message: str, status_code: int = 400):
    """Helper to create error response"""
    return jsonify({'error': message}), status_code


def success_response(data: dict):
    """Helper to create success response"""
    return jsonify({'success': True, **data})


# ============================================================
# HEALTH & META ENDPOINTS
# ============================================================

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return success_response({
        'status': 'ok',
        'message': 'ProfitPulse API is running',
        'database': 'Supabase PostgreSQL',
        'version': '1.0.0'
    })


@app.route('/api/meta', methods=['GET'])
def get_meta():
    """
    Get database metadata
    
    Returns:
        - Total companies
        - Total financial records
        - Available years
        - Company list
    """
    try:
        metadata = db.get_metadata()
        return success_response(metadata)
    except Exception as e:
        print(f"Error in /api/meta: {e}")
        return error_response(f'Error loading metadata: {str(e)}', 500)


# ============================================================
# COMPANY ENDPOINTS
# ============================================================

@app.route('/api/companies', methods=['GET'])
def get_companies():
    """
    Get list of all companies
    
    Query params:
        - limit: Maximum number of companies to return
    """
    try:
        limit = request.args.get('limit', type=int)
        companies = db.get_companies(limit=limit)
        
        return success_response({
            'companies': companies,
            'count': len(companies)
        })
    except Exception as e:
        print(f"Error in /api/companies: {e}")
        return error_response(f'Error fetching companies: {str(e)}', 500)


@app.route('/api/company/<ticker>', methods=['GET'])
def get_company(ticker: str):
    """
    Get detailed information for a specific company
    
    Args:
        ticker: Company ticker symbol (e.g., 'FPT')
    
    Returns:
        - Company info
        - Latest financial data
        - Latest predictions
        - Index scores
    """
    try:
        ticker = ticker.upper()
        
        # Get company info
        company = db.get_company_by_ticker(ticker)
        if not company:
            return error_response(f'Company {ticker} not found', 404)
        
        # Get latest financial data
        financial = db.get_financial_data(ticker=ticker)
        
        # Get predictions
        predictions = db.get_predictions(ticker=ticker)
        
        # Get index scores
        index_scores = db.get_index_scores(ticker=ticker)
        
        return success_response({
            'company': company,
            'financial_data': financial[:5],  # Latest 5 years
            'predictions': predictions[:5],
            'index_scores': index_scores[:5],
            'total_years': len(financial)
        })
    except Exception as e:
        print(f"Error in /api/company/{ticker}: {e}")
        return error_response(f'Error fetching company data: {str(e)}', 500)


# ============================================================
# FINANCIAL DATA ENDPOINTS
# ============================================================

@app.route('/api/financial', methods=['GET'])
def get_financial():
    """
    Get financial data with optional filters
    
    Query params:
        - ticker: Filter by company ticker
        - year: Filter by year
        - limit: Maximum number of records
    """
    try:
        ticker = request.args.get('ticker')
        year = request.args.get('year', type=int)
        limit = request.args.get('limit', type=int)
        
        if ticker:
            ticker = ticker.upper()
        
        financial = db.get_financial_data(ticker=ticker, year=year)
        
        if limit:
            financial = financial[:limit]
        
        return success_response({
            'financial_data': financial,
            'count': len(financial)
        })
    except Exception as e:
        print(f"Error in /api/financial: {e}")
        return error_response(f'Error fetching financial data: {str(e)}', 500)


# ============================================================
# PREDICTION ENDPOINTS
# ============================================================

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """
    Get predictions with optional filters
    
    Query params:
        - ticker: Filter by company ticker
        - year: Filter by year
        - limit: Maximum number of records
    """
    try:
        ticker = request.args.get('ticker')
        year = request.args.get('year', type=int)
        limit = request.args.get('limit', type=int)
        
        if ticker:
            ticker = ticker.upper()
        
        predictions = db.get_predictions(ticker=ticker, year=year)
        
        if limit:
            predictions = predictions[:limit]
        
        return success_response({
            'predictions': predictions,
            'count': len(predictions)
        })
    except Exception as e:
        print(f"Error in /api/predictions: {e}")
        return error_response(f'Error fetching predictions: {str(e)}', 500)


# ============================================================
# SCREENER ENDPOINT
# ============================================================

@app.route('/api/screener', methods=['GET'])
def screener():
    """
    Screen companies based on criteria
    
    Query params:
        - min_score: Minimum profit score
        - max_score: Maximum profit score
        - year: Filter by year (default: latest)
        - industry: Filter by industry
        - limit: Maximum results
    """
    try:
        year = request.args.get('year', type=int)
        min_score = request.args.get('min_score', type=float)
        max_score = request.args.get('max_score', type=float)
        limit = request.args.get('limit', type=int, default=50)
        
        # Get latest year if not specified
        if not year:
            year = db.get_latest_year()
        
        # Get all index scores for the year
        scores = db.get_index_scores(year=year)
        
        # Filter by score range if specified
        if min_score is not None:
            scores = [s for s in scores if s.get('profit_score', 0) >= min_score]
        if max_score is not None:
            scores = [s for s in scores if s.get('profit_score', 0) <= max_score]
        
        # Sort by profit score descending
        scores.sort(key=lambda x: x.get('profit_score', 0), reverse=True)
        
        # Apply limit
        if limit:
            scores = scores[:limit]
        
        return success_response({
            'results': scores,
            'count': len(scores),
            'year': year
        })
    except Exception as e:
        print(f"Error in /api/screener: {e}")
        return error_response(f'Error running screener: {str(e)}', 500)


# ============================================================
# COMPARISON ENDPOINT
# ============================================================

@app.route('/api/compare', methods=['POST'])
def compare_companies():
    """
    Compare multiple companies
    
    Request body:
        {
            "tickers": ["FPT", "VNM", "VIC"],
            "year": 2023 (optional)
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'tickers' not in data:
            return error_response('Missing tickers in request body', 400)
        
        tickers = [t.upper() for t in data['tickers']]
        year = data.get('year')
        
        comparison = []
        
        for ticker in tickers:
            company = db.get_company_by_ticker(ticker)
            if not company:
                continue
            
            financial = db.get_financial_data(ticker=ticker, year=year)
            scores = db.get_index_scores(ticker=ticker, year=year)
            
            comparison.append({
                'ticker': ticker,
                'company': company,
                'financial': financial[0] if financial else None,
                'scores': scores[0] if scores else None
            })
        
        return success_response({
            'comparison': comparison,
            'count': len(comparison)
        })
    except Exception as e:
        print(f"Error in /api/compare: {e}")
        return error_response(f'Error comparing companies: {str(e)}', 500)


# ============================================================
# SUMMARY STATS
# ============================================================

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Get summary statistics
    
    Query params:
        - year: Year for statistics (default: latest)
    """
    try:
        year = request.args.get('year', type=int)
        
        if not year:
            year = db.get_latest_year()
        
        # Get all scores for the year
        scores = db.get_index_scores(year=year)
        
        if not scores:
            return success_response({
                'year': year,
                'message': 'No data available for this year'
            })
        
        # Calculate statistics
        profit_scores = [s.get('profit_score', 0) for s in scores if s.get('profit_score') is not None]
        
        summary = {
            'year': year,
            'total_companies': len(scores),
            'avg_profit_score': sum(profit_scores) / len(profit_scores) if profit_scores else 0,
            'max_profit_score': max(profit_scores) if profit_scores else 0,
            'min_profit_score': min(profit_scores) if profit_scores else 0,
            'top_companies': sorted(scores, key=lambda x: x.get('profit_score', 0), reverse=True)[:10]
        }
        
        return success_response(summary)
    except Exception as e:
        print(f"Error in /api/summary: {e}")
        return error_response(f'Error calculating summary: {str(e)}', 500)


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    print("\n" + "="*70)
    print("  🚀 ProfitPulse API Server")
    print("="*70)
    print(f"  📡 Running on: http://localhost:{port}")
    print(f"  🗄️  Database: Supabase")
    print(f"  🔧 Debug mode: {debug}")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/summary', methods=['GET'])
def get_summary():
    """Thống kê tổng quan về dữ liệu"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        summary = {
            'total_records': len(df),
            'columns': df.columns.tolist(),
            'firms_count': df['FIRM_ID'].nunique() if 'FIRM_ID' in df.columns else 0,
            'year_range': {
                'min': int(df['YEAR'].min()) if 'YEAR' in df.columns else None,
                'max': int(df['YEAR'].max()) if 'YEAR' in df.columns else None
            },
            'statistics': df.describe().to_dict() if not df.empty else {}
        }
        
        return jsonify({
            'success': True,
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/firms', methods=['GET'])
def get_firms():
    """Lấy danh sách các công ty"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        if 'FIRM_ID' not in df.columns:
            return jsonify({'error': 'Không tìm thấy cột FIRM_ID'}), 400
        
        firms = df['FIRM_ID'].unique().tolist()
        
        return jsonify({
            'success': True,
            'total_firms': len(firms),
            'firms': firms
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/firm/<firm_id>', methods=['GET'])
def get_firm_data(firm_id):
    """Lấy dữ liệu của một công ty cụ thể"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        if 'FIRM_ID' not in df.columns:
            return jsonify({'error': 'Không tìm thấy cột FIRM_ID'}), 400
        
        firm_data = df[df['FIRM_ID'] == firm_id]
        
        if firm_data.empty:
            return jsonify({'error': f'Không tìm thấy dữ liệu cho công ty {firm_id}'}), 404
        
        data = firm_data.to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'firm_id': firm_id,
            'total_records': len(data),
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/year/<int:year>', methods=['GET'])
def get_data_by_year(year):
    """Lấy dữ liệu theo năm"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        if 'YEAR' not in df.columns:
            return jsonify({'error': 'Không tìm thấy cột YEAR'}), 400
        
        year_data = df[df['YEAR'] == year]
        
        if year_data.empty:
            return jsonify({'error': f'Không tìm thấy dữ liệu cho năm {year}'}), 404
        
        data = year_data.to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'year': year,
            'total_records': len(data),
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/filter', methods=['POST'])
def filter_data():
    """Lọc dữ liệu theo điều kiện"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        filters = request.get_json()
        filtered_df = df.copy()
        
        # Áp dụng các bộ lọc
        if 'firm_id' in filters:
            filtered_df = filtered_df[filtered_df['FIRM_ID'] == filters['firm_id']]
        
        if 'year_from' in filters:
            filtered_df = filtered_df[filtered_df['YEAR'] >= filters['year_from']]
        
        if 'year_to' in filters:
            filtered_df = filtered_df[filtered_df['YEAR'] <= filters['year_to']]
        
        data = filtered_df.to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'total_records': len(data),
            'filters_applied': filters,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Kiểm tra file tồn tại
    if not os.path.exists(DATA_FILE):
        print(f"CẢNH BÁO: Không tìm thấy file {DATA_FILE}")
    
    print("Starting Flask API Server...")
    print("Các endpoint có sẵn:")
    print("  - GET  /                      : Trang chủ")
    print("  - GET  /api/data              : Lấy toàn bộ dữ liệu")
    print("  - GET  /api/data/summary      : Thống kê tổng quan")
    print("  - GET  /api/data/firms        : Danh sách công ty")
    print("  - GET  /api/data/firm/<id>    : Dữ liệu công ty cụ thể")
    print("  - GET  /api/data/year/<year>  : Dữ liệu theo năm")
    print("  - POST /api/data/filter       : Lọc dữ liệu")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
