#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script for ProfitPulse Pipeline
Verify all components work correctly
"""

import sys
import os

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import pandas as pd
import numpy as np
from pathlib import Path

print("="*70)
print(" "*25 + "PIPELINE TEST")
print("="*70)

# Test 1: Import
print("\n[TEST 1] Importing ProfitPulse Pipeline...")
try:
    from backend.profitpulse_pipeline import ProfitPulsePipeline, AppConfig
    print("✅ Import successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Check Data File
print("\n[TEST 2] Checking data file...")
data_path = "Data.xlsx"
if not Path(data_path).exists():
    print(f"❌ Data file not found: {data_path}")
    print("   Please ensure Data.xlsx is in the project root.")
    sys.exit(1)
print(f"✅ Data file found: {data_path}")

# Test 3: Load Raw Data
print("\n[TEST 3] Loading raw data...")
try:
    cfg = AppConfig(
        input_path=data_path,
        output_dir="artifacts_profitpulse_test",
        train_target_end_year=2020,
        test_target_years=(2021, 2022, 2023, 2024),
        preprocess_fit_pred_year=2019,
    )
    pipe = ProfitPulsePipeline(cfg)
    df_raw = pipe.load_raw()
    
    print(f"✅ Loaded {len(df_raw)} rows")
    print(f"   Columns: {df_raw.columns.tolist()[:10]}...")
    print(f"   Years: {df_raw['YEAR'].min()} - {df_raw['YEAR'].max()}")
    print(f"   Firms: {df_raw['FIRM_ID'].nunique()}")
except Exception as e:
    print(f"❌ Load failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Build Proxies
print("\n[TEST 4] Building proxies (ROA, ROE, ROC, EPS, NPM)...")
try:
    df_proxy = pipe.build_proxies(df_raw)
    
    print(f"✅ Built proxies for {len(df_proxy)} rows")
    
    # Check if proxies exist
    proxy_cols = ["X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]
    existing = [c for c in proxy_cols if c in df_proxy.columns]
    print(f"   Proxy columns: {existing}")
    
    # Show sample stats
    print("\n   Sample stats:")
    for col in existing[:3]:  # Show first 3
        valid = df_proxy[col].dropna()
        if len(valid) > 0:
            print(f"   {col}: mean={valid.mean():.4f}, std={valid.std():.4f}")
            
except Exception as e:
    print(f"❌ Proxy building failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Fit Measurement (Winsor + Scaler + PCA)
print("\n[TEST 5] Fitting measurement (Winsor + Scaler + PCA on year ≤ 2019)...")
try:
    snap = pipe.fit_measurement(df_proxy)
    
    print(f"✅ Fitted preprocessing & PCA")
    print(f"   Fit window: predictor year ≤ {snap['fit_window_predictor_year_end']}")
    print(f"   PCA components: {snap['pca_k']}")
    print(f"   Explained variance ratio: {[round(x, 4) for x in snap['pca_evr']]}")
    print(f"   Omega (weights): {[round(x, 4) for x in snap['pca_omega']]}")
    
except Exception as e:
    print(f"❌ Fit measurement failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 6: Score Profitability (All Years)
print("\n[TEST 6] Scoring profitability (ProfitScore + Label for all years)...")
try:
    df_scored = pipe.score_profitability(df_proxy, label_rule="zero")
    
    print(f"✅ Scored {len(df_scored)} firm-years")
    print(f"   ProfitScore (P_t): mean={df_scored['P_t'].mean():.4f}, std={df_scored['P_t'].std():.4f}")
    print(f"   Label_t distribution: {df_scored['Label_t'].value_counts().to_dict()}")
    
except Exception as e:
    print(f"❌ Scoring failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 7: Build Forecast Panel (X(t) -> Label(t+1))
print("\n[TEST 7] Building forecast panel (X(t) -> Label(t+1))...")
try:
    df_ml = pipe.build_forecast_panel(df_scored)
    
    print(f"✅ Built forecast panel: {len(df_ml)} rows")
    print(f"   Target years: {sorted(df_ml['TargetYear'].unique())}")
    print(f"   Label(t+1) distribution: {df_ml['Label_t1'].value_counts().to_dict()}")
    
except Exception as e:
    print(f"❌ Forecast panel failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 8: Train Models
print("\n[TEST 8] Training ML models (SVM, RF, XGBoost)...")
try:
    metrics = pipe.train_models(df_ml)
    
    print(f"✅ Trained {len(metrics)} models")
    
    for model_name, met in metrics.items():
        print(f"\n   {model_name}:")
        print(f"     Accuracy: {met['accuracy']:.4f}")
        print(f"     Precision: {met['precision']:.4f}")
        print(f"     Recall: {met['recall']:.4f}")
        print(f"     F1: {met['f1']:.4f}")
        if not np.isnan(met['auc']):
            print(f"     AUC: {met['auc']:.4f}")
            
except Exception as e:
    print(f"❌ Model training failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 9: Predict for App
print("\n[TEST 9] Generating predictions for all firm-years...")
try:
    df_pred = pipe.predict_for_app(df_ml)
    
    print(f"✅ Generated {len(df_pred)} predictions")
    print(f"   Models: {df_pred['model'].unique().tolist()}")
    print(f"   Years: {sorted(df_pred['YEAR'].unique())}")
    
    # Show sample prediction
    sample = df_pred[df_pred['model'] == cfg.default_model_name].head(1)
    if len(sample) > 0:
        row = sample.iloc[0]
        print(f"\n   Sample prediction ({row['model']}):")
        print(f"     FIRM_ID: {row['FIRM_ID']}, Year: {int(row['YEAR'])} → Target: {int(row['TargetYear'])}")
        print(f"     Chance: {row['chance']:.2%}")
        print(f"     Predicted Label: {int(row['pred_label'])}")
        
except Exception as e:
    print(f"❌ Prediction failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 10: Build App Views
print("\n[TEST 10] Building app views (Screener, Company, Alerts)...")
try:
    # Screener
    screener = pipe.build_screener_view(predictor_year=2023)
    print(f"✅ Screener view (2023): {len(screener)} rows")
    print(f"   Columns: {screener.columns.tolist()}")
    
    # Risk distribution
    risk_dist = screener['risk'].value_counts().to_dict()
    print(f"   Risk distribution: {risk_dist}")
    
    # Company view
    company = pipe.build_company_view()
    print(f"✅ Company view: {len(company)} firm-years")
    
    # Alerts
    alerts = pipe.build_alerts_view(year_from=2020, year_to=2023)
    print(f"✅ Alerts view: {len(alerts)} alerts")
    if len(alerts) > 0:
        alert_types = alerts['alert_type'].value_counts().to_dict()
        print(f"   Alert types: {alert_types}")
    
except Exception as e:
    print(f"❌ App views failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 11: Export Artifacts
print("\n[TEST 11] Exporting artifacts to disk...")
try:
    paths = pipe.export_artifacts(predictor_year_for_screener=2023)
    
    print(f"✅ Exported {len(paths)} artifacts:")
    for name, path in paths.items():
        file_size = Path(path).stat().st_size / 1024  # KB
        print(f"   {name}: {path} ({file_size:.1f} KB)")
        
except Exception as e:
    print(f"❌ Export failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Final Summary
print("\n" + "="*70)
print(" "*25 + "✅ ALL TESTS PASSED")
print("="*70)

print("\n📁 Artifacts saved to: artifacts_profitpulse_test/")
print("\n🎯 Next steps:")
print("  1. Review artifacts in artifacts_profitpulse_test/")
print("  2. Run production pipeline: python backend/profitpulse_pipeline.py")
print("  3. Integrate with API server (see MIGRATION_GUIDE.md)")

print("\n" + "="*70)
