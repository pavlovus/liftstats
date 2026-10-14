import numpy as np
import pandas as pd
from typing import Dict, Tuple
from app.backend.schemas.progression import ProgressionResponse, ScorePercentileView

EXPLAINER = (
    "Wilks (1990s) and DOTS (2010s) both adjust your total for bodyweight. "
    "DOTS is newer and designed to be fairer across weight classes — "
    "so your percentile can shift a few points depending on which is used."
)

def calculate_wilks(sex: str, bodyweight: float, total: float) -> float:
    is_male = str(sex).upper().startswith("M")
    bw = max(40.0, min(float(bodyweight), 210.0 if is_male else 155.0))
    if is_male:
        c = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-06, -1.291e-08]
    else:
        c = [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 0.00004731582, -0.00000009054]
    denom = sum(coef * (bw ** i) for i, coef in enumerate(c))
    return (500.0 / denom) * float(total)

def calculate_dots(sex: str, bodyweight: float, total: float) -> float:
    is_male = str(sex).upper().startswith("M")
    bw = max(40.0, min(float(bodyweight), 210.0 if is_male else 150.0))
    if is_male:
        c = [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093]
    else:
        c = [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706]
    denom = sum(coef * (bw ** i) for i, coef in enumerate(c))
    return (500.0 / denom) * float(total)

def score_percentile_from_table(tables_df: pd.DataFrame, sex: str, age: float, wilks_score: float, dots_score: float) -> dict:
    sex = str(sex).strip().upper()
    if age <= 19:   bracket = '14-19'
    elif age <= 23: bracket = '20-23'
    elif age <= 29: bracket = '24-29'
    elif age <= 39: bracket = '30-39'
    elif age <= 49: bracket = '40-49'
    else:           bracket = '50+'

    row = tables_df[(tables_df['sex'] == sex) & (tables_df['age_bracket'] == bracket)]
    if row.empty:
        return {'wilks_pct': None, 'dots_pct': None, 'n': 0}

    arr_w = row.iloc[0]['wilks_scores_sorted']
    arr_d = row.iloc[0]['dots_scores_sorted']

    def _pct(val, arr):
        left = np.searchsorted(arr, val, side='left')
        right = np.searchsorted(arr, val, side='right')
        return round(float((left + right) / (2.0 * len(arr)) * 100), 1)

    return {
        'wilks_pct': _pct(wilks_score, arr_w),
        'dots_pct': _pct(dots_score, arr_d),
        'n': int(row.iloc[0]['n']),
    }

def predict_one_year_gain(
    progression_bundle: dict,
    sex: str,
    age: float,
    bodyweight: float,
    wilks_score: float,
    training_age: float,
    meets_so_far: int
) -> Tuple[float, float, float]:
    model = progression_bundle['model']
    features = progression_bundle['features']

    # For competitors entering N meets, model was trained on 0-based index. Clamped to 0.
    model_meets = max(meets_so_far - 1, 0)

    row_data = {
        'age': age,
        'bodyweight': bodyweight,
        'wilks': wilks_score,
        'training_age_years': training_age,
        'meets_so_far': model_meets,
        'days_to_next': 365.0,
    }
    if 'is_male' in features:
        row_data['is_male'] = 1.0 if sex == 'M' else 0.0

    row = pd.DataFrame([row_data])[features]
    point = float(model.predict(row)[0])

    if 'residuals_by_sex' in progression_bundle and sex in progression_bundle['residuals_by_sex']:
        q10 = progression_bundle['residuals_by_sex'][sex]['q10']
        q90 = progression_bundle['residuals_by_sex'][sex]['q90']
    else:
        q10 = progression_bundle['q10']
        q90 = progression_bundle['q90']

    return round(point, 1), round(point + q10, 1), round(point + q90, 1)

def analyze_progression(
    progression_bundle: dict,
    percentile_tables_df: pd.DataFrame,
    sex: str,
    age: float,
    bodyweight: float,
    total: float,
    training_age: float,
    meets_so_far: int
) -> ProgressionResponse:
    w = calculate_wilks(sex, bodyweight, total)
    d = calculate_dots(sex, bodyweight, total)
    point, lo, hi = predict_one_year_gain(progression_bundle, sex, age, bodyweight, w, training_age, meets_so_far)
    pcts = score_percentile_from_table(percentile_tables_df, sex, age, w, d)

    return ProgressionResponse(
        total=round(float(total), 1),
        point=point,
        lo=lo,
        hi=hi,
        views={
            "wilks": ScorePercentileView(
                score=round(float(w), 1),
                percentile=pcts.get("wilks_pct"),
                n=pcts.get("n", 0)
            ),
            "dots": ScorePercentileView(
                score=round(float(d), 1),
                percentile=pcts.get("dots_pct"),
                n=pcts.get("n", 0)
            )
        },
        explainer=EXPLAINER
    )
