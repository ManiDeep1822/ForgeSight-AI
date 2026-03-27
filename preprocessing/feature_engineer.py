import pandas as pd
import numpy as np

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering to cleaned CNC data.
    - power = torque * rotational_speed
    - temp_diff = process_temperature - air_temperature
    - wear_rate = tool_wear / (time index + 1)
    - rolling_mean, rolling_std per sensor (window=10)
    - diff() per sensor (rate of change)
    """
    
    # Core derived features
    if 'torque' in df.columns and 'rotational_speed' in df.columns:
        df['power'] = df['torque'] * df['rotational_speed']
        
    if 'process_temperature' in df.columns and 'air_temperature' in df.columns:
        df['temp_diff'] = df['process_temperature'] - df['air_temperature']
        
    if 'tool_wear' in df.columns:
        df['time_index'] = np.arange(len(df))
        df['wear_rate'] = df['tool_wear'] / (df['time_index'] + 1)
        df = df.drop(columns=['time_index'])
        
    sensors = ['air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear', 'power', 'temp_diff']
    
    # Rate of change and Rolling statistics
    for s in sensors:
        if s not in df.columns:
            continue
        df[f'{s}_diff'] = df[s].diff().fillna(0)
        df[f'{s}_rolling_mean_10'] = df[s].rolling(window=10, min_periods=1).mean()
        df[f'{s}_rolling_std_10'] = df[s].rolling(window=10, min_periods=1).std().fillna(0)
        
    return df
