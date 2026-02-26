"""
PCA & ProfitScore Module
Chức năng: 
- PCA trên 5 chỉ tiêu lợi nhuận (train-only)
- Tính ProfitScore P từ PC scores và EVR weights
"""

import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from typing import Tuple, Dict, List, Optional
import pickle


class PCAProfit:
    """
    PCA và tính ProfitScore
    """
    
    def __init__(self, n_components: int = 3):
        self.n_components = n_components
        self.pca = None
        self.evr = None  # Explained Variance Ratio
        self.loadings = None
        
    def fit_pca(
        self, 
        train_data: pd.DataFrame, 
        feature_cols: List[str]
    ) -> PCA:
        """
        Fit PCA trên TRAIN set ONLY
        
        Args:
            train_data: Training data (đã standardized)
            feature_cols: Các cột features (5 chỉ tiêu lợi nhuận)
            
        Returns:
            PCA object đã fit
        """
        X_train = train_data[feature_cols].values
        
        # Fit PCA
        self.pca = PCA(n_components=self.n_components)
        self.pca.fit(X_train)
        
        # Lưu EVR và loadings
        self.evr = self.pca.explained_variance_ratio_
        self.loadings = self.pca.components_
        
        print(f"\n=== PCA FIT (Train only) ===")
        print(f"N components: {self.n_components}")
        print(f"Explained Variance Ratio:")
        for i, evr in enumerate(self.evr):
            print(f"  PC{i+1}: {evr:.4f} ({evr*100:.2f}%)")
        print(f"Total EVR: {self.evr.sum():.4f} ({self.evr.sum()*100:.2f}%)")
        
        return self.pca
    
    def transform_pca(self, data: pd.DataFrame, feature_cols: List[str]) -> np.ndarray:
        """
        Transform data thành PC scores
        
        Args:
            data: Data cần transform (train hoặc test)
            feature_cols: Các cột features
            
        Returns:
            PC scores array (n_samples, n_components)
        """
        if self.pca is None:
            raise ValueError("Chưa fit PCA. Gọi fit_pca() trước.")
        
        X = data[feature_cols].values
        pc_scores = self.pca.transform(X)
        
        return pc_scores
    
    def compute_profit_score(
        self, 
        pc_scores: np.ndarray, 
        weights: str = 'evr'
    ) -> np.ndarray:
        """
        Tính ProfitScore P từ PC scores
        
        P = w1*PC1 + w2*PC2 + w3*PC3
        
        Args:
            pc_scores: PC scores (n_samples, n_components)
            weights: Cách tính trọng số
                - 'evr': Dùng EVR (explained variance ratio)
                - 'equal': Trọng số đều
                
        Returns:
            ProfitScore array (n_samples,)
        """
        if weights == 'evr':
            # Normalize EVR thành weights
            w = self.evr / self.evr.sum()
        elif weights == 'equal':
            w = np.ones(self.n_components) / self.n_components
        else:
            raise ValueError(f"Unknown weights: {weights}")
        
        # Weighted sum
        profit_score = np.sum(pc_scores * w, axis=1)
        
        print(f"\n✓ Tính ProfitScore với weights: {weights}")
        print(f"  Weights: {w}")
        print(f"  ProfitScore range: [{profit_score.min():.4f}, {profit_score.max():.4f}]")
        
        return profit_score
    
    def get_pca_info(self) -> Dict:
        """
        Trả về thông tin PCA để hiển thị trong API
        """
        if self.pca is None:
            return {}
        
        return {
            'n_components': self.n_components,
            'explained_variance_ratio': self.evr.tolist(),
            'total_evr': float(self.evr.sum()),
            'loadings': self.loadings.tolist()
        }
    
    def save_pca(self, filepath: str):
        """Lưu PCA model"""
        state = {
            'pca': self.pca,
            'evr': self.evr,
            'loadings': self.loadings,
            'n_components': self.n_components
        }
        with open(filepath, 'wb') as f:
            pickle.dump(state, f)
        print(f"✓ Đã lưu PCA model vào {filepath}")
    
    def load_pca(self, filepath: str):
        """Load PCA model đã lưu"""
        with open(filepath, 'rb') as f:
            state = pickle.load(f)
        self.pca = state['pca']
        self.evr = state['evr']
        self.loadings = state['loadings']
        self.n_components = state['n_components']
        print(f"✓ Đã load PCA model từ {filepath}")


def pca_pipeline(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_cols: List[str],
    n_components: int = 3
) -> Tuple[pd.DataFrame, pd.DataFrame, PCAProfit]:
    """
    Full PCA pipeline: Fit PCA + Transform + Compute ProfitScore
    
    Args:
        train_df: Training data (đã preprocessed)
        test_df: Test data (đã preprocessed)
        feature_cols: Các cột features
        n_components: Số PC components
        
    Returns:
        train_df (với PC scores & ProfitScore), 
        test_df (với PC scores & ProfitScore),
        pca_model
    """
    print("\n=== PCA PIPELINE ===")
    
    pca_model = PCAProfit(n_components=n_components)
    
    # Fit PCA trên train
    pca_model.fit_pca(train_df, feature_cols)
    
    # Transform train và test
    train_pc = pca_model.transform_pca(train_df, feature_cols)
    test_pc = pca_model.transform_pca(test_df, feature_cols)
    
    # Thêm PC scores vào DataFrame
    train_df_out = train_df.copy()
    test_df_out = test_df.copy()
    
    for i in range(n_components):
        train_df_out[f'PC{i+1}'] = train_pc[:, i]
        test_df_out[f'PC{i+1}'] = test_pc[:, i]
    
    # Tính ProfitScore
    train_profit = pca_model.compute_profit_score(train_pc, weights='evr')
    test_profit = pca_model.compute_profit_score(test_pc, weights='evr')
    
    train_df_out['ProfitScore'] = train_profit
    test_df_out['ProfitScore'] = test_profit
    
    print("\n✓ PCA Pipeline hoàn tất!")
    
    return train_df_out, test_df_out, pca_model


# Example usage
if __name__ == '__main__':
    from typing import List
    
    # Dummy data (5 features đã standardized)
    train = pd.DataFrame(np.random.randn(100, 5), 
                         columns=['F1', 'F2', 'F3', 'F4', 'F5'])
    test = pd.DataFrame(np.random.randn(30, 5), 
                        columns=['F1', 'F2', 'F3', 'F4', 'F5'])
    
    train_out, test_out, pca = pca_pipeline(
        train, test, 
        ['F1', 'F2', 'F3', 'F4', 'F5'],
        n_components=3
    )
    
    print("\nTrain PC scores & ProfitScore:")
    print(train_out[['PC1', 'PC2', 'PC3', 'ProfitScore']].head())
