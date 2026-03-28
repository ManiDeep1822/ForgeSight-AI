from fastapi import APIRouter, HTTPException
import torch
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import ClassificationResponse
import api.state as state
from api.utils import sanitize_float

router = APIRouter(prefix="/classification", tags=["M3: Failure Classification"])

@router.post("/classify", response_model=ClassificationResponse)
async def classify_failure(data: SensorWindow):
    model = state.models.get('classification')
    
    # Fallback if model missing
    if not model:
        classes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        return ClassificationResponse(
            failure_type="None",
            confidence=0.0,
            all_probs={cls: 0.0 for cls in classes}
        )
        
    try:
        input_tensor = torch.tensor([data.window], dtype=torch.float32).to(state.device)
        
        with torch.no_grad():
            probs = model(input_tensor).squeeze().cpu().numpy()
            
        # 5 failure classes
        classes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        max_idx = probs.argmax()
        
        conf_clean = sanitize_float(probs[max_idx])
        return ClassificationResponse(
            failure_type=classes[max_idx] if max_idx < len(classes) else "Unknown",
            confidence=conf_clean,
            all_probs={cls: sanitize_float(p) for cls, p in zip(classes, probs)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
