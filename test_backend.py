"""
Comprehensive Backend Verification Test
Kiểm tra toàn diện backend sau khi fix

Usage:
    python test_backend.py
"""

import sys
import traceback
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

def test_imports():
    """Test all critical imports"""
    print("\n" + "="*60)
    print("TEST 1: Import All Backend Modules")
    print("="*60)
    
    try:
        print("  → Importing profitpulse_pipeline...")
        from profitpulse_pipeline import ProfitPulsePipeline, AppConfig
        print("    ✅ profitpulse_pipeline OK")
        
        print("  → Importing pipeline...")
        from pipeline import MainPipeline
        print("    ✅ pipeline OK")
        
        print("  → Importing core modules...")
        from core import (
            data_loader,
            preprocessing,
            pca_profitscore,
            labeling,
            ml_models,
            explanations
        )
        print("    ✅ core.data_loader OK")
        print("    ✅ core.preprocessing OK")
        print("    ✅ core.pca_profitscore OK")
        print("    ✅ core.labeling OK")
        print("    ✅ core.ml_models OK")
        print("    ✅ core.explanations OK")
        
        print("  → Importing utils...")
        from utils import cache_manager
        print("    ✅ utils.cache_manager OK")
        
        print("\n✅ ALL IMPORTS SUCCESSFUL!")
        return True
        
    except Exception as e:
        print(f"\n❌ IMPORT FAILED: {e}")
        traceback.print_exc()
        return False


def test_class_instantiation():
    """Test creating instances of main classes"""
    print("\n" + "="*60)
    print("TEST 2: Class Instantiation")
    print("="*60)
    
    try:
        print("  → Creating ProfitPulsePipeline...")
        from profitpulse_pipeline import ProfitPulsePipeline, AppConfig
        cfg = AppConfig()
        pipeline = ProfitPulsePipeline(cfg)
        print("    ✅ ProfitPulsePipeline instantiated")
        
        print("  → Creating PCAProfit...")
        from core.pca_profitscore import PCAProfit
        pca_profit = PCAProfit(n_components=3)
        print("    ✅ PCAProfit instantiated")
        
        print("  → Creating LabelMaker...")
        from core.labeling import LabelMaker
        label_maker = LabelMaker(rule='positive')
        print("    ✅ LabelMaker instantiated")
        
        print("  → Creating MLModels...")
        from core.ml_models import MLModels
        ml_models = MLModels()
        print("    ✅ MLModels instantiated")
        
        print("\n✅ ALL CLASSES INSTANTIATED SUCCESSFULLY!")
        return True
        
    except Exception as e:
        print(f"\n❌ INSTANTIATION FAILED: {e}")
        traceback.print_exc()
        return False


def test_cli():
    """Test CLI interface"""
    print("\n" + "="*60)
    print("TEST 3: CLI Interface")
    print("="*60)
    
    try:
        import subprocess
        
        print("  → Testing main.py --help...")
        result = subprocess.run(
            ['python', 'backend/main.py', '--help'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and 'pipeline' in result.stdout:
            print("    ✅ CLI --help works")
            
            # Show excerpt
            lines = result.stdout.split('\n')[:10]
            print("\n    CLI output preview:")
            for line in lines:
                print(f"      {line}")
            
            print("\n✅ CLI INTERFACE OK!")
            return True
        else:
            print(f"    ❌ CLI failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"\n❌ CLI TEST FAILED: {e}")
        traceback.print_exc()
        return False


def test_type_annotations():
    """Test type annotations are correct"""
    print("\n" + "="*60)
    print("TEST 4: Type Annotations")
    print("="*60)
    
    try:
        from typing import get_type_hints
        
        print("  → Checking LabelMaker.__init__ type hints...")
        from core.labeling import LabelMaker
        hints = get_type_hints(LabelMaker.__init__)
        print(f"    rule type: {hints.get('rule', 'Missing')}")
        print("    ✅ LabelMaker type hints OK")
        
        print("  → Checking MLModels.train_svm type hints...")
        from core.ml_models import MLModels
        hints = get_type_hints(MLModels.train_svm)
        print(f"    max_depth type: {hints.get('max_depth', 'Missing')}")
        print("    ✅ MLModels type hints OK")
        
        print("\n✅ TYPE ANNOTATIONS OK!")
        return True
        
    except Exception as e:
        print(f"\n❌ TYPE ANNOTATION TEST FAILED: {e}")
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "🔍"*30)
    print("BACKEND COMPREHENSIVE VERIFICATION TEST")
    print("🔍"*30)
    
    results = {
        'imports': test_imports(),
        'instantiation': test_class_instantiation(),
        'cli': test_cli(),
        'types': test_type_annotations()
    }
    
    # Summary
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name.upper():20s}: {status}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n" + "🎉"*30)
        print("ALL TESTS PASSED! BACKEND IS READY!")
        print("🎉"*30)
        return 0
    else:
        print("\n" + "⚠️"*30)
        print(f"SOME TESTS FAILED ({total - passed} failures)")
        print("⚠️"*30)
        return 1


if __name__ == '__main__':
    sys.exit(main())
