# profitpulse_pipeline.py
# ============================================================
# ProfitPulse: App-ready leakage-safe PCA + ML pipeline
# Outputs: parquet/json views for Website (Screener / Company / Alerts)
# ============================================================

import warnings
warnings.filterwarnings("ignore")

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Optional: XGBoost (fallback)
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception:
    from sklearn.ensemble import GradientBoostingClassifier
    HAS_XGB = False


# ============================================================
# 1) CONFIG
# ============================================================

@dataclass
class AppConfig:
    input_path: str = "Data.xlsx"
    output_dir: str = "artifacts_profitpulse"

    random_state: int = 42
    par_value: int = 10000
    winsor_q: float = 0.01

    # Forecast split (label-year based)
    train_target_end_year: int = 2020
    test_target_years: Tuple[int, ...] = (2021, 2022, 2023, 2024)

    # Fit preprocessing on predictor years <= (train_target_end_year - 1)
    preprocess_fit_pred_year: int = 2019

    # Proxy set
    x_cols: Tuple[str, ...] = ("X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM")
    pretty: Optional[Dict[str, str]] = None

    # PCA
    main_k: int = 3

    # App policy
    default_model_name: str = "XGBoost"   # "SVM (RBF)" / "Random forest" / "XGBoost"
    proba_threshold: float = 0.50         # threshold to convert proba -> class for app display
    risk_high_cut: float = 0.40           # Chance < 0.40 => High risk
    risk_low_cut: float = 0.60            # Chance > 0.60 => Low risk
    borderline_abs_p: float = 0.10        # |P(t)| < 0.10 => Borderline

    # Explanations
    z_weak: float = -0.50                 # z-score threshold for "weak"
    z_strong: float = 0.70                # z-score threshold for "strong"
    z_jump: float = 1.00                  # big YoY change in z-score

    def __post_init__(self):
        if self.pretty is None:
            self.pretty = {
                "X1_ROA": "ROA",
                "X2_ROE": "ROE",
                "X3_ROC": "ROC",
                "X4_EPS": "EPS",
                "X5_NPM": "NPM",
            }


# ============================================================
# 2) UTILS (leakage-safe + robust)
# ============================================================

def require_cols(df: pd.DataFrame, cols: List[str]):
    miss = [c for c in cols if c not in df.columns]
    if miss:
        raise ValueError(f"Thiếu cột bắt buộc: {miss}")

def safe_div(a: pd.Series, b: pd.Series) -> pd.Series:
    b2 = b.replace(0, np.nan)
    return a / b2

def winsor_bounds_from_train(df_train: pd.DataFrame, cols: List[str], q: float) -> Dict[str, Tuple[float, float]]:
    bounds = {}
    for c in cols:
        lo = float(df_train[c].quantile(q))
        hi = float(df_train[c].quantile(1 - q))
        bounds[c] = (lo, hi)
    return bounds

def apply_winsor_bounds(df_in: pd.DataFrame, bounds: Dict[str, Tuple[float, float]]) -> pd.DataFrame:
    df = df_in.copy()
    for c, (lo, hi) in bounds.items():
        df[c] = df[c].clip(lower=lo, upper=hi)
    return df

def to_parquet(df: pd.DataFrame, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, index=False)

def to_json(obj: dict, path: Path):
    import json
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def risk_bucket(chance: float, high_cut: float, low_cut: float) -> str:
    if chance < high_cut:
        return "High"
    if chance > low_cut:
        return "Low"
    return "Medium"


# ============================================================
# 3) PIPELINE CLASS
# ============================================================

