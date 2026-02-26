"""
ML Models Module
Chức năng: Train và predict với SVM, Random Forest, XGBoost
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, Literal, Optional, List
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import pickle


class MLModels:
    """
    Quản lý các ML models: SVM, RF, XGBoost
    """
    
    def __init__(self):
        self.models = {}
        self.metrics = {}
        self.feature_importance = {}
        
    def train_svm(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        kernel: Literal['linear', 'poly', 'rbf', 'sigmoid', 'precomputed'] = 'rbf',
        C: float = 1.0,
        probability: bool = True
    ) -> SVC:
        """
        Train SVM classifier
        
        Args:
            X_train: Training features
            y_train: Training labels
            kernel: Kernel type
            C: Regularization parameter
            probability: Enable probability estimates
            
        Returns:
            Trained SVM model
        """
        print(f"\n=== Training SVM (kernel={kernel}, C={C}) ===")
        
        model = SVC(kernel=kernel, C=C, probability=probability, random_state=42)
        model.fit(X_train, y_train)
        
        self.models['svm'] = model
        print(f"✓ SVM trained với {len(X_train)} samples")
        
        return model
    
    def train_random_forest(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        n_estimators: int = 100,
        max_depth: Optional[int] = None,
        min_samples_split: int = 2
    ) -> RandomForestClassifier:
        """
        Train Random Forest classifier
        
        Args:
            X_train: Training features
            y_train: Training labels
            n_estimators: Number of trees
            max_depth: Maximum depth
            min_samples_split: Min samples to split
            
        Returns:
            Trained RF model
        """
        print(f"\n=== Training Random Forest (n_trees={n_estimators}) ===")
        
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        self.models['rf'] = model
        self.feature_importance['rf'] = model.feature_importances_
        print(f"✓ Random Forest trained với {len(X_train)} samples")
        
        return model
    
    def train_xgboost(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        n_estimators: int = 100,
        max_depth: int = 6,
        learning_rate: float = 0.1
    ) -> XGBClassifier:
        """
        Train XGBoost classifier
        
        Args:
            X_train: Training features
            y_train: Training labels
            n_estimators: Number of boosting rounds
            max_depth: Maximum tree depth
            learning_rate: Learning rate
            
        Returns:
            Trained XGBoost model
        """
        print(f"\n=== Training XGBoost (n_trees={n_estimators}) ===")
        
        model = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False
        )
        model.fit(X_train, y_train)
        
        self.models['xgb'] = model
        self.feature_importance['xgb'] = model.feature_importances_
        print(f"✓ XGBoost trained với {len(X_train)} samples")
        
        return model
    
    def train_all_models(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray
    ) -> Dict:
        """
        Train tất cả models: SVM, RF, XGBoost
        
        Args:
            X_train: Training features
            y_train: Training labels
            
        Returns:
            Dict of trained models
        """
        print("\n" + "="*50)
        print("TRAINING ALL MODELS")
        print("="*50)
        
        self.train_svm(X_train, y_train)
        self.train_random_forest(X_train, y_train)
        self.train_xgboost(X_train, y_train)
        
        print("\n✓ Đã train xong tất cả models!")
        return self.models
    
    def predict_proba(
        self,
        model_name: str,
        X: np.ndarray
    ) -> np.ndarray:
        """
        Predict probabilities
        
        Args:
            model_name: 'svm', 'rf', hoặc 'xgb'
            X: Features
            
        Returns:
            Probabilities (n_samples, 2)
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} chưa được train")
        
        model = self.models[model_name]
        proba = model.predict_proba(X)
        
        return proba
    
    def predict_label(
        self,
        model_name: str,
        X: np.ndarray,
        threshold: float = 0.5
    ) -> np.ndarray:
        """
        Predict labels với custom threshold
        
        Args:
            model_name: 'svm', 'rf', hoặc 'xgb'
            X: Features
            threshold: Probability threshold (default: 0.5)
            
        Returns:
            Predicted labels (0/1)
        """
        proba = self.predict_proba(model_name, X)
        pred = (proba[:, 1] >= threshold).astype(int)
        
        return pred
    
    def evaluate(
        self,
        model_name: str,
        X: np.ndarray,
        y_true: np.ndarray,
        threshold: float = 0.5
    ) -> Dict:
        """
        Đánh giá model performance
        
        Args:
            model_name: 'svm', 'rf', hoặc 'xgb'
            X: Features
            y_true: True labels
            threshold: Prediction threshold
            
        Returns:
            Dict chứa các metrics
        """
        # Predictions
        proba = self.predict_proba(model_name, X)
        y_pred = self.predict_label(model_name, X, threshold)
        
        # Metrics
        acc = accuracy_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred, average='weighted')
        
        try:
            auc = roc_auc_score(y_true, proba[:, 1])
        except:
            auc = None
        
        cm = confusion_matrix(y_true, y_pred)
        
        metrics = {
            'accuracy': float(acc),
            'f1_score': float(f1),
            'auc': float(auc) if auc is not None else None,
            'confusion_matrix': cm.tolist(),
            'classification_report': classification_report(y_true, y_pred, output_dict=True)
        }
        
        self.metrics[model_name] = metrics
        
        # Print report
        print(f"\n=== {model_name.upper()} Performance ===")
        print(f"Accuracy: {acc:.4f}")
        print(f"F1-Score: {f1:.4f}")
        if auc:
            print(f"AUC: {auc:.4f}")
        print(f"\nConfusion Matrix:")
        print(cm)
        
        return metrics
    
    def evaluate_all_models(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray,
        threshold: float = 0.5
    ) -> Dict:
        """
        Đánh giá tất cả models
        
        Args:
            X_test: Test features
            y_test: Test labels
            threshold: Prediction threshold
            
        Returns:
            Dict chứa metrics của tất cả models
        """
        print("\n" + "="*50)
        print("EVALUATING ALL MODELS")
        print("="*50)
        
        all_metrics = {}
        
        for model_name in self.models.keys():
            metrics = self.evaluate(model_name, X_test, y_test, threshold)
            all_metrics[model_name] = metrics
        
        return all_metrics
    
    def get_feature_importance(
        self,
        model_name: str,
        feature_names: Optional[List[str]] = None
    ) -> Dict:
        """
        Lấy feature importance (chỉ cho RF và XGB)
        
        Args:
            model_name: 'rf' hoặc 'xgb'
            feature_names: Tên các features
            
        Returns:
            Dict mapping feature -> importance
        """
        if model_name not in self.feature_importance:
            return {}
        
        importance = self.feature_importance[model_name]
        
        if feature_names is None:
            feature_names = [f"Feature_{i}" for i in range(len(importance))]
        
        importance_dict = {
            name: float(imp) 
            for name, imp in zip(feature_names, importance)
        }
        
        # Sort by importance
        importance_dict = dict(sorted(
            importance_dict.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return importance_dict
    
    def save_models(self, filepath: str):
        """Lưu tất cả models"""
        state = {
            'models': self.models,
            'metrics': self.metrics,
            'feature_importance': self.feature_importance
        }
        with open(filepath, 'wb') as f:
            pickle.dump(state, f)
        print(f"✓ Đã lưu models vào {filepath}")
    
    def load_models(self, filepath: str):
        """Load models đã lưu"""
        with open(filepath, 'rb') as f:
            state = pickle.load(f)
        self.models = state['models']
        self.metrics = state['metrics']
        self.feature_importance = state.get('feature_importance', {})
        print(f"✓ Đã load models từ {filepath}")


# Example usage
if __name__ == '__main__':
    # Dummy data
    from sklearn.datasets import make_classification
    
    X_train, y_train = make_classification(
        n_samples=1000, 
        n_features=5, 
        n_informative=3,
        n_redundant=2,
        random_state=42
    )
    X_test, y_test = make_classification(
        n_samples=200, 
        n_features=5, 
        n_informative=3,
        n_redundant=2,
        random_state=43
    )
    
    # Train và evaluate
    ml = MLModels()
    ml.train_all_models(X_train, y_train)
    ml.evaluate_all_models(X_test, y_test)
    
    # Feature importance
    print("\nRF Feature Importance:")
    print(ml.get_feature_importance('rf', [f'F{i}' for i in range(5)]))
