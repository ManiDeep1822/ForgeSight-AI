import torch
import torch.nn as nn

class CNNLSTMClassifier(nn.Module):
    def __init__(self, input_size, num_classes=5):
        super(CNNLSTMClassifier, self).__init__()
        
        # Conv1D expects input shape: (batch_size, channels, seq_len)
        self.conv1 = nn.Conv1d(in_channels=input_size, out_channels=64, kernel_size=3, padding=1)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool1d(kernel_size=2)
        
        self.conv2 = nn.Conv1d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.relu2 = nn.ReLU()
        
        # LSTM expects: (batch_size, seq_len, input_size) if batch_first=True
        self.lstm = nn.LSTM(input_size=128, hidden_size=128, num_layers=2, batch_first=True)
        
        self.fc = nn.Linear(128, num_classes)
        self.softmax = nn.Softmax(dim=1)
        
    def forward(self, x):
        # x input shape: (batch_size, seq_len, input_size)
        # Transpose for Conv1d -> (batch_size, input_size, seq_len)
        x = x.transpose(1, 2)
        
        x = self.conv1(x)
        x = self.relu1(x)
        x = self.pool1(x) # halves sequence length
        
        x = self.conv2(x)
        x = self.relu2(x)
        
        # Transpose back for LSTM -> (batch_size, seq_len/2, 128)
        x = x.transpose(1, 2)
        
        lstm_out, _ = self.lstm(x)
        
        # Take output of the last time step from the sequence
        last_out = lstm_out[:, -1, :] # (batch_size, 128)
        
        out = self.fc(last_out)
        out = self.softmax(out)
        
        return out
