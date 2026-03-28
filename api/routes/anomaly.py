from fastapi import APIRouter, HTTPException
import torch
import numpy as np
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import AnomalyResponse
import api.state as state
from api.utils import sanitize_float

router = APIRouter(prefix="/anomaly", tags=["M1: Anomaly Detection"])

@router.post("/detect", response_model=AnomalyResponse)
async def detect_anomaly(data: SensorWindow):
    model = state.models.get('anomaly')
    threshold = state.models.get('anomaly_threshold')
    
    if not model or not threshold:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    try:
        # shape: (batch=1, seq_len=60, features=43)
        input_tensor = torch.tensor([data.window], dtype=torch.float32).to(state.device)
        
        with torch.no_grad():
            output = model(input_tensor)
            # Ensure comparison happens on same device or as items
            mse = torch.mean((output - input_tensor) ** 2).item()
            
        mse_clean = sanitize_float(mse)
        threshold_clean = sanitize_float(threshold)
        
        return AnomalyResponse(
            score=mse_clean,
            is_anomaly=mse_clean > threshold_clean,
            threshold=threshold_clean
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
