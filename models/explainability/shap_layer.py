import shap
import torch
import asyncio
import numpy as np
import math

# Use the same sanitize helper for consistency
from api.utils import sanitize_float

# Cache results keyed by input hash
_SHAP_CACHE = {}

def compute_shap_sync(input_tensor: torch.Tensor, model: torch.nn.Module, bg_tensor: torch.Tensor, feature_names: list = None) -> dict:
    """
    Synchronous SHAP computation using shap.GradientExplainer for PyTorch models.
    """
    try:
        model.eval()
        explainer = shap.GradientExplainer(model, bg_tensor)
        shap_values = explainer.shap_values(input_tensor)
        
        if isinstance(shap_values, list):
            shap_vals = shap_values[0]
        else:
            shap_vals = shap_values
            
        # Average over batch and sequence dimension
        # Assuming input shape is (batch, seq, features)
        if hasattr(shap_vals, 'shape') and len(shap_vals.shape) == 3:
            mean_abs_shap = np.abs(shap_vals).mean(axis=(0, 1))
        elif hasattr(shap_vals, 'shape') and len(shap_vals.shape) == 2:
            mean_abs_shap = np.abs(shap_vals).mean(axis=0)
        else:
            mean_abs_shap = np.abs(shap_vals)
            
        # Ensure we have a 1D array of feature importance scores
        # We need to reach (num_features,)
        if hasattr(mean_abs_shap, 'ravel'):
            mean_abs_shap = mean_abs_shap.ravel()
            
        if feature_names is None or len(feature_names) != len(mean_abs_shap):
            feature_names = [f"Feature_{i}" for i in range(len(mean_abs_shap))]
            
        # Explicitly convert each value to a Python float and sanitize
        importance_dict = {
            str(name): sanitize_float(val) 
            for name, val in zip(feature_names, mean_abs_shap)
        }
        sorted_importance = dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))
        
        return sorted_importance
    except Exception as e:
        print(f"SHAP explanation failed: {e}")
        return {"error": True, "message": str(e)}

async def explain_async(input_tensor: torch.Tensor, model: torch.nn.Module, bg_tensor: torch.Tensor, feature_names: list = None) -> dict:
    """
    Async wrapper for SHAP computation.
    """
    if not isinstance(input_tensor, torch.Tensor):
        return {"error": True, "message": "Input must be a torch.Tensor"}
        
    # Create simple hash from tensor memory buffer
    input_hash = hash(input_tensor.cpu().numpy().tobytes())
    
    if input_hash in _SHAP_CACHE:
        result = _SHAP_CACHE[input_hash]
        result_copy = result.copy()
        result_copy['cached'] = True
        return result_copy
        
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, compute_shap_sync, input_tensor, model, bg_tensor, feature_names)
    
    if not result.get("error", False):
        _SHAP_CACHE[input_hash] = result.copy()
        result['cached'] = False
        
    return result
