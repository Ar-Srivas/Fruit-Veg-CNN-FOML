import unittest
from unittest.mock import Mock, patch

import recipe_api


class GetRecipesTests(unittest.TestCase):
    def test_forwards_ingredients_result_count_and_api_key(self):
        recipes = [{"id": 1, "title": "Apple salad"}]
        response = Mock()
        response.json.return_value = recipes

        with patch.object(recipe_api, "API_KEY", "test-api-key"), patch.object(
            recipe_api.requests, "get", return_value=response
        ) as get:
            result = recipe_api.get_recipes("apple,banana", number=6)

        get.assert_called_once_with(
            recipe_api.BASE_URL,
            params={
                "ingredients": "apple,banana",
                "number": 6,
                "apiKey": "test-api-key",
            },
        )
        self.assertEqual(result, recipes)

    def test_defaults_to_two_recipes(self):
        response = Mock()
        response.json.return_value = []

        with patch.object(recipe_api, "API_KEY", "test-api-key"), patch.object(
            recipe_api.requests, "get", return_value=response
        ) as get:
            result = recipe_api.get_recipes("carrot")

        self.assertEqual(
            get.call_args.kwargs["params"],
            {
                "ingredients": "carrot",
                "number": 2,
                "apiKey": "test-api-key",
            },
        )
        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
