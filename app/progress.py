"""Person C — Progression prediction + Wilks/DOTS toggle + share card."""
import os
import pickle
from pathlib import Path
import pandas as pd
from flask import Blueprint, render_template, request, jsonify
from scoring import wilks, dots
from wilks_dots_toggle import percentiles_for

ROOT = Path(__file__).resolve().parent.parent

progress_bp = Blueprint('progress', __name__)


progress_bp = Blueprint('progress', __name__)

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, '..', 'models', 'progression_model.pkl')

# Load once at import time
with open(model_path, 'rb') as f:
    _b = pickle.load(f)
MODEL    = _b['model']
FEATURES = _b['features']
SIGMA    = _b['sigma']

# Small constant for "population trend, not coaching" message
N_TRAIN_HINT = 120_000   # update after final training run; read from pickle if you store it


EXPLAINER = (
    "Wilks (1990s) and DOTS (2010s) both adjust your total for bodyweight. "
    "DOTS is newer and designed to be fairer across weight classes — "
    "so your percentile can shift a few points depending on which is used."
)


def _predict(age, bw, wilks_score, training_age, meets):
    row = pd.DataFrame([{
        'age': age, 'bodyweight': bw, 'wilks': wilks_score,
        'training_age_years': training_age,
        'meets_so_far': meets, 'days_to_next': 365.0,
    }])[FEATURES]
    point = float(MODEL.predict(row)[0])
    return point, point - 1.28 * SIGMA, point + 1.28 * SIGMA


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
        t_age = float(body.get('training_age', 1))
        meets = int(body.get('meets_so_far', 2))
    except (KeyError, TypeError, ValueError) as e:
        return jsonify({'error': f'Invalid input: {e}'}), 400

    # Sanity checks
    if not (14 <= age <= 100):
        return jsonify({'error': 'Age must be between 14 and 100.'}), 400
    if not (30 <= bw <= 250):
        return jsonify({'error': 'Bodyweight must be between 30 and 250 kg.'}), 400
    if not (50 <= total <= 1500):
        return jsonify({'error': 'Total must be between 50 and 1500 kg.'}), 400

    w = wilks(sex, bw, total)
    d = dots(sex, bw, total)
    point, lo, hi = _predict(age, bw, w, t_age, meets)
    pcts = percentiles_for(sex, age, w, d)

    return jsonify({
        'total': total,
        'n_train': N_TRAIN_HINT,
        'prediction': {
            'point': round(point, 1),
            'lo': round(lo, 1),
            'hi': round(hi, 1),
        },
        'views': {
            'wilks': {
                'score': round(w, 1),
                'percentile': pcts.get('wilks_pct'),
                'n': pcts.get('n', 0),
            },
            'dots': {
                'score': round(d, 1),
                'percentile': pcts.get('dots_pct'),
                'n': pcts.get('n', 0),
            },
        },
        'explainer': EXPLAINER,
    })
    