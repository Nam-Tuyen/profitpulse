from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Đường dẫn file dữ liệu
DATA_FILE = 'Data.xlsx'

def load_data():
    """Đọc dữ liệu từ file Excel"""
    try:
        df = pd.read_excel(DATA_FILE)
        return df
    except Exception as e:
        print(f"Lỗi khi đọc file: {str(e)}")
        return None

@app.route('/', methods=['GET'])
def home():
    """Endpoint trang chủ"""
    return jsonify({
        'message': 'Backend API đọc dữ liệu từ Data.xlsx',
        'endpoints': {
            '/api/data': 'Lấy toàn bộ dữ liệu',
            '/api/data/summary': 'Thống kê tổng quan',
            '/api/data/firms': 'Danh sách các công ty',
            '/api/data/firm/<firm_id>': 'Dữ liệu của một công ty cụ thể',
            '/api/data/year/<year>': 'Dữ liệu theo năm'
        }
    })

@app.route('/api/data', methods=['GET'])
def get_all_data():
    """Lấy toàn bộ dữ liệu"""
    try:
        df = load_data()
        if df is None:
            return jsonify({'error': 'Không thể đọc file dữ liệu'}), 500
        
        # Chuyển đổi DataFrame sang JSON
        data = df.to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'total_records': len(data),
            'data': data
        })
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
