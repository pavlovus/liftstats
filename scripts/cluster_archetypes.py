"""
Training-archetype clustering (Person B, FULL_CONTEXT.md section 5.2).

Men and women are clustered SEPARATELY. Pooled clustering mostly rediscovered
"men bench relatively more than women" instead of real differences in training style.
Each sex gets its own scaler, k (chosen by silhouette) and labels, and every cluster
is labelled relative to the average lifter of that sex.

Run once, offline (from anywhere):
    python scripts/cluster_archetypes.py            # k chosen by silhouette, per sex
    python scripts/cluster_archetypes.py --k 4      # force the same k for both sexes

Outputs
    models/kmeans_archetypes.joblib         {"M": {...}, "F": {...}} bundles (loaded by the app)
    models/cluster_profiles.csv             average ratio profile per cluster, per sex
    models/cluster_interpretation.md        tables you can paste into the report
    notebooks/figures/k_selection_<M|F>.png
    notebooks/figures/cluster_profiles_<M|F>.png
"""
import argparse
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from tested_toggle import CLEAN_CSV, PROJECT_ROOT, build_lifter_table

MODELS_DIR = PROJECT_ROOT / "models"
FIG_DIR = PROJECT_ROOT / "notebooks" / "figures"
FEATURES = ["squat_share", "bench_share", "deadlift_share"]
PRETTY = {"squat_share": "Squat", "bench_share": "Bench", "deadlift_share": "Deadlift"}
SEX_NAME = {"M": "Men", "F": "Women"}

K_RANGE = range(2, 9)              # k values evaluated
K_CHOOSE_MIN, K_CHOOSE_MAX = 3, 6  # keep archetypes interpretable
BALANCED_PP = 1.5                  # max deviation (percentage points) still called "Balanced"
SEED = 42


def prepare_features(path: Path = CLEAN_CSV) -> pd.DataFrame:
    """One row per lifter (best full-power total) with each lift as a share of the S+B+D sum."""
    df = build_lifter_table(pd.read_csv(path))

    lift_sum = df["squat"] + df["bench"] + df["deadlift"]
    df = df[(lift_sum - df["total"]).abs() <= 2.5]
    df = df[df["total"] / df["bodyweight"] <= 11]

    lift_sum = df["squat"] + df["bench"] + df["deadlift"]
    df = df.assign(
        squat_share=df["squat"] / lift_sum,
        bench_share=df["bench"] / lift_sum,
        deadlift_share=df["deadlift"] / lift_sum,
    )
    ok = df[FEATURES].apply(lambda c: c.between(0.10, 0.60)).all(axis=1)
    return df[ok].reset_index(drop=True)


def select_k(X: np.ndarray):
    """Elbow (inertia) + silhouette per k. Silhouette is computed on a sample (it is O(n^2))."""
    rng = np.random.RandomState(SEED)
    idx = rng.choice(len(X), size=min(20_000, len(X)), replace=False)
    inertias, sils = [], []
    for k in K_RANGE:
        km = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(X)
        inertias.append(km.inertia_)
        sils.append(silhouette_score(X[idx], km.labels_[idx]))
        print(f"  k={k}: inertia={km.inertia_:,.0f}  silhouette={sils[-1]:.3f}")
    return inertias, sils


def plot_k_selection(inertias, sils, sex):
    ks = list(K_RANGE)
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    ax[0].plot(ks, inertias, marker="o")
    ax[0].set(title=f"Elbow method ({SEX_NAME[sex]})", xlabel="k", ylabel="Inertia")
    ax[1].plot(ks, sils, marker="o", color="tab:orange")
    ax[1].set(title=f"Silhouette score ({SEX_NAME[sex]})", xlabel="k", ylabel="Silhouette")
    fig.tight_layout()
    fig.savefig(FIG_DIR / f"k_selection_{sex}.png", dpi=150)
    plt.close(fig)


def label_clusters(profiles: pd.DataFrame, overall: pd.Series) -> dict:
    """Human-readable label per cluster, based on deviation from the sex's average lifter."""
    dev = (profiles[FEATURES] - overall) * 100  # percentage points
    base = {}
    for cid, row in dev.iterrows():
        top, low = row.idxmax(), row.idxmin()
        if max(row.max(), -row.min()) < BALANCED_PP:
            base[cid] = "Balanced"
        elif row.max() >= -row.min():
            base[cid] = "Bench-specialist" if top == "bench_share" else f"{PRETTY[top]}-dominant"
        else:
            base[cid] = f"{PRETTY[low]}-light"

    labels, seen = {}, {}
    for cid, name in base.items():
        if list(base.values()).count(name) > 1:
            low = dev.loc[cid].idxmin()
            name = f"{name}, {PRETTY[low].lower()}-light" if f"{PRETTY[low]}-light" != name else name
        seen[name] = seen.get(name, 0) + 1
        labels[cid] = name if seen[name] == 1 else f"{name} #{seen[name]}"
    return labels


