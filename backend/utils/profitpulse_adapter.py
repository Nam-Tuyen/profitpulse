"""
ProfitPulse Adapter - Convert profitpulse artifacts to cache format
"""

import pandas as pd
import json
import os
from pathlib import Path


class ProfitPulseAdapter:
    """Adapter to read profitpulse artifacts and serve via API"""
    
    def __init__(self, artifacts_dir: str = 'artifacts_profitpulse'):
        self.artifacts_dir = artifacts_dir
        self._company_view = None
        self._predictions = None
        self._screener = None
        self._metrics = None
        
    def load_company_view(self) -> pd.DataFrame:
        """Load company view (main data)"""
        if self._company_view is None:
            path = os.path.join(self.artifacts_dir, 'company_view.parquet')
            if os.path.exists(path):
                self._company_view = pd.read_parquet(path)
            else:
                # Return empty dataframe with expected structure
                self._company_view = pd.DataFrame()
        return self._company_view
    
    def load_predictions(self) -> pd.DataFrame:
        """Load all predictions"""
        if self._predictions is None:
            path = os.path.join(self.artifacts_dir, 'predictions_all.parquet')
            if os.path.exists(path):
                self._predictions = pd.read_parquet(path)
            else:
                self._predictions = pd.DataFrame()
        return self._predictions
    
    def load_screener(self) -> pd.DataFrame:
        """Load screener data"""
        if self._screener is None:
            path = os.path.join(self.artifacts_dir, 'screener_2023.parquet')
            if os.path.exists(path):
                self._screener = pd.read_parquet(path)
            else:
                self._screener = pd.DataFrame()
        return self._screener
    
    def load_metrics(self) -> dict:
        """Load model metrics"""
        if self._metrics is None:
            path = os.path.join(self.artifacts_dir, 'model_metrics.json')
            if os.path.exists(path):
                with open(path, 'r') as f:
                    self._metrics = json.load(f)
            else:
                self._metrics = {}
        return self._metrics
    
    def get_metadata(self) -> dict:
        """Get metadata for API"""
        try:
            df = self.load_company_view()
            if df.empty:
                df = self.load_predictions()
            
            if df.empty:
                return {
                    'firms': [],
                    'firms_count': 0,
                    'years': [],
                    'year_range': {'min': 2020, 'max': 2023},
                    'model_metrics': {},
                    'feature_cols': ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']
                }
            
            metrics = self.load_metrics()
            
            # Get firms - check for FIRM_ID or Ticker column
            firms = []
            if 'FIRM_ID' in df.columns:
                firms = sorted(df['FIRM_ID'].unique().tolist())
            elif 'Ticker' in df.columns:
                firms = sorted(df['Ticker'].unique().tolist())
            
            # Get years - check for YEAR or year columns
            years = set()
            if 'YEAR' in df.columns:
                years.update(df['YEAR'].dropna().unique())
            elif 'year' in df.columns:
                years.update(df['year'].dropna().unique())
            if 'TargetYear' in df.columns:
                years.update(df['TargetYear'].dropna().unique())
            
            years = sorted([int(y) for y in years if pd.notna(y)])
            
            return {
                'firms': firms,
                'firms_count': len(firms),
                'years': years,
                'year_range': {
                    'min': min(years) if years else 2020,
                    'max': max(years) if years else 2023
                },
                'model_metrics': metrics.get('metrics', {}),
                'feature_cols': metrics.get('config', {}).get('x_cols', 
                    ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM'])
            }
        except Exception as e:
            print(f"Error loading metadata: {e}")
            import traceback
            traceback.print_exc()
            # Return minimal valid response
            return {
                'firms': [],
                'firms_count': 0,
                'years': [2020, 2021, 2022, 2023],
                'year_range': {'min': 2020, 'max': 2023},
                'model_metrics': {},
                'feature_cols': ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']
            }
    
    def get_all_firms(self) -> list:
        """Get list of all firms"""
        df = self.load_company_view()
        if df.empty:
            df = self.load_predictions()
        
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        if firm_col in df.columns:
            return sorted(df[firm_col].unique().tolist())
        return []
    
    def get_screener_data(self, year=None, **kwargs) -> pd.DataFrame:
        """Get screener data with optional filters"""
        df = self.load_screener()
        if df.empty:
            df = self.load_company_view()
        
        # Apply year filter if provided
        if year and not df.empty:
            year_col = None
            for col in ['YEAR', 'year', 'TargetYear']:
                if col in df.columns:
                    year_col = col
                    break
            if year_col:
                df = df[df[year_col] == year]
        
        return df
    
    def get_company_data(self, ticker: str, year=None) -> dict:
        """Get data for specific company with full details"""
        df = self.load_company_view()
        if df.empty:
            return {}
        
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        company_data = df[df[firm_col] == ticker].copy()
        
        if company_data.empty:
            return {}
        
        # Get time series for charts
        year_col = 'YEAR' if 'YEAR' in company_data.columns else 'year'
        timeseries = []
        
        for _, row in company_data.sort_values(year_col).iterrows():
            timeseries.append({
                'year': int(row[year_col]),
                'profitscore': round(float(row.get('P_t', 0)), 4) if 'P_t' in row else None,
                'label': int(row.get('Label_t', 0)) if 'Label_t' in row else None,
                'X1_ROA': round(float(row.get('X1_ROA', 0)), 4) if 'X1_ROA' in row and pd.notna(row.get('X1_ROA')) else None,
                'X2_ROE': round(float(row.get('X2_ROE', 0)), 4) if 'X2_ROE' in row and pd.notna(row.get('X2_ROE')) else None,
                'X3_ROC': round(float(row.get('X3_ROC', 0)), 4) if 'X3_ROC' in row and pd.notna(row.get('X3_ROC')) else None,
                'X4_EPS': round(float(row.get('X4_EPS', 0)), 2) if 'X4_EPS' in row and pd.notna(row.get('X4_EPS')) else None,
                'X5_NPM': round(float(row.get('X5_NPM', 0)), 4) if 'X5_NPM' in row and pd.notna(row.get('X5_NPM')) else None,
            })
        
        # Get latest record (or specific year)
        if year:
            latest = company_data[company_data[year_col] == year]
            if latest.empty:
                return {'firm_id': ticker, 'timeseries': timeseries, 'data_coverage': self._get_data_coverage(company_data)}
        else:
            latest = company_data.sort_values(year_col, ascending=False).iloc[0:1]
        
        if latest.empty:
            return {'firm_id': ticker, 'timeseries': timeseries, 'data_coverage': self._get_data_coverage(company_data)}
        
        latest_row = latest.iloc[0]
        
        # Generate reason and action
        reason, action = self._generate_reason_action(latest_row)
        
        return {
            'firm_id': ticker,
            'year': int(latest_row[year_col]),
            'profitscore': round(float(latest_row.get('P_t', 0)), 4) if 'P_t' in latest_row and pd.notna(latest_row.get('P_t')) else None,
            'label': int(latest_row.get('Label_t', 0)) if 'Label_t' in latest_row and pd.notna(latest_row.get('Label_t')) else None,
            'chance': round(float(latest_row.get('P_t', 0.5)), 4) if 'P_t' in latest_row and pd.notna(latest_row.get('P_t')) else 0.5,
            'risk_level': 'High' if latest_row.get('Label_t', 0) == 1 else 'Low',
            'is_borderline': bool(abs(latest_row.get('P_t', 0)) < 0.2) if 'P_t' in latest_row and pd.notna(latest_row.get('P_t')) else False,
            'reason': reason,
            'action': action,
            'timeseries': timeseries,
            'data_coverage': self._get_data_coverage(company_data),
            'financial_metrics': {
                'X1_ROA': round(float(latest_row.get('X1_ROA', 0)), 4) if 'X1_ROA' in latest_row and pd.notna(latest_row.get('X1_ROA')) else None,
                'X2_ROE': round(float(latest_row.get('X2_ROE', 0)), 4) if 'X2_ROE' in latest_row and pd.notna(latest_row.get('X2_ROE')) else None,
                'X3_ROC': round(float(latest_row.get('X3_ROC', 0)), 4) if 'X3_ROC' in latest_row and pd.notna(latest_row.get('X3_ROC')) else None,
                'X4_EPS': round(float(latest_row.get('X4_EPS', 0)), 2) if 'X4_EPS' in latest_row and pd.notna(latest_row.get('X4_EPS')) else None,
                'X5_NPM': round(float(latest_row.get('X5_NPM', 0)), 4) if 'X5_NPM' in latest_row and pd.notna(latest_row.get('X5_NPM')) else None,
            }
        }
    
    def _get_data_coverage(self, company_df) -> dict:
        """Calculate data coverage for a company"""
        year_col = 'YEAR' if 'YEAR' in company_df.columns else 'year'
        total_years = len(company_df)
        
        # Check missing values in metrics
        metrics = ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']
        missing_fields = []
        
        for metric in metrics:
            if metric not in company_df.columns or company_df[metric].isna().any():
                missing_fields.append(metric)
        
        available_years = len(company_df[company_df[metrics].notna().all(axis=1)]) if all(m in company_df.columns for m in metrics) else total_years
        
        return {
            'total_years': int(total_years),
            'available_years': int(available_years),
            'missing_fields': missing_fields,
            'coverage_ratio': round(available_years / total_years if total_years > 0 else 0, 2)
        }
    
    def _generate_reason_action(self, row) -> tuple:
        """Generate reason code and action tip based on metrics"""
        reasons = []
        actions = []
        
        # Check profitscore
        profitscore = row.get('P_t', 0)
        if profitscore < -0.5:
            reasons.append("ProfitScore thấp đáng kể (< -0.5)")
            actions.append("Kiểm tra BCTC: doanh thu, chi phí, tài sản")
        elif profitscore < 0:
            reasons.append("ProfitScore âm, dưới ngưỡng trung bình thị trường")
            actions.append("Xem xét xu hướng 2-3 năm gần đây")
        elif abs(profitscore) < 0.2:
            reasons.append("ProfitScore gần ngưỡng phân loại (borderline)")
            actions.append("Theo dõi sát quý tới, chú ý biến động")
        
        # Check specific metrics
        if pd.notna(row.get('X1_ROA')) and row.get('X1_ROA', 0) < 0.02:
            reasons.append("ROA thấp (< 2%)")
            actions.append("Đánh giá hiệu quả sử dụng tài sản")
        
        if pd.notna(row.get('X2_ROE')) and row.get('X2_ROE', 0) < 0.05:
            reasons.append("ROE thấp (< 5%)")
            actions.append("Xem xét cấu trúc vốn và lợi nhuận ròng")
        
        if pd.notna(row.get('X5_NPM')) and row.get('X5_NPM', 0) < 0.03:
            reasons.append("Biên lợi nhuận ròng mỏng (< 3%)")
            actions.append("Phân tích cấu trúc chi phí và giá vốn")
        
        # Default if no specific issues
        if not reasons:
            reasons.append("Các chỉ tiêu trong ngưỡng bình thường")
            actions.append("Theo dõi định kỳ, duy trì watchlist")
        
        return '; '.join(reasons), '; '.join(actions)
    
    def get_summary_stats(self, year=None) -> dict:
        """Get summary statistics for a specific year or all years"""
        df = self.load_company_view()
        if df.empty:
            df = self.load_predictions()
        
        if df.empty:
            return {
                'total_firms': 0,
                'high_risk_count': 0,
                'medium_risk_count': 0,
                'low_risk_count': 0,
                'avg_score': 0,
                'year': year
            }
        
        # Filter by year if provided
        if year:
            year_col = None
            for col in ['YEAR', 'year', 'TargetYear']:
                if col in df.columns:
                    year_col = col
                    break
            if year_col:
                df = df[df[year_col] == year]
        
        if df.empty:
            return {
                'total_firms': 0,
                'high_risk_count': 0,
                'medium_risk_count': 0,
                'low_risk_count': 0,
                'avg_score': 0,
                'year': year
            }
        
        # Calculate statistics
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        total_firms = df[firm_col].nunique() if firm_col in df.columns else len(df)
        
        # Get prediction scores
        score_col = 'P_t' if 'P_t' in df.columns else None
        label_col = 'Label_t' if 'Label_t' in df.columns else None
        
        avg_score = float(df[score_col].mean()) if score_col and score_col in df.columns else 0
        
        # Risk classification based on label if available
        high_risk = 0
        low_risk = 0
        
        if label_col and label_col in df.columns:
            high_risk = int((df[label_col] == 1).sum())
            low_risk = int((df[label_col] == 0).sum())
        elif score_col and score_col in df.columns:
            # Classify by score threshold
            high_risk = int((df[score_col] >= 0.5).sum())
            low_risk = int((df[score_col] < 0.5).sum())
        
        return {
            'total_firms': int(total_firms),
            'high_risk_count': high_risk,
            'medium_risk_count': 0,  # Not used in profitpulse
            'low_risk_count': low_risk,
            'avg_score': round(avg_score, 4),
            'year': year
        }
    
    def compare_firms(self, tickers: list, year: int) -> pd.DataFrame:
        """Compare multiple firms for a specific year"""
        df = self.load_company_view()
        if df.empty:
            df = self.load_predictions()
        
        if df.empty:
            return pd.DataFrame()
        
        # Filter by tickers
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        df_filtered = df[df[firm_col].isin(tickers)]
        
        # Filter by year if provided
        if year:
            year_col = None
            for col in ['YEAR', 'year', 'TargetYear']:
                if col in df_filtered.columns:
                    year_col = col
                    break
            if year_col:
                df_filtered = df_filtered[df_filtered[year_col] == year]
        
        return df_filtered
    
    def get_top_risk_increased(self, top_n: int = 10) -> list:
        """Get top N companies with highest risk scores"""
        df = self.load_company_view()
        if df.empty:
            df = self.load_predictions()
        
        if df.empty:
            return []
        
        # Get latest year data
        year_col = None
        for col in ['YEAR', 'year', 'TargetYear']:
            if col in df.columns:
                year_col = col
                break
        
        if year_col:
            latest_year = df[year_col].max()
            df = df[df[year_col] == latest_year]
        
        # Sort by score descending
        score_col = 'P_t' if 'P_t' in df.columns else None
        if score_col:
            df = df.sort_values(score_col, ascending=False).head(top_n)
        else:
            df = df.head(top_n)
        
        # Format results
        results = []
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        for _, row in df.iterrows():
            result = {
                'FIRM_ID': row.get(firm_col, ''),
                'year': row.get(year_col, None) if year_col else None,
                'risk_score': round(float(row.get('P_t', 0)), 4),
                'label': int(row.get('Label_t', 0))
            }
            results.append(result)
        
        return results
    
    def get_chart_data(self, year=None) -> dict:
        """Get chart-ready data for frontend visualizations"""
        df = self.load_company_view()
        if df.empty:
            df = self.load_predictions()
        
        if df.empty:
            return {
                'risk_distribution': {},
                'score_distribution': [],
                'top_performers': [],
                'yearly_trends': [],
                'metrics_distribution': {}
            }
        
        # Filter by year if provided
        year_col = None
        for col in ['YEAR', 'year', 'TargetYear']:
            if col in df.columns:
                year_col = col
                break
        
        if year and year_col:
            df_year = df[df[year_col] == year].copy()
        else:
            df_year = df.copy()
        
        # 1. Risk Distribution (based on labels)
        risk_dist = {}
        if 'Label_t' in df_year.columns:
            risk_dist = {
                'High Risk': int((df_year['Label_t'] == 1).sum()),
                'Low Risk': int((df_year['Label_t'] == 0).sum())
            }
        
        # 2. Score Distribution (histogram bins)
        score_dist = []
        if 'P_t' in df_year.columns:
            bins = [-float('inf'), 0, 0.2, 0.4, 0.6, 0.8, 1.0, float('inf')]
            labels = ['<0', '0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0', '>1.0']
            df_year['score_bin'] = pd.cut(df_year['P_t'], bins=bins, labels=labels)
            score_counts = df_year['score_bin'].value_counts().sort_index()
            score_dist = [
                {'range': str(label), 'count': int(count)}
                for label, count in score_counts.items()
            ]
        
        # 3. Top Performers (highest scores)
        top_performers = []
        if 'P_t' in df_year.columns:
            firm_col = 'FIRM_ID' if 'FIRM_ID' in df_year.columns else 'Ticker'
            top_df = df_year.nlargest(10, 'P_t')[[firm_col, 'P_t']].copy()
            top_performers = [
                {'firm': row[firm_col], 'score': round(float(row['P_t']), 4)}
                for _, row in top_df.iterrows()
            ]
        
        # 4. Yearly Trends (if multiple years)
        yearly_trends = []
        if year_col and not year:
            trend_df = df.groupby(year_col).agg({
                'P_t': 'mean' if 'P_t' in df.columns else 'count',
                'Label_t': 'sum' if 'Label_t' in df.columns else 'count'
            }).reset_index()
            
            yearly_trends = [
                {
                    'year': int(row[year_col]),
                    'avg_score': round(float(row['P_t']), 4) if 'P_t' in df.columns else 0,
                    'high_risk_count': int(row['Label_t']) if 'Label_t' in df.columns else 0
                }
                for _, row in trend_df.iterrows()
            ]
            yearly_trends = sorted(yearly_trends, key=lambda x: x['year'])
        
        # 5. Financial Metrics Distribution
        metrics_dist = {}
        for metric in ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']:
            if metric in df_year.columns:
                metrics_dist[metric] = {
                    'mean': round(float(df_year[metric].mean()), 4),
                    'median': round(float(df_year[metric].median()), 4),
                    'std': round(float(df_year[metric].std()), 4),
                    'min': round(float(df_year[metric].min()), 4),
                    'max': round(float(df_year[metric].max()), 4)
                }
        
        return {
            'risk_distribution': risk_dist,
            'score_distribution': score_dist,
            'top_performers': top_performers,
            'yearly_trends': yearly_trends,
            'metrics_distribution': metrics_dist
        }
    
    def get_overview_stats(self, year=None, filters=None) -> dict:
        """
        Get comprehensive overview statistics for Dashboard
        Returns: KPIs, histograms, sector risk, top attention list
        """
        df = self.load_company_view()
        if df.empty:
            return {'year': year, 'kpi': {}, 'chance_hist': [], 'sector_risk': [], 'top_attention': []}
        
        # Filter by year
        year_col = 'YEAR' if 'YEAR' in df.columns else 'year'
        if year and year_col in df.columns:
            df_year = df[df[year_col] == year].copy()
        else:
            # Get latest year
            df_year = df[df[year_col] == df[year_col].max()].copy()
            year = int(df_year[year_col].max())
        
        if df_year.empty:
            return {'year': year, 'kpi': {}, 'chance_hist': [], 'sector_risk': [], 'top_attention': []}
        
        # Apply additional filters
        if filters:
            if 'sector' in filters and 'Sector' in df_year.columns:
                df_year = df_year[df_year['Sector'] == filters['sector']]
            if 'exchange' in filters and 'Exchange' in df_year.columns:
                df_year = df_year[df_year['Exchange'] == filters['exchange']]
        
        # 1. KPIs
        total_firms = len(df_year)
        
        # Chance distribution (assuming Chance column or compute from Label_t)
        pct_good = 0
        if 'Label_t' in df_year.columns:
            # Label_t=0 is good, Label_t=1 is risk
            pct_good = (df_year['Label_t'] == 0).sum() / total_firms if total_firms > 0 else 0
        
        pct_high_risk = 0
        if 'Label_t' in df_year.columns:
            pct_high_risk = (df_year['Label_t'] == 1).sum() / total_firms if total_firms > 0 else 0
        
        # Borderline count (|P_t| < 0.10)
        borderline_count = 0
        if 'P_t' in df_year.columns:
            borderline_count = int((df_year['P_t'].abs() < 0.10).sum())
        
        # Top risk sector
        top_risk_sector = {'sector': 'N/A', 'pct_high': 0}
        if 'Sector' in df_year.columns and 'Label_t' in df_year.columns:
            sector_risk = df_year.groupby('Sector')['Label_t'].agg(['sum', 'count']).reset_index()
            sector_risk['pct_high'] = sector_risk['sum'] / sector_risk['count']
            if not sector_risk.empty:
                top_row = sector_risk.nlargest(1, 'pct_high').iloc[0]
                top_risk_sector = {
                    'sector': top_row['Sector'],
                    'pct_high': round(float(top_row['pct_high']), 2)
                }
        
        kpi = {
            'total_firms': total_firms,
            'pct_good': round(pct_good, 2),
            'pct_high_risk': round(pct_high_risk, 2),
            'borderline_count': borderline_count,
            'top_risk_sector': top_risk_sector
        }
        
        # 2. Chance histogram (using P_t or Label_t_prob if available)
        chance_hist = []
        if 'P_t' in df_year.columns:
            # Bin P_t scores
            bins = [-float('inf'), -0.5, -0.2, 0, 0.2, 0.5, float('inf')]
            labels = ['<-0.5', '-0.5--0.2', '-0.2-0', '0-0.2', '0.2-0.5', '>0.5']
            df_year['bin'] = pd.cut(df_year['P_t'], bins=bins, labels=labels)
            hist_counts = df_year['bin'].value_counts().sort_index()
            chance_hist = [
                {'bin': str(label), 'count': int(count)}
                for label, count in hist_counts.items()
            ]
        
        # 3. Sector risk breakdown
        sector_risk_list = []
        if 'Sector' in df_year.columns and 'Label_t' in df_year.columns:
            sector_agg = df_year.groupby('Sector')['Label_t'].agg(['sum', 'count']).reset_index()
            sector_agg['pct_high'] = sector_agg['sum'] / sector_agg['count']
            sector_risk_list = [
                {
                    'sector': row['Sector'],
                    'pct_high': round(float(row['pct_high']), 2),
                    'count': int(row['count'])
                }
                for _, row in sector_agg.iterrows()
            ]
            sector_risk_list = sorted(sector_risk_list, key=lambda x: x['pct_high'], reverse=True)
        
        # 4. Top attention list (High risk + low score)
        top_attention = []
        if 'Label_t' in df_year.columns and 'P_t' in df_year.columns:
            firm_col = 'FIRM_ID' if 'FIRM_ID' in df_year.columns else 'Ticker'
            high_risk = df_year[df_year['Label_t'] == 1].copy()
            high_risk = high_risk.nsmallest(10, 'P_t')[[firm_col, 'P_t', 'Label_t']].copy()
            
            for _, row in high_risk.iterrows():
                reason = self._generate_short_reason(row)
                top_attention.append({
                    'firm_id': row[firm_col],
                    'risk': 'High',
                    'p_t': round(float(row['P_t']), 4),
                    'reason': reason
                })
        
        return {
            'year': year,
            'kpi': kpi,
            'chance_hist': chance_hist,
            'sector_risk': sector_risk_list[:10],  # Top 10
            'top_attention': top_attention
        }
    
    def _generate_short_reason(self, row) -> str:
        """Generate a short one-line reason"""
        reasons = []
        
        if pd.notna(row.get('P_t')) and row.get('P_t', 0) < -0.5:
            reasons.append("ProfitScore thấp đáng kể")
        elif pd.notna(row.get('P_t')) and row.get('P_t', 0) < 0:
            reasons.append("ProfitScore âm")
        
        if pd.notna(row.get('X1_ROA')) and row.get('X1_ROA', 0) < 0.02:
            reasons.append("ROA yếu")
        if pd.notna(row.get('X5_NPM')) and row.get('X5_NPM', 0) < 0.03:
            reasons.append("biên lợi nhuận thấp")
        
        return "; ".join(reasons) if reasons else "Cần theo dõi thêm"
    
    def get_alerts(self, scope='market', watchlist=None, year_from=None, year_to=None, rules=None) -> list:
        """
        Generate alerts based on rules
        
        Args:
            scope: 'market' or 'watchlist'
            watchlist: list of firm_ids (if scope='watchlist')
            year_from: Start year
            year_to: End year
            rules: list of rule types (risk_change, chance_drop, borderline, roa_decline, npm_decline)
        
        Returns:
            List of alerts
        """
        df = self.load_company_view()
        if df.empty:
            return []
        
        year_col = 'YEAR' if 'YEAR' in df.columns else 'year'
        firm_col = 'FIRM_ID' if 'FIRM_ID' in df.columns else 'Ticker'
        
        # Filter by scope
        if scope == 'watchlist' and watchlist:
            df = df[df[firm_col].isin(watchlist)]
        
        # Filter by year range
        if year_from:
            df = df[df[year_col] >= year_from]
        if year_to:
            df = df[df[year_col] <= year_to]
        
        if df.empty:
            return []
        
        alerts = []
        rules = rules or ['risk_change', 'chance_drop', 'borderline']
        
        # Sort by firm and year
        df = df.sort_values([firm_col, year_col])
        
        # Check each rule
        for firm_id in df[firm_col].unique():
            firm_data = df[df[firm_col] == firm_id].sort_values(year_col)
            
            if len(firm_data) < 2:
                continue
            
            for i in range(1, len(firm_data)):
                prev_row = firm_data.iloc[i-1]
                curr_row = firm_data.iloc[i]
                curr_year = int(curr_row[year_col])
                
                # Rule 1: Risk change (Label_t changed from 0 to 1)
                if 'risk_change' in rules and 'Label_t' in firm_data.columns:
                    if prev_row['Label_t'] == 0 and curr_row['Label_t'] == 1:
                        alerts.append({
                            'year': curr_year,
                            'firm_id': firm_id,
                            'alert_type': 'risk_change',
                            'message': f"Risk tăng từ Low sang High trong năm {curr_year}",
                            'severity': 'high'
                        })
                
                # Rule 2: Chance drop (P_t decreased significantly)
                if 'chance_drop' in rules and 'P_t' in firm_data.columns:
                    if pd.notna(prev_row['P_t']) and pd.notna(curr_row['P_t']):
                        drop = prev_row['P_t'] - curr_row['P_t']
                        if drop >= 0.15:
                            alerts.append({
                                'year': curr_year,
                                'firm_id': firm_id,
                                'alert_type': 'chance_drop',
                                'message': f"ProfitScore giảm {round(drop, 2)} điểm trong năm {curr_year}",
                                'severity': 'medium'
                            })
                
                # Rule 3: Borderline activation
                if 'borderline' in rules and 'P_t' in firm_data.columns:
                    if pd.notna(curr_row['P_t']) and abs(curr_row['P_t']) < 0.10:
                        if abs(prev_row['P_t']) >= 0.10:  # Wasn't borderline before
                            alerts.append({
                                'year': curr_year,
                                'firm_id': firm_id,
                                'alert_type': 'borderline',
                                'message': f"Công ty vào vùng Borderline (|P|<0.1) trong năm {curr_year}",
                                'severity': 'low'
                            })
                
                # Rule 4: ROA decline for 2 consecutive years
                if 'roa_decline' in rules and 'X1_ROA' in firm_data.columns and i >= 2:
                    prev2_row = firm_data.iloc[i-2]
                    if all(pd.notna(r['X1_ROA']) for r in [prev2_row, prev_row, curr_row]):
                        if prev2_row['X1_ROA'] > prev_row['X1_ROA'] > curr_row['X1_ROA']:
                            alerts.append({
                                'year': curr_year,
                                'firm_id': firm_id,
                                'alert_type': 'roa_decline',
                                'message': f"ROA giảm liên tục 2 năm đến {curr_year}",
                                'severity': 'medium'
                            })
                
                # Rule 5: NPM decline for 2 consecutive years
                if 'npm_decline' in rules and 'X5_NPM' in firm_data.columns and i >= 2:
                    prev2_row = firm_data.iloc[i-2]
                    if all(pd.notna(r['X5_NPM']) for r in [prev2_row, prev_row, curr_row]):
                        if prev2_row['X5_NPM'] > prev_row['X5_NPM'] > curr_row['X5_NPM']:
                            alerts.append({
                                'year': curr_year,
                                'firm_id': firm_id,
                                'alert_type': 'npm_decline',
                                'message': f"Biên lợi nhuận (NPM) giảm liên tục 2 năm đến {curr_year}",
                                'severity': 'medium'
                            })
        
        # Sort by year descending
        alerts = sorted(alerts, key=lambda x: x['year'], reverse=True)
        
        return alerts
    
    def get_about_info(self) -> dict:
        """
        Get information for About/Trust page
        
        Returns:
            Model metrics, methodology, data coverage, trust indicators
        """
        metrics = self.load_metrics()
        metadata = self.get_metadata()
        
        # Model metrics
        model_metrics = metrics.get('metrics', {})
        
        # Methodology info
        config = metrics.get('config', {})
        methodology = {
            'train_period': config.get('train_years', '<=2020'),
            'test_period': config.get('test_years', '2021+'),
            'preprocessing': 'strict_mode',
            'winsorization': config.get('winsor_limits', [0.05, 0.95]),
            'scaling': config.get('scaling_method', 'StandardScaler'),
            'features': config.get('x_cols', ['X1_ROA', 'X2_ROE', 'X3_ROC', 'X4_EPS', 'X5_NPM']),
            'target': config.get('y_col', 'Label_t')
        }
        
        # Data coverage
        data_coverage = {
            'total_firms': metadata['firms_count'],
            'total_years': len(metadata['years']),
            'year_range': metadata['year_range'],
            'missing_data_policy': 'strict',
            'imputation': 'none'
        }
        
        # Trust indicators
        trust_indicators = {
            'train_test_split': 'Temporal (Train<=2020, Test>=2021)',
            'preprocessing_leakage': 'No (fit on train only)',
            'model_validation': 'Cross-validation on train set',
            'performance_metrics': model_metrics
        }
        
        return {
            'model_metrics': model_metrics,
            'methodology': methodology,
            'data_coverage': data_coverage,
            'trust_indicators': trust_indicators
        }


# Global instance
profitpulse_adapter = ProfitPulseAdapter()
