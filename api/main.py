import sys
import os
import torch
import pickle
import xgboost as xgb
import json
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.schemas.inputs import SensorWindow
import api.state as state
from api.utils import sanitize_dict
from models.anomaly.model import LSTMAutoencoder
from models.failure_prediction.model import LSTMClassifier
from models.failure_classification.model import CNNLSTMClassifier
from models.rul.model import TransformerRUL

class GlobalSafeJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        # Recursively sanitize content before serialization
        safe_content = sanitize_dict(content) if isinstance(content, dict) else content
        return json.dumps(
            safe_content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models
    await load_models()
    yield
    # Shutdown: Clean up if necessary
    state.models.clear()

app = FastAPI(
    title="CNC Machine Health Monitoring API", 
    lifespan=lifespan,
    default_response_class=GlobalSafeJSONResponse
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    missing = []
    for name, path in model_paths.items():
        if not os.path.exists(path):
            missing.append(name)
            print(f"WARNING: Missing model file: {path} for {name}. Some features will use fallback logic.")
            
    # Load Scalers
    if 'scaler' not in missing:
        try:
            with open(model_paths['scaler'], 'rb') as f:
                state.models['scaler'] = pickle.load(f)
        except Exception as e:
            print(f"ERROR loading scaler: {e}")
        
    if 'anomaly_threshold' not in missing:
        try:
            with open(model_paths['anomaly_threshold'], 'rb') as f:
                state.models['anomaly_threshold'] = pickle.load(f)
        except Exception as e:
            print(f"ERROR loading anomaly threshold: {e}")
        
    # Load Models (if files exist)
    try:
        if 'anomaly' not in missing:
            m1 = LSTMAutoencoder(input_size=state.GLOBAL_FEATURE_NUM, hidden=64, num_layers=2).to(state.device)
            m1.load_state_dict(torch.load(model_paths['anomaly'], map_location=state.device))
            m1.eval()
            state.models['anomaly'] = m1
        
        if 'failure' not in missing:
            m2 = LSTMClassifier(input_size=state.GLOBAL_FEATURE_NUM, hidden=128, num_layers=2).to(state.device)
            m2.load_state_dict(torch.load(model_paths['failure'], map_location=state.device))
            m2.eval()
            state.models['failure'] = m2
        
        if 'classification' not in missing:
            m3 = CNNLSTMClassifier(input_size=state.GLOBAL_FEATURE_NUM, num_classes=5).to(state.device)
            m3.load_state_dict(torch.load(model_paths['classification'], map_location=state.device))
            m3.eval()
            state.models['classification'] = m3
        
        if 'rul' not in missing:
            m4 = TransformerRUL(input_size=state.GLOBAL_FEATURE_NUM, d_model=32, nhead=4, num_layers=2).to(state.device)
            m4.load_state_dict(torch.load(model_paths['rul'], map_location=state.device))
            m4.eval()
            state.models['rul'] = m4
        
        if 'cost' not in missing:
            with open(model_paths['cost'], 'rb') as f:
                state.models['cost'] = pickle.load(f)
                
        print(f"Models loaded successfully on device: {state.device}")
    except Exception as e:
        print(f"CRITICAL ERROR during model initialization: {e}")

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
