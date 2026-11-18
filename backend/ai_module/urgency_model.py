import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "model.pkl")
model = joblib.load(MODEL_PATH)


def predict_urgency(task: dict) -> float:
    severity = task["severity"]
    population = task["population_affected"]
    hours = task["hours_since_reported"]

    input_data = pd.DataFrame({
        "severity_score": [severity],
        "population_affected": [population],
        "hours_since_reported": [hours]
    })

    urgency = model.predict(input_data)[0]
    return round(float(urgency), 2)