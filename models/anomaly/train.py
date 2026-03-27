import sys
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pickle
import numpy as np

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from preprocessing.pipeline import preprocess_pipeline
from models.anomaly.model import LSTMAutoencoder

def train_anomaly_model():
    filepath = 'data/raw/ai4i_engineered.csv'
    print("Loading and preprocessing data...")
    feature_cols, data_dict = preprocess_pipeline(filepath, is_training=True)
    
    # Extract training and validation splits
    X_train, y_anomaly_train, _, _, _ = data_dict['train']
    X_val, y_anomaly_val, _, _, _ = data_dict['val']
    
    # Filter for NORMAL data only (failure / anomaly label == 0)
    normal_mask_train = y_anomaly_train == 0
    X_train_normal = X_train[normal_mask_train]
    
    normal_mask_val = y_anomaly_val == 0
    X_val_normal = X_val[normal_mask_val]
    
    if len(X_train_normal) == 0:
        print("Error: No normal data found for training.")
        return
        
    print(f"Training on {len(X_train_normal)} normal samples. Validating on {len(X_val_normal)} normal samples.")
    
    # Convert to tensors
    X_train_t = torch.tensor(X_train_normal, dtype=torch.float32)
    X_val_t = torch.tensor(X_val_normal, dtype=torch.float32)
    
    # Create DataLoaders
    batch_size = 64
    train_dataset = TensorDataset(X_train_t, X_train_t) # autoencoder targets itself
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    val_dataset = TensorDataset(X_val_t, X_val_t)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    input_size = X_train.shape[2]
    model = LSTMAutoencoder(input_size=input_size, hidden=64, num_layers=2)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    epochs = 50
    
    print("Beginning Training: Model M1 (Anomaly Detection)")
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)
        
        train_loss /= len(train_loader.dataset)
        
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"Epoch {epoch+1}/{epochs} | Loss: {train_loss:.6f}")
            
    # Compute threshold on validation set
    model.eval()
    val_errors = []
    with torch.no_grad():
        for batch_x, _ in val_loader:
            outputs = model(batch_x)
            # compute MSE per sample in batch
            error = torch.mean((outputs - batch_x) ** 2, dim=(1,2)).numpy()
            val_errors.extend(error)
            
    val_errors = np.array(val_errors)
    if len(val_errors) > 0:
        threshold = np.mean(val_errors) + 3 * np.std(val_errors)
    else:
        # Fallback if no normal val data
        threshold = 0.1 
        
    print(f"Computed Anomaly Threshold (val mean + 3*std): {threshold:.6f}")
    
    # Save models
    os.makedirs('saved_models', exist_ok=True)
    torch.save(model.state_dict(), 'saved_models/anomaly_model.pt')
    with open('saved_models/anomaly_threshold.pkl', 'wb') as f:
        pickle.dump(float(threshold), f)
    print("Saved model to saved_models/anomaly_model.pt and threshold to anomaly_threshold.pkl")

if __name__ == '__main__':
    train_anomaly_model()
