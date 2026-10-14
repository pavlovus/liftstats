# LiftStats

> **Statistical Modeling, Biomechanical Clustering, and Longitudinal Progression Forecasting for Competitive Powerlifting**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![pandas](https://img.shields.io/badge/pandas-2.2+-150458.svg?logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![PyArrow](https://img.shields.io/badge/PyArrow-15.0+-D22128.svg?logo=apache-arrow&logoColor=white)](https://arrow.apache.org/)
[![Dataset](https://img.shields.io/badge/dataset-OpenPowerlifting-red.svg)](https://www.openpowerlifting.org/)

---

## 🔬 Overview & Problem Formulation

Standard strength standards in resistance training predominantly rely on arbitrary round-number tiers or static linear regressions (such as Wilks, DOTS, or IPF GL points) that fail to capture:
1. **Heterogeneous Demographics**: Non-linear variance across age brackets, weight divisions, and biological sex.
2. **Biomechanical Lift Proportions**: The interdependent trade-offs between squat, bench press, and deadlift execution.
3. **Longitudinal Diminishing Returns**: Progression rates conditioned on accumulated training age, prior competition frequency, and baseline performance.

**LiftStats** is an empirical data science and predictive modeling pipeline trained on **1,550,000+ sanctioned competition records** from the OpenPowerlifting database. It provides:
- **Exact Empirical CDF Percentile Modeling**: Non-parametric distribution estimation stratified by cohort.
- **Biomechanical Archetype Discovery**: Unsupervised $k$-Means clustering on lift ratio simplices.
- **Longitudinal Strength Progression Forecasting**: L2-regularized regression trained on paired historical meet trajectories with sex-stratified empirical prediction intervals.

---

## ⚡ Quick Start

### 🐳 Run with Docker (Recommended)
The fastest way to launch the complete integrated application (React 19 SPA + FastAPI backend + trained ML models) in a single command:

```sh
# Clone and enter repository
git clone https://github.com/pavlovus/liftstats.git
cd liftstats

# Build and start container
docker compose up --build
```

- **Web Dashboard**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 💻 Local Run (Without Docker)
If you prefer running directly on your host machine:

```sh
# 1. Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Launch unified server (serves both SPA frontend and REST API)
uvicorn app.backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🔄 Pipeline Reproduction

To reproduce data ingestion, preprocessing, ECDF tables, clustering, and regression modeling from scratch:

```sh
# 1. Ingest raw OpenPowerlifting records
python scripts/download_data.py

# 2. Clean, deduplicate, and filter SBD attempts
python scripts/preprocess.py

# 3. Extract longitudinal meet transitions
python scripts/build_longitudinal.py

# 4. Generate pre-aggregated cohort percentile tables
python scripts/build_percentile_tables.py

# 5. Fit sex-stratified archetype k-Means clusters
python scripts/cluster_archetypes.py

# 6. Train Ridge progression model and calculate empirical residual quantiles
python scripts/train_progression_model.py
```

---

## 📊 Dataset & Preprocessing Pipeline

The underlying data is derived from sanctioned powerlifting meets across all major international federations (IPF, USAPL, WRPF, USPA, etc.).

| Metric | Raw Dataset | Processed & Deduplicated |
|:---|:---|:---|
| **Total Attempts / Records** | 3,200,000+ | 1,553,241 |
| **Unique Competitors** | 680,000+ | 349,946 |
| **Longitudinal Meet Pairs** | — | 464,035 |
| **Disciplines** | Raw, Wraps, Single-ply, Multi-ply | Raw & Wraps (SBD Full Power) |

### Preprocessing & Hygiene Steps (`scripts/preprocess.py`)
1. **Event Filtering**: Restricted strictly to 3-lift full-power competitions (Squat, Bench Press, and Deadlift). Single-lift or push-pull meets are excluded.
2. **Disqualification Handling**: Lifters who bombed out (failed all attempts in any discipline) or were disqualified for anti-doping violations are pruned.
3. **Equip-Type Normalization**: Excluded multi-ply and mechanical assistive equipment to isolate biological athletic output.
4. **Demographic Imputation & Binning**:
   - **Weight Classes**: Mapped to standard IPF competition boundaries (`59`, `66`, `74`, `83`, `93`, `105`, `120`, `120+` for men; `47`, `52`, `57`, `63`, `69`, `76`, `84`, `84+` for women).
   - **Age Brackets**: Binned into chronological developmental categories: Sub-Junior (`14-18`), Junior (`19-23`), Open (`24-34`), Sub-Master (`35-39`), Master I (`40-49`), Master II (`50-59`), Master III (`60-69`), Master IV (`70+`).
   - **Testing Status**: Partitioned by federation anti-doping policies (drug-tested vs. non-tested divisions).

---

## 🧠 Modeling Methodology

### 1. Non-Parametric Empirical CDF Percentiles (`scripts/build_percentile_tables.py`)

Rather than imposing parametric assumptions (e.g., Gaussian or log-normal fits that mischaracterize elite tail distributions), percentiles are estimated using empirical cumulative distribution functions (ECDF) partitioned over discrete demographic cells:

$$\hat{F}_X(x) = \frac{1}{n} \sum_{i=1}^n \mathbf{1}_{X_i \le x}$$

- Partition key: $\text{Cohort} = (\text{Sex}, \text{WeightClass}, \text{AgeBracket}, \text{TestedStatus})$.
- Pre-aggregated Parquet tables ensure $O(1)$ constant-time lookup and sub-10ms query execution in production.

### 2. Biomechanical Archetype Clustering (`scripts/cluster_archetypes.py`)

To evaluate individual anthropometry and strength balance without confounding absolute body mass, each lifter's 3-lift performance is projected onto a 2-simplex:

$$\mathbf{p} = \left(\frac{\text{Squat}}{\text{Total}},\, \frac{\text{Bench}}{\text{Total}},\, \frac{\text{Deadlift}}{\text{Total}}\right), \quad \text{where } \sum p_i = 1$$

$k$-Means clustering was evaluated across $k \in [2, 6]$ using silhouette analysis and inertia elbow curves, converging on $k=3$ distinct, interpretable biomechanical archetypes for each sex:

#### Men ($k = 3$, $n = 239,698$)
| Cluster | Label | Squat % | Bench % | Deadlift % | Proportion | Median BW |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **0** | **Deadlift-dominant** | 33.7% | 22.2% | **44.1%** | 33.0% | 81.5 kg |
| **1** | **Squat-dominant** | **37.5%** | 22.5% | 40.0% | 39.9% | 89.9 kg |
| **2** | **Bench-specialist** | 34.2% | **26.6%** | 39.2% | 27.1% | 90.2 kg |
*Population Mean: Squat 35.3%, Bench 23.6%, Deadlift 41.1%*

#### Women ($k = 3$, $n = 110,248$)
| Cluster | Label | Squat % | Bench % | Deadlift % | Proportion | Median BW |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **0** | **Squat-dominant** | **38.4%** | 18.6% | 43.0% | 40.0% | 68.4 kg |
| **1** | **Deadlift-dominant** | 33.1% | 19.5% | **47.3%** | 29.9% | 64.6 kg |
| **2** | **Bench-specialist** | 35.9% | **22.7%** | 41.4% | 30.1% | 67.4 kg |
*Population Mean: Squat 36.1%, Bench 20.1%, Deadlift 43.8%*

### 3. Longitudinal Progression Forecasting (`scripts/train_progression_model.py`)

#### Target & Task Formulation
The model predicts the one-year absolute strength progression $\Delta \text{Total}_{365\text{d}} = \text{Total}_{t + 365\text{d}} - \text{Total}_t$ (in kg).

#### Preventing Target Leakage
Lifters frequently compete across multiple meets over decades. Standard random train/test splitting introduces severe identity leakage. We enforce **`GroupShuffleSplit` on `lifter_id` (80% train / 20% test)**:
- **Train Set**: 371,146 longitudinal pairs across 89,655 unique competitors.
- **Test Set**: 92,889 longitudinal pairs across 22,414 unseen competitors.

#### Model Architecture & Features
A regularized **Ridge Regression** pipeline wrapped in a `StandardScaler`:

$$\hat{y} = \arg\min_w \left( \|Xw - y\|_2^2 + \alpha \|w\|_2^2 \right)$$

| Feature | Description | Unscaled Weight |
|:---|:---|:---:|
| `is_male` | Indicator for biological sex | $+10.164$ kg |
| `days_to_next` | Temporal distance to next competition | $+0.0168$ kg/day |
| `training_age_years` | Years elapsed since first sanctioned meet | $-0.2666$ kg/year |
| `meets_so_far` | Prior cumulative competition experience | $-0.2086$ kg/meet |
| `wilks` | Current baseline bodyweight-adjusted coefficient | $-0.1149$ kg/pt |
| `age` | Lifter chronological age (decay modeling) | $-0.6039$ kg/year |
| `bodyweight` | Current athlete bodyweight (kg) | $-0.0294$ kg/kg |
| *Intercept* | Baseline model constant | $+16.399$ kg |

#### Validation Performance vs. Naive Baseline
Evaluated on the held-out 92,889 test pairs against a naive baseline predicting the training-set median progression:

| Model | MAE | $R^2$ |
|:---|:---:|:---:|
| **Naive Baseline (Median Gain)** | 21.67 kg | $-0.015$ |
| **Ridge Pipeline** | **20.46 kg** | **$+0.130$** |

#### Heteroscedastic Uncertainty Estimation
Because physical gains exhibit skewness and variance dependent on sex and training status, symmetrical Gaussian ($\pm \sigma$) error bounds are unrepresentative. We extract **empirical residual quantiles** ($q_{10}$ and $q_{90}$) stratified by sex:
- **Male Residuals**: $q_{10} = -35.21\text{ kg}$, $q_{90} = +34.77\text{ kg}$
- **Female Residuals**: $q_{10} = -23.54\text{ kg}$, $q_{90} = +23.04\text{ kg}$

The final progression forecast delivers an **80% prediction interval** calibrated directly to historical variation: $[\hat{y} + q_{10},\, \hat{y} + q_{90}]$.

---

## 📁 Project Structure

```
liftstats/
├── app/          # Production FastAPI inference service & web dashboard
│   ├── backend/  # REST API controllers, schemas, and in-memory caches
│   └── frontend/ # Analytical web client & visualizations
├── data/         # Raw OpenPowerlifting archives & processed Parquet tables
│   ├── raw/      # Raw openpowerlifting.csv dumps
│   └── processed/# Cleaned datasets, longitudinal pairs, and bucket tables
├── models/       # Serialized estimators and model cards
│   ├── kmeans_archetypes.joblib   # Trained sex-specific k-Means pipelines
│   ├── progression_model.pkl      # Trained Ridge pipeline & residual quantiles
│   ├── cluster_interpretation.md  # Detailed cluster profiling
│   └── progression_notes.md       # Regression metrics & residual tables
├── notebooks/    # Exploratory data analysis & prototype validation
│   ├── eda.ipynb                  # Distribution analysis & feature exploration
│   └── figures/                   # Generated charts & diagnostic plots
├── scripts/      # Reproducible ETL, processing, and training pipeline
│   ├── download_data.py           # Dataset acquisition
│   ├── preprocess.py              # Data hygiene & filtering
│   ├── build_longitudinal.py      # Longitudinal pair extraction
│   ├── build_percentile_tables.py # Non-parametric ECDF table builder
│   ├── cluster_archetypes.py      # k-Means archetype training
│   ├── train_progression_model.py # Ridge progression training
│   └── scoring.py                 # DOTS and Wilks mathematical formulations
├── tests/        # Pytest test suite (18 unit & parity tests)
└── requirements.txt
```

---

## 🔌 Primary Endpoint: `POST /api/analyze/full`

Aggregates demographic percentile scoring, archetype classification, and progression forecasting into a single call.

```sh
curl -X POST "http://localhost:8000/api/analyze/full" \
  -H "Content-Type: application/json" \
  -d '{
    "sex": "M",
    "age": 28.0,
    "bodyweight": 83.0,
    "squat": 210.0,
    "bench": 142.5,
    "deadlift": 260.0,
    "training_age": 4.5,
    "meets_so_far": 3,
    "tested_status": true
  }'
```

```json
{
  "total": 612.5,
  "percentiles": {
    "squat": {
      "lift_type": "squat",
      "user_weight": 210.0,
      "percentile": 64.2,
      "population_size": 23480,
      "median_lift": 197.5,
      "p25": 175.0,
      "p50": 197.5,
      "p75": 220.0,
      "p90": 242.5,
      "bins": [ ... ]
    },
    "bench": {
      "lift_type": "bench",
      "user_weight": 142.5,
      "percentile": 65.4,
      "population_size": 29245,
      "median_lift": 132.5,
      "p25": 115.0,
      "p50": 132.5,
      "p75": 150.0,
      "p90": 165.0,
      "bins": [ ... ]
    },
    "deadlift": {
      "lift_type": "deadlift",
      "user_weight": 260.0,
      "percentile": 80.7,
      "population_size": 25156,
      "median_lift": 230.0,
      "p25": 205.0,
      "p50": 230.0,
      "p75": 252.5,
      "p90": 275.0,
      "bins": [ ... ]
    },
    "total": {
      "lift_type": "total",
      "user_weight": 612.5,
      "percentile": 73.4,
      "population_size": 23362,
      "median_lift": 557.5,
      "p25": 497.5,
      "p50": 557.5,
      "p75": 615.0,
      "p90": 670.0,
      "bins": [ ... ]
    }
  },
  "archetype": {
    "label": "Deadlift-dominant",
    "user_shares": [34.3, 23.3, 42.4],
    "cluster_shares": [33.7, 22.2, 44.1],
    "all_clusters": {
      "Deadlift-dominant": [33.7, 22.2, 44.1],
      "Squat-dominant": [37.5, 22.5, 40.0],
      "Bench-specialist": [34.2, 26.6, 39.2]
    },
    "toggle": {
      "lift": "total",
      "value": 612.5,
      "age_bracket": "24-29",
      "weight_class": "82.5/83",
      "views": {
        "all": { "n": 27807, "percentile": 74.1 },
        "tested": { "n": 23362, "percentile": 73.4 },
        "untested": { "n": 4445, "percentile": 77.4 }
      },
      "explainer": "It barely changes for you: 74th percentile against everyone, 73rd against drug-tested lifters only..."
    }
  },
  "progression": {
    "total": 612.5,
    "point": 16.3,
    "lo": -18.9,
    "hi": 51.1,
    "views": {
      "wilks": { "score": 408.8, "percentile": 67.7, "n": 145966 },
      "dots": { "score": 413.5, "percentile": 68.7, "n": 145966 }
    },
    "explainer": "Wilks (1990s) and DOTS (2010s) both adjust your total for bodyweight..."
  }
}
```

---

## 📜 Dataset Attribution & References

- **Dataset**: [OpenPowerlifting project](https://www.openpowerlifting.org), licensed under the Open Database License (ODbL).
- **DOTS Formula**: Developed by the Dynamite Open Tracking System for bodyweight-normalized strength comparison.
- **Wilks Formula**: Wilks, R. (1994, updated 2020), Australian Powerlifting Federation.
- **License**: MIT License. See [LICENSE](LICENSE) for details.
