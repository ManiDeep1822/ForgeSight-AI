from fastapi import APIRouter, HTTPException
import numpy as np
from api.schemas.inputs import CostInput
from api.schemas.outputs import CostResponse
import api.main as main

router = APIRouter(prefix="/cost", tags=["M6: Cost Estimation"])

@router.post("/estimate", response_model=CostResponse)
async def estimate_cost(data: CostInput):
    model = main.models.get('cost')
    
    # Fallback if model missing
    if not model:
        return CostResponse(
            estimated_cost=45.50,
            currency="USD"
        )
        
    try:
        # Features needed: failure_type_encoded, health_index, rul, machine_type_encoded
        fail_map = {'None': 0, 'TWF': 1, 'HDF': 2, 'PWF': 3, 'OSF': 4, 'RNF': 5}
        f_type = fail_map.get(data.failure_type, 0)
        
        mach_map = {'L': 0, 'M': 1, 'H': 2}
        m_type = mach_map.get(data.machine_type, 0)
        
        # Format input for xgboost
        x_input = np.array([[f_type, data.health_index, data.rul, m_type]])
        
        cost = model.predict(x_input)[0]
        
        return CostResponse(
            estimated_cost=float(max(0.0, cost)),
            currency="USD"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
