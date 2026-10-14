"""Person C — Progression prediction + Wilks/DOTS toggle + share card."""
import pickle
import sys
from pathlib import Path
import pandas as pd
from flask import Blueprint, render_template, request, jsonify

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from scoring import wilks, dots
from wilks_dots_toggle import percentiles_for

progress_bp = Blueprint('progress', __name__, template_folder='templates')

_bundle = None


def _get_bundle():
    global _bundle
    if _bundle is None:
        model_path = ROOT / 'models' / 'progression_model.pkl'
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {model_path}. "
                "Run `python scripts/train_progression_model.py` first."
            )
        with open(model_path, 'rb') as f:
            _bundle = pickle.load(f)
    return _bundle


EXPLAINER = (
    "Wilks (1990s) and DOTS (2010s) both adjust your total for bodyweight. "
    "DOTS is newer and designed to be fairer across weight classes — "
    "so your percentile can shift a few points depending on which is used."
)


def _predict(sex, age, bw, wilks_score, training_age, meets):
    """Predict 1-year total gain (kg) and an 80% prediction interval.

    The interval is point + [q10, q90], using empirical test-set residual quantiles.
    Sex-specific intervals are used when available.
    """
    b = _get_bundle()
    model = b['model']
    features = b['features']

    row_data = {
        'age': age,
        'bodyweight': bw,
        'wilks': wilks_score,
        'training_age_years': training_age,
        'meets_so_far': meets,
        'days_to_next': 365.0,
    }
    if 'is_male' in features:
        row_data['is_male'] = 1.0 if sex == 'M' else 0.0

    row = pd.DataFrame([row_data])[features]
    point = float(model.predict(row)[0])

    if 'residuals_by_sex' in b and sex in b['residuals_by_sex']:
        q10 = b['residuals_by_sex'][sex]['q10']
        q90 = b['residuals_by_sex'][sex]['q90']
    else:
        q10 = b['q10']
        q90 = b['q90']

    return point, point + q10, point + q90


@progress_bp.route('/progress')
def page():
    return render_template('progress.html')


@progress_bp.route('/api/progress', methods=['POST'])
def api_progress():
    try:
        body = request.get_json(force=True)
        sex   = str(body['sex']).upper()
        age   = float(body['age'])
        bw    = float(body['bodyweight'])
        total = float(body['total'])
        t_age = float(body['training_age'])
        meets = int(body['meets_so_far'])
    except (KeyError, TypeError, ValueError) as e:
        return jsonify({'error': f'All fields are required. ({e})'}), 400

    # Server-side sanity checks (browser already enforces most via required/min)
    if not (14 <= age <= 100):
        return jsonify({'error': 'Age must be between 14 and 100.'}), 400
    if not (30 <= bw <= 250):
        return jsonify({'error': 'Bodyweight must be between 30 and 250 kg.'}), 400
    if not (50 <= total <= 1500):
        return jsonify({'error': 'Total must be between 50 and 1500 kg.'}), 400
    if not (0 <= t_age <= 40):
        return jsonify({'error': 'Years training must be between 0 and 40.'}), 400
    if meets < 0:
        return jsonify({'error': 'Competitions attended cannot be negative.'}), 400

    # UI is 1-based ("this is my Nth meet"); model was trained on 0-based
    # cumcount. For non-competitors entering 0, we clamp to 0 (= first-meet).
    model_meets = max(meets - 1, 0)

    w = wilks(sex, bw, total)
    d = dots(sex, bw, total)
    point, lo, hi = _predict(sex, age, bw, w, t_age, model_meets)
    pcts = percentiles_for(sex, age, w, d)

    return jsonify({
        'total': total,
        'prediction': {
            'point': round(point, 1),
            'lo':    round(lo, 1),
            'hi':    round(hi, 1),
        },
        'views': {
            'wilks': {
                'score':      round(w, 1),
                'percentile': pcts.get('wilks_pct'),
                'n':          pcts.get('n', 0),
            },
            'dots': {
                'score':      round(d, 1),
                'percentile': pcts.get('dots_pct'),
                'n':          pcts.get('n', 0),
            },
        },
        'explainer': EXPLAINER,
    })
    