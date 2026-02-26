"""
Labeling Module
Chức năng: Tạo label cho năm t+1 dựa trên ProfitScore
"""

import pandas as pd
import numpy as np
from typing import Literal


class LabelMaker:
    """
    Tạo label nhị phân cho classification
    """
    
    def __init__(self, rule: Literal['positive', 'median', 'threshold'] = 'positive'):
        """
        Args:
            rule: Quy tắc tạo label
                - 'positive': P(t+1) > 0 → label=1
                - 'median': P(t+1) > median(P_train) → label=1
                - 'threshold': P(t+1) > custom threshold → label=1
        """
        self.rule = rule
        self.threshold = None
        
    def make_label_t1(
        self,
        df: pd.DataFrame,
        profit_col: str = 'ProfitScore',
        rule: Literal['positive', 'median', 'threshold'] = 'positive'
    ) -> pd.Series:
        """
        Tạo label cho năm t+1 dựa trên ProfitScore(t+1)
        
        QUAN TRỌNG: 
        - Dữ liệu đã được align, nên ProfitScore hiện tại 
          đã là ProfitScore(t+1) (năm tiếp theo)
        
        Args:
            df: DataFrame có cột ProfitScore
            profit_col: Tên cột ProfitScore
            rule: Quy tắc tạo label (override self.rule)
            
        Returns:
            Series label (0/1)
        """
        if rule is None:
            rule = self.rule
        
        profit = df[profit_col]
        
        if rule == 'positive':
            # Label = 1 nếu ProfitScore > 0
            label = (profit > 0).astype(int)
            self.threshold = 0
            
        elif rule == 'median':
            # Label = 1 nếu ProfitScore > median
            threshold = profit.median()
            label = (profit > threshold).astype(int)
            self.threshold = threshold
            
        elif rule == 'threshold':
            if self.threshold is None:
                raise ValueError("Threshold chưa được set. Dùng set_threshold() trước.")
            label = (profit > self.threshold).astype(int)
        
        else:
            raise ValueError(f"Unknown rule: {rule}")
        
        # Stats
        n_positive = label.sum()
        n_total = len(label)
        pct_positive = n_positive / n_total * 100
        
        print(f"\n=== LABEL CREATION (t+1) ===")
        print(f"Rule: {rule}")
        print(f"Threshold: {self.threshold:.4f}")
        print(f"Label distribution:")
        print(f"  Class 0 (Below threshold): {n_total - n_positive} ({100-pct_positive:.2f}%)")
        print(f"  Class 1 (Above threshold): {n_positive} ({pct_positive:.2f}%)")
        
        return label
    
    def set_threshold(self, value: float):
        """Set custom threshold"""
        self.threshold = value
        print(f"✓ Set threshold = {value}")
    
    def fit_threshold_from_train(
        self,
        train_df: pd.DataFrame,
        profit_col: str = 'ProfitScore',
        method: Literal['median', 'mean', 'percentile'] = 'median',
        percentile: float = 0.5
    ):
        """
        Tính threshold từ train set
        
        Args:
            train_df: Training data
            profit_col: Cột ProfitScore
            method: Phương pháp tính threshold
            percentile: Nếu method='percentile', dùng giá trị này (0-1)
        """
        profit = train_df[profit_col]
        
        if method == 'median':
            threshold = profit.median()
        elif method == 'mean':
            threshold = profit.mean()
        elif method == 'percentile':
            threshold = profit.quantile(percentile)
        else:
            raise ValueError(f"Unknown method: {method}")
        
        self.threshold = threshold
        print(f"✓ Fit threshold từ train: {threshold:.4f} (method={method})")
        return threshold


def create_labels_pipeline(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    profit_col: str = 'ProfitScore',
    rule: Literal['positive', 'median', 'threshold'] = 'positive'
) -> tuple[pd.DataFrame, pd.DataFrame, LabelMaker]:
    """
    Full labeling pipeline
    
    Args:
        train_df: Training data (có ProfitScore)
        test_df: Test data (có ProfitScore)
        profit_col: Cột ProfitScore
        rule: Quy tắc tạo label
        
    Returns:
        train_df (với label), test_df (với label), label_maker
    """
    print("\n=== LABELING PIPELINE ===")
    
    label_maker = LabelMaker(rule=rule)
    
    # Nếu dùng median/threshold, fit từ train
    if rule == 'median':
        label_maker.fit_threshold_from_train(train_df, profit_col, method='median')
    
    # Tạo label cho train và test
    train_df_out = train_df.copy()
    test_df_out = test_df.copy()
    
    train_df_out['label'] = label_maker.make_label_t1(train_df, profit_col, rule)
    test_df_out['label'] = label_maker.make_label_t1(test_df, profit_col, rule='threshold')
    
    print("\n✓ Labeling hoàn tất!")
    
    return train_df_out, test_df_out, label_maker


# Example usage
if __name__ == '__main__':
    # Dummy data
    train = pd.DataFrame({
        'ProfitScore': np.random.randn(100)
    })
    test = pd.DataFrame({
        'ProfitScore': np.random.randn(30)
    })
    
    train_out, test_out, lm = create_labels_pipeline(train, test, rule='median')
    
    print("\nTrain labels:")
    print(train_out['label'].value_counts())
    print("\nTest labels:")
    print(test_out['label'].value_counts())
