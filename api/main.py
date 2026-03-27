import sys
import os
import torch
import pickle
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.anomaly.model import LSTMAutoencoder
from models.failure_prediction.model import LSTMClassifier
from models.failure_classification.model import CNNLSTMClassifier
from models.rul.model import TransformerRUL

app = FastAPI(title="CNC Machine Health Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and scalers
models = {}
GLOBAL_FEATURE_NUM = 43 # Based on the generated preprocessing pipeline

@app.on_event("startup")
async def load_models():
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'saved_models')
    
    model_paths = {
        'scaler': os.path.join(base_dir, 'scaler.pkl'),
        'anomaly': os.path.join(base_dir, 'anomaly_model.pt'),
        'anomaly_threshold': os.path.join(base_dir, 'anomaly_threshold.pkl'),
        'failure': os.path.join(base_dir, 'failure_model.pt'),
        'classification': os.path.join(base_dir, 'classification_model.pt'),
        'rul': os.path.join(base_dir, 'rul_model.pt'),
        'cost': os.path.join(base_dir, 'cost_model.pkl')
    }
    
    # Check if models exist (log warning if missing instead of crashing)
    missing = []
    for name, path in model_paths.items():
        if not os.path.exists(path):
            missing.append(name)
            print(f"WARNING: Missing model file: {path} for {name}. Some features will use fallback logic.")
            
    # Load Scalers
    if 'scaler' in models or os.path.exists(model_paths['scaler']):
        with open(model_paths['scaler'], 'rb') as f:
            models['scaler'] = pickle.load(f)
        
    if 'anomaly_threshold' in models or os.path.exists(model_paths['anomaly_threshold']):
        with open(model_paths['anomaly_threshold'], 'rb') as f:
            models['anomaly_threshold'] = pickle.load(f)
        
    # Load Models (if files exist)
    if 'anomaly' not in missing:
        m1 = LSTMAutoencoder(input_size=GLOBAL_FEATURE_NUM, hidden=64, num_layers=2)
        m1.load_state_dict(torch.load(model_paths['anomaly']))
        m1.eval()
        models['anomaly'] = m1
    
    if 'failure' not in missing:
        m2 = LSTMClassifier(input_size=GLOBAL_FEATURE_NUM, hidden=128, num_layers=2)
        m2.load_state_dict(torch.load(model_paths['failure']))
        m2.eval()
        models['failure'] = m2
    
    if 'classification' not in missing:
        m3 = CNNLSTMClassifier(input_size=GLOBAL_FEATURE_NUM, num_classes=5)
        m3.load_state_dict(torch.load(model_paths['classification']))
        m3.eval()
        models['classification'] = m3
    
    if 'rul' not in missing:
        m4 = TransformerRUL(input_size=GLOBAL_FEATURE_NUM, d_model=64, nhead=4, num_layers=3)
        m4.load_state_dict(torch.load(model_paths['rul']))
        m4.eval()
        models['rul'] = m4
    
    if 'cost' not in missing:
        with open(model_paths['cost'], 'rb') as f:
            models['cost'] = pickle.load(f)

    print("All models loaded successfully!")

# Ensure __init__.py exists in api/routes to import properly
import api.routes.anomaly as anomaly
import api.routes.failure as failure
import api.routes.classification as classification
import api.routes.rul as rul
import api.routes.health as health
import api.routes.cost as cost
import api.routes.maintenance as maintenance
import api.routes.explain as explain

app.include_router(anomaly.router)
app.include_router(failure.router)
app.include_router(classification.router)
app.include_router(rul.router)
app.include_router(health.router)
app.include_router(cost.router)
app.include_router(maintenance.router)
app.include_router(explain.router)

if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)