def fit_one_sex(df: pd.DataFrame, sex: str, k_override: int | None):
    print(f"\n===== {SEX_NAME[sex]}: {len(df):,} lifters =====")
    scaler = StandardScaler()
    X = scaler.fit_transform(df[FEATURES])

    print("Evaluating k ...")
    inertias, sils = select_k(X)
    plot_k_selection(inertias, sils, sex)

    candidates = {k: s for k, s in zip(K_RANGE, sils) if K_CHOOSE_MIN <= k <= K_CHOOSE_MAX}
    k = k_override or max(candidates, key=candidates.get)
    print(f"Chosen k = {k} (silhouette {sils[list(K_RANGE).index(k)]:.3f})")

    km = KMeans(n_clusters=k, n_init=20, random_state=SEED).fit(X)
    df = df.assign(cluster=km.labels_)

    overall = df[FEATURES].mean()
    profiles = df.groupby("cluster")[FEATURES].mean()
    profiles["n_lifters"] = df.groupby("cluster").size()
    profiles["pct_of_lifters"] = (profiles["n_lifters"] / len(df) * 100).round(1)
    profiles["pct_tested"] = df.groupby("cluster")["is_tested"].mean().mul(100).round(1)
    profiles["median_bodyweight"] = df.groupby("cluster")["bodyweight"].median().round(1)

    labels = label_clusters(profiles, overall)
    profiles.insert(0, "label", pd.Series(labels))

    # profile plot
    fig, ax = plt.subplots(figsize=(8, 4.5))
    width = 0.8 / k
    for i, (cid, r) in enumerate(profiles.iterrows()):
        ax.bar(np.arange(3) + i * width, [r[f] * 100 for f in FEATURES], width, label=r["label"])
    ax.set_xticks(np.arange(3) + 0.4 - width / 2)
    ax.set_xticklabels([PRETTY[f] for f in FEATURES])
    ax.set(ylabel="% of total", title=f"Average lift split per archetype ({SEX_NAME[sex]})")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(FIG_DIR / f"cluster_profiles_{sex}.png", dpi=150)
    plt.close(fig)

    md = [
        f"### {SEX_NAME[sex]} (k = {k}, {len(df):,} lifters)",
        "",
        "| Cluster | Label | Squat % | Bench % | Deadlift % | Lifters | % tested | Median BW (kg) |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for cid, r in profiles.iterrows():
        md.append(
            f"| {cid} | {r['label']} | {r['squat_share']*100:.1f} | {r['bench_share']*100:.1f} | "
            f"{r['deadlift_share']*100:.1f} | {int(r['n_lifters']):,} | {r['pct_tested']} | {r['median_bodyweight']} |"
        )
    md.append(
        f"\nAverage {SEX_NAME[sex].lower()[:-1]}: squat {overall.squat_share*100:.1f}%, "
        f"bench {overall.bench_share*100:.1f}%, deadlift {overall.deadlift_share*100:.1f}%.\n"
    )
    print("\n".join(md))

    bundle = {
        "scaler": scaler,
        "kmeans": km,
        "features": FEATURES,
        "labels": labels,
        "profiles": {int(c): {f: float(profiles.loc[c, f]) for f in FEATURES} for c in profiles.index},
        "k": k,
        "silhouette_by_k": dict(zip(K_RANGE, sils)),
    }
    return bundle, profiles.assign(sex=sex), md


def main(k_override: int | None = None):
    MODELS_DIR.mkdir(exist_ok=True)
    FIG_DIR.mkdir(parents=True, exist_ok=True)

    df = prepare_features()
    print(f"Lifters after filtering: {len(df):,}")

    bundles, all_profiles, md_lines = {}, [], []
    for sex in ("M", "F"):
        bundle, profiles, md = fit_one_sex(df[df["sex"] == sex], sex, k_override)
        bundles[sex] = bundle
        all_profiles.append(profiles)
        md_lines += md

    pd.concat(all_profiles).to_csv(MODELS_DIR / "cluster_profiles.csv")
    (MODELS_DIR / "cluster_interpretation.md").write_text("\n".join(md_lines), encoding="utf-8")
    joblib.dump(bundles, MODELS_DIR / "kmeans_archetypes.joblib")
    print(f"\nSaved model to {MODELS_DIR / 'kmeans_archetypes.joblib'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=None, help="override the silhouette-chosen k (both sexes)")
    main(parser.parse_args().k)