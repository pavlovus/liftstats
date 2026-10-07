from flask import Flask, redirect
from training_type import bp

app = Flask(__name__)
app.register_blueprint(bp)

@app.get("/")
def home():
    return redirect("/training-type")

if __name__ == "__main__":
    app.run(debug=True)