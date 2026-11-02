"use client";
import { useState, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState(null);
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [manyResults, setManyResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset all states
      setUploadedImageUrl(null);
      setAnnotatedImageUrl(null);
      setShowAnnotated(false);
      setPrediction(null);
      setManyResults(null);
      setRecipes(null);
      setSummary(null);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`${API_BASE_URL}/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.detail || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      console.log("Upload successful:", uploadData);

      // Set the display URL
      setUploadedImageUrl(`${API_BASE_URL}/display/?t=${Date.now()}`);
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
      return false;
    }
  };

  const handlePredictSingle = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    setLoading(true);
    setPrediction(null);
    setManyResults(null);
    setShowAnnotated(false);

    try {
      // Upload image first
      const uploaded = await uploadImage(file);
      if (!uploaded) return;

      // Get single prediction
      const predRes = await fetch(`${API_BASE_URL}/predict/`);
      if (!predRes.ok) throw new Error("Prediction failed");

      const predData = await predRes.json();
      console.log("Single prediction:", predData);
      setPrediction(predData.prediction);
    } catch (error) {
      console.error("Prediction error:", error);
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictMany = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    setLoading(true);
    setPrediction(null);
    setManyResults(null);
    setShowAnnotated(false);
    setSummary(null);
    setRecipes(null);

    try {
      // Upload image first
      const uploaded = await uploadImage(file);
      if (!uploaded) return;

      // Get multiple predictions
      const threshold = 0.5;
      const predRes = await fetch(`${API_BASE_URL}/predict_many/?threshold=${threshold}`);
      if (!predRes.ok) throw new Error("Detection failed");

      const predData = await predRes.json();
      console.log("Multiple predictions:", predData);
      setManyResults(predData);

      // Get annotated image
      const vizUrl = `${API_BASE_URL}/visualize/?threshold=${threshold}&t=${Date.now()}`;
      setAnnotatedImageUrl(vizUrl);
      setShowAnnotated(true);

      // Get summary
      const summaryRes = await fetch(`${API_BASE_URL}/summary/`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        console.log("Summary:", summaryData);
        setSummary(summaryData);

        // Fetch recipes with fresh ingredients
        if (summaryData.ingredients_for_recipes.length > 0) {
          await fetchRecipes(summaryData.ingredients_for_recipes);
        }
      }
    } catch (error) {
      console.error("Detection error:", error);
      alert(`Detection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipes = async (ingredients) => {
    try {
      const ingredientsQuery = ingredients.join(",");
      const recipeRes = await fetch(
        `${API_BASE_URL}/api/recipes/?ingredients=${ingredientsQuery}&number=6`
      );

      if (recipeRes.ok) {
        const recipeData = await recipeRes.json();
        console.log("Recipes:", recipeData);
        setRecipes(recipeData);
      }
    } catch (error) {
      console.error("Recipe fetch error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            FoodLens
          </h1>
          <p className="text-gray-600 text-lg">
            Upload an image to detect fresh or rotten fruits and vegetables.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Section - Upload & Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
              >
                {file ? "Change Image" : "Choose Image"}
              </button>
              {file && (
                <p className="mt-3 text-sm text-gray-600 text-center truncate">
                  📁 {file.name}
                </p>
              )}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePredictSingle}
                  disabled={!file || loading}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                >

                  {loading ? "Detecting..." : "Detect Single Item"}
                </button>
                <button
                  onClick={handlePredictMany}
                  disabled={!file || loading}
                  className="w-full py-3 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                >

                  {loading ? "Detecting..." : "Detect Multiple Items"}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Section - Image Display */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {showAnnotated ? "Detection Results" : "Uploaded Image"}
                </h3>
                {showAnnotated && annotatedImageUrl && (
                  <button
                    onClick={() => setShowAnnotated(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm transition-colors"
                  >
                    Show Original
                  </button>
                )}
              </div>

              <div className="flex justify-center">
                {showAnnotated && annotatedImageUrl ? (
                  <img
                    src={annotatedImageUrl}
                    alt="Annotated"
                    className="max-w-full max-h-[500px] border-2 border-gray-200 rounded-xl shadow-md object-contain"
                    onError={() => {
                      console.error("Failed to load annotated image");
                      setAnnotatedImageUrl(null);
                    }}
                  />
                ) : uploadedImageUrl ? (
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded"
                    className="max-w-full max-h-[500px] border-2 border-gray-200 rounded-xl shadow-md object-contain"
                    onError={() => {
                      console.error("Failed to load uploaded image");
                      setUploadedImageUrl(null);
                    }}
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-white">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">No image uploaded</p>
                      <p className="text-sm mt-1">Upload an image to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {prediction && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Detection Results</h3>
                <div className="space-y-4">
                  {/* Primary Prediction */}
                  <div className="p-6 rounded-xl border border-gray-300 bg-gray-50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">Primary Detection</h4>
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                        {prediction.label}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Confidence Level</span>
                        <span className="font-semibold">{(prediction.confidence * 100).toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gray-500 transition-all duration-1000"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Prediction */}
                  {prediction.second_prediction && (
                    <div className="p-6 rounded-xl border border-gray-300 bg-gray-50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">Second Most Probable</h4>
                        <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                          {prediction.second_prediction.label}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Confidence Level</span>
                          <span className="font-semibold">{(prediction.second_prediction.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gray-500 transition-all duration-1000"
                            style={{ width: `${prediction.second_prediction.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Summary */}
            {summary && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-blue-200 animate-fadeIn">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v0m-6 0h6" />
                    </svg>
                  </div>
                  Detection Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-gray-800">{summary.total_items}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{summary.fresh_count}</div>
                    <div className="text-sm text-gray-600 mt-1">Fresh Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-red-600">{summary.rotten_count}</div>
                    <div className="text-sm text-gray-600 mt-1">Rotten Items</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detection Results Grid */}
        {manyResults && manyResults.predictions && manyResults.predictions.length > 0 && (
  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-8 animate-fadeIn">
    <h3 className="text-2xl font-bold text-gray-800 mb-6">
      Detected Items ({manyResults.count})
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {manyResults.predictions.map((pred, idx) => (
        <div
          key={idx}
          className={`group relative border-2 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            pred.label.startsWith("Fresh")
              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-500"
              : "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 hover:border-red-500"
          }`}
        >
          <div className="text-center">
            <p className="font-semibold text-gray-800 text-sm mb-1">
              {pred.label.replace("Fresh", "").replace("Rotten", "")}
            </p>
            <p className="text-xs text-gray-600">
              {(pred.confidence * 100).toFixed(1)}%
            </p>
            <p
              className={`text-xs font-medium mt-1 ${
                pred.label.startsWith("Fresh")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {pred.label.startsWith("Fresh") ? "Fresh" : "Rotten"}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


        {/* Recipes Section */}
        {recipes && recipes.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-fadeIn">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Recipe Suggestions ({recipes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {recipe.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{recipe.readyInMinutes} mins</span>
                      <span className="mx-1">•</span>
                      <span>{recipe.servings} servings</span>
                    </div>
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      View Recipe
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}