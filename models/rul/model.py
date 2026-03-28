import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super(PositionalEncoding, self).__init__()
        
        # Standard sinusoidal positional encoding
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        pe = pe.unsqueeze(0) # (1, max_len, d_model)
        # register_buffer ensures pe is moved to the correct device but not treated as a trainable parameter
        self.register_buffer('pe', pe)

    def forward(self, x):
        # x shape: (batch_size, seq_len, d_model)
        seq_len = x.size(1)
        x = x + self.pe[:, :seq_len, :]
        return x

class TransformerRUL(nn.Module):
    def __init__(self, input_size, d_model=64, nhead=4, num_layers=3, dropout=0.1):
        super(TransformerRUL, self).__init__()
        
        self.input_projection = nn.Linear(input_size, d_model)
        self.norm1 = nn.LayerNorm(d_model)
        self.pos_encoder = PositionalEncoding(d_model=d_model)
        
        # PyTorch TransformerEncoderLayer inherently uses batch_first=True to align inputs comfortably
        encoder_layers = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=nhead, 
            dropout=dropout, 
            batch_first=True,
            norm_first=True # More stable for deeper models
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers=num_layers)
        
        self.fc1 = nn.Linear(d_model, 32)
        self.norm2 = nn.LayerNorm(32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)
        
        # Xavier Initialization for better stability
        self._init_weights()

    def _init_weights(self):
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)

    def forward(self, x):
        # x is (batch_size, seq_len, input_size)
        x = self.input_projection(x) # (batch_size, seq_len, d_model)
        x = self.norm1(x)
        x = self.pos_encoder(x)
        
        x = self.transformer_encoder(x) # (batch_size, seq_len, d_model)
        
        # Global average pooling over sequence dim
        x = torch.mean(x, dim=1) # (batch_size, d_model)
        
        x = self.fc1(x)
        x = self.norm2(x)
        x = self.relu(x)
        out = self.fc2(x) # (batch_size, 1)
        
        return out
