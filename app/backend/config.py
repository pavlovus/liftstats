from pathlib import Path

# Project root is the parent of app/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Data paths
DATA_DIR = PROJECT_ROOT / "data" / "processed"
PARQUET_DATA_PATH = DATA_DIR / "clean_data.parquet"
CSV_DATA_PATH = DATA_DIR / "clean_data.csv"
PERCENTILE_TABLES_PATH = DATA_DIR / "percentile_tables.parquet"

# Models paths
MODELS_DIR = PROJECT_ROOT / "models"
KMEANS_MODEL_PATH = MODELS_DIR / "kmeans_archetypes.joblib"
PROGRESSION_MODEL_PATH = MODELS_DIR / "progression_model.pkl"

# Constants
MIN_PEERS_THRESHOLD = 50
VALID_LIFTS = ("squat", "bench", "deadlift", "total")
VALID_SEXES = ("M", "F")
