from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap 
import sqlite3 
import json
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict
import auth
import datetime

# --- Configuration ---
MODEL_FILE = "model.joblib"
# Define the institutional risk policy threshold (50% chance of default or higher is rejection)
RISK_THRESHOLD = 0.50 
DATABASE_FILE = "audit.db"

# Initialize FastAPI app
app = FastAPI(title="FinTech-Approve: Loan Approval Prediction API")

# Enable CORS (Allows frontend to communicate with this API)
app.add_middleware(
    CORSMiddleware,
    # Use specific origins for robustness, including common development addresses
    allow_origins=["http://localhost:3000", "http://127.0.0.1:8000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialization and Logging Functions ---

def init_db():
    """Initializes the SQLite database and creates the audit table if it doesn't exist."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # User account table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                hashed_password TEXT,
                full_name TEXT
            )
        """)

        # Table schema to store decision details and XAI reasons
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS loan_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                timestamp TEXT,
                loan_approval TEXT,
                approval_probability REAL,
                risk_band TEXT,            -- Added in Phase 3
                input_data TEXT,           -- Original JSON input data
                risk_drivers_json TEXT,    -- XAI drivers stored as JSON string
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        conn.commit()
        conn.close()
        print(f"Database {DATABASE_FILE} initialized successfully.")
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")

# Run initialization once on server startup
init_db()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = auth.decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return {"id": user[0], "username": user[1], "full_name": user[2]}

def log_audit_entry(user_id: Optional[int], input_data: dict, loan_approval: str, proba: float, risk_band: str, risk_drivers: list):
    """Saves a single decision record to the audit table."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Convert complex objects to JSON strings for storage
        input_data_json = json.dumps(input_data)
        risk_drivers_json = json.dumps(risk_drivers)
        
        timestamp = pd.Timestamp.now().isoformat()
        
        cursor.execute("""
            INSERT INTO loan_audits (user_id, timestamp, loan_approval, approval_probability, risk_band, input_data, risk_drivers_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, timestamp, loan_approval, proba, risk_band, input_data_json, risk_drivers_json))
        
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        print(f"Error logging audit entry: {e}")

# --- Model Loading and Initialization ---
try:
    model_data = joblib.load(MODEL_FILE)
    pipeline = model_data["pipeline"]
    features = model_data["features"]
    
    # ----------------------------------------------------------------------------------
    # --- ROBUST SHAP FIX: Use PermutationExplainer on Transformed Data ---
    
    # 1. Extract the actual classifier model from the pipeline
    classifier = pipeline.named_steps['classifier']
    preprocessor = pipeline.named_steps['preprocessor']

    # 2. Get the transformed feature names
    # This is complex, but generally the input features plus the OHE columns.
    ohe_feature_names = list(preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(model_data['categorical_features']))
    
    # Assuming 'numeric_features' is available in model_data (standard practice)
    transformed_feature_names = model_data['numeric_features'] + list(ohe_feature_names)
    
    # 3. Create a stable background set by transforming the dummy data once
    # We transform the *dummy* background data used previously to ensure correct SHAP dimensions.
    background_data_dict = {
        'no_of_dependents': [0.0], 'education': ['Graduate'], 'self_employed': ['No'],    
        'income_annum': [0.0], 'loan_amount': [0.0], 'loan_term': [0.0], 
        'cibil_score': [0.0], 'residential_assets_value': [0.0], 'commercial_assets_value': [0.0], 
        'luxury_assets_value': [0.0], 'bank_asset_value': [0.0]
    }
    background_df_raw = pd.DataFrame(background_data_dict)[features]
    
    # We only use the transformed data for the explainer's reference
    transformed_background = preprocessor.transform(background_df_raw)

    # 4. Define the SHAP prediction function to run ONLY the classifier
    def classifier_prediction_function(X_transformed):
        # We need to return the probability for the positive class (index 1)
        return classifier.predict_proba(X_transformed)[:, 1]

    # 5. Initialize the Explainer
    # Use the PermutationExplainer, which is more robust for tabular models.
    explainer = shap.PermutationExplainer(
        classifier_prediction_function, 
        transformed_background # Explainer now works on the numpy array output of the preprocessor
    )
    
    print(f"Model and SHAP Explainer loaded successfully. Transformed Features: {len(transformed_feature_names)}")
    
    # ----------------------------------------------------------------------------------
    
