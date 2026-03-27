from fastapi import APIRouter, HTTPException
import torch
import numpy as np
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import AnomalyResponse
import api.main as main

router = APIRouter(prefix="/anomaly", tags=["M1: Anomaly Detection"])

@router.post("/detect", response_model=AnomalyResponse)
async def detect_anomaly(data: SensorWindow):
    model = main.models.get('anomaly')
    threshold = main.models.get('anomaly_threshold')
    
    if not model or not threshold:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    try:
        # shape: (batch=1, seq_len=60, features=43)
        input_tensor = torch.tensor([data.window], dtype=torch.float32)
        
        with torch.no_grad():
            output = model(input_tensor)
            mse = torch.mean((output - input_tensor) ** 2).item()
            
        return AnomalyResponse(
            score=mse,
            is_anomaly=mse > threshold,
            threshold=threshold
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
