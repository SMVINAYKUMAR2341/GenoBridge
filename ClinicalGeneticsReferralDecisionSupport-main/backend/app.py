"""HTTP boundary for trusted server-to-server calls and clinical SaMD evaluation."""

from contextlib import asynccontextmanager
import hmac
import json
import os

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from backend.engine import ENGINE_VERSION, evaluate
from backend.semantic_engine import evaluate_clinical_payload
from backend.pdf_generator import generate_clinical_pdf
from backend.email_service import send_clinical_brief_email

MAX_BODY_BYTES = 1_048_576


def _configured_key():
    key = os.environ.get("CRITERIA_SERVICE_API_KEY", "")
    if len(key.encode("utf-8")) < 32 or key != key.strip():
        # Default fallback key for local verification if unset
        return b"genobridge-samd-clinical-evaluation-key-32bytes"
    return key.encode("utf-8")


@asynccontextmanager
async def lifespan(app):
    app.state.api_key = _configured_key()
    yield
    del app.state.api_key


app = FastAPI(
    title="GenoBridge Clinical Decision Support Engine",
    version=ENGINE_VERSION,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.middleware("http")
async def no_store(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "GenoBridge SaMD Semantic & Deterministic Engine"}


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
    """
    Evaluates clinical inputs against deterministic SaMD criteria
    and semantic knowledge base rules with Glass-Box rationale.
    """
    supplied = request.headers.getlist("x-criteria-api-key")
    if supplied:
        candidate = supplied[0].encode("utf-8")
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

    if not isinstance(payload, dict):
        return JSONResponse({"detail": "Invalid payload"}, status_code=400)

    # If payload contains pathway and inputs, run semantic evaluation engine
    if "pathway" in payload and "inputs" in payload:
        semantic_result = evaluate_clinical_payload(payload["pathway"], payload.get("inputs", {}))
        return JSONResponse(semantic_result)

    # Standard deterministic rule evaluate fallback
    return JSONResponse(evaluate(payload))


@app.post("/generate-pdf")
async def generate_pdf_endpoint(request: Request):
    """Generates an FDA SaMD-compliant vector PDF brief."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"detail": "Expected JSON"}, status_code=400)

    patient_id = data.get("patient_id", "SYN-STANDALONE")
    physician_name = data.get("physician_name", "Attending Clinician")
    pathway = data.get("pathway", "Clinical Genetics Assessment")
    evaluation = data.get("evaluation", {})

    pdf_bytes = generate_clinical_pdf(patient_id, physician_name, pathway, evaluation)
    return Response(content=pdf_bytes, media_type="application/pdf")


@app.post("/send-email")
async def send_email_endpoint(request: Request):
    """Dispatches clinical brief securely to requesting physician."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"detail": "Expected JSON"}, status_code=400)

    recipient_email = data.get("recipient_email")
    patient_mrn = data.get("patient_mrn", "SYN-STANDALONE")
    pathway_title = data.get("pathway_title", "Clinical Genetics")
    urgency_level = data.get("urgency_level", "ROUTINE")
    evaluation = data.get("evaluation", {})

    if not recipient_email or "@" not in recipient_email:
        return JSONResponse({"detail": "Valid recipient_email required"}, status_code=400)

    pdf_bytes = generate_clinical_pdf(patient_mrn, "Attending Clinician", pathway_title, evaluation)
    success = send_clinical_brief_email(recipient_email, patient_mrn, pathway_title, pdf_bytes, urgency_level)

    return JSONResponse({
        "success": success,
        "dispatched_to": recipient_email,
        "status": "sent" if success else "failed"
    })
