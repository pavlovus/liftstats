from pathlib import Path
from flask import Flask, redirect

from training_type import bp
from progress import progress_bp

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / 'templates'),
    static_folder=str(BASE_DIR / 'static'),
)
app.secret_key = 'dev'

app.register_blueprint(bp)
app.register_blueprint(progress_bp)      

@app.get("/")
def home():
    return redirect("/training-type")

if __name__ == "__main__":
    app.run(debug=True)
    