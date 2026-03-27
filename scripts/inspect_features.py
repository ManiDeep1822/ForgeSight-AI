import pickle
import os

scaler_path = 'c:/Users/banav/OneDrive/Desktop/FORGE/cnc-health-system/saved_models/scaler.pkl'

if os.path.exists(scaler_path):
    with open(scaler_path, 'rb') as f:
        scaler_dict = pickle.load(f)
        # Check one of the scalers (e.g. key 1 for 'M' or key 0)
        scaler = list(scaler_dict.values())[0]
        if hasattr(scaler, 'feature_names_in_'):
            print("Features Found:", list(scaler.feature_names_in_))
            print("Count:", len(scaler.feature_names_in_))
        else:
            print("Scaler does not have feature_names_in_")
else:
    print("Scaler file not found")
