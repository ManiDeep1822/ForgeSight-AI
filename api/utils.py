import math
import numpy as np
from typing import Any, Dict, List

def sanitize_float(val: Any, default: float = 0.0) -> float:
    """
    Robustly sanitize numeric values (Python, NumPy, Torch) to be JSON-compliant.
    Handles NaN, Inf, and non-serializable numeric types.
    """
    try:
        # Handle cases where val is a tensor or numpy scalar with .item()
        if hasattr(val, 'item') and callable(val.item):
            f_val = float(val.item())
        else:
            f_val = float(val)

        if math.isnan(f_val) or math.isinf(f_val):
            return default
        return f_val
    except (ValueError, TypeError, AttributeError):
        return default

def sanitize_dict(data: Any) -> Any:
    """
    Recursively sanitize any data structure for JSON serialization.
    Converts NumPy types to Python types and ensures all floats are finite.
    """
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, (float, int, np.floating, np.integer)):
        return sanitize_float(data)
    elif hasattr(data, 'dtype'): # NumPy arrays or similar
        if len(data.shape) == 0: # Scalar
            return sanitize_float(data)
        return [sanitize_dict(x) for x in data.tolist()]
    else:
        return data
