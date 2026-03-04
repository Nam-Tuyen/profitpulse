"""
Database Manager - Supabase Connection
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
from typing import Any, Dict, List, Optional, Sequence

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")


class SupabaseDB:
    """Supabase database manager"""
    
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
            raise ValueError("Missing Supabase credentials in environment variables")
        
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
        print(f"✅ Connected to Supabase: {SUPABASE_URL}")
    
    def query_table(self, table_name: str, select: str = "*", 
                   filters: Optional[Dict] = None, 
                   limit: Optional[int] = None,
                   order_by: Optional[str] = None) -> List[Any]:
        """
        Query a table with optional filters
        
        Args:
            table_name: Name of the table
            select: Columns to select (default: all)
            filters: Dict of {column: value} filters
            limit: Maximum number of rows
            order_by: Column to order by (prepend '-' for descending)
            
        Returns:
            List of dictionaries (rows)
        """
        query = self.client.table(table_name).select(select)
        
        # Apply filters
        if filters:
            for col, val in filters.items():
                query = query.eq(col, val)
        
        # Apply ordering
        if order_by:
            if order_by.startswith('-'):
                query = query.order(order_by[1:], desc=True)
            else:
                query = query.order(order_by)
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        return response.data
    
    def get_companies(self, limit: Optional[int] = None) -> Sequence[Dict]:
        """Get list of companies"""
        return self.query_table('companies', limit=limit, order_by='ticker')
    
    def get_company_by_ticker(self, ticker: str) -> Optional[Dict]:
        """Get single company by ticker (e.g. 'FPT') or symbol (e.g. 'FPT.HM')"""
        # Try exact ticker first
        results = self.query_table('companies', filters={'ticker': ticker})
        if results:
            return results[0]
        # Try as symbol (firm_id format)
        results = self.query_table('companies', filters={'symbol': ticker})
        return results[0] if results else None
    
    def _resolve_firm_ids(self, ticker: str) -> List[str]:
        """Resolve a ticker to all matching firm_id (symbol) values.
        E.g. 'FPT' -> ['FPT.HM'] or 'FPT.HM' -> ['FPT.HM']
        """
        # Direct match as symbol
        company = self.query_table('companies', filters={'symbol': ticker})
        if company:
            return [ticker]
        # Match by ticker -> may have multiple suffixes
        companies = self.query_table('companies', filters={'ticker': ticker})
        return [c['symbol'] for c in companies] if companies else []
    
    def get_financial_data(self, ticker: Optional[str] = None, 
                          year: Optional[int] = None) -> Sequence[Dict]:
        """
        Get financial data with optional filters.
        Note: financial_raw uses 'firm_id' column (symbol format like 'FPT.HM')
        """
        if ticker:
            firm_ids = self._resolve_firm_ids(ticker)
            if not firm_ids:
                return []
            # Query for each firm_id
            all_results = []
            for fid in firm_ids:
                filters = {'firm_id': fid}
                if year:
                    filters['year'] = year
                all_results.extend(self.query_table('financial_raw', filters=filters, order_by='-year'))
            return all_results
        else:
            filters = {}
            if year:
                filters['year'] = year
            return self.query_table('financial_raw', filters=filters, order_by='-year')
    
    def get_predictions(self, ticker: Optional[str] = None, 
                       year: Optional[int] = None) -> Sequence[Dict]:
        """Get predictions with optional filters (table may be empty)"""
        try:
            if ticker:
                firm_ids = self._resolve_firm_ids(ticker)
                if not firm_ids:
                    return []
                all_results = []
                for fid in firm_ids:
                    filters = {'firm_id': fid}
                    if year:
                        filters['year'] = year
                    all_results.extend(self.query_table('predictions', filters=filters, order_by='-year'))
                return all_results
            else:
                filters = {}
                if year:
                    filters['year'] = year
                return self.query_table('predictions', filters=filters, order_by='-year')
        except Exception:
            return []
    
    def get_index_scores(self, ticker: Optional[str] = None,
                        year: Optional[int] = None) -> Sequence[Dict]:
        """Get index scores with optional filters (maps p_t → profit_score).
        Note: index_scores uses 'firm_id' column (symbol format like 'FPT.HM')
        """
        if ticker:
            firm_ids = self._resolve_firm_ids(ticker)
            if not firm_ids:
                return []
            all_results = []
            for fid in firm_ids:
                filters = {'firm_id': fid}
                if year:
                    filters['year'] = year
                all_results.extend(self.query_table('index_scores', filters=filters, order_by='-year'))
        else:
            filters = {}
            if year:
                filters['year'] = year
            all_results = self.query_table('index_scores', filters=filters, order_by='-year')
        
        # Map p_t → profit_score for API compatibility
        for row in all_results:
            if 'p_t' in row:
                row['profit_score'] = row['p_t']
        
        return all_results
    
    def get_latest_year(self) -> int:
        """Get the latest year available in index_scores"""
        result = self.query_table('index_scores', 
                                 select='year', 
                                 limit=1, 
                                 order_by='-year')
        return result[0]['year'] if result else 2023
    
    def get_metadata(self) -> Dict:
        """
        Get database metadata
        
        Returns:
            Dict with counts and summary stats
        """
        companies = self.query_table('companies')
        financial = self.query_table('financial_raw', select='year')
        
        years = sorted(list(set([r['year'] for r in financial])))
        
        return {
            'total_companies': len(companies),
            'total_financial_records': len(financial),
            'years': years,
            'year_range': {
                'min': min(years) if years else None,
                'max': max(years) if years else None
            },
            'companies': [c['ticker'] for c in companies]
        }
    
    def execute_custom_query(self, query_fn):
        """
        Execute a custom query function
        
        Usage:
            def custom_query(client):
                return client.table('table').select('*').execute()
            
            result = db.execute_custom_query(custom_query)
        """
        return query_fn(self.client)


# Global database instance
db = None

def get_db() -> SupabaseDB:
    """Get or create database connection"""
    global db
    if db is None:
        db = SupabaseDB()
    return db


def close_db():
    """Close database connection"""
    global db
    db = None


# Test connection on module import
if __name__ == '__main__':
    print("Testing Supabase connection...")
    test_db = get_db()
    print(f"✅ Connection successful!")
    
    metadata = test_db.get_metadata()
    print(f"📊 Companies: {metadata['total_companies']}")
    print(f"📊 Financial records: {metadata['total_financial_records']}")
    print(f"📊 Year range: {metadata['year_range']}")
