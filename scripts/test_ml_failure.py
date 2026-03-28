import requests
import json
import random
import numpy as np
import time

API_BASE = "http://localhost:8000"

def generate_anomalous_window(length=60, features=43):
    """
    Simulates a window of sensor data that is highly anomalous.
    """
    window = []
    for i in range(length):
        # Base noise
        feat = [random.uniform(0, 0.2) for _ in range(features)]
        
        # Inject failure patterns (Normalized 0-1)
        severity = 1.0
        
        # Temp (Critical)
        feat[0] = 0.98 + random.uniform(0, 0.02) * severity
        # Torque (Max)
        feat[1] = 0.8 + (np.sin(i / 1.0) * 0.2) * severity
        # Wear (Max)
        feat[2] = 0.9 + (i / length) * 0.1
        # Speed (fluctuating)
        feat[3] = 0.2 + random.uniform(0, 0.8) * severity
        
        # Other sensors
        for j in range(4, 10):
            feat[j] = 0.85 + random.uniform(0, 0.15)
            
        # Rolling means
        for j in range(10, 25):
            feat[j] = 0.7 + random.uniform(0, 0.3)
            
        # High freq/Vibration
        for j in range(26, 43):
            feat[j] = 0.8 + random.uniform(0, 0.2)
            
        window.append(feat)
    return window

def test_failure_detection():
    print(f"--- ML FAILURE DETECTION TEST ---")
    print(f"Target API: {API_BASE}")
    
    # Generate false data
    window = generate_anomalous_window()
    payload = {
        "window": window,
        "machine_type": "CNC-FORGE-TEST"
    }
    
    try:
        # 1. Test Failure Prediction
        print("\n[Testing Failure Prediction...]")
        res_fail = requests.post(f"{API_BASE}/failure/predict", json=payload)
        fail_data = res_fail.json()
        print(f"Result: {json.dumps(fail_data, indent=2)}")
        
        # 2. Test Classification
        print("\n[Testing Failure Classification...]")
        res_class = requests.post(f"{API_BASE}/classification/classify", json=payload)
        class_data = res_class.json()
        print(f"Result: {json.dumps(class_data, indent=2)}")
        
        # 3. Test Anomaly Detection
        print("\n[Testing Anomaly Detection...]")
        res_anom = requests.post(f"{API_BASE}/anomaly/detect", json=payload)
        anom_data = res_anom.json()
        print(f"Result: {json.dumps(anom_data, indent=2)}")
        
        # 4. Test RUL Estimation
        print("\n[Testing RUL Estimation...]")
        res_rul = requests.post(f"{API_BASE}/rul/estimate", json=payload)
        rul_data = res_rul.json()
        print(f"Result: {json.dumps(rul_data, indent=2)}")

        print("\n--- TEST SUMMARY ---")
        if fail_data.get('will_fail'):
            print("SUCCESS: ML Model correctly identified the failure.")
        else:
            print("WARNING: ML Model did not flag the failure.")
            
    except Exception as e:
        print(f"ERROR: Could not connect to API: {e}")

if __name__ == "__main__":
    test_failure_detection()
