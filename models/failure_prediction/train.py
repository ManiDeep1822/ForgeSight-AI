import sys
import os
import torch
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import f1_score, roc_auc_score
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from preprocessing.pipeline import preprocess_pipeline
from models.failure_prediction.model import LSTMClassifier, FocalLoss

def train_failure_model():
    filepath = 'data/raw/ai4i_engineered.csv'
    print("Loading and preprocessing data...")
    feature_cols, data_dict = preprocess_pipeline(filepath, is_training=True)
    
    # Extract training and validation splits
    X_train, _, y_failure_train, _, _ = data_dict['train']
    X_val, _, y_failure_val, _, _ = data_dict['val']
    
    if len(X_train) == 0:
        print("Error: No data found for training.")
        return
        
    print(f"Training on {len(X_train)} samples. Validating on {len(X_val)} samples.")
    
    # Convert to tensors
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_failure_train, dtype=torch.float32).unsqueeze(1)
    
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_failure_val, dtype=torch.float32).unsqueeze(1)
    
    # Create DataLoaders
    batch_size = 32
    # Important: No shuffle for walk-forward time-series validation
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)
    
    val_dataset = TensorDataset(X_val_t, y_val_t)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    input_size = X_train.shape[2]
    model = LSTMClassifier(input_size=input_size, hidden=128, num_layers=2, dropout=0.3)
    criterion = FocalLoss(alpha=0.25, gamma=2.0)
    optimizer = optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)
    epochs = 80
    
    print("Beginning Training: Model M2 (Failure Prediction)")
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
        
        # Validation
        model.eval()
        val_preds = []
        val_targets = []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                outputs = model(batch_x)
                val_preds.extend(outputs.numpy())
                val_targets.extend(batch_y.numpy())
                
        val_preds = np.array(val_preds).flatten()
        val_targets = np.array(val_targets).flatten()
        
        val_preds_binary = (val_preds >= 0.5).astype(int)
        
        f1 = f1_score(val_targets, val_preds_binary, zero_division=0)
        try:
            auc = roc_auc_score(val_targets, val_preds)
        except ValueError:
            auc = 0.5 # Fallback if only one class present in val set splits
            
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch {epoch+1}/{epochs} | Loss: {train_loss:.6f} | Val F1: {f1:.4f} | Val AUC: {auc:.4f}")
    
    os.makedirs('saved_models', exist_ok=True)
    torch.save(model.state_dict(), 'saved_models/failure_model.pt')
    print("Saved model to saved_models/failure_model.pt")

if __name__ == '__main__':
    train_failure_model()
