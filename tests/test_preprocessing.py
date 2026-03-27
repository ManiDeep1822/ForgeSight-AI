import sys
import os
# Add parent dir to path to allow importing packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing import preprocess_pipeline

def main():
    filepath = 'data/raw/ai4i_engineered.csv'
    print(f"Testing pipeline with data from {filepath}")
    feature_cols, data_dict = preprocess_pipeline(filepath, window_size=60, step=30, scaler_path='saved_models/scaler.pkl', is_training=True)
    
    print(f"Features: {feature_cols}")
    print(f"Number of features: {len(feature_cols)}")
    print("--------------------------------------------------")
    
    for split in ['train', 'val', 'test']:
        X, y_anomaly, y_failure, y_class, y_rul = data_dict[split]
        print(f"Split [{split.upper()}]:")
        print(f"  X shape: {X.shape}")
        print(f"  y_anomaly shape: {y_anomaly.shape} | Anomaly ratio: {sum(y_anomaly) / len(y_anomaly):.4f}")
        print(f"  y_failure shape: {y_failure.shape} | Failure ratio: {sum(y_failure) / len(y_failure):.4f}")
        print(f"  y_rul preview (min/mean/max): {min(y_rul):.1f} / {y_rul.mean():.1f} / {max(y_rul):.1f}")
        print()

if __name__ == '__main__':
    main()
