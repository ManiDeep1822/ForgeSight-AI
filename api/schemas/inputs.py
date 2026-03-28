from pydantic import BaseModel, field_validator
from typing import List
import math

class SensorWindow(BaseModel):
    # window shape: [60, n_features]
    window: List[List[float]]
    machine_type: str
    
    @field_validator('window')
    @classmethod
    def check_finite(cls, v: List[List[float]]) -> List[List[float]]:
        for row in v:
            for item in row:
                if not math.isfinite(item):
                    raise ValueError('Input data contains non-finite values (NaN or inf)')
        return v

class CostInput(BaseModel):
    failure_type: str
    health_index: float
    rul: float
    machine_type: str
    
    @field_validator('health_index', 'rul')
    @classmethod
    def check_finite(cls, v: float) -> float:
        if not math.isfinite(v):
            raise ValueError(f'Input contains non-finite value: {v}')
        return v

class MaintenanceInput(BaseModel):
    health_index: float
    rul: float
    failure_type: str
    
    @field_validator('health_index', 'rul')
    @classmethod
    def check_finite(cls, v: float) -> float:
        if not math.isfinite(v):
            raise ValueError(f'Input contains non-finite value: {v}')
        return v
