import sys
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import mean_squared_error, mean_absolute_error
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from preprocessing.pipeline import preprocess_pipeline
from models.rul.model import TransformerRUL

def train_rul_model():
    filepath = 'data/raw/ai4i_engineered.csv'
    print("Loading and preprocessing data...")
    feature_cols, data_dict = preprocess_pipeline(filepath, is_training=True)
    
    # Extract training and validation splits
    X_train, _, _, _, y_rul_train = data_dict['train']
    X_val, _, _, _, y_rul_val = data_dict['val']
    
    if len(X_train) == 0:
        print("Error: No data found for training.")
        return
        
    print(f"Training M4 on {len(X_train)} samples. Validating on {len(X_val)} samples.")
    
    # Convert to tensors
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_rul_train, dtype=torch.float32).unsqueeze(1)
    
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_rul_val, dtype=torch.float32).unsqueeze(1)
    
    batch_size = 32
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)
    
    val_dataset = TensorDataset(X_val_t, y_val_t)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    input_size = X_train.shape[2]
    model = TransformerRUL(input_size=input_size, d_model=64, nhead=4, num_layers=3, dropout=0.1)
    
    # Combined loss: 0.7 * MSELoss + 0.3 * L1Loss
    mse_criterion = nn.MSELoss()
    mae_criterion = nn.L1Loss()
    
    optimizer = optim.AdamW(model.parameters(), lr=5e-4, weight_decay=1e-4)
    epochs = 100
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    print("Beginning Training: Model M4 (RUL Estimation)")
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            
            # Composite Loss
            loss = 0.7 * mse_criterion(outputs, batch_y) + 0.3 * mae_criterion(outputs, batch_y)
            
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)
            
        train_loss /= len(train_loader.dataset)
        
        # Step LR
        scheduler.step()
        
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
        
        if len(val_targets) > 0:
            rmse = np.sqrt(mean_squared_error(val_targets, val_preds))
            mae = mean_absolute_error(val_targets, val_preds)
        else:
            rmse, mae = 0, 0
            
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch {epoch+1}/{epochs} | Loss: {train_loss:.4f} | Val RMSE: {rmse:.4f} | Val MAE: {mae:.4f}")
    
    os.makedirs('saved_models', exist_ok=True)
    torch.save(model.state_dict(), 'saved_models/rul_model.pt')
    print("Saved model to saved_models/rul_model.pt")

if __name__ == '__main__':
    train_rul_model()
