from pydantic import BaseModel
from typing import List

class SensorWindow(BaseModel):
    # window shape: [60, n_features]
    window: List[List[float]]
    machine_type: str

class CostInput(BaseModel):
    failure_type: str
    health_index: float
    rul: float
    machine_type: str

class MaintenanceInput(BaseModel):
    health_index: float
    rul: float
    failure_type: str
