from pydantic import BaseModel
from typing import Dict, Any

class AnomalyResponse(BaseModel):
    score: float
    is_anomaly: bool
    threshold: float

class FailureResponse(BaseModel):
    probability: float
    will_fail: bool

class ClassificationResponse(BaseModel):
    failure_type: str
    confidence: float
    all_probs: Dict[str, float]

class RULResponse(BaseModel):
    rul_value: float
    unit: str

class HealthResponse(BaseModel):
    health_index: float
    status: str

class CostResponse(BaseModel):
    estimated_cost: float
    currency: str

class MaintenanceResponse(BaseModel):
    suggestion: str
    urgency: int
    failure_type: str

class SHAPResponse(BaseModel):
    feature_importance: Dict[str, float]
    cached: bool
