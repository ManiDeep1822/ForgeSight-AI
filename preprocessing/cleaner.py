import pandas as pd
import numpy as np

def clean_data(filepath: str) -> pd.DataFrame:
    """
    Load and clean raw CNC sensor data.
    - Load CSV from data/raw/
    - Drop duplicates
    - Handle missing values (ffill for gaps < 60s, linear interpolation for longer)
    - Add binary missing_flag column per sensor
    - Detect outliers via IQR method, cap at 1.5*IQR boundaries
    - Encode machine_type: L=0, M=1, H=2
    """
    df = pd.read_csv(filepath)
    
    # Map AI4I columns to standard names
    rename_map = {
        'Air temperature [K]': 'air_temperature',
        'Process temperature [K]': 'process_temperature',
        'Rotational speed [rpm]': 'rotational_speed',
        'Torque [Nm]': 'torque',
        'Tool wear [min]': 'tool_wear',
        'Type': 'machine_type',
        'Machine failure': 'failure_label'
    }
    col_mapping = {k: v for k, v in rename_map.items() if k in df.columns}
    df = df.rename(columns=col_mapping)
    
    if 'failure_type' not in df.columns:
        failure_cols = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        available = [c for c in failure_cols if c in df.columns]
        if available:
            def get_failure_type(row):
                for c in available:
                    if row[c] == 1:
                        return c
                return 'None'
            df['failure_type'] = df.apply(get_failure_type, axis=1)
        else:
            df['failure_type'] = 'None'
            
    df = df.drop_duplicates().reset_index(drop=True)
    
    sensors = ['air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear']
    
    for s in sensors:
        if s not in df.columns:
            continue
        df[f'{s}_missing_flag'] = df[s].isna().astype(int)
        df[s] = df[s].ffill(limit=60)
        df[s] = df[s].interpolate(method='linear')
        
    # Cap outliers via IQR
    for s in sensors:
        if s not in df.columns:
            continue
        Q1 = df[s].quantile(0.25)
        Q3 = df[s].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df[s] = np.clip(df[s], lower_bound, upper_bound)
        
    # Encode machine_type: L=0, M=1, H=2
    if 'machine_type' in df.columns:
        mapping = {'L': 0, 'M': 1, 'H': 2}
        df['machine_type_encoded'] = df['machine_type'].map(mapping).fillna(df['machine_type'])
        # Handle cases where the column was already encoded
        df['machine_type_encoded'] = pd.to_numeric(df['machine_type_encoded'], errors='coerce').fillna(0).astype(int)
    else:
        df['machine_type_encoded'] = 0
        
    return df
