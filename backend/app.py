from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from PIL import Image
import io
import os
from time import perf_counter
from pathlib import Path
from metrics import (
    PrometheusMiddleware,
    observe_inference,
    record_prediction,
)
from recipe_api import dish_router
from model_classifier import predict_single_image
from model_finetuned import detect_and_classify, draw_predictions_on_image


app = FastAPI()
app.include_router(dish_router, prefix="/api")
app.add_middleware(PrometheusMiddleware)
FRONTEND2_DIR = Path(__file__).resolve().parent.parent / "frontend2"

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    FRONTEND_URL,
    "https://foml.arijitsrivastava.tech",
]

if ENVIRONMENT == "production":
    ALLOWED_ORIGINS = [
        "https://foml.arijitsrivastava.tech",
        FRONTEND_URL,
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for uploaded image
uploaded_image = {"image_bytes": None, "original_image": None, "detections": None}


@app.get("/")
async def root():
    return FileResponse(FRONTEND2_DIR / "index.html")


@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file content
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        uploaded_image["original_image"] = image.copy()

        # Store as bytes for display
        img_bytes = io.BytesIO()
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        uploaded_image["image_bytes"] = img_bytes.getvalue()

        # Reset detections on new upload
        uploaded_image["detections"] = None

        return {
            "message": "Image uploaded successfully",
            "image_size": image.size,
            "mode": image.mode,
            "display_url": "/display/"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")


@app.get("/display/")
async def display_image():
    if uploaded_image["image_bytes"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    return StreamingResponse(
        io.BytesIO(uploaded_image["image_bytes"]),
        media_type="image/png"
    )


@app.get("/predict/")
async def predict_image():
    if uploaded_image["original_image"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    started_at = perf_counter()
    try:
        result = predict_single_image(uploaded_image["original_image"])
    finally:
        observe_inference(started_at)
    record_prediction(result["label"])

    return JSONResponse({
        "prediction": result,
        "count": 1,
        "mode": "single",
        "demo_mode": True,
    })


@app.get("/predict_many/")
async def predict_many(threshold: float = 0.5):
    if uploaded_image["original_image"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    started_at = perf_counter()
    try:
        detections = detect_and_classify(
            uploaded_image["original_image"],
            score_threshold=threshold
        )
    finally:
        observe_inference(started_at)
    for detection in detections:
        record_prediction(detection["label"])

    # Store detections for visualization
    uploaded_image["detections"] = detections

    return JSONResponse({
        "predictions": detections,
        "count": len(detections),
        "mode": "multiple",
        "threshold": threshold,
        "visualize_url": f"/visualize/?threshold={threshold}",
        "demo_mode": True,
    })


@app.get("/visualize/")
async def visualize_detections(threshold: float = 0.5):
    if uploaded_image["original_image"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    # Get or recompute detections
    if uploaded_image["detections"] is None:
        started_at = perf_counter()
        try:
            detections = detect_and_classify(
                uploaded_image["original_image"],
                score_threshold=threshold
            )
        finally:
            observe_inference(started_at)
        for detection in detections:
            record_prediction(detection["label"])
        uploaded_image["detections"] = detections
    else:
        detections = uploaded_image["detections"]

    # Draw predictions on image
    annotated_image = draw_predictions_on_image(
        uploaded_image["original_image"],
        detections
    )

    # Convert to bytes
    img_bytes = io.BytesIO()
    annotated_image.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    return StreamingResponse(img_bytes, media_type="image/png")


@app.get("/summary/")
async def get_summary():
    if uploaded_image["detections"] is None:
        raise HTTPException(
            status_code=404,
            detail="No detections available. Run /predict_many/ first"
        )

    detections = uploaded_image["detections"]

    # Group by freshness
    fresh_items = []
    rotten_items = []

    for det in detections:
        label = det["label"]
        if label.startswith("Fresh"):
            item_name = label.replace("Fresh", "").strip()
            fresh_items.append({
                "name": item_name,
                "confidence": det["confidence"],
                "bbox": det.get("bbox")
            })
        elif label.startswith("Rotten"):
            item_name = label.replace("Rotten", "").strip()
            rotten_items.append({
                "name": item_name,
                "confidence": det["confidence"],
                "bbox": det.get("bbox")
            })

    # Extract unique ingredient names for recipes (only fresh items)
    ingredients = list(set([item["name"].lower() for item in fresh_items]))

    return JSONResponse({
        "total_items": len(detections),
        "fresh_count": len(fresh_items),
        "rotten_count": len(rotten_items),
        "fresh_items": fresh_items,
        "rotten_items": rotten_items,
        "ingredients_for_recipes": ingredients,
        "demo_mode": True,
    })


@app.delete("/reset/")
async def reset_session():
    uploaded_image["image_bytes"] = None
    uploaded_image["original_image"] = None
    uploaded_image["detections"] = None

    return {"message": "Session reset successfully"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/metrics", include_in_schema=False)
async def prometheus_metrics():
    return Response(
        content=generate_latest(),
        headers={"Content-Type": CONTENT_TYPE_LATEST},
    )


@app.get("/health/", include_in_schema=False)
async def detailed_health_check():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "has_image": uploaded_image["original_image"] is not None
    }


app.mount("/", StaticFiles(directory=FRONTEND2_DIR, html=True), name="frontend2")