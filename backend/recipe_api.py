from fastapi import APIRouter, Query
import requests
from dotenv import load_dotenv
import os

load_dotenv()

dish_router = APIRouter()

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://api.spoonacular.com/recipes/findByIngredients"

@dish_router.get("/recipes/")
def get_recipes(ingredients: str = Query(..., description="Comma-separated ingredients"),
                number: int = 2):
    params = {
        "ingredients": ingredients,
        "number": number,
        "apiKey": API_KEY
    }

    response = requests.get(BASE_URL, params=params)
    return response.json()