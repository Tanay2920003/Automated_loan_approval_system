from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Loan Approval Prediction API")

# Load the trained model
model_data = joblib.load("model.joblib")
pipeline = model_data["pipeline"]
features = model_data["features"]

class LoanInput(BaseModel):
    no_of_dependents: int
    education: str
    self_employed: str
    income_annum: float
    loan_amount: float
    loan_term: float
    cibil_score: float
    residential_assets_value: float
    commercial_assets_value: float
    luxury_assets_value: float
    bank_asset_value: float

@app.post("/predict")
def predict_loan(data: LoanInput):
    # Convert input to DataFrame
    df = pd.DataFrame([data.dict()])[features]
    prediction = pipeline.predict(df)[0]
    proba = pipeline.predict_proba(df)[0][1] if hasattr(pipeline, "predict_proba") else None

    return {
        "loan_approval": "Approved" if prediction == 1 else "Rejected",
        "approval_probability": round(float(proba), 3) if proba is not None else None
    }
