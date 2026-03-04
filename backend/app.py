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

        financial = db.get_financial_data(ticker=ticker)
        predictions = db.get_predictions(ticker=ticker)
        index_scores = db.get_index_scores(ticker=ticker)

        return success_response({
            "company": company,
            "financial_data": financial[:5],
            "predictions": predictions[:5],
            "index_scores": index_scores[:5],
            "total_years": len(financial),
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

        profit_scores = [s.get("profit_score") for s in scores if s.get("profit_score") is not None]

        return success_response({
            "year": year,
            "total_companies": len(scores),
            "avg_profit_score": (sum(profit_scores) / len(profit_scores)) if profit_scores else 0,
            "max_profit_score": max(profit_scores) if profit_scores else 0,
            "min_profit_score": min(profit_scores) if profit_scores else 0,
            "top_companies": sorted(scores, key=lambda x: (x.get("profit_score") or -1e18), reverse=True)[:10]
        })
    except Exception as e:
        print(f"Error /api/summary: {e}")
        return error_response(f"Error calculating summary: {str(e)}", 500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