class ProfitPulsePipeline:
    """
    App-ready pipeline:
    - Build proxies
    - Leakage-safe preprocess (winsor + scaler fit on predictor<=2019)
    - PCA fit on predictor<=2019 standardized
    - ProfitScore P(t), Label(t)
    - Align X(t)->Label(t+1) + split by label-year
    - Train models + predict
    - Build app views: screener, company-series, alerts
    """

    def __init__(self, cfg: AppConfig):
        self.cfg = cfg

        # Learned artifacts (fit on TRAIN-only)
        self.winsor_bounds_: Optional[Dict[str, Tuple[float, float]]] = None
        self.pca_scaler_: Optional[StandardScaler] = None
        self.pca_: Optional[PCA] = None
        self.omega_: Optional[np.ndarray] = None

        # ML artifacts
        self.svm_scaler_: Optional[StandardScaler] = None
        self.models_: Dict[str, object] = {}
        self.metrics_: Dict[str, dict] = {}

        # Data cache
        self.df_raw_: Optional[pd.DataFrame] = None
        self.df_proxy_: Optional[pd.DataFrame] = None
        self.df_scored_: Optional[pd.DataFrame] = None
        self.df_ml_: Optional[pd.DataFrame] = None
        self.df_pred_: Optional[pd.DataFrame] = None

    # ----------------------------
    # (A) LOAD + BUILD PROXIES
    # ----------------------------
    def load_raw(self) -> pd.DataFrame:
        df = pd.read_excel(self.cfg.input_path)
        df.columns = [c.strip() for c in df.columns]
        self.df_raw_ = df
        return df

    def build_proxies(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        if df is None:
            if self.df_raw_ is None:
                df = self.load_raw()
            else:
                df = self.df_raw_

        require_cols(df, ["FIRM_ID", "YEAR", "TA", "EQ_P", "SH_ISS", "EPS_B", "REV"])
        if ("NI_P" not in df.columns) and ("NI_AT" not in df.columns):
            raise ValueError("Cần có NI_P hoặc NI_AT để tính ROA/ROE/ROC/NPM.")

        df = df.copy()
        df["YEAR"] = pd.to_datetime(df["YEAR"], errors="coerce").dt.year
        df = df.dropna(subset=["FIRM_ID", "YEAR"]).copy()
        df["YEAR"] = df["YEAR"].astype(int)

        # numeric cast
        for c in ["NI_P", "NI_AT", "TA", "EQ_P", "SH_ISS", "EPS_B", "REV"]:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")

        df = df.sort_values(["FIRM_ID", "YEAR"]).reset_index(drop=True)

        # NI_USED preference
        if "NI_P" in df.columns and "NI_AT" in df.columns:
            df["NI_USED"] = df["NI_P"].where(df["NI_P"].notna(), df["NI_AT"])
        elif "NI_P" in df.columns:
            df["NI_USED"] = df["NI_P"]
        else:
            df["NI_USED"] = df["NI_AT"]

        # Proxies (Table 1)
        df["X1_ROA"] = safe_div(df["NI_USED"], df["TA"])
        df["X2_ROE"] = safe_div(df["NI_USED"], df["EQ_P"])
        df["PAID_UP_CAP"] = df["SH_ISS"] * self.cfg.par_value
        df["X3_ROC"] = safe_div(df["NI_USED"], df["PAID_UP_CAP"])
        df["X4_EPS"] = df["EPS_B"]
        df["X5_NPM"] = safe_div(df["NI_USED"], df["REV"])

        for c in self.cfg.x_cols:
            df[c] = df[c].replace([np.inf, -np.inf], np.nan)

        self.df_proxy_ = df
        return df

    # ----------------------------
    # (B) FIT PREPROCESS + PCA (TRAIN-only)
    # ----------------------------
    def fit_measurement(self, df_proxy: Optional[pd.DataFrame] = None) -> dict:
        """
        Fit winsor bounds + scaler + PCA on predictor years <= preprocess_fit_pred_year (2019).
        """
        if df_proxy is None:
            if self.df_proxy_ is None:
                df_proxy = self.build_proxies()
            else:
                df_proxy = self.df_proxy_

        dfx = df_proxy.dropna(subset=list(self.cfg.x_cols)).copy()
        fit_df = dfx[dfx["YEAR"] <= self.cfg.preprocess_fit_pred_year].copy()
        if len(fit_df) < 300:
            raise ValueError("Quá ít quan sát trong fit window (≤2019). Kiểm tra dữ liệu.")

        # Winsor (TRAIN-only)
        bounds = winsor_bounds_from_train(fit_df, list(self.cfg.x_cols), self.cfg.winsor_q)
        dfx_w = apply_winsor_bounds(dfx, bounds)

        fit_w = dfx_w[dfx_w["YEAR"] <= self.cfg.preprocess_fit_pred_year].copy()

        # Standardize for PCA (TRAIN-only)
        pca_scaler = StandardScaler()
        X_fit_std = pca_scaler.fit_transform(fit_w[list(self.cfg.x_cols)].values)

        # PCA fit (k=3 main)
        pca = PCA(n_components=self.cfg.main_k, random_state=self.cfg.random_state)
        pca.fit(X_fit_std)

        lambdas = pca.explained_variance_
        omega = lambdas / np.sum(lambdas)

        # store
        self.winsor_bounds_ = bounds
        self.pca_scaler_ = pca_scaler
        self.pca_ = pca
        self.omega_ = omega

        # return lightweight snapshot for app "About methodology" (optional)
        snap = {
            "fit_window_predictor_year_end": self.cfg.preprocess_fit_pred_year,
            "winsor_q": self.cfg.winsor_q,
            "pca_k": self.cfg.main_k,
            "pca_evr": pca.explained_variance_ratio_.tolist(),
            "pca_omega": omega.tolist(),
            "x_cols": list(self.cfg.x_cols),
        }
        return snap

    # ----------------------------
    # (C) SCORE ALL YEARS -> ProfitScore + Label(t)
    # ----------------------------
    def score_profitability(self, df_proxy: Optional[pd.DataFrame] = None,
                            label_rule: str = "zero") -> pd.DataFrame:
        """
        Compute PC scores + ProfitScore P(t) + Label(t) for all firm-years.
        label_rule: "zero" or "median_by_year"
        """
        if any(x is None for x in [self.winsor_bounds_, self.pca_scaler_, self.pca_, self.omega_]):
            self.fit_measurement(df_proxy)

        if df_proxy is None:
            df_proxy = self.df_proxy_

        dfx = df_proxy.dropna(subset=list(self.cfg.x_cols)).copy()
        dfx_w = apply_winsor_bounds(dfx, self.winsor_bounds_)

        # Standardize using TRAIN-only scaler
        X_std = self.pca_scaler_.transform(dfx_w[list(self.cfg.x_cols)].values)

        # PCA transform
        PCs = self.pca_.transform(X_std)
        pc_cols = [f"PC{i}" for i in range(1, self.cfg.main_k + 1)]

        out = dfx_w[["FIRM_ID", "YEAR"] + list(self.cfg.x_cols)].copy()
        for j, pc in enumerate(pc_cols):
            out[pc] = PCs[:, j]

        # ProfitScore
        out["P_t"] = (out[pc_cols].values * self.omega_.reshape(1, -1)).sum(axis=1)

        # Label(t)
        if label_rule == "zero":
            out["Label_t"] = (out["P_t"] > 0).astype(int)
            out["Label_rule"] = "P_t > 0"
        elif label_rule in ("median_by_year", "median"):
            med = out.groupby("YEAR")["P_t"].transform("median")
            out["Label_t"] = (out["P_t"] > med).astype(int)
            out["Label_rule"] = "P_t > median(P|YEAR)"
        else:
            raise ValueError("label_rule must be 'zero' or 'median_by_year'.")

        # Also store z-scores for explanations (from TRAIN-only scaler)
        Z = X_std
        for i, col in enumerate(self.cfg.x_cols):
            out[f"Z_{col}"] = Z[:, i]

        self.df_scored_ = out.sort_values(["FIRM_ID", "YEAR"]).reset_index(drop=True)
        return self.df_scored_

    # ----------------------------
    # (D) BUILD FORECAST PANEL X(t) -> Label(t+1) + split
    # ----------------------------
    def build_forecast_panel(self, df_scored: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        if df_scored is None:
            if self.df_scored_ is None:
                df_scored = self.score_profitability(label_rule="zero")
            else:
                df_scored = self.df_scored_

        out = df_scored.sort_values(["FIRM_ID", "YEAR"]).copy()
        out["TargetYear"] = out["YEAR"] + 1
        out["Label_t1"] = out.groupby("FIRM_ID")["Label_t"].shift(-1)

        ml = out.dropna(subset=["Label_t1"]).copy()
        ml["Label_t1"] = ml["Label_t1"].astype(int)

        # Keep useful columns for app later (include ProfitScore & z-scores)
        keep_cols = (
            ["FIRM_ID", "YEAR", "TargetYear", "Label_t1", "P_t"] +
            list(self.cfg.x_cols) +
            [c for c in ml.columns if c.startswith("Z_")] +
            [c for c in ml.columns if c.startswith("PC")]
        )
        keep_cols = [c for c in keep_cols if c in ml.columns]
        ml = ml[keep_cols].copy()

        self.df_ml_ = ml.sort_values(["FIRM_ID", "YEAR"]).reset_index(drop=True)
        return self.df_ml_

    # ----------------------------
    # (E) TRAIN MODELS (on train targets <=2020)
    # ----------------------------
    def train_models(self, df_ml: Optional[pd.DataFrame] = None) -> Dict[str, dict]:
        if df_ml is None:
            if self.df_ml_ is None:
                df_ml = self.build_forecast_panel()
            else:
                df_ml = self.df_ml_

        train = df_ml[df_ml["TargetYear"] <= self.cfg.train_target_end_year].copy()
        test = df_ml[df_ml["TargetYear"].isin(self.cfg.test_target_years)].copy()

        X_train = train[list(self.cfg.x_cols)].values
        y_train = train["Label_t1"].values
        X_test = test[list(self.cfg.x_cols)].values
        y_test = test["Label_t1"].values

        # Models (same as your notebook)
        models = {
            "XGBoost": (
                XGBClassifier(
                    n_estimators=500, max_depth=4, learning_rate=0.05,
                    subsample=0.9, colsample_bytree=0.9,
                    reg_lambda=1.0, random_state=self.cfg.random_state,
                    eval_metric="logloss"
                ) if HAS_XGB else GradientBoostingClassifier(random_state=self.cfg.random_state)
            ),
            "SVM (RBF)": SVC(
                kernel="rbf", C=10.0, gamma="scale",
                class_weight="balanced", probability=True,
                random_state=self.cfg.random_state
            ),
            "Random forest": RandomForestClassifier(
                n_estimators=400, min_samples_leaf=2,
                class_weight="balanced", random_state=self.cfg.random_state, n_jobs=-1
            )
        }

        # SVM needs scaling (TRAIN-only)
        svm_scaler = StandardScaler()
        X_train_s = svm_scaler.fit_transform(X_train)
        X_test_s = svm_scaler.transform(X_test)

        self.svm_scaler_ = svm_scaler
        self.models_ = {}
        self.metrics_ = {}

        # Evaluate out-of-sample (2021–2024)
        has_two = (len(np.unique(y_test)) == 2)

        for name, model in models.items():
            if name == "SVM (RBF)":
                model.fit(X_train_s, y_train)
                pred = model.predict(X_test_s)
                proba = model.predict_proba(X_test_s)[:, 1]
            else:
                model.fit(X_train, y_train)
                pred = model.predict(X_test)
                proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else pred.astype(float)

            met = {
                "accuracy": float(accuracy_score(y_test, pred)),
                "precision": float(precision_score(y_test, pred, zero_division=0)),
                "recall": float(recall_score(y_test, pred, zero_division=0)),
                "f1": float(f1_score(y_test, pred, zero_division=0)),
                "auc": float(roc_auc_score(y_test, proba)) if has_two else np.nan,
                "confusion": confusion_matrix(y_test, pred, labels=[0, 1]).tolist(),
            }

            self.models_[name] = model
            self.metrics_[name] = met

        return self.metrics_

    # ----------------------------
    # (F) PREDICT ALL (for app) -> store per firm-year (predictor year t)
    # ----------------------------
    def predict_for_app(self, df_ml: Optional[pd.DataFrame] = None,
                        model_names: Optional[List[str]] = None) -> pd.DataFrame:
        if not self.models_:
            self.train_models(df_ml)

        if df_ml is None:
            df_ml = self.df_ml_

        if model_names is None:
            model_names = list(self.models_.keys())

        X = df_ml[list(self.cfg.x_cols)].values

        rows = []
        for name in model_names:
            m = self.models_[name]
            if name == "SVM (RBF)":
                Xs = self.svm_scaler_.transform(X)
                proba = m.predict_proba(Xs)[:, 1]
            else:
                proba = m.predict_proba(X)[:, 1] if hasattr(m, "predict_proba") else m.predict(X).astype(float)

            tmp = df_ml[["FIRM_ID", "YEAR", "TargetYear", "P_t", "Label_t1"]].copy()
            tmp["model"] = name
            tmp["chance"] = proba
            tmp["pred_label"] = (tmp["chance"] >= self.cfg.proba_threshold).astype(int)
            rows.append(tmp)

        pred = pd.concat(rows, ignore_index=True)
        self.df_pred_ = pred.sort_values(["model", "FIRM_ID", "YEAR"]).reset_index(drop=True)
        return self.df_pred_

    # ----------------------------
    # (G) EXPLANATIONS (1 câu) + ACTION TIPS (rule-based)
    # ----------------------------
    def _reason_one_liner(self, row: pd.Series, prev: Optional[pd.Series]) -> str:
        """
        Return 1 short reason line in Vietnamese (non-academic).
        Uses z-scores & YoY changes in z-scores.
        """
        z_roa = row.get("Z_X1_ROA", np.nan)
        z_roe = row.get("Z_X2_ROE", np.nan)
        z_npm = row.get("Z_X5_NPM", np.nan)
        z_eps = row.get("Z_X4_EPS", np.nan)

        dz_eps = np.nan
        dz_npm = np.nan
        if prev is not None:
            dz_eps = z_eps - prev.get("Z_X4_EPS", np.nan)
            dz_npm = z_npm - prev.get("Z_X5_NPM", np.nan)

        # Rules (simple & actionable)
        if (z_roe >= self.cfg.z_strong) and (z_roa <= -0.20):
            return "ROE cao nhưng ROA thấp (có thể do đòn bẩy)."
        if (z_roa <= self.cfg.z_weak) and (z_roe <= self.cfg.z_weak):
            return "Hiệu suất sinh lợi (ROA/ROE) đang yếu."
        if (z_npm <= self.cfg.z_weak) or (pd.notna(dz_npm) and dz_npm <= -self.cfg.z_jump):
            return "Biên lợi nhuận (NPM) suy giảm."
        if pd.notna(dz_eps) and abs(dz_eps) >= self.cfg.z_jump:
            return "EPS biến động mạnh (thiếu ổn định theo cổ phiếu)."
        return "Tín hiệu lợi nhuận ở mức trung tính, cần theo dõi thêm."

    def _action_tips(self, reason: str) -> str:
        if "đòn bẩy" in reason:
            return "Gợi ý: kiểm tra nợ vay/chi phí lãi và chất lượng lợi nhuận."
        if "ROA/ROE" in reason or "Hiệu suất" in reason:
            return "Gợi ý: xem hiệu quả sử dụng tài sản, vòng quay và hiệu suất vốn."
        if "NPM" in reason or "Biên lợi nhuận" in reason:
            return "Gợi ý: soát giá vốn/chi phí và chính sách giá bán."
        if "EPS" in reason:
            return "Gợi ý: kiểm tra pha loãng cổ phiếu và lợi nhuận bất thường."
        return "Gợi ý: đọc nhanh BCTC và thuyết minh để xác nhận nguyên nhân."

    # ----------------------------
    # (H) BUILD APP VIEWS
    # ----------------------------
    def build_company_view(self) -> pd.DataFrame:
        """
        Company page needs time-series per firm:
        YEAR, proxies, P_t, Label_t, (optional) PCs.
        """
        if self.df_scored_ is None:
            self.score_profitability(label_rule="zero")
        cols = ["FIRM_ID", "YEAR", "P_t", "Label_t"] + list(self.cfg.x_cols) + \
               [c for c in self.df_scored_.columns if c.startswith("PC")]
        cols = [c for c in cols if c in self.df_scored_.columns]
        return self.df_scored_[cols].copy()

    def build_screener_view(self, predictor_year: int) -> pd.DataFrame:
        """
        Screener uses predictor year t:
        - ProfitScore P(t)
        - Chance for TargetYear=t+1 (from default model)
        - Risk level + Borderline + reason + action tip
        """
        if self.df_ml_ is None:
            self.build_forecast_panel()
        if self.df_pred_ is None:
            self.predict_for_app()

        # Filter ML rows for predictor year
        base = self.df_ml_[self.df_ml_["YEAR"] == predictor_year].copy()
        if base.empty:
            raise ValueError(f"Không có dữ liệu predictor_year={predictor_year}.")

        # pick default model predictions for that year
        pred = self.df_pred_[
            (self.df_pred_["model"] == self.cfg.default_model_name) &
            (self.df_pred_["YEAR"] == predictor_year)
        ][["FIRM_ID", "YEAR", "TargetYear", "chance", "pred_label"]].copy()

        view = base.merge(pred, on=["FIRM_ID", "YEAR"], how="left")

        # Risk + Borderline
        view["risk"] = view["chance"].apply(lambda x: risk_bucket(x, self.cfg.risk_high_cut, self.cfg.risk_low_cut))
        view["borderline"] = (view["P_t"].abs() < self.cfg.borderline_abs_p)

        # Reason & action tips using previous year row (for YoY logic)
        # Build a quick lookup for prev-year z-scores
        z_cols = [c for c in view.columns if c.startswith("Z_")]
        prev_map = {}
        tmp_all = self.df_ml_.copy()
        tmp_all["key"] = tmp_all["FIRM_ID"].astype(str) + "_" + tmp_all["YEAR"].astype(str)
        for _, r in tmp_all.iterrows():
            prev_map[r["key"]] = r

        reasons = []
        actions = []
        for _, r in view.iterrows():
            prev_key = f"{r['FIRM_ID']}_{int(r['YEAR']-1)}"
            prev_row = prev_map.get(prev_key, None)
            reason = self._reason_one_liner(r, prev_row)
            reasons.append(reason)
            actions.append(self._action_tips(reason))

        view["reason"] = reasons
        view["action_tip"] = actions

        # Friendly column names for UI
        rename = {c: self.cfg.pretty.get(c, c) for c in self.cfg.x_cols}
        view = view.rename(columns=rename)

        keep = ["FIRM_ID", "YEAR", "TargetYear", "P_t", "chance", "risk", "borderline",
                "reason", "action_tip"] + list(rename.values())
        keep = [c for c in keep if c in view.columns]
        view = view[keep].copy()

        # sort: high risk first, then low chance
        risk_order = {"High": 0, "Medium": 1, "Low": 2}
        view["_risk_rank"] = view["risk"].map(risk_order).fillna(9)
        view = view.sort_values(["_risk_rank", "chance"], ascending=[True, True]).drop(columns=["_risk_rank"])
        return view.reset_index(drop=True)

    def build_alerts_view(self, year_from: int, year_to: int) -> pd.DataFrame:
        """
        Alerts: detect risk changes / borderline.
        Produces firm-level alerts between years in [year_from..year_to].
        """
        frames = []
        for y in range(year_from, year_to + 1):
            try:
                v = self.build_screener_view(predictor_year=y)[["FIRM_ID", "YEAR", "TargetYear", "risk", "chance", "borderline"]].copy()
                frames.append(v)
            except Exception:
                pass
        if not frames:
            return pd.DataFrame(columns=["FIRM_ID", "YEAR", "alert_type", "message"])

        allv = pd.concat(frames, ignore_index=True)
        allv = allv.sort_values(["FIRM_ID", "YEAR"]).reset_index(drop=True)

        alerts = []
        for firm, g in allv.groupby("FIRM_ID"):
            g = g.sort_values("YEAR").reset_index(drop=True)
            for i in range(1, len(g)):
                prev = g.iloc[i - 1]
                cur = g.iloc[i]

                # Risk level change
                if prev["risk"] != cur["risk"]:
                    alerts.append({
                        "FIRM_ID": firm,
                        "YEAR": int(cur["YEAR"]),
                        "alert_type": "risk_change",
                        "message": f"Risk đổi từ {prev['risk']} → {cur['risk']} (Chance {prev['chance']:.2f} → {cur['chance']:.2f})."
                    })

                # Borderline
                if bool(cur["borderline"]):
                    alerts.append({
                        "FIRM_ID": firm,
                        "YEAR": int(cur["YEAR"]),
                        "alert_type": "borderline",
                        "message": "ProfitScore đang gần ngưỡng (dễ đổi trạng thái nếu chỉ tiêu biến động nhẹ)."
                    })

                # Chance drop
                if (prev["chance"] - cur["chance"]) >= 0.15:
                    alerts.append({
                        "FIRM_ID": firm,
                        "YEAR": int(cur["YEAR"]),
                        "alert_type": "chance_drop",
                        "message": f"Chance giảm mạnh: {prev['chance']:.2f} → {cur['chance']:.2f}."
                    })

        return pd.DataFrame(alerts)

    # ----------------------------
    # (I) EXPORT ARTIFACTS FOR WEBSITE
    # ----------------------------
    def export_artifacts(self, predictor_year_for_screener: int = 2023) -> Dict[str, str]:
        """
        Export data views to output_dir for the website:
        - company_view.parquet
        - screener_{year}.parquet
        - predictions_all.parquet
        - model_metrics.json
        - methodology_snapshot.json
        - alerts_{range}.parquet
        """
        outdir = Path(self.cfg.output_dir)
        outdir.mkdir(parents=True, exist_ok=True)

        # Ensure pipeline ran
        snap = self.fit_measurement()
        self.score_profitability(label_rule="zero")
        self.build_forecast_panel()
        self.train_models()
        self.predict_for_app()

        # Company view
        company_view = self.build_company_view()
        to_parquet(company_view, outdir / "company_view.parquet")

        # Screener view
        screener = self.build_screener_view(predictor_year_for_screener)
        to_parquet(screener, outdir / f"screener_{predictor_year_for_screener}.parquet")

        # Predictions (all years)
        to_parquet(self.df_pred_, outdir / "predictions_all.parquet")

        # Metrics + config snapshots
        to_json({"config": asdict(self.cfg), "metrics": self.metrics_, "HAS_XGB": HAS_XGB}, outdir / "model_metrics.json")
        to_json({"methodology": snap}, outdir / "methodology_snapshot.json")

        # Alerts sample
        alerts = self.build_alerts_view(year_from=2016, year_to=2023)
        to_parquet(alerts, outdir / "alerts_2016_2023.parquet")

        return {
            "company_view": str(outdir / "company_view.parquet"),
            "screener": str(outdir / f"screener_{predictor_year_for_screener}.parquet"),
            "predictions_all": str(outdir / "predictions_all.parquet"),
            "model_metrics": str(outdir / "model_metrics.json"),
            "methodology_snapshot": str(outdir / "methodology_snapshot.json"),
            "alerts": str(outdir / "alerts_2016_2023.parquet"),
        }


# ============================================================
# 4) RUN (example)
# ============================================================
if __name__ == "__main__":
    cfg = AppConfig(
        input_path="Data.xlsx",
        output_dir="artifacts_profitpulse",
        default_model_name="XGBoost",  # bạn có thể set "SVM (RBF)" nếu ưu tiên F1
        main_k=3,
        winsor_q=0.01,
        train_target_end_year=2020,
        test_target_years=(2021, 2022, 2023, 2024),
        preprocess_fit_pred_year=2019,
        proba_threshold=0.50,
        risk_high_cut=0.40,
        risk_low_cut=0.60,
        borderline_abs_p=0.10,
    )

    pipe = ProfitPulsePipeline(cfg)

    # Build & export for website
    paths = pipe.export_artifacts(predictor_year_for_screener=2023)

    print("\n✅ Exported artifacts:")
    for k, v in paths.items():
        print(f"  - {k}: {v}")

    print("\n📊 Model metrics (test 2021–2024):")
    for name, met in pipe.metrics_.items():
        print(f"\n{name}:")
        for k, v in met.items():
            if k != "confusion":
                if isinstance(v, float):
                    print(f"  {k}: {v:.4f}")
                else:
                    print(f"  {k}: {v}")
