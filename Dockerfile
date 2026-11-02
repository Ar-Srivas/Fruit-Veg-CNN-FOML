FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        libsm6 \
        libxext6 \
        libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY backend/app.py backend/metrics.py backend/recipe_api.py backend/model_classifier.py backend/model_finetuned.py ./
COPY backend/model4_v2_fixed.keras backend/veg_fruit_classifier_mobilenetv2_128.keras ./
COPY frontend2/ /frontend2/

EXPOSE 80

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
