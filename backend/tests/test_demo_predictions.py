import unittest

from PIL import Image, ImageChops

from model_classifier import predict_single_image
from model_finetuned import detect_and_classify, draw_predictions_on_image


class DemoPredictionTests(unittest.TestCase):
    def test_single_prediction_is_a_fixed_sample(self):
        image = Image.new("RGB", (40, 30), "white")

        result = predict_single_image(image)

        self.assertEqual(result["label"], "FreshCarrot")
        self.assertEqual(result["confidence"], 0.96)
        self.assertEqual(result["second_prediction"]["label"], "FreshTomato")

    def test_multi_predictions_and_annotation_are_image_sized(self):
        image = Image.new("RGB", (100, 80), "white")

        predictions = detect_and_classify(image)
        annotated = draw_predictions_on_image(image, predictions)

        self.assertEqual(
            [prediction["label"] for prediction in predictions],
            ["FreshCarrot", "FreshTomato", "RottenBanana"],
        )
        for prediction in predictions:
            x1, y1, x2, y2 = prediction["bbox"]
            self.assertTrue(0 <= x1 < x2 <= image.width)
            self.assertTrue(0 <= y1 < y2 <= image.height)

        # Uncomment to confirm the bounds assertion catches a broken box:
        # x1, y1, x2, y2 = -1, 0, image.width + 1, image.height
        # self.assertTrue(0 <= x1 < x2 <= image.width)

        self.assertIsNotNone(ImageChops.difference(image, annotated).getbbox())


if __name__ == "__main__":
    unittest.main()
