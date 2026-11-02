"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "../../config/api";

function RecipesContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const ingredientsParam = searchParams.get("ingredients");
    if (ingredientsParam) {
      setIngredients(ingredientsParam);
      fetchRecipes(ingredientsParam);
    }
  }, [searchParams]);

  const fetchRecipes = async (ingredientsList) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/recipes/?ingredients=${encodeURIComponent(
          ingredientsList
        )}&number=6`
      );

      if (!response.ok) throw new Error("Failed to fetch recipes");

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error("Recipe fetch error:", err);
      setError(err.message || "Failed to load recipes");
      setRecipes([]);
    }

    setLoading(false);
  };

  const handleGetRecipes = async () => {
    if (!ingredients.trim()) {
      setError("Please enter at least one ingredient");
      return;
    }
    fetchRecipes(ingredients);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGetRecipes();
    }
  };

  const ingredientsList = ingredients.split(",").map(i => i.trim()).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Recipe Finder</h1>
            <p className="text-gray-600">Discover delicious recipes based on your ingredients</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-semibold shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Detector
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Your Ingredients
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., apple, banana, carrot"
              className="flex-1 border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleGetRecipes}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 font-semibold shadow-md disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Find Recipes"}
            </button>
          </div>
          {ingredientsList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingredientsList.map((ing, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {ing}
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="text-gray-600 mt-4 text-lg">Finding delicious recipes...</p>
          </div>
        ) : recipes.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Found {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                  {recipe.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 line-clamp-2">
                      {recipe.title}
                    </h3>

                    {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-semibold text-green-700">
                            You have ({recipe.usedIngredients.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recipe.usedIngredients.slice(0, 3).map((ing, i) => (
                            <span
                              key={i}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {ing.name}
                            </span>
                          ))}
                          {recipe.usedIngredients.length > 3 && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              +{recipe.usedIngredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-semibold text-orange-700">
                            You need ({recipe.missedIngredients.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recipe.missedIngredients.slice(0, 3).map((ing, i) => (
                            <span
                              key={i}
                              className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded"
                            >
                              {ing.name}
                            </span>
                          ))}
                          {recipe.missedIngredients.length > 3 && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                              +{recipe.missedIngredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <a
                      href={`https://spoonacular.com/recipes/${recipe.title.toLowerCase().replace(/ /g, '-')}-${recipe.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md"
                    >
                      View Full Recipe
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ingredients ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl text-gray-600 mb-2">No recipes found</p>
            <p className="text-gray-500">Try different ingredients or add more options</p>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-xl text-gray-600">Enter ingredients to find recipes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}