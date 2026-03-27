import sys
import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error
import pickle

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from preprocessing.pipeline import preprocess_pipeline
from models.health_index.scorer import compute_health_index

def train_cost_model():
    filepath = 'data/raw/ai4i_engineered.csv'
    print("Loading data for Cost Estimation model...")
    feature_cols, data_dict = preprocess_pipeline(filepath, is_training=True)
    
    X_train, y_anomaly, y_failure, y_class, y_rul = data_dict['train']
    
    # machine_type_encoded index
    m_idx = feature_cols.index('machine_type_encoded') if 'machine_type_encoded' in feature_cols else -1
    
    costs = []
    features_list = []
    
    # Synthesize cost dataset and features
    for i in range(len(X_train)):
        mach_type = int(X_train[i, -1, m_idx]) if m_idx >= 0 else 0
        r = float(y_rul[i])
        c_class = int(y_class[i])
        f_prob = float(y_failure[i])
        a_score = float(y_anomaly[i])
        c_conf = 1.0 if c_class > 0 else 0.0
        
        hi = compute_health_index(a_score, f_prob, r, c_conf)
        
        # Synthetic cost logic: cost = (100 - health_index) * 500 + random(0,200)
        cost = (100.0 - hi) * 500.0 + np.random.uniform(0, 200.0)
        
        # Features: failure_type_encoded, health_index, rul, machine_type_encoded
        features_list.append([c_class, hi, r, mach_type])
        costs.append(cost)
        
    X_cost = np.array(features_list)
    y_cost = np.array(costs)
    
    # reg:absoluteerror is equivalent to MAE robust optimization
    model = xgb.XGBRegressor(objective='reg:absoluteerror', n_estimators=100, max_depth=4, learning_rate=0.1)
    
    print("Training XGBoost Cost Estimator (Model M6)...")
    model.fit(X_cost, y_cost)
    
    preds = model.predict(X_cost)
    mae = mean_absolute_error(y_cost, preds)
    print(f"Cost Model Training MAE (Robust): {mae:.4f}")
    
    os.makedirs('saved_models', exist_ok=True)
    with open('saved_models/cost_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("Saved cost model to saved_models/cost_model.pkl")

if __name__ == '__main__':
    train_cost_model()
