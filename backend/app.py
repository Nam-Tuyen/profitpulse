"""
ProfitPulse Backend API
Flask API connected to Supabase database
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from database import get_db

# Load environment (Render env vars vẫn hoạt động; dotenv chỉ hỗ trợ local)
load_dotenv()

app = Flask(__name__)
CORS(app)

db = get_db()


# ============================================================
# UTILITY
# ============================================================

def error_response(message: str, status_code: int = 400):
    return jsonify({"success": False, "error": message}), status_code


def success_response(data: dict):
    return jsonify({"success": True, **data})


# ============================================================
# HEALTH & META
# ============================================================

@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return success_response({
        "status": "ok",
        "message": "ProfitPulse API is running",
        "database": "Supabase PostgreSQL",
        "version": "1.0.0"
    })


@app.route("/api/meta", methods=["GET"])
def meta():
    try:
        metadata = db.get_metadata()
        return success_response(metadata)
    except Exception as e:
        print(f"Error /api/meta: {e}")
        return error_response(f"Error loading metadata: {str(e)}", 500)


# ============================================================
# COMPANIES
# ============================================================

@app.route("/api/companies", methods=["GET"])
def companies():
    try:
        limit = request.args.get("limit", type=int)
        rows = db.get_companies(limit=limit)
        return success_response({"companies": rows, "count": len(rows)})
    except Exception as e:
        print(f"Error /api/companies: {e}")
        return error_response(f"Error fetching companies: {str(e)}", 500)


@app.route("/api/company/<ticker>", methods=["GET"])
def company_detail(ticker: str):
    try:
        ticker = ticker.upper()

        company = db.get_company_by_ticker(ticker)
        if not company:
            return error_response(f"Company {ticker} not found", 404)

        # Get index scores for timeseries (this is the main data)
        index_scores = db.get_index_scores(ticker=ticker)
        
        # Get financial data
        financial = db.get_financial_data(ticker=ticker)

        # Build timeseries from index_scores
        timeseries = []
        for s in sorted(index_scores, key=lambda x: x.get('year', 0)):
            timeseries.append({
                'year': s.get('year'),
                'profitscore': s.get('profit_score', s.get('p_t', 0)),
                'label': s.get('label_t'),
                'percentile': s.get('percentile_year'),
            })

        # Latest score for header
        latest = index_scores[0] if index_scores else {}
        risk_label = 'Cao' if latest.get('label_t') == 1 else 'Thấp' if latest.get('label_t') == 0 else 'N/A'
        
        return success_response({
            "company": company,
            "ticker": company.get('ticker', ticker),
            "firm_id": company.get('symbol', ticker),
            "latest_score": {
                "year": latest.get('year'),
                "profit_score": latest.get('profit_score', latest.get('p_t', 0)),
                "label_t": latest.get('label_t'),
                "risk_level": risk_label,
                "percentile": latest.get('percentile_year'),
                "pc1": latest.get('pc1'),
                "pc2": latest.get('pc2'),
                "pc3": latest.get('pc3'),
            },
            "timeseries": timeseries,
            "financial_data": financial[:5],
            "total_years": len(index_scores),
        })
    except Exception as e:
        print(f"Error /api/company/{ticker}: {e}")
        return error_response(f"Error fetching company data: {str(e)}", 500)


# ============================================================
# FINANCIAL
# ============================================================

@app.route("/api/financial", methods=["GET"])
def financial():
    try:
        ticker = request.args.get("ticker")
        year = request.args.get("year", type=int)
        limit = request.args.get("limit", type=int)

        if ticker:
            ticker = ticker.upper()

        rows = db.get_financial_data(ticker=ticker, year=year)
        if limit:
            rows = rows[:limit]

        return success_response({"financial_data": rows, "count": len(rows)})
    except Exception as e:
        print(f"Error /api/financial: {e}")
        return error_response(f"Error fetching financial data: {str(e)}", 500)


# ============================================================
# PREDICTIONS
# ============================================================

@app.route("/api/predictions", methods=["GET"])
def predictions():
    try:
        ticker = request.args.get("ticker")
        year = request.args.get("year", type=int)
        limit = request.args.get("limit", type=int)

        if ticker:
            ticker = ticker.upper()

        rows = db.get_predictions(ticker=ticker, year=year)
        if limit:
            rows = rows[:limit]

        return success_response({"predictions": rows, "count": len(rows)})
    except Exception as e:
        print(f"Error /api/predictions: {e}")
        return error_response(f"Error fetching predictions: {str(e)}", 500)


# ============================================================
# SCREENER
# ============================================================

@app.route("/api/screener", methods=["GET"])
def screener():
    """
    year: mặc định latest
    min_score/max_score: lọc theo profit_score (db layer nên trả key này)
    limit: mặc định 50
    """
    try:
        year = request.args.get("year", type=int)
        min_score = request.args.get("min_score", type=float)
        max_score = request.args.get("max_score", type=float)
        limit = request.args.get("limit", type=int, default=50)

        if not year:
            year = db.get_latest_year()

        scores = db.get_index_scores(year=year)

        if min_score is not None:
            scores = [s for s in scores if (s.get("profit_score") is not None and s.get("profit_score") >= min_score)]
        if max_score is not None:
            scores = [s for s in scores if (s.get("profit_score") is not None and s.get("profit_score") <= max_score)]

        scores.sort(key=lambda x: (x.get("profit_score") or -1e18), reverse=True)
        scores = scores[:limit] if limit else scores

        return success_response({"results": scores, "count": len(scores), "year": year})
    except Exception as e:
        print(f"Error /api/screener: {e}")
        return error_response(f"Error running screener: {str(e)}", 500)


# ============================================================
# COMPARE
# ============================================================

@app.route("/api/compare", methods=["POST"])
def compare():
    try:
        data = request.get_json(silent=True) or {}
        tickers = data.get("tickers")
        year = data.get("year")

        if not tickers or not isinstance(tickers, list):
            return error_response("Missing tickers in request body", 400)

        tickers = [t.upper() for t in tickers]

        comparison = []
        for ticker in tickers:
            company = db.get_company_by_ticker(ticker)
            if not company:
                continue

            financial = db.get_financial_data(ticker=ticker, year=year)
            scores = db.get_index_scores(ticker=ticker, year=year)

            comparison.append({
                "ticker": ticker,
                "company": company,
                "financial": financial[0] if financial else None,
                "scores": scores[0] if scores else None
            })

        return success_response({"comparison": comparison, "count": len(comparison)})
    except Exception as e:
        print(f"Error /api/compare: {e}")
        return error_response(f"Error comparing companies: {str(e)}", 500)


# ============================================================
# SUMMARY
# ============================================================

@app.route("/api/summary", methods=["GET"])
def summary():
    try:
        year = request.args.get("year", type=int)
        if not year:
            year = db.get_latest_year()

        scores = db.get_index_scores(year=year)
        if not scores:
            return success_response({"year": year, "message": "No data available for this year"})

        profit_scores = [s.get("profit_score", 0) for s in scores if s.get("profit_score") is not None]
        
        # Count risk levels
        high_risk = sum(1 for s in scores if s.get("label_t") == 1)
        low_risk = sum(1 for s in scores if s.get("label_t") == 0)
        
        # Build risk distribution for chart
        risk_distribution = {"High": high_risk, "Low": low_risk}
        
        # Build score distribution
        score_ranges = [
            {"range": "< -1", "count": 0},
            {"range": "-1 ~ 0", "count": 0},
            {"range": "0 ~ 0.5", "count": 0},
            {"range": "0.5 ~ 1", "count": 0},
            {"range": "> 1", "count": 0},
        ]
        for ps in profit_scores:
            if ps < -1:
                score_ranges[0]["count"] += 1
            elif ps < 0:
                score_ranges[1]["count"] += 1
            elif ps < 0.5:
                score_ranges[2]["count"] += 1
            elif ps < 1:
                score_ranges[3]["count"] += 1
            else:
                score_ranges[4]["count"] += 1
        
        # Top performers
        top_sorted = sorted(scores, key=lambda x: (x.get("profit_score") or -1e18), reverse=True)[:10]
        top_performers = [{"firm": s.get("firm_id", ""), "score": s.get("profit_score", 0)} for s in top_sorted]

        return success_response({
            "year": year,
            "summary": {
                "total_firms": len(scores),
                "total_companies": len(scores),
                "high_risk_count": high_risk,
                "low_risk_count": low_risk,
                "avg_profit_score": (sum(profit_scores) / len(profit_scores)) if profit_scores else 0,
                "max_profit_score": max(profit_scores) if profit_scores else 0,
                "min_profit_score": min(profit_scores) if profit_scores else 0,
            },
            "chart_data": {
                "risk_distribution": risk_distribution,
                "score_distribution": score_ranges,
                "top_performers": top_performers,
            },
            "top_companies": top_sorted[:10],
        })
    except Exception as e:
        print(f"Error /api/summary: {e}")
        return error_response(f"Error calculating summary: {str(e)}", 500)


# ============================================================
# ALERTS
# ============================================================

@app.route("/api/alerts", methods=["GET"])
def alerts():
    """Generate alerts based on risk analysis"""
    try:
        year = request.args.get("year_to", type=int) or db.get_latest_year()
        scope = request.args.get("scope", "market")

        scores = db.get_index_scores(year=year)
        
        alert_list = []
        for s in scores:
            label = s.get("label_t")
            if label == 1:  # High risk
                alert_list.append({
                    "firm_id": s.get("firm_id", ""),
                    "year": s.get("year"),
                    "type": "risk_change",
                    "severity": "high",
                    "message": f"{s.get('firm_id', '')} được dự báo Risk cao (label=1) cho năm {s.get('year')}",
                    "profit_score": s.get("profit_score", s.get("p_t", 0)),
                    "percentile": s.get("percentile_year"),
                })

        # Sort by profit_score ascending (worst first)
        alert_list.sort(key=lambda x: x.get("profit_score", 0))

        return success_response({
            "alerts": alert_list[:50],
            "count": len(alert_list),
            "year": year,
        })
    except Exception as e:
        print(f"Error /api/alerts: {e}")
        return error_response(f"Error generating alerts: {str(e)}", 500)


@app.route("/api/alerts/top-risk", methods=["GET"])
def top_risk():
    """Get top N highest risk companies"""
    try:
        n = request.args.get("n", type=int, default=10)
        year = request.args.get("year", type=int) or db.get_latest_year()

        scores = db.get_index_scores(year=year)
        
        # Filter high-risk (label_t == 1) and sort by profit_score ascending
        high_risk = [s for s in scores if s.get("label_t") == 1]
        high_risk.sort(key=lambda x: x.get("profit_score", 0))
        
        results = high_risk[:n]

        return success_response({
            "results": results,
            "count": len(results),
            "year": year,
        })
    except Exception as e:
        print(f"Error /api/alerts/top-risk: {e}")
        return error_response(f"Error fetching top risk: {str(e)}", 500)


# ============================================================
# ABOUT
# ============================================================

@app.route("/api/about", methods=["GET"])
def about():
    """Return project information"""
    try:
        metadata = db.get_metadata()
        return success_response({
            "project": "ProfitPulse",
            "version": "1.0.0",
            "description": "Hệ thống phân tích và dự báo lợi nhuận doanh nghiệp niêm yết tại Việt Nam",
            "methodology": {
                "name": "PCA + Machine Learning",
                "metrics": ["ROA", "ROE", "ROC", "EPS", "NPM"],
                "models": ["PCA (chấm điểm)", "XGBoost / Random Forest (phân loại risk)"],
                "data_source": "Dữ liệu tài chính doanh nghiệp niêm yết Việt Nam"
            },
            "stats": {
                "total_companies": metadata.get("total_companies", 0),
                "total_records": metadata.get("total_financial_records", 0),
                "year_range": metadata.get("year_range", {}),
            }
        })
    except Exception as e:
        print(f"Error /api/about: {e}")
        return error_response(f"Error fetching about info: {str(e)}", 500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
