"""
"Your Training Type" screen backend (Person B).

Register in your Flask app:
    from training_type import bp as training_type_bp
    app.register_blueprint(training_type_bp)

Routes
    GET  /training-type        the screen (app/templates/training_type.html)
    POST /api/training-type    JSON in -> archetype + tested/untested toggle data out
"""
import sys
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, render_template, request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import tested_toggle as tt  # noqa: E402

bp = Blueprint("training_type", __name__, template_folder="templates")


@lru_cache(maxsize=1)
def _bundle():
    return joblib.load(ROOT / "models" / "kmeans_archetypes.joblib")


@lru_cache(maxsize=1)
def _peers():
    return tt.build_lifter_table(pd.read_csv(tt.CLEAN_CSV))


def classify(sex: str, squat: float, bench: float, deadlift: float) -> dict:
    """Nearest-centroid archetype for the user's lift split (model is NOT retrained live).
    Men and women have separate cluster models, so `sex` must be 'M' or 'F'."""
    b = _bundle()[sex]
    total = squat + bench + deadlift
    shares = pd.DataFrame([[squat / total, bench / total, deadlift / total]], columns=b["features"])
    cid = int(b["kmeans"].predict(b["scaler"].transform(shares))[0])
    pct = lambda d: [round(d[f] * 100, 1) for f in b["features"]]  # noqa: E731
    return {
        "label": b["labels"][cid],
        "user_shares": [round(float(v) * 100, 1) for v in shares.iloc[0]],
        "cluster_shares": pct(b["profiles"][cid]),
        "all_clusters": {b["labels"][c]: pct(p) for c, p in b["profiles"].items()},
    }


@bp.get("/training-type")
def page():
    return render_template("training_type.html")


@bp.post("/api/training-type")
def api():
    d = request.get_json(force=True, silent=True) or {}
    try:
        sex = str(d["sex"]).strip().upper()
        age, bw = float(d["age"]), float(d["bodyweight"])
        squat, bench, dead = float(d["squat"]), float(d["bench"]), float(d["deadlift"])
        lift = str(d.get("lift", "total"))
    except (KeyError, TypeError, ValueError):
        return jsonify(error="Fill in sex, age, bodyweight and all three lifts with numbers."), 400
    if sex not in ("M", "F"):
        return jsonify(error="Sex must be M or F."), 400
    if min(age, bw, squat, bench, dead) <= 0:
        return jsonify(error="All values must be greater than zero."), 400

    values = {"squat": squat, "bench": bench, "deadlift": dead, "total": squat + bench + dead}
    if lift not in values:
        return jsonify(error="Unknown lift."), 400

    try:
        toggle = tt.tested_toggle(_peers(), sex, age, bw, lift, values[lift])
    except ValueError as e:
        return jsonify(error=str(e)), 400

    return jsonify(archetype=classify(sex, squat, bench, dead), toggle=toggle)