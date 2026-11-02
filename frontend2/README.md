# FoodLens — plain HTML, CSS, and JavaScript

`frontend2` is a static, framework-free replica of the FoodLens detector and recipe finder. It uses the same FastAPI endpoints as the Next.js frontend.

## Run locally

Start the backend from the `backend` directory:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000` in a browser. FastAPI serves this folder's `index.html` at `/`, and serves the recipe page and static assets from the same origin.

Use the freshness checker to upload and classify an image, or open Recipe Finder to search by comma-separated ingredients. Recipe suggestions from a multi-item scan link through to the separate recipe page with detected fresh ingredients prefilled.
