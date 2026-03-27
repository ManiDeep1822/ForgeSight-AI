def compute_health_index(anomaly_score: float, failure_prob: float, rul: float, class_confidence: float) -> float:
    """
    Computes synthesizing health index (0 to 100).
    Penalizes based on anomaly presence, failure probability, remaining useful life,
    and confidence of classification.
    """
    base = 100.0
    base -= anomaly_score * 20.0
    base -= failure_prob * 30.0
    
    # Penalize low RUL, capping penalty at 30.0 for RUL=0
    rul_penalty = max(0.0, (200.0 - rul) / 200.0) * 30.0
    base -= rul_penalty
    
    base -= class_confidence * 20.0
    
    # Ensure health index is strictly between 0 and 100
    return float(max(0.0, min(100.0, base)))
