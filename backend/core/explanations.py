"""
Explanations Module
Chức năng: Generate lý do và action tips (không học thuật, dễ hiểu)
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional


class ExplanationGenerator:
    """
    Generate explanations cho predictions
    """
    
    def __init__(self, feature_names: List[str]):
        """
        Args:
            feature_names: Tên các features (5 chỉ tiêu: ROA, ROE, ROC, EPS, NPM)
        """
        self.feature_names = feature_names
        
        # Mapping feature names sang tên thân thiện
        self.friendly_names = {
            'NI_AT': 'ROA (Lợi nhuận/Tài sản)',
            'NI_P': 'ROE (Lợi nhuận/Giá)',
            'EPS_B': 'EPS (Lãi/Cổ phiếu)',
            'GP': 'Lợi nhuận gộp',
            'REV': 'Doanh thu'
        }
    
    def analyze_drivers(
        self,
        row: pd.Series,
        z_threshold: float = 1.0
    ) -> List[Dict]:
        """
        Phân tích drivers chính (các chỉ tiêu ảnh hưởng nhất)
        
        Args:
            row: 1 dòng data (có z-scores của các features)
            z_threshold: Ngưỡng z-score để coi là "ảnh hưởng mạnh"
            
        Returns:
            List of drivers, sorted by impact
        """
        drivers = []
        
        for feat in self.feature_names:
            if feat not in row:
                continue
            
            z_score = row[feat]
            abs_z = abs(z_score)
            
            if abs_z >= z_threshold:
                direction = 'tăng mạnh' if z_score > 0 else 'suy giảm'
                impact = 'tích cực' if z_score > 0 else 'tiêu cực'
                
                drivers.append({
                    'feature': feat,
                    'friendly_name': self.friendly_names.get(feat, feat),
                    'z_score': float(z_score),
                    'direction': direction,
                    'impact': impact,
                    'abs_impact': abs_z
                })
        
        # Sort by absolute impact
        drivers = sorted(drivers, key=lambda x: x['abs_impact'], reverse=True)
        
        return drivers
    
    def generate_reason_code(
        self,
        row: pd.Series,
        top_n: int = 3
    ) -> str:
        """
        Generate reason code (1 câu ngắn gọn)
        
        Args:
            row: 1 dòng data
            top_n: Số drivers tối đa để mention
            
        Returns:
            Reason string
        """
        drivers = self.analyze_drivers(row, z_threshold=0.8)
        
        if not drivers:
            return "Các chỉ tiêu ổn định, không có biến động đáng kể"
        
        # Lấy top N drivers
        top_drivers = drivers[:top_n]
        
        # Build reason string
        negative_drivers = [d for d in top_drivers if d['impact'] == 'tiêu cực']
        positive_drivers = [d for d in top_drivers if d['impact'] == 'tích cực']
        
        if negative_drivers:
            neg_names = ', '.join([d['friendly_name'] for d in negative_drivers])
            reason = f"Có dấu hiệu suy yếu: {neg_names}"
        elif positive_drivers:
            pos_names = ', '.join([d['friendly_name'] for d in positive_drivers])
            reason = f"Phát triển tích cực: {pos_names}"
        else:
            reason = "Hoạt động ổn định"
        
        return reason
    
    def generate_action_tips(
        self,
        row: pd.Series,
        drivers: Optional[List[Dict]] = None
    ) -> List[str]:
        """
        Generate action tips (gợi ý hành động)
        
        Args:
            row: 1 dòng data
            drivers: List drivers (nếu None sẽ tự analyze)
            
        Returns:
            List of action tips
        """
        if drivers is None:
            drivers = self.analyze_drivers(row)
        
        tips = []
        
        for driver in drivers[:3]:  # Top 3 drivers
            feat = driver['feature']
            impact = driver['impact']
            
            if impact == 'tiêu cực':
                # Negative impact → suggestions
                if feat == 'NI_AT':  # ROA
                    tips.append("Kiểm tra hiệu suất sử dụng tài sản, cân nhắc tối ưu vòng quay tài sản")
                elif feat == 'NI_P':  # ROE
                    tips.append("Xem xét cơ cấu vốn chủ sở hữu và hiệu quả sinh lời")
                elif feat == 'EPS_B':  # EPS
                    tips.append("Phân tích chi phí hoạt động và tối ưu lợi nhuận trên mỗi cổ phần")
                elif feat == 'GP':  # Gross Profit
                    tips.append("Soát xét giá vốn hàng bán, chính sách giá bán")
                elif feat == 'REV':  # Revenue
                    tips.append("Tập trung tăng trưởng doanh thu, mở rộng thị trường")
        
        # General tips
        if not tips:
            tips.append("Duy trì hiệu suất hiện tại, theo dõi biến động thị trường")
        
        # Rule-based tip: ROE cao nhưng ROA thấp
        if 'NI_P' in row and 'NI_AT' in row:
            if row['NI_P'] > 1 and row['NI_AT'] < -0.5:
                tips.append("⚠ ROE cao nhưng ROA thấp: Cẩn trọng với đòn bẩy tài chính, kiểm tra nợ vay")
        
        return tips
    
    def generate_full_explanation(
        self,
        row: pd.Series,
        prediction_proba: float,
        threshold: float = 0.5
    ) -> Dict:
        """
        Generate full explanation cho 1 công ty
        
        Args:
            row: 1 dòng data
            prediction_proba: Xác suất dự báo (Chance %)
            threshold: Threshold để classify
            
        Returns:
            Dict chứa full explanation
        """
        # Analyze drivers
        drivers = self.analyze_drivers(row)
        
        # Generate reason
        reason = self.generate_reason_code(row)
        
        # Generate action tips
        tips = self.generate_action_tips(row, drivers)
        
        # Determine risk level
        risk_level = self.calculate_risk_level(prediction_proba, threshold)
        
        # Determine status
        if abs(prediction_proba - threshold) < 0.1:
            status = "Gần ngưỡng: có thể thay đổi nếu chỉ tiêu biến động"
        elif prediction_proba >= threshold:
            status = "Ổn định: khả năng cao duy trì trạng thái tốt năm tới"
        else:
            status = "Có nguy cơ suy giảm: cần chú ý theo dõi"
        
        return {
            'chance_percent': round(prediction_proba * 100, 2),
            'risk_level': risk_level,
            'status': status,
            'reason': reason,
            'drivers': drivers[:3],  # Top 3
            'action_tips': tips,
            'is_borderline': abs(prediction_proba - threshold) < 0.1
        }
    
    def calculate_risk_level(
        self,
        prediction_proba: float,
        threshold: float = 0.5
    ) -> str:
        """
        Tính risk level dựa trên probability
        
        Args:
            prediction_proba: Xác suất dự báo
            threshold: Threshold
            
        Returns:
            'Thấp', 'Vừa', hoặc 'Cao'
        """
        if prediction_proba >= 0.7:
            return "Thấp"
        elif prediction_proba >= 0.4:
            return "Vừa"
        else:
            return "Cao"
    
    def batch_explain(
        self,
        df: pd.DataFrame,
        predictions_proba: np.ndarray,
        threshold: float = 0.5
    ) -> pd.DataFrame:
        """
        Generate explanations cho nhiều công ty
        
        Args:
            df: DataFrame với features
            predictions_proba: Array of probabilities
            threshold: Threshold
            
        Returns:
            DataFrame với explanations
        """
        explanations = []
        
        for i, (idx, row) in enumerate(df.iterrows()):
            proba = predictions_proba[i]  # Use enumerate index instead of df index
            exp = self.generate_full_explanation(row, proba, threshold)
            explanations.append(exp)
        
        exp_df = pd.DataFrame(explanations)
        
        # Merge với original df
        result = pd.concat([
            df[['FIRM_ID', 'year_t', 'year_t1']].reset_index(drop=True),
            exp_df
        ], axis=1)
        
        return result


# Example usage
if __name__ == '__main__':
    # Dummy data
    row = pd.Series({
        'FIRM_ID': 'ABC',
        'year_t': 2020,
        'year_t1': 2021,
        'NI_AT': -1.5,  # ROA thấp
        'NI_P': 0.8,
        'EPS_B': -0.3,
        'GP': 0.5,
        'REV': 1.2
    })
    
    exp_gen = ExplanationGenerator(['NI_AT', 'NI_P', 'EPS_B', 'GP', 'REV'])
    
    drivers = exp_gen.analyze_drivers(row)
    print("Drivers:", drivers)
    
    reason = exp_gen.generate_reason_code(row)
    print("\nReason:", reason)
    
    tips = exp_gen.generate_action_tips(row)
    print("\nAction Tips:")
    for tip in tips:
        print(f"  - {tip}")
    
    full_exp = exp_gen.generate_full_explanation(row, prediction_proba=0.35)
    print("\nFull Explanation:")
    print(full_exp)
