"""HTTP boundary for trusted server-to-server calls, not a browser API."""

from contextlib import asynccontextmanager
import hmac
import json
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.engine import ENGINE_VERSION, evaluate

MAX_BODY_BYTES = 1_048_576


def _configured_key():
    key = os.environ.get("CRITERIA_SERVICE_API_KEY", "")
    if len(key.encode("utf-8")) < 32 or key != key.strip():
        raise RuntimeError("CRITERIA_SERVICE_API_KEY must contain at least 32 bytes without surrounding whitespace")
    return key.encode("utf-8")


@asynccontextmanager
async def lifespan(app):
    app.state.api_key = _configured_key()
    yield
    del app.state.api_key


app = FastAPI(
    title="Internal criteria evaluation", version=ENGINE_VERSION,
    lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None,
)


@app.middleware("http")
async def no_store(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/health")
async def health():
    # Liveness only. No environment, credentials, patient data, or criteria.
    return {"status": "ok"}


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON object key")
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError("Non-finite JSON constant")


@app.post("/evaluate")
async def evaluate_request(request: Request):
    # Authenticate before consuming or parsing a potentially sensitive body.
    supplied = request.headers.getlist("x-criteria-api-key")
    candidate = supplied[0].encode("utf-8") if len(supplied) == 1 else b""
    if not hmac.compare_digest(candidate, request.app.state.api_key):
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
        return JSONResponse({"detail": "Expected application/json"}, status_code=415)
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_BODY_BYTES:
            return JSONResponse({"detail": "Request body exceeds limit"}, status_code=413)
        body.extend(chunk)
    try:
        payload = json.loads(body, object_pairs_hook=_unique_object, parse_constant=_reject_constant)
    except (ValueError, UnicodeDecodeError, RecursionError):
        payload = None
    return JSONResponse(evaluate(payload))
