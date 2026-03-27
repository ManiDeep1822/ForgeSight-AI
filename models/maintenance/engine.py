def suggest_maintenance(health_index: float, rul: float, failure_type: str) -> dict:
    """
    Rules-based engine for maintenance suggestions.
    """
    if health_index < 20:
        urgency = 5
        msg = 'CRITICAL — Immediate shutdown'
    elif health_index < 40:
        urgency = 4
        msg = 'HIGH — Maintenance within 24 hours'
    elif health_index < 60:
        urgency = 3
        msg = 'MEDIUM — Inspect within 3 days'
    elif health_index < 80:
        urgency = 2
        msg = 'LOW — Routine check recommended'
    else:
        urgency = 1
        msg = 'HEALTHY — No action needed'
        
    if rul < 50 and urgency < 5:
        urgency += 1
        
    return {
        "suggestion": msg,
        "urgency": urgency,
        "failure_type": failure_type
    }
