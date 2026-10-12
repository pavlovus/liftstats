# LiftStats

LiftStats analyzes powerlifting meet results and provides training-type and
progression views.

## Data and model workflow

Run the data and model steps from the repository root:

1. `python download_data.py`
2. `python preprocess.py`
3. `python scripts/build_longitudinal.py`
4. `python scripts/train_progression_model.py`

## Run the app

Install the app dependencies from `app/requirements.txt`, then start the Flask
app from the `app/` directory:

```sh
pip install -r requirements.txt
python app.py
```

- Training type: <http://localhost:5000/training-type>
- Progression: <http://localhost:5000/progress>
