from fastapi import APIRouter, HTTPException
import torch
from api.schemas.inputs import SensorWindow
from api.schemas.outputs import ClassificationResponse
import api.main as main

router = APIRouter(prefix="/classification", tags=["M3: Failure Classification"])

@router.post("/classify", response_model=ClassificationResponse)
async def classify_failure(data: SensorWindow):
    model = main.models.get('classification')
    
    # Fallback if model missing
    if not model:
        classes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        return ClassificationResponse(
            failure_type="None",
            confidence=0.0,
            all_probs={cls: 0.0 for cls in classes}
        )
        
    try:
        input_tensor = torch.tensor([data.window], dtype=torch.float32)
        
        with torch.no_grad():
            probs = model(input_tensor).squeeze().numpy()
            
        # 5 failure classes
        classes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        max_idx = probs.argmax()
        
        return ClassificationResponse(
            failure_type=classes[max_idx] if max_idx < len(classes) else "Unknown",
            confidence=float(probs[max_idx]),
            all_probs={cls: float(p) for cls, p in zip(classes, probs)}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
