"""
Preprocessing Module
Chức năng: Xử lý dữ liệu TRAIN-ONLY để tránh data leakage
- Winsorization (clip outliers)
- Standardization (z-score normalization)
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import pickle


class SafePreprocessor:
    """
    Preprocessing an toàn: Fit trên TRAIN, Transform trên cả TRAIN & TEST
    """
    
    def __init__(self):
        self.winsor_bounds = {}
        self.scaler_params = {}
        
    def fit_winsor_bounds(
        self, 
        train_df: pd.DataFrame, 
        columns: List[str], 
        lower_q: float = 0.01,
        upper_q: float = 0.99
    ) -> Dict[str, Dict[str, float]]:
        """
        Tính quantile bounds từ TRAIN set ONLY
        
        Args:
            train_df: Training data
            columns: Các cột cần winsorize
            lower_q: Quantile dưới (default: 0.01 = 1%)
            upper_q: Quantile trên (default: 0.99 = 99%)
            
        Returns:
            Dict mapping column -> {lower, upper} bounds
        """
        bounds = {}
        
        for col in columns:
            if col not in train_df.columns:
                print(f"⚠ Column {col} không tồn tại, bỏ qua")
                continue
                
            values = train_df[col].dropna()
            lower = values.quantile(lower_q)
            upper = values.quantile(upper_q)
            
            bounds[col] = {
                'lower': lower,
                'upper': upper
            }
            
        self.winsor_bounds = bounds
        print(f"✓ Đã fit winsor bounds cho {len(bounds)} columns (train only)")
        return bounds
    
    def apply_winsor(
        self, 
        df: pd.DataFrame, 
        bounds: Optional[Dict[str, Dict[str, float]]] = None
    ) -> pd.DataFrame:
        """
        Apply winsorization dựa trên bounds đã fit
        
        Args:
            df: Data cần clip (train hoặc test)
            bounds: Bounds đã fit (nếu None, dùng self.winsor_bounds)
            
        Returns:
            DataFrame đã winsorized
        """
        if bounds is None:
            bounds = self.winsor_bounds
            
        if not bounds:
            raise ValueError("Chưa fit winsor bounds. Gọi fit_winsor_bounds() trước.")
        
        df_clipped = df.copy()
        
        for col, bound in bounds.items():
            if col in df_clipped.columns:
                df_clipped[col] = df_clipped[col].clip(
                    lower=bound['lower'],
                    upper=bound['upper']
                )
        
        print(f"✓ Đã apply winsorization cho {len(bounds)} columns")
        return df_clipped
    
    def fit_scaler(
        self, 
        train_df: pd.DataFrame, 
        columns: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """
        Tính mean và std từ TRAIN set ONLY (z-score)
        
        Args:
            train_df: Training data
            columns: Các cột cần standardize
            
        Returns:
            Dict mapping column -> {mean, std}
        """
        params = {}
        
        for col in columns:
            if col not in train_df.columns:
                print(f"⚠ Column {col} không tồn tại, bỏ qua")
                continue
                
            values = train_df[col].dropna()
            params[col] = {
                'mean': float(values.mean()),
                'std': float(values.std())
            }
            
        self.scaler_params = params
        print(f"✓ Đã fit scaler params cho {len(params)} columns (train only)")
        return params
    
    def apply_scaler(
        self, 
        df: pd.DataFrame, 
        params: Optional[Dict[str, Dict[str, float]]] = None
    ) -> pd.DataFrame:
        """
        Apply z-score normalization dựa trên params đã fit
        
        Args:
            df: Data cần scale (train hoặc test)
            params: Scaler params đã fit (nếu None, dùng self.scaler_params)
            
        Returns:
            DataFrame đã standardized
        """
        if params is None:
            params = self.scaler_params
            
        if not params:
            raise ValueError("Chưa fit scaler params. Gọi fit_scaler() trước.")
        
        df_scaled = df.copy()
        
        for col, param in params.items():
            if col in df_scaled.columns:
                # Z-score: (x - mean) / std
                df_scaled[col] = (df_scaled[col] - param['mean']) / param['std']
        
        print(f"✓ Đã apply standardization cho {len(params)} columns")
        return df_scaled
    
    def save_preprocessor(self, filepath: str):
        """Lưu preprocessor để sử dụng lại"""
        state = {
            'winsor_bounds': self.winsor_bounds,
            'scaler_params': self.scaler_params
        }
        with open(filepath, 'wb') as f:
            pickle.dump(state, f)
        print(f"✓ Đã lưu preprocessor vào {filepath}")
    
    def load_preprocessor(self, filepath: str):
        """Load preprocessor đã lưu"""
        with open(filepath, 'rb') as f:
            state = pickle.load(f)
        self.winsor_bounds = state['winsor_bounds']
        self.scaler_params = state['scaler_params']
        print(f"✓ Đã load preprocessor từ {filepath}")


def preprocess_pipeline(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_cols: List[str]
) -> Tuple[pd.DataFrame, pd.DataFrame, SafePreprocessor]:
    """
    Full preprocessing pipeline: Winsorize + Standardize
    FIT trên train, APPLY trên cả train và test
    
    Args:
        train_df: Training data
        test_df: Test data
        feature_cols: Các cột features cần xử lý
        
    Returns:
        train_processed, test_processed, preprocessor
    """
    print("\n=== PREPROCESSING PIPELINE ===")
    
    preprocessor = SafePreprocessor()
    
    # Step 1: Fit winsor bounds trên train
    print("\n[1] Winsorization...")
    preprocessor.fit_winsor_bounds(train_df, feature_cols)
    
    # Apply winsor trên cả train và test
    train_winsor = preprocessor.apply_winsor(train_df)
    test_winsor = preprocessor.apply_winsor(test_df)
    
    # Step 2: Fit scaler trên train (sau winsor)
    print("\n[2] Standardization...")
    preprocessor.fit_scaler(train_winsor, feature_cols)
    
    # Apply scaler trên cả train và test
    train_scaled = preprocessor.apply_scaler(train_winsor)
    test_scaled = preprocessor.apply_scaler(test_winsor)
    
    print("\n✓ Preprocessing hoàn tất!")
    
    return train_scaled, test_scaled, preprocessor


# Example usage
if __name__ == '__main__':
    # Dummy data
    train = pd.DataFrame({
        'A': [1, 2, 100, 4, 5],  # outlier: 100
        'B': [10, 20, 30, 40, 50]
    })
    test = pd.DataFrame({
        'A': [3, 150, 5],  # outlier: 150
        'B': [25, 35, 45]
    })
    
    train_p, test_p, prep = preprocess_pipeline(train, test, ['A', 'B'])
    print("\nTrain processed:\n", train_p)
    print("\nTest processed:\n", test_p)
