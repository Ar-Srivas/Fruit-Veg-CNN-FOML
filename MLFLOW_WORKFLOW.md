# Command log

## MLflow

Run these commands from the repository root.

```powershell
python -m pip install -r backend\requirements.txt
python -m pip install -r backend\requirements-mlflow.txt
python backend\train_tracking.py
mlflow ui --backend-store-uri sqlite:///mlflow.db --host 127.0.0.1 --port 5000
```

The training command runs the 10-epoch and 12-epoch CNN experiments. The UI is available at `http://127.0.0.1:5000`.
