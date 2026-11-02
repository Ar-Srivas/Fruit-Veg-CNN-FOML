def predict_single_image(image_pil):
    """Return a fixed sample classification for the no-model demo deployment."""
    return {
        "label": "FreshCarrot",
        "confidence": 0.96,
        "bbox": None,
        "second_prediction": {
            "label": "FreshTomato",
            "confidence": 0.88,
        },
    }
