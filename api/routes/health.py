from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.schemas.outputs import HealthResponse
from models.health_index.scorer import compute_health_index

router = APIRouter(prefix="/health", tags=["M5: Health Index"])

class HealthInput(BaseModel):
    anomaly_score: float
    failure_prob: float
    rul: float
    class_confidence: float

@router.post("/score", response_model=HealthResponse)
async def score_health(data: HealthInput):
    try:
        hi = compute_health_index(
            anomaly_score=data.anomaly_score,
            failure_prob=data.failure_prob,
            rul=data.rul,
            class_confidence=data.class_confidence
        )
        
        status = "Healthy"
        if hi < 20: status = "Critical"
        elif hi < 40: status = "Poor"
        elif hi < 60: status = "Fair"
        elif hi < 80: status = "Good"
            
        return HealthResponse(
            health_index=hi,
            status=status
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
