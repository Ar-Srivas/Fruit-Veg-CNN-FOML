const API_BASE_URL = window.location.origin;

const fileInput = document.querySelector("#image-input");
const dropzone = document.querySelector("#dropzone");
const imagePreview = document.querySelector("#preview-image");
const emptyState = document.querySelector("#empty-state");
const singleButton = document.querySelector("#single-button");
const multipleButton = document.querySelector("#multiple-button");
const showOriginalButton = document.querySelector("#show-original");
const statusMessage = document.querySelector("#status-message");

let selectedFile = null;
let localImageUrl = null;
let uploadedImageUrl = null;
let annotatedImageUrl = null;
let isLoading = false;

function setMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.hidden = !message;
}

function setBusy(busy) {
  isLoading = busy;
  singleButton.disabled = busy || !selectedFile;
  multipleButton.disabled = busy || !selectedFile;
  singleButton.innerHTML = busy ? "Checking…" : '<span aria-hidden="true">◉</span> Check one item';
  multipleButton.innerHTML = busy ? "Checking…" : '<span aria-hidden="true">⌗</span> Scan all items';
}

function clearResults() {
  document.querySelector("#single-results").hidden = true;
  document.querySelector("#single-results").replaceChildren();
  document.querySelector("#summary-section").hidden = true;
  document.querySelector("#summary-section").replaceChildren();
  document.querySelector("#multiple-results").hidden = true;
  document.querySelector("#multiple-results").replaceChildren();
  document.querySelector("#recipe-results").hidden = true;
  document.querySelector("#recipe-results").replaceChildren();
  annotatedImageUrl = null;
  showOriginalButton.hidden = true;
  document.querySelector("#image-heading").textContent = selectedFile ? "Image ready to scan" : "Ready when you are";
}

function selectFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setMessage("Please select an image file (JPG, PNG, or WEBP).", true);
    return;
  }
  if (localImageUrl) URL.revokeObjectURL(localImageUrl);
  selectedFile = file;
  localImageUrl = URL.createObjectURL(file);
  imagePreview.src = localImageUrl;
  imagePreview.alt = `Preview of ${file.name}`;
  imagePreview.hidden = false;
  emptyState.hidden = true;
  document.querySelector("#file-details").hidden = false;
  document.querySelector("#file-name").textContent = file.name;
  document.querySelector("#dropzone-title").textContent = "Image selected";
  document.querySelector("#dropzone-hint").textContent = "Choose another image to replace it";
  document.querySelector("#image-heading").textContent = "Image ready to scan";
  setMessage("");
  clearResults();
  setBusy(false);
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

function formatPercent(value) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return 0;
  return Math.round(Math.max(0, Math.min(1, confidence)) * 1000) / 10;
}

function confidenceClass(confidence) {
  if (confidence >= 0.8) return "";
  if (confidence >= 0.6) return "medium";
  return "low";
}

function renderPrediction(prediction, caption) {
  const confidence = Math.max(0, Math.min(1, Number(prediction.confidence) || 0));
  const label = escapeHTML(prediction.label || "Unknown");
  return `
    <article class="prediction-card">
      <div class="prediction-top">
        <div>
          <p class="prediction-caption">${caption}</p>
          <h4 class="prediction-label">${label}</h4>
        </div>
        <span class="confidence-pill ${confidenceClass(confidence)}">${formatPercent(confidence)}% confidence</span>
      </div>
      <div class="confidence-row">
        <span>Confidence</span>
        <div class="confidence-track"><div class="confidence-fill" style="width:${formatPercent(confidence)}%"></div></div>
        <strong>${formatPercent(confidence)}%</strong>
      </div>
    </article>`;
}

