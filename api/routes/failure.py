from fastapi import APIRouter, HTTPException
import torch
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import FailureResponse
import api.state as state
from api.utils import sanitize_float

router = APIRouter(prefix="/failure", tags=["M2: Failure Prediction"])

@router.post("/predict", response_model=FailureResponse)
async def predict_failure(data: SensorWindow):
    model = state.models.get('failure')
    
    if not model:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    try:
        input_tensor = torch.tensor([data.window], dtype=torch.float32).to(state.device)
        
        with torch.no_grad():
            prob = model(input_tensor).item()
            
        prob_clean = sanitize_float(prob)
        return FailureResponse(
            probability=prob_clean,
            will_fail=prob_clean >= 0.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
