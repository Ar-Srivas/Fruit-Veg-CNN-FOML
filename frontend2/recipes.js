const API_BASE_URL = "http://127.0.0.1:8000";
const ingredientsInput = document.querySelector("#ingredients-input");
const ingredientForm = document.querySelector("#ingredient-form");
const ingredientChips = document.querySelector("#ingredient-chips");
const recipeMessage = document.querySelector("#recipe-message");
const recipeList = document.querySelector("#recipe-list");
const submitButton = document.querySelector("#find-recipes");

function setMessage(message, isError = false) {
  recipeMessage.textContent = message;
  recipeMessage.classList.toggle("error", isError);
  recipeMessage.hidden = !message;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getIngredients() {
  return [...new Set(ingredientsInput.value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function updateIngredientChips() {
  ingredientChips.innerHTML = getIngredients()
    .map((ingredient) => `<span class="ingredient-chip">${escapeHTML(ingredient)}</span>`)
    .join("");
}

function renderIngredientGroup(title, ingredients, className) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return "";
  const names = ingredients.slice(0, 4).map((item) => `<span>${escapeHTML(item.name || item)}</span>`).join("");
  const remaining = ingredients.length > 4 ? `<span>+${ingredients.length - 4} more</span>` : "";
  return `<div class="ingredient-group ${className}"><p>${title} (${ingredients.length})</p>${names}${remaining}</div>`;
}

function renderRecipe(recipe) {
  const title = escapeHTML(recipe.title || "Recipe");
  const image = escapeHTML(recipe.image || "");
  const id = encodeURIComponent(recipe.id ?? "");
  const slug = String(recipe.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const recipeUrl = recipe.sourceUrl || `https://spoonacular.com/recipes/${slug}-${id}`;
  return `
    <article class="recipe-card">
      ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ""}
      <div class="recipe-card-body">
        <h3>${title}</h3>
        ${renderIngredientGroup("You have", recipe.usedIngredients, "have")}
        ${renderIngredientGroup("You’ll need", recipe.missedIngredients, "need")}
        <a class="recipe-link" href="${escapeHTML(recipeUrl)}" target="_blank" rel="noopener noreferrer">View full recipe <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
}

async function findRecipes(event) {
  event.preventDefault();
  const ingredients = getIngredients();
  if (!ingredients.length) {
    setMessage("Enter at least one ingredient to find recipes.", true);
    ingredientsInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Searching…";
  recipeList.replaceChildren();
  setMessage("Finding recipes with your ingredients…");

  try {
    const query = encodeURIComponent(ingredients.join(","));
    const response = await fetch(`${API_BASE_URL}/api/recipes/?ingredients=${query}&number=6`);
    if (!response.ok) {
      let detail = `Recipe search failed (${response.status})`;
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch {
        // Keep the HTTP status when the server did not return JSON.
      }
      throw new Error(detail);
    }
    const recipes = await response.json();
    if (!Array.isArray(recipes)) throw new Error("The recipe service returned an unexpected response.");

    if (recipes.length) {
      recipeList.innerHTML = recipes.map(renderRecipe).join("");
      setMessage(`Found ${recipes.length} recipe${recipes.length === 1 ? "" : "s"}.`);
    } else {
      setMessage("No recipes found. Try a different combination of ingredients.");
    }
  } catch (error) {
    setMessage(`Could not find recipes: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Find recipes <span aria-hidden="true">→</span>';
  }
}

ingredientsInput.value = new URLSearchParams(window.location.search).get("ingredients") || "";
updateIngredientChips();
ingredientsInput.addEventListener("input", updateIngredientChips);
ingredientForm.addEventListener("submit", findRecipes);
if (ingredientsInput.value.trim()) ingredientForm.requestSubmit();
