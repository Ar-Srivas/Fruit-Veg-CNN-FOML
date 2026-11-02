from PIL import ImageDraw, ImageFont


def _scaled_box(image_size, fractions):
    width, height = image_size
    left, top, right, bottom = fractions
    x1 = min(width - 1, max(0, round(width * left)))
    y1 = min(height - 1, max(0, round(height * top)))
    x2 = min(width, max(x1 + 1, round(width * right)))
    y2 = min(height, max(y1 + 1, round(height * bottom)))
    return [x1, y1, x2, y2]


def detect_and_classify(image_pil, score_threshold=0.5):
    """Return fixed sample detections; image content is not analyzed."""
    examples = [
        ("FreshCarrot", 0.96, (0.08, 0.12, 0.42, 0.78)),
        ("FreshTomato", 0.91, (0.55, 0.16, 0.88, 0.52)),
        ("RottenBanana", 0.84, (0.34, 0.58, 0.76, 0.9)),
    ]
    return [
        {
            "bbox": _scaled_box(image_pil.size, box),
            "label": label,
            "confidence": confidence,
        }
        for label, confidence, box in examples
        if confidence >= score_threshold
    ]


def draw_predictions_on_image(image_pil, predictions):
    image = image_pil.copy().convert("RGB")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    for prediction in predictions:
        label = prediction["label"]
        color = "#23864b" if label.startswith("Fresh") else "#c3443b"
        box = prediction["bbox"]
        draw.rectangle(box, outline=color, width=3)
        text = f'{label} (sample {prediction["confidence"]:.0%})'
        text_box = draw.textbbox((box[0], max(0, box[1] - 14)), text, font=font)
        draw.rectangle(text_box, fill=color)
        draw.text(
            (box[0], max(0, box[1] - 14)),
            text,
            fill="white",
            font=font,
        )

    return image