function renderRecipeCard(recipe) {
  const title = escapeHTML(recipe.title || "Recipe");
  const image = escapeHTML(recipe.image || "");
  const source = escapeHTML(recipe.sourceUrl || `https://spoonacular.com/recipes/${String(recipe.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${recipe.id}`);
  return `
    <article class="recipe-card">
      ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ""}
      <div class="recipe-card-body">
        <h3>${title}</h3>
        <p class="recipe-meta">${recipe.readyInMinutes ? `${escapeHTML(recipe.readyInMinutes)} mins` : "A fresh idea"}${recipe.servings ? ` · ${escapeHTML(recipe.servings)} servings` : ""}</p>
        <a class="recipe-link" href="${source}" target="_blank" rel="noopener noreferrer">View recipe <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
}

async function requestJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // Use the HTTP status when the server response is not JSON.
    }
    throw new Error(detail);
  }
  return response.json();
}

async function uploadSelectedImage() {
  const formData = new FormData();
  formData.append("file", selectedFile);
  await requestJSON(`${API_BASE_URL}/upload/`, { method: "POST", body: formData });
  uploadedImageUrl = `${API_BASE_URL}/display/?t=${Date.now()}`;
}

async function runSinglePrediction() {
  if (!selectedFile || isLoading) return;
  setBusy(true);
  setMessage("Uploading your image and checking freshness…");
  clearResults();

  try {
    await uploadSelectedImage();
    const data = await requestJSON(`${API_BASE_URL}/predict/`);
    const result = document.querySelector("#single-results");
    result.innerHTML = `<h3 class="result-heading">Freshness check</h3>${renderPrediction(data.prediction, "Primary detection")}${data.prediction?.second_prediction ? `<div style="height:9px"></div>${renderPrediction(data.prediction.second_prediction, "Second most likely")}` : ""}`;
    result.hidden = false;
    imagePreview.src = uploadedImageUrl;
    document.querySelector("#image-heading").textContent = "Your freshness check";
    setMessage("Freshness check complete.");
  } catch (error) {
    setMessage(`Could not check this image: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

async function runMultipleDetection() {
  if (!selectedFile || isLoading) return;
  setBusy(true);
  setMessage("Uploading your image and scanning for produce…");
  clearResults();

  try {
    await uploadSelectedImage();
    const threshold = 0.5;
    const data = await requestJSON(`${API_BASE_URL}/predict_many/?threshold=${threshold}`);
    const results = Array.isArray(data.predictions) ? data.predictions : [];
    const summary = await requestJSON(`${API_BASE_URL}/summary/`);

    const summarySection = document.querySelector("#summary-section");
    summarySection.innerHTML = `
      <h3 class="result-heading">Detection summary</h3>
      <div class="summary-cards">
        <div class="summary-card"><div class="summary-value">${Number(summary.total_items) || 0}</div><div class="summary-label">Total items</div></div>
        <div class="summary-card fresh"><div class="summary-value">${Number(summary.fresh_count) || 0}</div><div class="summary-label">Fresh</div></div>
        <div class="summary-card rotten"><div class="summary-value">${Number(summary.rotten_count) || 0}</div><div class="summary-label">Rotten</div></div>
      </div>`;
    summarySection.hidden = false;

    const multipleSection = document.querySelector("#multiple-results");
    multipleSection.innerHTML = `
      <h3 class="lower-heading">Detected items (${results.length})</h3>
      ${results.length ? `<div class="detection-grid">${results.map((item) => {
        const fresh = String(item.label || "").startsWith("Fresh");
        const name = String(item.label || "Unknown").replace(/^(Fresh|Rotten)\s*/, "");
        return `<article class="detection-card ${fresh ? "" : "rotten"}"><p class="detection-name">${escapeHTML(name)}</p><span class="detection-confidence">${formatPercent(item.confidence)}%</span><p class="detection-state">${fresh ? "Fresh" : "Rotten"}</p></article>`;
      }).join("")}</div>` : '<p class="empty-copy">No produce was detected in this image. Try a clearer photo with the items in view.</p>'}`;
    multipleSection.hidden = false;

    annotatedImageUrl = `${API_BASE_URL}/visualize/?threshold=${threshold}&t=${Date.now()}`;
    imagePreview.src = annotatedImageUrl;
    showOriginalButton.hidden = false;
    document.querySelector("#image-heading").textContent = "Scan results";
    setMessage("Produce scan complete.");

    const ingredients = Array.isArray(summary.ingredients_for_recipes) ? summary.ingredients_for_recipes : [];
    if (ingredients.length) await loadSuggestedRecipes(ingredients);
  } catch (error) {
    setMessage(`Could not scan this image: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

async function loadSuggestedRecipes(ingredients) {
  const section = document.querySelector("#recipe-results");
  try {
    const query = encodeURIComponent(ingredients.join(","));
    const recipes = await requestJSON(`${API_BASE_URL}/api/recipes/?ingredients=${query}&number=6`);
    if (!Array.isArray(recipes) || recipes.length === 0) return;
    section.innerHTML = `<h3 class="lower-heading">Recipe ideas from your fresh ingredients</h3><div class="recipe-grid">${recipes.map(renderRecipeCard).join("")}</div><p style="margin:15px 0 0"><a class="recipe-link" href="recipes.html?ingredients=${query}">Explore more recipes with these ingredients <span aria-hidden="true">→</span></a></p>`;
    section.hidden = false;
  } catch (error) {
    setMessage(`The produce scan finished, but recipe suggestions could not be loaded: ${error.message}`, true);
  }
}

fileInput.addEventListener("change", (event) => selectFile(event.target.files[0]));
document.querySelector("#remove-file").addEventListener("click", () => {
  selectedFile = null;
  uploadedImageUrl = null;
  if (localImageUrl) URL.revokeObjectURL(localImageUrl);
  localImageUrl = null;
  fileInput.value = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  emptyState.hidden = false;
  document.querySelector("#file-details").hidden = true;
  document.querySelector("#dropzone-title").textContent = "Drop your image here";
  document.querySelector("#dropzone-hint").innerHTML = 'or <span class="browse-link">browse files</span>';
  document.querySelector("#image-heading").textContent = "Ready when you are";
  clearResults();
  setMessage("");
  setBusy(false);
});
singleButton.addEventListener("click", runSinglePrediction);
multipleButton.addEventListener("click", runMultipleDetection);
showOriginalButton.addEventListener("click", () => {
  if (!localImageUrl) return;
  imagePreview.src = localImageUrl;
  showOriginalButton.hidden = true;
  document.querySelector("#image-heading").textContent = "Original image";
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag-over");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag-over");
  selectFile(event.dataTransfer.files[0]);
});

window.addEventListener("beforeunload", () => {
  if (localImageUrl) URL.revokeObjectURL(localImageUrl);
});
