# LiftStats

LiftStats analyzes powerlifting meet results and provides training-type and
progression views.

## Data and model workflow

Run the data and model steps from the repository root:

1. `python scripts/download_data.py`
2. `python scripts/preprocess.py`
3. `python scripts/build_longitudinal.py`
4. `python scripts/build_percentile_tables.py`
5. `python scripts/train_progression_model.py`

## Run the backend (FastAPI)

Install the dependencies from `requirements.txt`, then start the FastAPI
server from the repository root:

```sh
pip install -r requirements.txt
uvicorn app.backend.main:app --reload --port 8000
```

- API Docs (Swagger UI): <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>

## Run the tests

Run the test suite using pytest:

```sh
pytest tests/ -v
```
