#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Backend Main Entrypoint
=======================

Unified interface for running the ML pipeline and API server.

Usage:
    # Run pipeline (build cache)
    python backend/main.py pipeline --data Data.xlsx

    # Start API server
    python backend/main.py serve --port 5000

    # Run both (pipeline then serve)
    python backend/main.py all --data Data.xlsx --port 5000
"""

import sys
import os
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))


def run_pipeline(args):
    """Run ML pipeline to build cache"""
    print("\n" + "="*70)
    print(" "*20 + "RUNNING ML PIPELINE")
    print("="*70)
    
    if args.use_profitpulse:
        # Use ProfitPulse pipeline (leakage-safe, proxy building)
        from profitpulse_pipeline import ProfitPulsePipeline, AppConfig
        
        cfg = AppConfig(
            input_path=args.data,
            output_dir=args.output_dir or "artifacts_profitpulse",
            train_target_end_year=args.train_year,
            test_target_years=tuple(range(args.test_year, 2025)),
            preprocess_fit_pred_year=args.train_year - 1,
        )
        
        pipe = ProfitPulsePipeline(cfg)
        paths = pipe.export_artifacts(predictor_year_for_screener=2023)
        
        print("\n✅ Pipeline complete! Artifacts:")
        for name, path in paths.items():
            print(f"  - {name}: {path}")
            
    else:
        # Use original modular pipeline
        from pipeline import MainPipeline
        
        pipeline = MainPipeline(
            data_path=args.data,
            cache_dir=args.output_dir or "backend/cache"
        )
        
        results = pipeline.run_full_pipeline(
            train_label_max_year=args.train_year,
            test_label_min_year=args.test_year,
            save_cache=True
        )
        
        print("\n✅ Pipeline complete!")
        print(f"  Train size: {results['train_size']}")
        print(f"  Test size: {results['test_size']}")
        print(f"  Best model: {results['best_model']}")


def run_server(args):
    """Start API server"""
    print("\n" + "="*70)
    print(" "*20 + "STARTING API SERVER")
    print("="*70)
    
    from api_server import app
    
    print(f"🌐 Starting server on port {args.port}...")
    print(f"📡 API endpoints available at: http://localhost:{args.port}/api/")
    print(f"🏥 Health check: http://localhost:{args.port}/health")
    print("\nPress Ctrl+C to stop\n")
    
    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug
    )


def run_all(args):
    """Run pipeline then start server"""
    # Run pipeline first
    print("Step 1/2: Running pipeline...")
    run_pipeline(args)
    
    # Then start server
    print("\nStep 2/2: Starting server...")
    run_server(args)


def main():
    """Main entrypoint"""
    parser = argparse.ArgumentParser(
        description="Backend entrypoint for ProfitScore ML system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run pipeline with ProfitPulse (recommended)
  python backend/main.py pipeline --use-profitpulse --data Data.xlsx
  
  # Run original pipeline
  python backend/main.py pipeline --data Data.xlsx
  
  # Start API server
  python backend/main.py serve --port 5000
  
  # Run both (pipeline + server)
  python backend/main.py all --use-profitpulse --data Data.xlsx --port 5000
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Pipeline command
    pipeline_parser = subparsers.add_parser('pipeline', help='Run ML pipeline')
    pipeline_parser.add_argument('--data', type=str, default='Data.xlsx',
                                help='Path to data file (default: Data.xlsx)')
    pipeline_parser.add_argument('--train-year', type=int, default=2020,
                                help='Max label year for training (default: 2020)')
    pipeline_parser.add_argument('--test-year', type=int, default=2021,
                                help='Min label year for testing (default: 2021)')
    pipeline_parser.add_argument('--output-dir', type=str, default=None,
                                help='Output directory for artifacts')
    pipeline_parser.add_argument('--use-profitpulse', action='store_true',
                                help='Use ProfitPulse pipeline (leakage-safe)')
    
    # Server command
    server_parser = subparsers.add_parser('serve', help='Start API server')
    server_parser.add_argument('--host', type=str, default='0.0.0.0',
                              help='Host to bind (default: 0.0.0.0)')
    server_parser.add_argument('--port', type=int, default=5000,
                              help='Port to bind (default: 5000)')
    server_parser.add_argument('--debug', action='store_true',
                              help='Run in debug mode')
    
    # All command (pipeline + server)
    all_parser = subparsers.add_parser('all', help='Run pipeline then start server')
    all_parser.add_argument('--data', type=str, default='Data.xlsx',
                           help='Path to data file (default: Data.xlsx)')
    all_parser.add_argument('--train-year', type=int, default=2020,
                           help='Max label year for training (default: 2020)')
    all_parser.add_argument('--test-year', type=int, default=2021,
                           help='Min label year for testing (default: 2021)')
    all_parser.add_argument('--output-dir', type=str, default=None,
                           help='Output directory for artifacts')
    all_parser.add_argument('--use-profitpulse', action='store_true',
                           help='Use ProfitPulse pipeline (leakage-safe)')
    all_parser.add_argument('--host', type=str, default='0.0.0.0',
                           help='Host to bind (default: 0.0.0.0)')
    all_parser.add_argument('--port', type=int, default=5000,
                           help='Port to bind (default: 5000)')
    all_parser.add_argument('--debug', action='store_true',
                           help='Run in debug mode')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == 'pipeline':
            run_pipeline(args)
        elif args.command == 'serve':
            run_server(args)
        elif args.command == 'all':
            run_all(args)
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
