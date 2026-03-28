import torch

# Shared state to prevent circular imports
models = {}
GLOBAL_FEATURE_NUM = 43
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
