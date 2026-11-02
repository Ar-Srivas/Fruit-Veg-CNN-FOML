from time import perf_counter
from typing import Any

from prometheus_client import Counter, Histogram

HTTP_REQUEST_COUNTER = Counter(
    "fastapi_http_requests_total",
    "Total HTTP requests handled by FastAPI",
    ["endpoint", "method", "status_code"],
)

INFERENCE_LATENCY = Histogram(
    "foodlens_inference_latency_seconds",
    "Time taken for fruit and vegetable inference",
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

PREDICTION_BY_CLASS = Counter(
    "foodlens_predictions_total",
    "Count of items detected grouped by freshness status and category",
    ["item_class", "status"],
)

class PrometheusMiddleware:
    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, scope: dict, receive: Any, send: Any) -> None:
        if scope["type"] != "http" or scope.get("path", "").rstrip("/") == "/metrics":
            await self.app(scope, receive, send)
            return

        status_code = 500

        async def send_and_capture_status(message: dict) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        started_at = perf_counter()
        try:
            await self.app(scope, receive, send_and_capture_status)
        finally:
            route = scope.get("route")
            endpoint = getattr(route, "path", "unmatched")
            HTTP_REQUEST_COUNTER.labels(
                endpoint=endpoint,
                method=scope.get("method", "UNKNOWN"),
                status_code=str(status_code),
            ).inc()


def observe_inference(started_at: float) -> None:
    INFERENCE_LATENCY.observe(perf_counter() - started_at)


def record_prediction(label: str) -> None:
    if label.startswith("Fresh"):
        status = "fresh"
        item_class = label.removeprefix("Fresh").strip()
    elif label.startswith("Rotten"):
        status = "rotten"
        item_class = label.removeprefix("Rotten").strip()
    else:
        status = "unknown"
        item_class = "unknown"

    PREDICTION_BY_CLASS.labels(
        item_class=item_class or "unknown",
        status=status,
    ).inc()