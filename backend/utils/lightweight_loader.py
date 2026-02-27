"""
Lightweight Data Loader for Vercel
Uses JSON instead of Parquet to avoid pyarrow dependency
"""
import json
import os
from typing import Dict, List, Optional


class LightweightDataLoader:
    """
    Minimal data loader optimized for Vercel Lambda
    Uses pre-computed JSON artifacts instead of heavy ML dependencies
    """
    
    def __init__(self, artifacts_dir: str = 'artifacts_profitpulse'):
        self.artifacts_dir = artifacts_dir
        self._data_cache = {}
        
    def _load_json(self, filename: str) -> Dict:
        """Load JSON file with caching"""
        if filename not in self._data_cache:
            path = os.path.join(self.artifacts_dir, filename)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    self._data_cache[filename] = json.load(f)
            else:
                return {}
        return self._data_cache[filename]
    
    def get_metadata(self) -> Dict:
        """Get dataset metadata"""
        methodology = self._load_json('methodology_snapshot.json')
        metrics = self._load_json('model_metrics.json')
        
        return {
            'model_metrics': metrics,
            'methodology': methodology,
            'features': methodology.get('features', {}),
            'data_info': methodology.get('data_info', {})
        }
    
    def get_company_data(self, ticker: str) -> Optional[Dict]:
        """Get company data (implement as needed)"""
        # For MVP, return basic structure
        return {
            'ticker': ticker,
            'data': [],
            'message': 'Data loading from artifacts - implement as needed'
        }
    
    def get_all_companies(self) -> List[str]:
        """Get list of all companies"""
        methodology = self._load_json('methodology_snapshot.json')
        data_info = methodology.get('data_info', {})
        return data_info.get('firms', [])
    
    def get_summary_stats(self) -> Dict:
        """Get summary statistics"""
        methodology = self._load_json('methodology_snapshot.json')
        metrics = self._load_json('model_metrics.json')
        
        return {
            'model_metrics': metrics,
            'data_summary': methodology.get('data_info', {}),
            'methodology': methodology.get('methodology', {})
        }


# Global instance
lightweight_loader = LightweightDataLoader()
