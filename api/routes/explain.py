from fastapi import APIRouter, HTTPException
from typing import Dict
from pydantic import BaseModel
import torch
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import SHAPResponse
from models.explainability.shap_layer import explain_async
import api.state as state
from api.utils import sanitize_dict

router = APIRouter(prefix="/explain", tags=["M8: Explainability"])

FEAT_NAMES = [
    'air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear', 
    'machine_type_encoded', 'temp_diff', 'power', 'thermal_load', 'wear_rate', 
    'torque_speed_stress', 'thermal_efficiency', 'wear_per_cycle', 'tool_wear_normalized', 
    'power_normalized', 'thermal_load_normalized', 'risk_index', 
    'air_temperature_missing_flag', 'process_temperature_missing_flag', 'rotational_speed_missing_flag', 
    'torque_missing_flag', 'tool_wear_missing_flag', 'air_temperature_diff', 
    'air_temperature_rolling_mean_10', 'air_temperature_rolling_std_10', 
    'process_temperature_diff', 'process_temperature_rolling_mean_10', 'process_temperature_rolling_std_10', 
    'rotational_speed_diff', 'rotational_speed_rolling_mean_10', 'rotational_speed_rolling_std_10', 
    'torque_diff', 'torque_rolling_mean_10', 'torque_rolling_std_10', 'tool_wear_diff', 
    'tool_wear_rolling_mean_10', 'tool_wear_rolling_std_10', 'power_diff', 
    'power_rolling_mean_10', 'power_rolling_std_10', 'temp_diff_diff', 
    'temp_diff_rolling_mean_10', 'temp_diff_rolling_std_10'
]

@router.post("/", response_model=SHAPResponse)
async def get_explanation(data: SensorWindow):
    model = state.models.get('failure') # Explain the failure predictor usually
    
    if not model:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    try:
        # shape: (1, 60, features)
        input_tensor = torch.tensor([data.window], dtype=torch.float32).to(state.device)
        
        # bg_tensor should ideally be drawn from training set, 
        # using zeros as a fast fallback surrogate for API real-time requirement
        bg_tensor = torch.zeros((10, 60, state.GLOBAL_FEATURE_NUM), dtype=torch.float32).to(state.device)
        
        result = await explain_async(input_tensor, model, bg_tensor, feature_names=FEAT_NAMES)
        
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result.get("message", "SHAP evaluation failed"))
            
        cached = result.pop("cached", False)
        
        sanitized_result = sanitize_dict(result)
        
        return SHAPResponse(
            feature_importance=sanitized_result,
            cached=cached
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
