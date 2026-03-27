import torch
import torch.nn as nn
import torch.nn.functional as F

class LSTMClassifier(nn.Module):
    def __init__(self, input_size, hidden=128, num_layers=2, dropout=0.3):
        super(LSTMClassifier, self).__init__()
        
        self.lstm = nn.LSTM(input_size=input_size,
                            hidden_size=hidden,
                            num_layers=num_layers,
                            dropout=dropout if num_layers > 1 else 0,
                            batch_first=True)
                            
        self.attention = nn.Linear(hidden, 1)
        
        self.fc1 = nn.Linear(hidden, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        # x shape: (batch, seq, input_size)
        lstm_out, _ = self.lstm(x) # lstm_out shape: (batch, seq, hidden)
        
        # Attention mechanism
        attn_weights = self.attention(lstm_out) # (batch, seq, 1)
        attn_weights = F.softmax(attn_weights, dim=1) # softmax over sequence length
        
        # Context vector via weighted sum
        context = torch.sum(attn_weights * lstm_out, dim=1) # (batch, hidden)
        
        # Classifier layers
        x = self.fc1(context)
        x = self.relu(x)
        x = self.fc2(x)
        out = self.sigmoid(x)
        return out

class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        
    def forward(self, inputs, targets):
        """
        inputs: predicted probabilities (batch, 1)
        targets: ground truth labels (batch, 1)
        """
        eps = 1e-7
        # Clamp inputs to avoid log(0)
        inputs = torch.clamp(inputs, eps, 1.0 - eps)
        
        # pt is the probability of the true class
        pt = torch.where(targets == 1.0, inputs, 1.0 - inputs)
        alpha_t = torch.where(targets == 1.0, self.alpha, 1.0 - self.alpha)
        
        loss = -alpha_t * torch.pow((1.0 - pt), self.gamma) * torch.log(pt)
        return loss.mean()
