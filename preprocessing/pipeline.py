import os
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import RobustScaler

from .cleaner import clean_data
from .feature_engineer import engineer_features

def preprocess_pipeline(filepath: str, window_size=60, step=30, scaler_path='saved_models/scaler.pkl', is_training=True, scaler_dict=None):
    """
    Full preprocessing pipeline:
    - Apply cleaner -> feature_engineer
    - Apply RobustScaler per machine_type group
    - Sliding window: size=60, step=30
    - Return features list, data_dict
    - Saves scaler to saved_models/scaler.pkl
    """
    df = clean_data(filepath)
    df = engineer_features(df)
    
    # Target Extraction
    if 'failure_label' in df.columns:
        failure_indices = df.index[df['failure_label'] == 1].values
        if len(failure_indices) > 0:
            def calc_rul(idx):
                future_failures = failure_indices[failure_indices >= idx]
                return float(future_failures[0] - idx) if len(future_failures) > 0 else 200.0
            df['rul'] = df.index.map(calc_rul)
        else:
            df['rul'] = 200.0
    else:
        df['rul'] = 200.0
        
    class_map = {'None': 0, 'TWF': 1, 'HDF': 2, 'PWF': 3, 'OSF': 4, 'RNF': 5}
    if 'failure_type' in df.columns:
        df['y_class'] = df['failure_type'].map(class_map).fillna(0).astype('int64')
    else:
        df['y_class'] = 0
        
    df['y_failure'] = df['failure_label'].astype('float32') if 'failure_label' in df.columns else 0.0
    df['y_anomaly'] = df['failure_label'].astype('float32') if 'failure_label' in df.columns else 0.0
    
    exclude_cols = ['machine_type', 'failure_label', 'failure_type', 'rul', 'y_class', 'y_failure', 'y_anomaly', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF', 'Type', 'Product ID', 'UDI']
    exclude_cols = [c for c in exclude_cols if c in df.columns]
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    
    m_types = df['machine_type_encoded'].unique() if 'machine_type_encoded' in df.columns else [0]
    
    if is_training:
        scaler_dict = {}
        for m_type in m_types:
            mask = df['machine_type_encoded'] == m_type
            scaler = RobustScaler()
            # Scale features
            scaled_vals = scaler.fit_transform(df.loc[mask, feature_cols])
            # Handle possible IQR division by 0 causing infinity or NaNs
            scaled_vals = np.nan_to_num(scaled_vals, nan=0.0, posinf=10.0, neginf=-10.0)
            df.loc[mask, feature_cols] = scaled_vals
            scaler_dict[m_type] = scaler
        
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler_dict, f)
    else:
        if not scaler_dict:
            with open(scaler_path, 'rb') as f:
                scaler_dict = pickle.load(f)
        for m_type in m_types:
            mask = df['machine_type_encoded'] == m_type
            if m_type in scaler_dict:
                scaled_vals = scaler_dict[m_type].transform(df.loc[mask, feature_cols])
                scaled_vals = np.nan_to_num(scaled_vals, nan=0.0, posinf=10.0, neginf=-10.0)
                df.loc[mask, feature_cols] = scaled_vals
                
    X, y_anomaly, y_failure, y_class, y_rul = [], [], [], [], []
    
    # Walk-forward sliding window (no shuffle inherently)
    for i in range(0, len(df) - window_size + 1, step):
        window = df.iloc[i:i+window_size]
        X.append(window[feature_cols].values)
        last_idx = i + window_size - 1
        y_anomaly.append(df.iloc[last_idx]['y_anomaly'])
        y_failure.append(df.iloc[last_idx]['y_failure'])
        y_class.append(df.iloc[last_idx]['y_class'])
        y_rul.append(df.iloc[last_idx]['rul'])
        
    X = np.array(X, dtype=np.float32)
    y_anomaly = np.array(y_anomaly, dtype=np.float32)
    y_failure = np.array(y_failure, dtype=np.float32)
    y_class = np.array(y_class, dtype=np.int64)
    y_rul = np.array(y_rul, dtype=np.float32)
    
    if not is_training:
        return feature_cols, X, y_anomaly, y_failure, y_class, y_rul
        
    # Walk-forward split: 70% train / 15% val / 15% test
    n = len(X)
    train_idx = int(0.70 * n)
    val_idx = int(0.85 * n)
    
    data_dict = {
        'train': (X[:train_idx], y_anomaly[:train_idx], y_failure[:train_idx], y_class[:train_idx], y_rul[:train_idx]),
        'val': (X[train_idx:val_idx], y_anomaly[train_idx:val_idx], y_failure[train_idx:val_idx], y_class[train_idx:val_idx], y_rul[train_idx:val_idx]),
        'test': (X[val_idx:], y_anomaly[val_idx:], y_failure[val_idx:], y_class[val_idx:], y_rul[val_idx:])
    }
    
    return feature_cols, data_dict
