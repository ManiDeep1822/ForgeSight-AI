from fastapi import APIRouter, HTTPException
from api.schemas.inputs import MaintenanceInput
from api.schemas.outputs import MaintenanceResponse
from models.maintenance.engine import suggest_maintenance
from pydantic import BaseModel

router = APIRouter(prefix="/maintenance", tags=["M7: Maintenance Engine"])

@router.post("/suggest", response_model=MaintenanceResponse)
async def get_maintenance_suggestion(data: MaintenanceInput):
    try:
        result = suggest_maintenance(
            health_index=data.health_index,
            rul=data.rul,
            failure_type=data.failure_type
        )
        
        return MaintenanceResponse(
            suggestion=result["suggestion"],
            urgency=result["urgency"],
            failure_type=result["failure_type"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
