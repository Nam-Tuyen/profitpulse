"""
API Routes - Main Server
Flask API với các endpoints cho frontend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.cache_manager import cache_manager
from utils.profitpulse_adapter import profitpulse_adapter

app = Flask(__name__)
CORS(app)

# Try to use profitpulse adapter first, fallback to cache_manager
USE_PROFITPULSE = os.path.exists('artifacts_profitpulse')
data_source = profitpulse_adapter if USE_PROFITPULSE else cache_manager


# ============================================================
# Utils
# ============================================================

def error_response(message: str, status_code: int = 400):
    """Helper để tạo error response"""
    return jsonify({'error': message}), status_code


def success_response(data: dict):
    """Helper để tạo success response"""
    return jsonify({'success': True, **data})


# ============================================================
# ENDPOINT 1: Home / Meta Info
# ============================================================

@app.route('/', methods=['GET'])
def home():
    """Trang chủ API"""
    return success_response({
        'message': 'ProfitScore API - Financial Analysis & Prediction',
        'version': '1.0.0',
        'endpoints': {
            'GET /api/meta': 'Metadata về dataset',
            'GET /api/screener': 'Sàng lọc công ty theo điều kiện',
            'GET /api/company/<ticker>': 'Thông tin chi tiết công ty',
            'POST /api/compare': 'So sánh nhiều công ty',
            'GET /api/summary': 'Thống kê tổng quan',
            'GET /api/alerts/top-risk': 'Top công ty risk tăng',
        }
    })


@app.route('/api/meta', methods=['GET'])
def get_meta():
    """
    Lấy metadata về dataset
    
    Returns:
        - Danh sách năm
        - Danh sách công ty
        - Số lượng records
        - Model metrics
    """
    try:
        if USE_PROFITPULSE:
            metadata = data_source.get_metadata()
            return success_response(metadata)
        else:
            metadata = cache_manager.load_metadata()
            firms = cache_manager.get_all_firms()
            years = cache_manager.get_all_years()
            
            return success_response({
                'firms': firms,
                'firms_count': len(firms),
                'years': years,
                'year_range': {
                    'min': min(years),
                    'max': max(years)
                },
                'model_metrics': metadata.get('metrics', {}),
                'feature_cols': metadata.get('feature_cols', [])
            })
    except Exception as e:
        print(f"Error in /api/meta: {e}")
        return error_response(f'Lỗi khi load metadata: {str(e)}', 500)


# ============================================================
# ENDPOINT 2: Screener
# ============================================================

@app.route('/api/screener', methods=['GET'])
def screener():
    """
    Sàng lọc công ty theo điều kiện
    
    Query params:
        - year: Năm t (năm dự báo)
        - min_score: Điểm tối thiểu (0-1)
        - limit: Số lượng kết quả (default: 100)
    """
    try:
        # Parse query params
        year = request.args.get('year', type=int)
        min_score = request.args.get('min_score', default=0.0, type=float)
        limit = request.args.get('limit', default=100, type=int)
        
        if USE_PROFITPULSE:
            # Use ProfitPulse adapter
            df = data_source.get_screener_data(year=year)
            
            if df.empty:
                return success_response({
                    'total_results': 0,
                    'filters': {'year': year, 'min_score': min_score},
                    'results': []
                })
            
            # Filter by score if available
            if 'P_t' in df.columns and min_score > 0:
                df = df[df['P_t'] >= min_score]
            
            # Sort by score descending
            if 'P_t' in df.columns:
                df = df.sort_values('P_t', ascending=False)
            
            # Limit results
            df = df.head(limit)
            
            # Format response - adapt to available columns
            results = []
            for _, row in df.iterrows():
                result = {
                    'FIRM_ID': row.get('FIRM_ID', row.get('Ticker', '')),
                    'year': row.get('YEAR', row.get('year', year)),
                    'score': round(float(row.get('P_t', 0)), 4),
                    'label': int(row.get('Label_t', 0))
                }
                # Add financial metrics if available
                for col in ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']:
                    if col in row:
                        result[col] = round(float(row[col]), 4)
                results.append(result)
            
            return success_response({
                'total_results': len(results),
                'filters': {'year': year, 'min_score': min_score},
                'results': results
            })
        else:
            # Use original cache manager
            df = cache_manager.get_screener_data(
                year=year,
                risk_level=request.args.get('risk'),
                chance_min=request.args.get('chance_min', type=float),
                chance_max=request.args.get('chance_max', type=float),
                borderline_only=request.args.get('borderline', 'false').lower() == 'true'
            )
            
            df = df.head(limit)
            
            results = df[[
                'FIRM_ID', 'year_t', 'year_t1', 'risk_level', 
                'chance_percent', 'status', 'reason', 
                'is_borderline'
            ]].to_dict(orient='records')
            
            return success_response({
                'total_results': len(results),
                'filters': {
                    'year': year,
                    'risk_level': request.args.get('risk'),
                    'chance_min': request.args.get('chance_min'),
                    'chance_max': request.args.get('chance_max'),
                    'borderline_only': request.args.get('borderline', 'false').lower() == 'true'
                },
                'results': results
            })
        
    except Exception as e:
        print(f"Error in /api/screener: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi screener: {str(e)}', 500)


# ============================================================
# ENDPOINT 3: Company Detail
# ============================================================

@app.route('/api/company/<ticker>', methods=['GET'])
def get_company(ticker: str):
    """
    Lấy thông tin chi tiết công ty
    
    Path param:
        - ticker: Mã công ty
        
    Query params:
        - year: Năm t (nếu không có thì lấy latest)
    """
    try:
        year = request.args.get('year', type=int)
        
        if USE_PROFITPULSE:
            # Use ProfitPulse adapter
            data = data_source.get_company_data(ticker, year)
            
            if not data or 'firm_id' not in data:
                return error_response(f'Không tìm thấy dữ liệu cho công ty {ticker}', 404)
            
            return success_response(data)
        else:
            # Use original cache manager
            data = cache_manager.get_firm_data(ticker, year)
            
            if not data['predictions']:
                return error_response(f'Không tìm thấy dữ liệu cho công ty {ticker}', 404)
            
            # Get latest prediction nếu có nhiều
            latest_pred = data['predictions'][-1] if data['predictions'] else {}
            
            return success_response({
                'firm_id': ticker,
                'latest_prediction': latest_pred,
                'all_predictions': data['predictions'],
                'profit_score_timeseries': data['profit_score_timeseries']
            })
        
    except Exception as e:
        print(f"Error in /api/company/{ticker}: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy dữ liệu công ty: {str(e)}', 500)


# ============================================================
# ENDPOINT 4: Compare Companies
# ============================================================

@app.route('/api/compare', methods=['POST'])
def compare_companies():
    """
    So sánh nhiều công ty
    
    Body:
        {
            "tickers": ["ABC", "XYZ", ...],
            "year": 2023
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'tickers' not in data or 'year' not in data:
            return error_response('Missing tickers or year in request body')
        
        tickers = data['tickers']
        year = data['year']
        
        if not isinstance(tickers, list) or len(tickers) < 2:
            return error_response('tickers phải là list với ít nhất 2 mã')
        
        if USE_PROFITPULSE:
            df = data_source.compare_firms(tickers, year)
            
            if df.empty:
                return error_response('Không tìm thấy dữ liệu để so sánh', 404)
            
            # Format response for profitpulse
            results = []
            firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
            for _, row in df.iterrows():
                result = {
                    'FIRM_ID': row.get(firm_col, ''),
                    'year': row.get('YEAR', year),
                    'score': round(float(row.get('P_t', 0)), 4),
                    'label': int(row.get('Label_t', 0))
                }
                # Add metrics if available
                for col in ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']:
                    if col in row:
                        result[col] = round(float(row[col]), 4)
                results.append(result)
            
            return success_response({
                'year': year,
                'tickers': tickers,
                'comparison': results
            })
        else:
            # Original cache manager logic
            df = cache_manager.compare_firms(tickers, year)
            
            if df.empty:
                return error_response('Không tìm thấy dữ liệu để so sánh', 404)
            
            results = df[[
                'FIRM_ID', 'year_t', 'risk_level', 
                'chance_percent', 'status', 'reason'
            ]].to_dict(orient='records')
            
            return success_response({
                'year': year,
                'tickers': tickers,
                'comparison': results
            })
        
    except Exception as e:
        print(f"Error in /api/compare: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi so sánh: {str(e)}', 500)


# ============================================================
# ENDPOINT 5: Summary Stats
# ============================================================

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Thống kê tổng quan
    
    Query params:
        - year: Năm t (nếu không có thì all years)
    """
    try:
        year = request.args.get('year', type=int)
        
        if USE_PROFITPULSE:
            summary = data_source.get_summary_stats(year)
            chart_data = data_source.get_chart_data(year)
            
            return success_response({
                'summary': summary,
                'chart_data': chart_data
            })
        else:
            summary = cache_manager.get_summary_stats(year)
            
            return success_response({
                'summary': summary
            })
        
    except Exception as e:
        print(f"Error in /api/summary: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy summary: {str(e)}', 500)


# ============================================================
# ENDPOINT 5.5: Overview (Tổng quan page - KPIs + charts)
# ============================================================

@app.route('/api/overview', methods=['GET'])
def get_overview():
    """
    Lấy dữ liệu tổng quan cho Dashboard
    
    Query params:
        - year: Năm phân tích (mặc định: latest)
        - sector: Ngành (optional)
        - exchange: Sàn (optional)
    """
    try:
        year = request.args.get('year', type=int)
        sector = request.args.get('sector')
        exchange = request.args.get('exchange')
        
        filters = {}
        if sector:
            filters['sector'] = sector
        if exchange:
            filters['exchange'] = exchange
        
        if USE_PROFITPULSE:
            overview_data = data_source.get_overview_stats(year, filters)
            return success_response(overview_data)
        else:
            # Fallback logic
            summary = cache_manager.get_summary_stats(year)
            return success_response({
                'year': year,
                'kpi': summary,
                'chance_hist': [],
                'sector_risk': [],
                'top_attention': []
            })
        
    except Exception as e:
        print(f"Error in /api/overview: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy overview: {str(e)}', 500)


# ============================================================
# ENDPOINT 6: Alerts - Comprehensive
# ============================================================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Lấy danh sách cảnh báo theo rules
    
    Query params:
        - scope: 'watchlist' hoặc 'market' (default: 'market')
        - watchlist: comma-separated firm_ids (nếu scope='watchlist')
        - year_from: Năm bắt đầu
        - year_to: Năm kết thúc (mặc định: latest)
        - rules: comma-separated alert rules (risk_change,chance_drop,borderline,roa_decline,npm_decline)
    """
    try:
        scope = request.args.get('scope', 'market')
        watchlist_str = request.args.get('watchlist', '')
        watchlist = [f.strip() for f in watchlist_str.split(',') if f.strip()] if watchlist_str else []
        
        year_from = request.args.get('year_from', type=int)
        year_to = request.args.get('year_to', type=int)
        
        rules_str = request.args.get('rules', 'risk_change,chance_drop,borderline')
        rules = [r.strip() for r in rules_str.split(',') if r.strip()]
        
        if USE_PROFITPULSE:
            alerts = data_source.get_alerts(
                scope=scope,
                watchlist=watchlist,
                year_from=year_from,
                year_to=year_to,
                rules=rules
            )
            return success_response({
                'scope': scope,
                'year_range': {'from': year_from, 'to': year_to},
                'rules_applied': rules,
                'alerts': alerts
            })
        else:
            # Fallback
            return success_response({
                'scope': scope,
                'alerts': []
            })
        
    except Exception as e:
        print(f"Error in /api/alerts: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy alerts: {str(e)}', 500)


@app.route('/api/alerts/top-risk', methods=['GET'])
def get_top_risk():
    """
    Lấy top N công ty có risk tăng mạnh
    
    Query params:
        - n: Số lượng (default: 10)
    """
    try:
        n = request.args.get('n', default=10, type=int)
        
        if USE_PROFITPULSE:
            top_risk = data_source.get_top_risk_increased(top_n=n)
        else:
            top_risk = cache_manager.get_top_risk_increased(top_n=n)
        
        return success_response({
            'top_n': n,
            'results': top_risk
        })
        
    except Exception as e:
        print(f"Error in /api/alerts/top-risk: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy top risk: {str(e)}', 500)


# ============================================================
# ENDPOINT 7: About / Trust Page
# ============================================================

@app.route('/api/about', methods=['GET'])
def get_about():
    """
    Lấy thông tin về ứng dụng, methodology, trust metrics
    
    Returns:
        - Model metrics (F1, AUC, Accuracy)
        - Methodology summary
        - Data coverage info
        - Trust indicators
    """
    try:
        if USE_PROFITPULSE:
            about_data = data_source.get_about_info()
            return success_response(about_data)
        else:
            # Fallback
            metadata = cache_manager.load_metadata()
            return success_response({
                'model_metrics': metadata.get('metrics', {}),
                'methodology': {
                    'train_period': '<=2020',
                    'test_period': '2021+',
                    'preprocessing': 'strict_mode'
                },
                'data_coverage': {
                    'total_firms': len(cache_manager.get_all_firms()),
                    'total_years': len(cache_manager.get_all_years())
                }
            })
        
    except Exception as e:
        print(f"Error in /api/about: {e}")
        import traceback
        traceback.print_exc()
        return error_response(f'Lỗi khi lấy about info: {str(e)}', 500)


# ============================================================
# Health Check
# ============================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        if USE_PROFITPULSE:
            # Check if profitpulse artifacts exist
            metadata = data_source.get_metadata()
            status = 'ok' if metadata.get('firms_count', 0) > 0 else 'degraded'
            return success_response({
                'status': status,
                'data_source': 'profitpulse',
                'artifacts_found': True,
                'message': 'Using ProfitPulse artifacts'
            })
        else:
            # Test cache access
            cache_manager.load_metadata()
            return success_response({'status': 'healthy'})
    except Exception as e:
        return error_response(f'Unhealthy: {str(e)}', 503)


# ============================================================
# Run Server
# ============================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print(" "*20 + "PROFITSCORE API SERVER")
    print("="*70)
    print("\nĐang khởi động server...")
    print("\nEndpoints có sẵn:")
    print("  GET  /                       - Trang chủ API")
    print("  GET  /api/meta               - Metadata")
    print("  GET  /api/screener           - Sàng lọc công ty")
    print("  GET  /api/company/<ticker>   - Chi tiết công ty")
    print("  POST /api/compare            - So sánh công ty")
    print("  GET  /api/summary            - Thống kê tổng quan")
    print("  GET  /api/alerts/top-risk    - Top risk tăng")
    print("  GET  /health                 - Health check")
    print("\n" + "="*70)
    print(f"\nServer đang chạy tại: http://localhost:5000")
    print("Nhấn CTRL+C để dừng server\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
