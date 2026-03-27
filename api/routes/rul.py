from fastapi import APIRouter, HTTPException
import torch
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import RULResponse
import api.main as main

router = APIRouter(prefix="/rul", tags=["M4: RUL Estimation"])

@router.post("/estimate", response_model=RULResponse)
async def estimate_rul(data: SensorWindow):
    model = main.models.get('rul')
    
    # Fallback if model missing
    if not model:
        return RULResponse(
            rul_value=150.0,
            unit="time_steps"
        )
        
    try:
        input_tensor = torch.tensor([data.window], dtype=torch.float32)
        
        with torch.no_grad():
            rul = model(input_tensor).item()
            
        return RULResponse(
            rul_value=max(0.0, rul),
            unit="time_steps"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
