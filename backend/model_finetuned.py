import tensorflow_hub as hub
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from tensorflow.keras.models import load_model


detector = hub.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")
classifier = load_model("veg_fruit_classifier_mobilenetv2_128.keras")


class_names = [
    'FreshApple', 'FreshBanana', 'FreshCarrot', 'FreshCucumber', 'FreshMango',
    'FreshOrange', 'FreshPotato', 'FreshStrawberry', 'FreshTomato',
    'RottenApple', 'RottenBanana', 'RottenCarrot', 'RottenCucumber',
    'RottenMango', 'RottenOrange', 'RottenPotato', 'RottenStrawberry', 'RottenTomato'
]


def detect_and_classify(image_pil, score_threshold=0.5):
    img = np.array(image_pil)
    input_tensor = tf.expand_dims(img, 0)
    detections = detector(input_tensor)

    boxes = detections["detection_boxes"][0].numpy()
    scores = detections["detection_scores"][0].numpy()

    h, w, _ = img.shape
    predictions = []

    for i in range(len(scores)):
        if scores[i] < score_threshold:
            continue

        y1, x1, y2, x2 = boxes[i]
        (x1, y1, x2, y2) = (int(x1 * w), int(y1 * h), int(x2 * w), int(y2 * h))

        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        crop_resized = cv2.resize(crop, (128, 128))
        crop_array = np.expand_dims(crop_resized, axis=0)

        preds = classifier.predict(crop_array, verbose=0)
        label = class_names[np.argmax(preds)]
        confidence = np.max(preds)

        predictions.append({
            "bbox": [x1, y1, x2, y2],
            "label": label,
            "confidence": float(confidence)
        })

    return predictions


def draw_predictions_on_image(image_pil, predictions):
    img = image_pil.copy()
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    for pred in predictions:
        bbox = pred["bbox"]
        label = pred["label"]
        confidence = pred["confidence"]

        x1, y1, x2, y2 = bbox

        if label.startswith("Fresh"):
            color = "#00FF00"  # Green for fresh
        elif label.startswith("Rotten"):
            color = "#FF0000"  # Red for rotten
        else:
            color = "#FFFF00"  # Yellow for unknown

        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        display_label = label.replace("Fresh", "Fresh ").replace("Rotten", "Rotten ")
        text = f"{display_label} ({confidence:.2f})"

        text_bbox = draw.textbbox((x1, y1 - 25), text, font=small_font)
        draw.rectangle(text_bbox, fill=color)

        draw.text((x1, y1 - 25), text, fill="black", font=small_font)

    return img