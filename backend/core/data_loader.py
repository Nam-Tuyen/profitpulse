"""
Data Loader Module
Chức năng: Load và align dữ liệu panel (firm-year) đúng cách
- Load data từ Excel
- Align X(t) với Label(t+1)
- Loại bỏ năm cuối cùng (không có t+1 để dự báo)
"""

import pandas as pd
import numpy as np
from typing import Tuple, Optional


class DataLoader:
    """Load và quản lý dữ liệu panel"""
    
    def __init__(self, data_path: str = 'Data.xlsx'):
        self.data_path = data_path
        self.df = None
        
    def load_panel(self) -> pd.DataFrame:
        """
        Load dữ liệu từ Excel
        
        Returns:
            DataFrame với columns: FIRM_ID, YEAR, các biến tài chính
        """
        try:
            self.df = pd.read_excel(self.data_path)
            print(f"✓ Đã load {len(self.df)} records từ {self.data_path}")
            print(f"✓ Columns: {self.df.columns.tolist()}")
            print(f"✓ Số công ty: {self.df['FIRM_ID'].nunique()}")
            print(f"✓ Năm: {self.df['YEAR'].min()} - {self.df['YEAR'].max()}")
            return self.df.copy()
        except Exception as e:
            print(f"✗ Lỗi khi load data: {str(e)}")
            raise
    
    def get_profit_proxies(self) -> list:
        """
        Trả về danh sách 5 chỉ tiêu lợi nhuận chính
        (ROA, ROE, ROC, EPS, NPM từ data)
        """
        # Map từ data thực tế
        proxies = {
            'NI_AT': 'ROA',      # Net Income / Total Assets
            'NI_P': 'ROE_proxy', # Net Income / Price (tương tự ROE)
            'EPS_B': 'EPS',      # Earnings Per Share
            'GP': 'GPM',         # Gross Profit (có thể tính margin)
            'REV': 'REV'         # Revenue (để tính NPM)
        }
        # Trong thực tế cần tính thêm ROE, ROC, NPM từ các chỉ tiêu có sẵn
        return ['NI_AT', 'NI_P', 'EPS_B', 'GP', 'REV']
    
    def align_Xt_to_label_t1(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Align dữ liệu: X tại năm t dùng để dự báo Label tại năm t+1
        
        Logic:
        1. Sort theo FIRM_ID, YEAR
        2. Tạo label t+1 (shift -1 trong cùng firm)
        3. Loại bỏ năm cuối của mỗi công ty (không có t+1)
        
        Args:
            df: DataFrame gốc
            
        Returns:
            DataFrame đã align với cột year_t và year_t1
        """
        df = df.sort_values(['FIRM_ID', 'YEAR']).reset_index(drop=True)
        
        # Tạo năm t+1 cho label
        df['year_t'] = df['YEAR']
        df['year_t1'] = df.groupby('FIRM_ID')['YEAR'].shift(-1)
        
        # Loại bỏ records không có t+1 (năm cuối của mỗi công ty)
        df_aligned = df[df['year_t1'].notna()].copy()
        
        # Convert year_t1 sang int
        df_aligned['year_t1'] = df_aligned['year_t1'].astype(int)
        
        n_removed = len(df) - len(df_aligned)
        print(f"✓ Aligned: Loại bỏ {n_removed} records (năm cuối của mỗi công ty)")
        print(f"✓ Dataset sau align: {len(df_aligned)} records")
        
        return df_aligned
    
    def split_by_label_year(
        self, 
        df: pd.DataFrame, 
        train_label_max_year: int = 2020,
        test_label_min_year: int = 2021
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Time-based split theo năm của LABEL (year_t1)
        
        QUAN TRỌNG: Split theo year_t1 (năm dự báo), không phải year_t
        
        Args:
            df: DataFrame đã aligned
            train_label_max_year: Label năm tối đa cho train (vd: 2020)
            test_label_min_year: Label năm tối thiểu cho test (vd: 2021)
            
        Returns:
            train_df, test_df
        """
        # Split dựa trên year_t1 (năm của label)
        train_df = df[df['year_t1'] <= train_label_max_year].copy()
        test_df = df[df['year_t1'] >= test_label_min_year].copy()
        
        print(f"\n=== TIME SPLIT (by Label Year) ===")
        print(f"Train: year_t1 <= {train_label_max_year}")
        print(f"  → {len(train_df)} records")
        print(f"  → Year_t range: {train_df['year_t'].min()}-{train_df['year_t'].max()}")
        print(f"  → Year_t1 (label) range: {train_df['year_t1'].min()}-{train_df['year_t1'].max()}")
        
        print(f"\nTest: year_t1 >= {test_label_min_year}")
        print(f"  → {len(test_df)} records")
        print(f"  → Year_t range: {test_df['year_t'].min()}-{test_df['year_t'].max()}")
        print(f"  → Year_t1 (label) range: {test_df['year_t1'].min()}-{test_df['year_t1'].max()}")
        
        return train_df, test_df
    
    def get_metadata(self, df: pd.DataFrame) -> dict:
        """
        Trả về metadata về dataset
        """
        return {
            'total_records': len(df),
            'firms': df['FIRM_ID'].nunique(),
            'firm_list': df['FIRM_ID'].unique().tolist(),
            'years': sorted(df['YEAR'].unique().tolist()),
            'year_range': {
                'min': int(df['YEAR'].min()),
                'max': int(df['YEAR'].max())
            },
            'columns': df.columns.tolist()
        }


# Example usage
if __name__ == '__main__':
    loader = DataLoader('Data.xlsx')
    df = loader.load_panel()
    df_aligned = loader.align_Xt_to_label_t1(df)
    train_df, test_df = loader.split_by_label_year(df_aligned)
    
    print("\nMetadata:")
    print(loader.get_metadata(df_aligned))
