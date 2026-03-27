import subprocess
import sys

scripts = [
    "models/anomaly/train.py",
    "models/failure_prediction/train.py",
    "models/failure_classification/train.py",
    "models/rul/train.py",
    "models/cost_estimation/train.py"
]

print("Starting overall training process...")

for script in scripts:
    print(f"\n{'='*50}")
    print(f"Running {script}...")
    print(f"{'='*50}")
    
    result = subprocess.run([sys.executable, script], capture_output=False)
    if result.returncode != 0:
        print(f"Error occurred while running {script}. Halting.")
        sys.exit(1)

print("\nAll models trained and saved successfully.")
