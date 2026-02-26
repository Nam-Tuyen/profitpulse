"""
Main Pipeline
Chức năng: Kết nối toàn bộ pipeline từ data → model → predictions → cache
"""

import pandas as pd
import numpy as np
import os
import json
from typing import Dict, Tuple

from core.data_loader import DataLoader
from core.preprocessing import SafePreprocessor, preprocess_pipeline
from core.pca_profitscore import PCAProfit, pca_pipeline
from core.labeling import LabelMaker, create_labels_pipeline
from core.ml_models import MLModels
from core.explanations import ExplanationGenerator


class MainPipeline:
    """
    Full ML Pipeline: Load → Preprocess → PCA → Label → Train → Predict → Explain
    """
    
    def __init__(self, data_path: str = 'Data.xlsx', cache_dir: str = 'backend/cache'):
        self.data_path = data_path
        self.cache_dir = cache_dir
        
        # Components
        self.loader = DataLoader(data_path)
        self.preprocessor = SafePreprocessor()
        self.pca = PCAProfit(n_components=3)
        self.label_maker = LabelMaker(rule='positive')
        self.ml_models = MLModels()
        self.explainer = None
        
        # Data
        self.train_df = None
        self.test_df = None
        self.feature_cols = ['NI_AT', 'NI_P', 'EPS_B', 'GP', 'REV']
        
        # Create cache dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def run_full_pipeline(
        self,
        train_label_max_year: int = 2020,
        test_label_min_year: int = 2021,
        save_cache: bool = True
    ) -> Dict:
        """
        Chạy toàn bộ pipeline
        
        Args:
            train_label_max_year: Năm label tối đa cho train
            test_label_min_year: Năm label tối thiểu cho test
            save_cache: Có lưu cache không
            
        Returns:
            Dict chứa kết quả và metrics
        """
        print("\n" + "="*70)
        print(" "*20 + "FULL ML PIPELINE")
        print("="*70)
        
        # Step 1: Load data
        print("\n[STEP 1] Loading Data...")
        df = self.loader.load_panel()
        df_aligned = self.loader.align_Xt_to_label_t1(df)
        
        # Step 2: Time split
        print("\n[STEP 2] Time-based Split...")
        train_df, test_df = self.loader.split_by_label_year(
            df_aligned, 
            train_label_max_year, 
            test_label_min_year
        )
        
        # Step 3: Preprocessing (Train-only fit)
        print("\n[STEP 3] Preprocessing (Winsorize + Standardize)...")
        train_prep, test_prep, self.preprocessor = preprocess_pipeline(
            train_df, test_df, self.feature_cols
        )
        
        # Step 4: PCA + ProfitScore
        print("\n[STEP 4] PCA + ProfitScore...")
        train_pca, test_pca, self.pca = pca_pipeline(
            train_prep, test_prep, self.feature_cols, n_components=3
        )
        
        # Step 5: Labeling
        print("\n[STEP 5] Creating Labels (t+1)...")
        train_labeled, test_labeled, self.label_maker = create_labels_pipeline(
            train_pca, test_pca, profit_col='ProfitScore', rule='positive'
        )
        
        self.train_df = train_labeled
        self.test_df = test_labeled
        
        # Step 6: Prepare features for ML
        print("\n[STEP 6] Preparing ML Features...")
        X_train = train_labeled[self.feature_cols].values
        y_train = train_labeled['label'].values
        X_test = test_labeled[self.feature_cols].values
        y_test = test_labeled['label'].values
        
        print(f"  X_train shape: {X_train.shape}")
        print(f"  X_test shape: {X_test.shape}")
        
        # Step 7: Train models
        print("\n[STEP 7] Training ML Models...")
        self.ml_models.train_all_models(X_train, y_train)
        
        # Step 8: Evaluate models
        print("\n[STEP 8] Evaluating Models...")
        metrics = self.ml_models.evaluate_all_models(X_test, y_test)
        
        # Step 9: Generate predictions & explanations
        print("\n[STEP 9] Generating Predictions & Explanations...")
        
        # Use best model (let's say RF for now)
        best_model = 'rf'
        
        train_proba = self.ml_models.predict_proba(best_model, X_train)[:, 1]
        test_proba = self.ml_models.predict_proba(best_model, X_test)[:, 1]
        
        # Initialize explainer
        self.explainer = ExplanationGenerator(self.feature_cols)
        
        # Generate explanations
        train_explanations = self.explainer.batch_explain(
            train_labeled, train_proba, threshold=0.5
        )
        test_explanations = self.explainer.batch_explain(
            test_labeled, test_proba, threshold=0.5
        )
        
        print(f"✓ Generated explanations for {len(train_explanations)} train + {len(test_explanations)} test records")
        
        # Step 10: Save cache
        if save_cache:
            print("\n[STEP 10] Saving Cache...")
            self.save_to_cache(train_explanations, test_explanations, metrics)
        
        print("\n" + "="*70)
        print(" "*20 + "PIPELINE COMPLETE!")
        print("="*70)
        
        return {
            'metrics': metrics,
            'train_size': len(train_labeled),
            'test_size': len(test_labeled),
            'best_model': best_model,
            'train_explanations': train_explanations,
            'test_explanations': test_explanations
        }
    
    def save_to_cache(
        self,
        train_explanations: pd.DataFrame,
        test_explanations: pd.DataFrame,
        metrics: Dict
    ):
        """
        Lưu kết quả vào cache để API sử dụng
        """
        # Combine train + test explanations
        all_explanations = pd.concat([train_explanations, test_explanations], ignore_index=True)
        
        # Save to parquet (fast loading)
        all_explanations.to_parquet(
            os.path.join(self.cache_dir, 'predictions.parquet'),
            index=False
        )
        print(f"✓ Saved predictions to cache/predictions.parquet")
        
        # Save ProfitScore timeseries
        profit_scores = pd.concat([
            self.train_df[['FIRM_ID', 'year_t', 'year_t1', 'ProfitScore']],
            self.test_df[['FIRM_ID', 'year_t', 'year_t1', 'ProfitScore']]
        ], ignore_index=True)
        
        profit_scores.to_parquet(
            os.path.join(self.cache_dir, 'profit_scores.parquet'),
            index=False
        )
        print(f"✓ Saved profit scores to cache/profit_scores.parquet")
        
        # Save metadata & metrics
        metadata = {
            'metrics': metrics,
            'feature_cols': self.feature_cols,
            'pca_info': self.pca.get_pca_info(),
            'winsor_bounds': self.preprocessor.winsor_bounds,
            'scaler_params': self.preprocessor.scaler_params,
            'label_threshold': self.label_maker.threshold
        }
        
        with open(os.path.join(self.cache_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Saved metadata to cache/metadata.json")
        
        # Save models
        self.ml_models.save_models(os.path.join(self.cache_dir, 'models.pkl'))
        self.preprocessor.save_preprocessor(os.path.join(self.cache_dir, 'preprocessor.pkl'))
        self.pca.save_pca(os.path.join(self.cache_dir, 'pca.pkl'))
        
        print("\n✓ All cache files saved!")


# Script để chạy offline build
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Run ML Pipeline & Build Cache')
    parser.add_argument('--data', type=str, default='Data.xlsx', help='Path to data file')
    parser.add_argument('--train-year', type=int, default=2020, help='Max label year for train')
    parser.add_argument('--test-year', type=int, default=2021, help='Min label year for test')
    parser.add_argument('--cache-dir', type=str, default='backend/cache', help='Cache directory')
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline = MainPipeline(data_path=args.data, cache_dir=args.cache_dir)
    results = pipeline.run_full_pipeline(
        train_label_max_year=args.train_year,
        test_label_min_year=args.test_year,
        save_cache=True
    )
    
    print("\n📊 Final Metrics:")
    for model_name, model_metrics in results['metrics'].items():
        print(f"\n{model_name.upper()}:")
        print(f"  Accuracy: {model_metrics['accuracy']:.4f}")
        print(f"  F1-Score: {model_metrics['f1_score']:.4f}")
        if model_metrics['auc']:
            print(f"  AUC: {model_metrics['auc']:.4f}")
