"""
Cache Manager
Chức năng: Query dữ liệu từ cache (parquet files) - nhanh và hiệu quả
"""

import pandas as pd
import json
import os
from typing import Dict, List, Optional


class CacheManager:
    """
    Quản lý và query cache data
    """
    
    def __init__(self, cache_dir: str = 'backend/cache'):
        self.cache_dir = cache_dir
        self._predictions = None
        self._profit_scores = None
        self._metadata = None
        
    def load_predictions(self) -> pd.DataFrame:
        """Load predictions cache"""
        if self._predictions is None:
            path = os.path.join(self.cache_dir, 'predictions.parquet')
            if os.path.exists(path):
                self._predictions = pd.read_parquet(path)
            else:
                raise FileNotFoundError(f"Predictions cache not found: {path}")
        return self._predictions
    
    def load_profit_scores(self) -> pd.DataFrame:
        """Load profit scores cache"""
        if self._profit_scores is None:
            path = os.path.join(self.cache_dir, 'profit_scores.parquet')
            if os.path.exists(path):
                self._profit_scores = pd.read_parquet(path)
            else:
                raise FileNotFoundError(f"Profit scores cache not found: {path}")
        return self._profit_scores
    
    def load_metadata(self) -> Dict:
        """Load metadata"""
        if self._metadata is None:
            path = os.path.join(self.cache_dir, 'metadata.json')
            if os.path.exists(path):
                with open(path, 'r') as f:
                    self._metadata = json.load(f)
            else:
                raise FileNotFoundError(f"Metadata not found: {path}")
        return self._metadata
    
    def get_all_firms(self) -> List[str]:
        """Lấy danh sách tất cả công ty"""
        df = self.load_predictions()
        return sorted(df['FIRM_ID'].unique().tolist())
    
    def get_all_years(self) -> List[int]:
        """Lấy danh sách tất cả năm"""
        df = self.load_predictions()
        years = set(df['year_t'].unique().tolist()) | set(df['year_t1'].unique().tolist())
        return sorted([int(y) for y in years])
    
    def get_firm_data(self, firm_id: str, year: Optional[int] = None) -> Dict:
        """
        Lấy dữ liệu của 1 công ty
        
        Args:
            firm_id: Mã công ty
            year: Năm t (năm dự báo), nếu None thì lấy tất cả
            
        Returns:
            Dict chứa predictions và profit score timeseries
        """
        # Get predictions
        pred_df = self.load_predictions()
        firm_pred = pred_df[pred_df['FIRM_ID'] == firm_id].copy()
        
        if year is not None:
            firm_pred = firm_pred[firm_pred['year_t'] == year]
        
        # Get profit scores timeseries
        ps_df = self.load_profit_scores()
        firm_ps = ps_df[ps_df['FIRM_ID'] == firm_id].copy()
        
        return {
            'firm_id': firm_id,
            'predictions': firm_pred.to_dict(orient='records'),
            'profit_score_timeseries': firm_ps.to_dict(orient='records')
        }
    
    def get_screener_data(
        self,
        year: Optional[int] = None,
        risk_level: Optional[str] = None,
        chance_min: Optional[float] = None,
        chance_max: Optional[float] = None,
        borderline_only: bool = False
    ) -> pd.DataFrame:
        """
        Lọc dữ liệu theo điều kiện (screener)
        
        Args:
            year: Năm t (năm dự báo)
            risk_level: 'Thấp', 'Vừa', 'Cao'
            chance_min: Chance tối thiểu (0-100)
            chance_max: Chance tối đa (0-100)
            borderline_only: Chỉ lấy borderline cases
            
        Returns:
            Filtered DataFrame
        """
        df = self.load_predictions()
        
        # Filter by year
        if year is not None:
            df = df[df['year_t'] == year]
        
        # Filter by risk level
        if risk_level is not None:
            df = df[df['risk_level'] == risk_level]
        
        # Filter by chance range
        if chance_min is not None:
            df = df[df['chance_percent'] >= chance_min]
        if chance_max is not None:
            df = df[df['chance_percent'] <= chance_max]
        
        # Filter borderline
        if borderline_only:
            df = df[df['is_borderline'] == True]
        
        return df
    
    def get_summary_stats(self, year: Optional[int] = None) -> Dict:
        """
        Thống kê tổng quan
        
        Args:
            year: Năm t (nếu None thì all years)
            
        Returns:
            Dict chứa summary statistics
        """
        df = self.load_predictions()
        
        if year is not None:
            df = df[df['year_t'] == year]
        
        total_firms = df['FIRM_ID'].nunique()
        
        # Risk distribution
        risk_dist = df['risk_level'].value_counts().to_dict()
        
        # Chance stats
        chance_mean = df['chance_percent'].mean()
        chance_median = df['chance_percent'].median()
        
        # Borderline count
        borderline_count = df['is_borderline'].sum()
        
        # Outlook distribution (heuristic: chance >= 50%)
        outlook_good = (df['chance_percent'] >= 50).sum()
        outlook_bad = (df['chance_percent'] < 50).sum()
        
        return {
            'year': year,
            'total_firms': int(total_firms),
            'total_records': len(df),
            'risk_distribution': risk_dist,
            'chance_stats': {
                'mean': float(chance_mean),
                'median': float(chance_median)
            },
            'borderline_count': int(borderline_count),
            'outlook_distribution': {
                'good': int(outlook_good),
                'bad': int(outlook_bad),
                'good_percent': float(outlook_good / len(df) * 100) if len(df) > 0 else 0
            }
        }
    
    def get_top_risk_increased(self, top_n: int = 10) -> List[Dict]:
        """
        Lấy top N công ty có risk tăng mạnh (so với kỳ trước)
        
        Args:
            top_n: Số lượng kết quả
            
        Returns:
            List of dicts
        """
        df = self.load_predictions()
        
        # Sort by year, get latest 2 years per firm
        df = df.sort_values(['FIRM_ID', 'year_t'])
        
        # Calculate risk change (simplified: compare chance_percent)
        df['chance_lag'] = df.groupby('FIRM_ID')['chance_percent'].shift(1)
        df['chance_change'] = df['chance_percent'] - df['chance_lag']
        
        # Negative change = risk increased
        risk_increased = df[df['chance_change'] < 0].copy()
        risk_increased = risk_increased.sort_values('chance_change').head(top_n)
        
        return risk_increased[['FIRM_ID', 'year_t', 'chance_percent', 'chance_change', 'risk_level']].to_dict(orient='records')
    
    def compare_firms(self, firm_ids: List[str], year: int) -> pd.DataFrame:
        """
        So sánh nhiều công ty
        
        Args:
            firm_ids: List mã công ty
            year: Năm t
            
        Returns:
            DataFrame để so sánh
        """
        df = self.load_predictions()
        
        compared = df[
            (df['FIRM_ID'].isin(firm_ids)) & 
            (df['year_t'] == year)
        ].copy()
        
        return compared


# Singleton instance
cache_manager = CacheManager()
