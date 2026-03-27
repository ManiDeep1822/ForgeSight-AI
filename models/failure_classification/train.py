import sys
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import f1_score, confusion_matrix
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from preprocessing.pipeline import preprocess_pipeline
from models.failure_classification.model import CNNLSTMClassifier

def train_classification_model():
    filepath = 'data/raw/ai4i_engineered.csv'
    print("Loading and preprocessing data...")
    feature_cols, data_dict = preprocess_pipeline(filepath, is_training=True)
    
    # Extract training and validation splits
    X_train, _, y_failure_train, y_class_train, _ = data_dict['train']
    X_val, _, y_failure_val, y_class_val, _ = data_dict['val']
    
    # Filter for anomalies/failures only (since this model classifies failures)
    failure_mask_train = y_failure_train == 1
    X_train_failures = X_train[failure_mask_train]
    y_class_train_failures = y_class_train[failure_mask_train]
    
    failure_mask_val = y_failure_val == 1
    X_val_failures = X_val[failure_mask_val]
    y_class_val_failures = y_class_val[failure_mask_val]
    
    if len(X_train_failures) == 0:
        print("Error: No failure data found for training.")
        return
        
    # Map classes from 1-5 to 0-4
    y_class_train_mapped = y_class_train_failures - 1
    y_class_val_mapped = y_class_val_failures - 1
    
    print(f"Training M3 on {len(X_train_failures)} failure samples. Validating on {len(X_val_failures)} samples.")
    
    # Compute class weights: weight = 1 / class_frequency
    classes, counts = np.unique(y_class_train_mapped, return_counts=True)
    class_weights = np.ones(5)
    for c, count in zip(classes, counts):
        if 0 <= c < 5:
            class_weights[c] = 1.0 / (count + 1e-5) # avoid div by zero
    class_weights = class_weights / np.sum(class_weights) * 5.0 # normalize
    class_weights_t = torch.tensor(class_weights, dtype=torch.float32)
    
    # Convert to tensors
    X_train_t = torch.tensor(X_train_failures, dtype=torch.float32)
    y_train_t = torch.tensor(y_class_train_mapped, dtype=torch.int64)
    
    X_val_t = torch.tensor(X_val_failures, dtype=torch.float32)
    y_val_t = torch.tensor(y_class_val_mapped, dtype=torch.int64)
    
    # Create DataLoaders
    batch_size = 32
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)
    
    val_dataset = TensorDataset(X_val_t, y_val_t)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    input_size = X_train.shape[2]
    model = CNNLSTMClassifier(input_size=input_size, num_classes=5)
    
    # Model has Softmax at the end, so we use NLLLoss with torch.log for numerical stability
    # equivalent to CrossEntropyLoss on raw logits
    criterion = nn.NLLLoss(weight=class_weights_t)
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    epochs = 60
    
    print("Beginning Training: Model M3 (Failure Classification)")
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            probs = model(batch_x)
            # Add eps to avoid log(0)
            log_probs = torch.log(probs + 1e-7)
            loss = criterion(log_probs, batch_y)
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
                probs = model(batch_x)
                preds = torch.argmax(probs, dim=1)
                val_preds.extend(preds.numpy())
                val_targets.extend(batch_y.numpy())
                
        val_preds = np.array(val_preds)
        val_targets = np.array(val_targets)
        
        if len(val_targets) > 0:
            f1 = f1_score(val_targets, val_preds, average='macro', zero_division=0)
            cm = confusion_matrix(val_targets, val_preds, labels=list(range(5)))
        else:
            f1 = 0
            cm = np.zeros((5,5))
            
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch {epoch+1}/{epochs} | Loss: {train_loss:.6f} | Val Macro F1: {f1:.4f}")
            if len(val_targets) > 0 and (epoch + 1) == epochs:
                print(f"Confusion Matrix (Validation):\n{cm}")
    
    os.makedirs('saved_models', exist_ok=True)
    torch.save(model.state_dict(), 'saved_models/classification_model.pt')
    print("Saved model to saved_models/classification_model.pt")

if __name__ == '__main__':
    train_classification_model()