except Exception as e:
    print(f"Error loading model or initializing SHAP: {e}")
    pipeline = None
    features = []
    # If SHAP fails, define a generic list of feature names to prevent a crash later
    transformed_feature_names = [] 

class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Auth Endpoints
@app.post("/api/v1/auth/register")
def register(user: UserRegister):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    cursor.execute("INSERT INTO users (username, hashed_password, full_name) VALUES (?, ?, ?)", 
                   (user.username, hashed_pw, user.full_name))
    conn.commit()
    conn.close()
    return {"message": "User registered successfully"}

@app.post("/api/v1/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT hashed_password FROM users WHERE username = ?", (form_data.username,))
    result = cursor.fetchone()
    conn.close()
    
    if not result or not auth.verify_password(form_data.password, result[0]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/user/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, loan_approval, approval_probability, input_data, risk_drivers_json 
        FROM loan_audits 
        WHERE user_id = ? 
        ORDER BY timestamp DESC
    """, (current_user["id"],))
    results = cursor.fetchall()
    conn.close()
    
    history = []
    for row in results:
        history.append({
            "timestamp": row[0],
            "loan_approval": row[1],
            "approval_probability": row[2],
            "input_data": json.loads(row[3]),
            "risk_drivers": json.loads(row[4])
        })
    
    return {
        "user": current_user,
        "application_history": history
    }

# Define input schema (UNCHANGED)
class LoanInput(BaseModel):
    # Set to float to match the numerical treatment in the ML pipeline
    no_of_dependents: float 
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

# Prediction endpoint
@app.post("/predict")
@app.post("/api/v1/predict")
def predict_loan(data: LoanInput, token: Optional[str] = Depends(oauth2_scheme)):
    # Extract user if token is provided
    current_user = None
    if token:
        try:
            current_user = get_current_user(token)
        except:
            pass # Prediction continues as anonymous if token is invalid
            
    if pipeline is None:
        return {"error": "Model not loaded. Check server logs."}
        
    # Get dictionary of input data
    input_data_dict = data.dict()
    df = pd.DataFrame([input_data_dict])[features]

    # Get prediction probability (P(Approval) at index [1])
    proba = pipeline.predict_proba(df)[0][1] if hasattr(pipeline, "predict_proba") else None
    
    # 1. Apply Decision Logic (Configurable Business Rule Engine)
    if proba is None:
        loan_approval = "Error"
        confidence = 0
        risk_band = "Unknown"
    # FIX: If P(Approval) is greater than or equal to threshold, APPROVE.
    elif proba >= RISK_THRESHOLD:
        loan_approval = "Approved"
        confidence = float(proba)
        # Higher proba = Lower risk
        risk_band = "Low" if proba > 0.8 else "Medium"
    # Otherwise, REJECT.
    else:
        loan_approval = "Rejected"
        confidence = float(1 - proba)
        # Lower proba = Higher risk
        risk_band = "High" if proba < 0.3 else "Medium"

    # 2. Calculate Financial Ratios (New in Phase 2)
    # Annual EMI estimate (principal only for simplicity)
    annual_emi = data.loan_amount / max(data.loan_term, 1)
    dti_ratio = round(annual_emi / max(data.income_annum, 1), 2)
    
    total_assets = (data.residential_assets_value + data.commercial_assets_value + 
                    data.luxury_assets_value + data.bank_asset_value)
    asset_coverage = round(total_assets / max(data.loan_amount, 1), 2)

    # 3. Calculate Explainable AI (XAI) - SHAP Values (MODIFIED CALL)
    
    # Transform the single input instance using the fitted preprocessor 
    X_transformed = preprocessor.transform(df) 
    
    # Calculate SHAP values on the transformed input using the specialized explainer
    shap_values = explainer.shap_values(X_transformed)[0]
    
    feature_contributions = list(zip(transformed_feature_names, shap_values))
    sorted_contributions = sorted(feature_contributions, key=lambda x: abs(x[1]), reverse=True)
    
    risk_drivers = []
    for feature, contribution in sorted_contributions[:5]:
        clean_feature = feature.replace('_', ' ').title().replace('Graduate', 'Education: Graduate')
        risk_drivers.append({
            "feature": clean_feature,
            "contribution_score": float(contribution),
            "effect": "Support Rejection" if contribution > 0 else "Support Approval"
        })

    # 4. Generate Actionable Next Steps (New in Phase 2)
    actionable_steps = []
    if loan_approval == "Rejected":
        # Find strongest support for rejection
        top_rejector = sorted(risk_drivers, key=lambda x: x["contribution_score"] if x["effect"] == "Support Rejection" else -999, reverse=True)[0]
        if "Cibil" in top_rejector["feature"]:
            actionable_steps.append("Focus on improving your CIBIL score. A score above 750 is ideal for this loan amount.")
        elif "Income" in top_rejector["feature"] or "Amount" in top_rejector["feature"]:
            actionable_steps.append("Consider reducing your loan amount request or declaring additional supplementary income.")
        elif "Asset" in top_rejector["feature"]:
            actionable_steps.append("Increasing your declared asset value (e.g., bank balance or residential assets) could shift the decision.")
        else:
            actionable_steps.append(f"Targeted improvement in {top_rejector['feature']} would significantly boost your approval odds.")
    else:
        if risk_band == "Medium":
            actionable_steps.append("You are in the Medium risk band. Maintaining your CIBIL score for 6 more months could move you to Low risk.")
        else:
            actionable_steps.append("Your profile is strong! Continue maintaining your current debt-to-income balance.")

    # 5. LOG THE AUDIT ENTRY
    log_audit_entry(
        user_id=current_user["id"] if current_user else None,
        input_data=data.dict(),
        loan_approval=loan_approval,
        proba=proba,
        risk_band=risk_band,
        risk_drivers=risk_drivers
    )

    # 6. Return Enhanced Response
    return {
        "loan_approval": loan_approval,
        "approval_probability": round(float(proba), 3) if proba is not None else None,
        "confidence": round(confidence, 2),
        "risk_band": risk_band,
        "risk_score": round(float(1 - proba), 2) if proba is not None else None,
        "risk_drivers": risk_drivers,
        "financial_metrics": {
            "dti_ratio": dti_ratio,
            "asset_coverage": asset_coverage,
            "total_assets": total_assets
        },
        "actionable_steps": actionable_steps
    }

# Optional: basic health check route (EXISTING)
@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "online",
        "version": "v1.0.0",
        "message": "FinTech-Approve AI Intelligence Platform is running."
    }

@app.get("/api/v1/knowledge/{term}")
async def get_glossary(term: str):
    knowledge_base = {
        "cibil": {
            "title": "CIBIL Score",
            "definition": "A 3-digit numeric summary of your credit history, ranging from 300 to 900.",
            "ideal_range": "750+",
            "how_to_improve": ["Pay bills on time", "Keep credit utilization low", "Avoid frequent loan applications"]
        },
        "debt-to-income": {
            "title": "Debt-to-Income Ratio",
            "definition": "The percentage of your gross monthly income that goes toward paying monthly debt.",
            "ideal_range": "Below 36%",
            "how_to_improve": ["Reduce monthly recurring debt", "Increase your gross monthly income"]
        },
        "credit-utilization": {
            "title": "Credit Utilization",
            "definition": "The ratio of your outstanding credit balance to your total credit limit.",
            "ideal_range": "Below 30%",
            "how_to_improve": ["Pay off balances early", "Increase credit limits without spending more"]
        }
    }
    return knowledge_base.get(term.lower(), {"error": "Term not found in knowledge base."})

@app.get("/api/v1/user/analytics")
def get_user_analytics(current_user: Optional[dict] = Depends(get_current_user)):
    """Retrieves time-series data and behavioral metrics for the personal dashboard."""
    user_id = current_user["id"] if current_user else None
    
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # 1. Trend Data (Last 10 applications)
        cursor.execute("""
            SELECT timestamp, approval_probability, risk_band 
            FROM loan_audits 
            WHERE user_id IS ? OR (user_id IS NULL AND ? IS NULL)
            ORDER BY timestamp ASC LIMIT 10
        """, (user_id, user_id))
        history = [{"time": r[0], "prob": r[1], "band": r[2]} for r in cursor.fetchall()]
        
        # 2. Behavioral Ratios (Most Recent)
        cursor.execute("SELECT input_data FROM loan_audits WHERE user_id IS ? ORDER BY timestamp DESC LIMIT 1", (user_id,))
        recent = cursor.fetchone()
        metrics = {}
        if recent:
            data = json.loads(recent[0])
            income = data.get('income_annum', 0) / 12
            loan = data.get('loan_amount', 0)
            term = data.get('loan_term', 1)
            metrics = {
                "dti": round((loan / term) / income, 2) if income > 0 else 0,
                "asset_coverage": round((data.get('residential_assets_value', 0) + data.get('bank_asset_value', 0)) / loan, 2) if loan > 0 else 0,
                "stability_index": "High" if data.get('cibil_score', 0) > 700 else "Moderate"
            }
            
        conn.close()
        return {
            "score_trend": history,
            "behavioral_metrics": metrics,
            "synthetic_score": 700 + (len(history) * 10) # Mock synthetic score growth
        }
    except Exception as e:
        return {"error": str(e)}

class ChatRequest(BaseModel):
    message: str
    context: dict = {}

@app.get("/api/v1/admin/stats")
def get_admin_stats():
    """Aggregates loan application data for the admin dashboard."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # 1. Basic Counts
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN loan_approval='Approved' THEN 1 ELSE 0 END) FROM loan_audits")
        total, approved = cursor.fetchone()
        
        # 2. Risk Distribution
        cursor.execute("SELECT risk_band, COUNT(*) FROM loan_audits GROUP BY risk_band")
        risk_dist = dict(cursor.fetchall())
        
        # 3. Recent Activity (Last 5)
        cursor.execute("SELECT timestamp, loan_approval, approval_probability, risk_band FROM loan_audits ORDER BY timestamp DESC LIMIT 5")
        recent = [{"time": r[0], "status": r[1], "score": r[2], "band": r[3]} for r in cursor.fetchall()]
        
        conn.close()
        return {
            "total_applications": total or 0,
            "approval_rate": round((approved / total) * 100, 1) if total and approved else 0,
            "risk_distribution": risk_dist,
            "recent_activity": recent
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/ai/chat")
async def ai_chat(request: ChatRequest):
    """Upgraded Advisor that takes application context into account."""
    msg = request.message.lower()
    ctx = request.context # Contains recent prediction data
    
    # Context-aware logic
    if ctx and "loan_approval" in ctx:
        status = ctx["loan_approval"]
        band = ctx.get("risk_band", "High")
        
        if "my result" in msg or "why" in msg:
            if status == "Rejected":
                return {"reply": f"Your application was rejected because our model identified you in the {band} risk category. I recommend looking at the 'Action Plan' which suggests focusing on your CIBIL or assets."}
            else:
                return {"reply": f"Congratulations! Your application was approved with a {band} risk rating. This is a very strong profile."}

    # General Knowledge logic
    if "cibil" in msg:
        return {"reply": "Your CIBIL score is a 3-digit summary of your credit history. Scores above 750 are generally required for instant approval."}
    elif "dti" in msg or "income" in msg:
        return {"reply": "Debt-to-Income (DTI) ratio measures how much of your income goes to EMIs. Keeping this below 40% is ideal."}
    
    return {"reply": "I am your AI Financial Advisor. You can ask me about your recent results or general financial health!"}

# Mount the static files (built Next.js frontend)
# We assume the 'static' directory contains the exported Next.js files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    # Only mount subdirectories if they actually exist
    next_static = os.path.join(static_dir, "_next")
    if os.path.exists(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next_static")
    
    images_static = os.path.join(static_dir, "images")
    if os.path.exists(images_static):
        app.mount("/images", StaticFiles(directory=images_static), name="images_static")
    # Add other static mounts if needed (e.g., manifest.json, icons)

@app.get("/{rest_of_path:path}")
async def serve_frontend(rest_of_path: str):
    # Try to serve a specific file if it exists in the static directory
    file_path = os.path.join(static_dir, rest_of_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Default to serving index.html for all other routes (SPA behavior)
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Static files not found. Please build the frontend."}
