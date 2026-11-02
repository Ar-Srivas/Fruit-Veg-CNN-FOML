# FoodLens - Fruit & Vegetable Freshness Demo

**FoodLens** is a web application demo for fruit and vegetable freshness checking and recipe recommendations. The deployed backend returns fixed sample carrot, tomato, and banana results; it does not analyze uploaded image contents.

![Demo](https://img.shields.io/badge/predictions-sample%20data-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal)

## ✨ Features

### **Demo Detection Modes**
- **Single Item Demo**: Returns fixed carrot and tomato sample predictions
- **Multi-Item Demo**: Returns fixed carrot, tomato, and banana sample detections with illustrative bounding boxes

These are placeholder responses for deployment and UI demonstrations. They are not model predictions and do not depend on image contents.

###  **Visual Feedback**
- Color-coded bounding boxes (green for fresh, red for rotten)
- Clearly marked sample scores for each example
- Annotated images with illustrative labels and boxes

###  **Smart Recipe Recommendations**
- Can suggest recipes based on the fixed fresh sample ingredients
- Integration with Spoonacular API
- Detailed recipe cards with cooking times, servings, and ingredients

###  **Summary Analytics**
- Total items detected
- Fresh vs.  rotten count breakdown
- Ingredient extraction for recipe generation

## 🏗️ Architecture

```
Fruit-Veg-CNN-FOML/
├── backend/              # FastAPI server
│   ├── app.py                 # API and frontend2 serving
│   ├── model_classifier.py    # Fixed single-item demo response
│   ├── model_finetuned.py     # Fixed multi-item demo response
│   ├── recipe_api.py          # Recipe recommendation API
│   └── requirements.txt       # Lightweight deployment dependencies
├── frontend2/           # Static HTML, CSS, and JavaScript frontend
└── ml/                  # Optional model training utilities
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend runtime uses Pillow for image uploads and annotations. TensorFlow is not installed or needed to run the deployed demo.

The backend serves the static `frontend2` application at `http://localhost:8000`; no Node.js build is required.

### Run the backend and `frontend2` in Docker

Build the image from the repository root (the build context must include both `backend/` and `frontend2/`). Uvicorn listens on port 8000 inside the container:

```bash
docker build -t foodlens .
docker run --rm -p 8000:8000 foodlens
```

Open `http://localhost:8000`. To enable recipe lookup, provide the backend's `API_KEY` at runtime, for example with `docker run --rm -p 8000:8000 --env-file backend/.env foodlens`. The `.env` file is not copied into the image.

### Deploy to Kubernetes

Terraform provisions a unique ACR name and grants the AKS kubelet identity permission to pull images. The Kubernetes Service exposes port 80 and forwards traffic to the container's port 8000. After applying Terraform and allowing the ACR role assignment to propagate, run these PowerShell commands from the repository root to build a Linux/AMD64 image, push a unique tag, and deploy that exact tag:

```powershell
$acrLoginServer = terraform -chdir=terraform output -raw acr_login_server
$acrName = $acrLoginServer -replace '\.azurecr\.io$', ''
$imageTag = "$(Get-Date -Format 'yyyyMMddHHmmss')-$([guid]::NewGuid().ToString('N').Substring(0, 8))"

az acr login --name $acrName
docker build --platform linux/amd64 -t "${acrLoginServer}/foodlens:${imageTag}" .
docker push "${acrLoginServer}/foodlens:${imageTag}"

az aks get-credentials --resource-group rg-foodlens-mlops --name aks-foodlens-cluster
(Get-Content k8s/deployment.yaml -Raw) `
  -replace '\$\{ACR_LOGIN_SERVER\}', $acrLoginServer `
  -replace '\$\{IMAGE_TAG\}', $imageTag |
  kubectl apply -f -
kubectl rollout status deployment/foodlens-app
```

The deployment and its probes target container port 8000; the Kubernetes Service exposes port 80 and forwards traffic to that container port. It uses one replica because uploads and detections are stored in FastAPI process memory. The optional `foodlens-secrets` Kubernetes Secret can supply the Spoonacular `API_KEY`. The Terraform ACR name includes a generated suffix, so use its output rather than a hard-coded registry name.

### Prometheus metrics

The backend exposes request, inference-latency, and prediction-class metrics at `/metrics`. The scrape configuration in `backend/prometheus.yml` targets `foodlens-service:80`, the Kubernetes Service port; Prometheus must run in the same Kubernetes namespace or use the service's fully qualified DNS name.

### Run FoodLens with Prometheus and Grafana

Start the backend, Prometheus, and Grafana together from the repository root:

```bash
docker compose up --build -d
```

Open FoodLens at `http://localhost:8000`, Prometheus at `http://localhost:9090`, and Grafana at `http://localhost:3000`. Sign in to Grafana with username `admin` and the local default password `foodlens-local`. Change it before sharing the stack by setting `GRAFANA_ADMIN_PASSWORD` in your shell. Grafana is provisioned with the Prometheus data source and the FoodLens Overview dashboard. Prometheus scrapes the backend at `backend:8000` on the Compose network.

To enable Spoonacular recipe lookup, set `API_KEY` in your shell before starting the stack. Stop the services with `docker compose down`; named volumes retain Grafana and Prometheus data. Add `-v` to `docker compose down` only if you intend to delete that stored data.

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload/` | POST | Upload image for display (not analyzed) |
| `/predict/` | GET | Fixed single-item sample result |
| `/predict_many/` | GET | Fixed multi-item sample results |
| `/visualize/` | GET | Sample bounding boxes drawn on the uploaded image |
| `/summary/` | GET | Summary of sample results |
| `/api/recipes/` | GET | Get recipe recommendations |

## 🎯 How It Works

1. **Upload Image**: The image is displayed for demonstration; its contents are not analyzed.
2. **Sample Results**: The API returns fixed carrot, tomato, and banana examples with illustrative boxes and scores.
3. **Recommendations**: Recipe suggestions can use the fixed fresh sample ingredients.

This is a deployment/UI demo, not a freshness assessment tool. API prediction responses include `demo_mode: true`.

## 📊 MLflow Experiment Tracking

TensorFlow is excluded from the deployable runtime. It is only needed if you choose to run the separate local CNN training and MLflow workflow:

```bash
python -m pip install -r backend/requirements-training.txt
python backend/train_tracking.py
```

The script uses the class folders in `ml/data` (the current `ml/dataset_manifest.csv` contains only its header), creates the same stratified 80/20 split for both runs, and trains the notebook's simple CNN architecture for 10 and 12 epochs. Fourteen WebP images are excluded because the notebook's Keras image generator does not accept that format. It records per-epoch training/validation metrics, final validation accuracy and loss, macro F1, parameters, and the trained Keras model for each run.

By default, tracking metadata is stored in the root-level `mlflow.db` SQLite database, with model artifacts under `mlartifacts/`. These generated files are ignored by Git. To view runs locally, start the UI from the repository root:

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db --host 127.0.0.1 --port 5000
```

Then open `http://127.0.0.1:5000`. Set `MLFLOW_TRACKING_URI` to use a different tracking server or database. Both runs train models from scratch on the same split; the 12-epoch run is not initialized from the 10-epoch model.

## 🛠️ Tech Stack

**Frontend:**
- Static HTML, CSS, and JavaScript

**Backend:**
- FastAPI
- PIL (Pillow)
- Prometheus client

**ML/AI:**
- Optional local TensorFlow CNN training (`backend/requirements-training.txt`)
- Fixed sample predictions in the deployed application
