"""Optional HTTP adapter tests using an in-process ASGI client, not httpx.

Skipped when FastAPI is unavailable. The pure engine suite needs only stdlib.
"""

import asyncio
import importlib.util
import json
import unittest
from unittest.mock import patch


# Test-only credential, not a deployment secret.
TEST_KEY = "test-only-not-a-real-service-key-000000000000"


async def call(app, method, path, body=b"", headers=None):
    sent = []
    received = False
    disconnected = asyncio.Event()

    async def receive():
        nonlocal received
        if not received:
            received = True
            return {"type": "http.request", "body": body, "more_body": False}
        await disconnected.wait()
        return {"type": "http.disconnect"}

    async def send(message):
        sent.append(message)
        if message["type"] == "http.response.body" and not message.get("more_body", False):
            disconnected.set()

    await app({
        "type": "http", "asgi": {"version": "3.0", "spec_version": "2.4"},
        "http_version": "1.1", "method": method, "scheme": "http", "path": path,
        "raw_path": path.encode(), "query_string": b"", "root_path": "",
        "headers": headers or [], "client": ("127.0.0.1", 12345), "server": ("test", 80),
    }, receive, send)
    start = next(message for message in sent if message["type"] == "http.response.start")
    raw_body = b"".join(message.get("body", b"") for message in sent if message["type"] == "http.response.body")
    return start["status"], dict(start["headers"]), json.loads(raw_body)


@unittest.skipUnless(importlib.util.find_spec("fastapi"), "Install backend/requirements.txt for HTTP tests")
class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from backend.app import app
        cls.app = app

    def run_request(self, method="POST", path="/evaluate", body=b"{}", key=TEST_KEY,
                    content_type=b"application/json", extra_headers=None):
        headers = []
        if key is not None:
            headers.append((b"x-criteria-api-key", key.encode()))
        if content_type is not None:
            headers.append((b"content-type", content_type))
        headers.extend(extra_headers or [])

        async def scenario():
            async with self.app.router.lifespan_context(self.app):
                return await call(self.app, method, path, body, headers)

        with patch.dict("os.environ", {"CRITERIA_SERVICE_API_KEY": TEST_KEY}):
            return asyncio.run(scenario())

    def test_health_is_secret_free_and_no_store(self):
        status, headers, payload = self.run_request("GET", "/health", key=None)
        self.assertEqual(status, 200)
        self.assertEqual(payload, {"status": "ok"})
        self.assertEqual(headers[b"cache-control"], b"no-store")
        self.assertNotIn(TEST_KEY, json.dumps(payload))

    def test_authentication_before_body_parsing(self):
        for key in (None, "wrong"):
            status, _, payload = self.run_request(body=b"not JSON", key=key)
            self.assertEqual(status, 401)
            self.assertEqual(payload, {"detail": "Unauthorized"})

    def test_duplicate_key_headers_denied(self):
        status, _, _ = self.run_request(extra_headers=[(b"x-criteria-api-key", TEST_KEY.encode())])
        self.assertEqual(status, 401)

    def test_missing_key_fails_startup(self):
        async def scenario():
            async with self.app.router.lifespan_context(self.app):
                self.fail("Startup accepted a missing service key")
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(RuntimeError):
                asyncio.run(scenario())

    def test_short_key_fails_startup(self):
        async def scenario():
            async with self.app.router.lifespan_context(self.app):
                self.fail("Startup accepted a short service key")
        with patch.dict("os.environ", {"CRITERIA_SERVICE_API_KEY": "short"}):
            with self.assertRaises(RuntimeError):
                asyncio.run(scenario())

    def test_malformed_json_and_duplicate_fields_fail_closed(self):
        for body in (b"not JSON", b'{"facts":{},"facts":{}}', b'{"facts":{"x":NaN}}', b'\xff', b"[" * 2000):
            status, _, payload = self.run_request(body=body)
            self.assertEqual(status, 200)
            self.assertEqual(payload["outcome"], "insufficient_information")
            self.assertIn("criteriaSnapshots", payload)
            self.assertNotIn(TEST_KEY, json.dumps(payload))

    def test_content_type_and_body_limit(self):
        status, _, _ = self.run_request(content_type=b"text/plain")
        self.assertEqual(status, 415)
        status, _, _ = self.run_request(body=b" " * 1_048_577)
        self.assertEqual(status, 413)

    def test_authenticated_matching_request_has_same_engine_contract(self):
        from backend.tests.test_engine import request, rule
        from backend.engine import evaluate
        payload = request([rule()])
        status, headers, result = self.run_request(body=json.dumps(payload).encode())
        self.assertEqual(status, 200)
        self.assertEqual(result, evaluate(payload))
        self.assertEqual(headers[b"cache-control"], b"no-store")

    def test_escaped_surrogate_is_safe_input_failure(self):
        from backend.tests.test_engine import request, rule
        payload = request([rule(rationale="\ud800")])
        status, _, result = self.run_request(body=json.dumps(payload).encode())
        self.assertEqual(status, 200)
        self.assertEqual(result["outcome"], "insufficient_information")

    def test_valid_empty_criteria_request(self):
        body = json.dumps({"schemaVersion": "1.0", "pathway": "nipt-results",
                           "evaluatedAt": "2026-06-01T12:00:00Z", "facts": {}, "criteria": []}).encode()
        status, _, payload = self.run_request(body=body)
        self.assertEqual(status, 200)
        self.assertEqual(payload["outcome"], "criteria_pending_approval")

    def test_no_browser_cors_or_public_docs(self):
        status, headers, _ = self.run_request(extra_headers=[(b"origin", b"https://browser.invalid")])
        self.assertEqual(status, 200)
        self.assertNotIn(b"access-control-allow-origin", headers)
        status, _, _ = self.run_request("GET", "/openapi.json")
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
