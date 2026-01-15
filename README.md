# FoodLens - AI-Powered Fruit & Vegetable Freshness Detector

**FoodLens** is an intelligent web application that uses deep learning to detect and classify fruits and vegetables as fresh or rotten. It combines computer vision with recipe recommendations to help reduce food waste and inspire cooking.

![TensorFlow](https://img.shields.io/badge/TensorFlow-2.20.0-orange)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal)

## ✨ Features

###  **Dual Detection Modes**
- **Single Item Detection**: Classify a single fruit/vegetable with confidence scores
- **Multi-Item Detection**: Detect and classify multiple items in one image with bounding boxes

###  **Advanced ML Architecture**
- **Object Detection**: SSD MobileNet V2 from TensorFlow Hub for real-time object detection
- **Classification**: Custom fine-tuned MobileNet V2 CNN trained on 18 fruit/vegetable classes
- **Classes Supported**:
  - **Fresh**: Apple, Banana, Carrot, Cucumber, Mango, Orange, Potato, Strawberry, Tomato
  - **Rotten**: Apple, Banana, Carrot, Cucumber, Mango, Orange, Potato, Strawberry, Tomato

###  **Visual Feedback**
- Color-coded bounding boxes (green for fresh, red for rotten)
- Confidence scores for each detection
- Annotated images with labels and predictions

###  **Smart Recipe Recommendations**
- Automatically suggests recipes based on detected fresh ingredients
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
│   ├── app.py           # Main API endpoints
│   ├── model_classifier.py    # Single-item CNN classifier
│   ├── model_finetuned.py     # Multi-item detector + classifier
│   ├── recipe_api.py    # Recipe recommendation API
│   └── requirements.txt
├── frontend/            # Next.js web application
│   ├── src/
│   │   └── app/
│   │       ├── page.js  # Main detection interface
│   │       ├── recipes/page.js  # Recipe explorer
│   │       └── layout.js
│   └── next.config.mjs
└── ml/                  # Model training and utilities
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- TensorFlow 2.20.0

### Backend Setup

```bash
cd backend
pip install -r requirements. txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload/` | POST | Upload image for analysis |
| `/predict/` | GET | Single-item classification |
| `/predict_many/` | GET | Multi-item detection & classification |
| `/visualize/` | GET | Get annotated image with bounding boxes |
| `/summary/` | GET | Get detection summary statistics |
| `/api/recipes/` | GET | Get recipe recommendations |

## 🎯 How It Works

1. **Upload Image**: User uploads a photo containing fruits/vegetables
2. **Detection**: SSD MobileNet V2 detects objects in the image
3. **Classification**: Each detected object is cropped and classified using a fine-tuned CNN
4. **Analysis**: Results categorized as fresh or rotten with confidence scores
5. **Recommendations**: Fresh ingredients are used to suggest recipes

## 🧪 Model Details

### Object Detector
- **Model**: SSD MobileNet V2 (TensorFlow Hub)
- **Purpose**:  Localize fruits/vegetables in images
- **Output**: Bounding boxes with confidence scores

### Classifier
- **Architecture**: MobileNet V2 (fine-tuned)
- **Input Size**: 128x128 RGB
- **Classes**: 18 (9 fresh + 9 rotten varieties)
- **Training**: Custom dataset with data augmentation

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14
- Tailwind CSS

**Backend:**
- FastAPI
- TensorFlow 2.20
- TensorFlow Hub
- OpenCV
- PIL (Pillow)

**ML/AI:**
- SSD MobileNet V2 (Object Detection)
- MobileNet V2 (Classification)
- Custom CNN architecture
