import torch
import torch.nn as nn

class LSTMAutoencoder(nn.Module):
    def __init__(self, input_size, hidden=64, num_layers=2):
        super(LSTMAutoencoder, self).__init__()
        self.input_size = input_size
        self.hidden = hidden
        self.num_layers = num_layers
        
        # Encoder
        self.encoder = nn.LSTM(input_size=input_size, 
                               hidden_size=hidden, 
                               num_layers=num_layers, 
                               batch_first=True)
        
        # Decoder LSTM
        self.decoder_lstm = nn.LSTM(input_size=hidden, 
                                    hidden_size=hidden, 
                                    num_layers=num_layers, 
                                    batch_first=True)
        # Decoder Output Layer
        self.decoder_fc = nn.Linear(hidden, input_size)
        
    def forward(self, x):
        # x shape: (batch_size, seq_len, input_size)
        batch_size, seq_len, _ = x.size()
        
        # Encode
        # out shape: (batch_size, seq_len, hidden)
        # h_n, c_n shape: (num_layers, batch_size, hidden)
        enc_out, (h_n, c_n) = self.encoder(x)
        
        # Take the last hidden state from the last layer as the context vector
        last_hidden = h_n[-1] # shape: (batch_size, hidden)
        
        # Repeat the context vector to match seq_len
        # shape: (batch_size, seq_len, hidden)
        repeated_context = last_hidden.unsqueeze(1).repeat(1, seq_len, 1)
        
        # Decode
        dec_out, _ = self.decoder_lstm(repeated_context)
        
        # Reconstruct
        # shape: (batch_size, seq_len, input_size)
        reconstruction = self.decoder_fc(dec_out)
        
        return reconstruction
