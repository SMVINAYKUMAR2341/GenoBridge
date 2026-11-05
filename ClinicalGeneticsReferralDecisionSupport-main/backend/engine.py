"""Pure deterministic evaluation. Standard library only; never reads time or env."""

from copy import deepcopy
from datetime import date, datetime, timezone
import math
from urllib.parse import urlsplit

ENGINE_VERSION = "1.0.0"
SCHEMA_VERSION = "1.0"
PATHWAYS = (
    "hereditary-cancer-risk",
    "preconception-carrier-screening",
    "nipt-results",
    "abnormal-ultrasound-findings",
    "infertility-recurrent-pregnancy-loss",
    "positive-family-history",
)
OUTCOMES = (
    "urgent_referral", "routine_referral", "no_referral_needed",
    "borderline_consideration",
)
OPERATORS = {"eq", "ne", "in", "gte", "lte", "exists"}
RULE_KEYS = {
    "id", "pathway", "status", "approvedAt", "reviewer", "effectiveDate",
    "reviewDate", "simulated", "sources", "conditions", "requiredFields",
    "exclusions", "outcome", "destination", "rationale", "version",
}
SOURCE_KEYS = {"title", "org", "guidelineVersion", "date", "page", "section", "url"}


def _string(value):
    if not isinstance(value, str) or len(value) > 8192:
        return False
    try:
        value.encode("utf-8")
        return True
    except UnicodeEncodeError:
        return False


def _text(value):
    return _string(value) and bool(value.strip())


def _number(value):
    return type(value) is int or (type(value) is float and math.isfinite(value))


def _primitive(value):
    return _string(value) or type(value) is bool or _number(value)


def _day(value):
    if not isinstance(value, str) or len(value) != 10:
        return None
    try:
        parsed = date.fromisoformat(value)
        return parsed if parsed.isoformat() == value else None
    except ValueError:
        return None


def _instant(value):
    if not isinstance(value, str) or len(value) > 64 or "T" not in value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            return None
        return parsed.astimezone(timezone.utc)
    except (ValueError, OverflowError):
        return None


def _error(errors, path, message):
    errors.append({"path": path, "message": message})


def _conditions(value, path, errors, allow_empty):
    if not isinstance(value, list) or len(value) > 100 or (not value and not allow_empty):
        _error(errors, path, "Expected a bounded condition array" + ("" if allow_empty else " with at least one condition"))
        return
    for index, condition in enumerate(value):
        location = f"{path}[{index}]"
        if not isinstance(condition, dict) or set(condition) != {"field", "op", "value"}:
            _error(errors, location, "Expected exactly field, op, value")
            continue
        if not _text(condition["field"]):
            _error(errors, location + ".field", "Expected a nonempty flat fact key")
        op, operand = condition["op"], condition["value"]
        if not isinstance(op, str) or op not in OPERATORS:
            _error(errors, location + ".op", "Unsupported operator")
        elif op == "exists":
            if type(operand) is not bool:
                _error(errors, location + ".value", "exists requires a boolean")
        elif op == "in":
            if not isinstance(operand, list) or not operand or len(operand) > 100 or not all(_primitive(item) for item in operand):
                _error(errors, location + ".value", "in requires a nonempty array of finite non-null primitives")
        elif op in ("gte", "lte"):
            if not _number(operand):
                _error(errors, location + ".value", "Ordering requires a finite number")
        elif not _primitive(operand):
            _error(errors, location + ".value", "Expected a finite non-null primitive")


def _validate_rule(rule, path, errors):
    before = len(errors)
    if not isinstance(rule, dict) or set(rule) != RULE_KEYS:
        _error(errors, path, "Expected exactly the documented criteria fields")
        return False
    for key in ("id", "status", "version", "destination", "rationale"):
        if not _text(rule[key]):
            _error(errors, path + "." + key, "Expected a nonempty string")
    if rule["pathway"] not in PATHWAYS:
        _error(errors, path + ".pathway", "Unsupported pathway")
    if rule["outcome"] not in OUTCOMES:
        _error(errors, path + ".outcome", "Unsupported outcome")
    if rule["simulated"] is not False:
        _error(errors, path + ".simulated", "Simulated criteria are rejected; must be false")
    if rule["approvedAt"] is not None and _instant(rule["approvedAt"]) is None:
        _error(errors, path + ".approvedAt", "Expected null or an offset-aware ISO timestamp")
    if rule["reviewer"] is not None and not _text(rule["reviewer"]):
        _error(errors, path + ".reviewer", "Expected null or a reviewer identifier")
    effective, review = _day(rule["effectiveDate"]), _day(rule["reviewDate"])
    if effective is None or review is None or review <= effective:
        _error(errors, path, "Expected ISO dates with reviewDate after effectiveDate")
    required = rule["requiredFields"]
    if not isinstance(required, list) or len(required) > 100 or not all(_text(item) for item in required):
        _error(errors, path + ".requiredFields", "Expected an array of nonempty flat fact keys")
    elif len(set(required)) != len(required):
        _error(errors, path + ".requiredFields", "Duplicate fact keys")
    _conditions(rule["conditions"], path + ".conditions", errors, False)
    _conditions(rule["exclusions"], path + ".exclusions", errors, True)
    sources = rule["sources"]
    if not isinstance(sources, list) or not sources or len(sources) > 100:
        _error(errors, path + ".sources", "At least one source citation is required")
    else:
        for index, source in enumerate(sources):
            location = f"{path}.sources[{index}]"
            if not isinstance(source, dict) or set(source) != SOURCE_KEYS:
                _error(errors, location, "Expected exactly the documented source fields")
                continue
            for key in ("title", "org", "guidelineVersion", "url"):
                if not _text(source[key]):
                    _error(errors, location + "." + key, "Expected a nonempty string")
            for key in ("page", "section"):
                if source[key] is not None and not _text(source[key]):
                    _error(errors, location + "." + key, "Expected null or a nonempty string")
            if _day(source["date"]) is None:
                _error(errors, location + ".date", "Expected an ISO date")
            try:
                url = urlsplit(source["url"]) if isinstance(source["url"], str) else None
                if url is None or url.scheme not in ("http", "https") or not url.hostname or url.username or url.password:
                    raise ValueError("Invalid citation URL")
            except ValueError:
                _error(errors, location + ".url", "Expected an absolute HTTP(S) citation URL without credentials")
    return len(errors) == before


def _eligibility(rule, now):
    reasons = []
    if rule["status"] != "ACTIVE":
        reasons.append("not_active")
    approved = _instant(rule["approvedAt"])
    if approved is None or not rule["reviewer"]:
        reasons.append("approval_missing")
    elif approved > now:
        reasons.append("approval_in_future")
    if _day(rule["effectiveDate"]) > now.date():
        reasons.append("not_yet_effective")
    if _day(rule["reviewDate"]) <= now.date():
        reasons.append("review_due")
    return reasons


def _same_type(left, right):
    return (_number(left) and _number(right)) or type(left) is type(right)


def _test(condition, facts):
    """True/False/None: None means unknown, not false (including bad types)."""
    field, op, operand = condition["field"], condition["op"], condition["value"]
    present = field in facts and facts[field] is not None
    if op == "exists":
        return present == operand
    if not present:
        return None
    actual = facts[field]
    if op == "in":
        compatible = [item for item in operand if _same_type(actual, item)]
        return actual in compatible if compatible else None
    if not _same_type(actual, operand):
        return None
    if op == "eq":
        return actual == operand
    if op == "ne":
        return actual != operand
    if op == "gte":
        return actual >= operand
    return actual <= operand


def _assess(rule, facts):
    conditions = [(item, _test(item, facts)) for item in rule["conditions"]]
    exclusions = [(item, _test(item, facts)) for item in rule["exclusions"]]
    # A known false conjunct or known true exclusion proves the rule cannot fire.
    if any(result is False for _, result in conditions) or any(result is True for _, result in exclusions):
        return "unmatched", []
    missing = {field for field in rule["requiredFields"] if facts.get(field) is None}
    missing.update(item["field"] for item, result in conditions + exclusions if result is None)
    # An absence test alone must never justify a clinical negative.
    if rule["outcome"] == "no_referral_needed":
        missing.update(item["field"] for item, _ in conditions + exclusions if facts.get(item["field"]) is None)
    return ("unresolved", sorted(missing)) if missing else ("matched", [])


def evaluate(payload):
    """Evaluate a JSON-shaped request; no I/O, mutation, clock, or dependencies.

    The trusted Next server supplies rules AND evaluatedAt. Domain/input failures
    are safety outcomes in the same envelope, never implicit clinical negatives.
    """
    response = {
        "schemaVersion": SCHEMA_VERSION,
        "engineVersion": ENGINE_VERSION,
        "pathway": None,
        "timestamp": None,
        "outcome": "insufficient_information",
        "reasonCode": "invalid_input",
        "rationale": "Input validation failed; no clinical recommendation was made.",
        "destinations": [],
        "matchedCriteria": [],
        "missingFields": [],
        "criteriaSnapshots": [],
        "sourceCitations": [],
        "criteriaVersions": [],
        "reviewPending": True,
        "validationErrors": [],
    }
    errors = response["validationErrors"]
    if not isinstance(payload, dict):
        _error(errors, "$", "Expected an object")
        return response
    if set(payload) != {"schemaVersion", "pathway", "evaluatedAt", "facts", "criteria"}:
        _error(errors, "$", "Expected exactly schemaVersion, pathway, evaluatedAt, facts, criteria")
    if payload.get("schemaVersion") != SCHEMA_VERSION:
        _error(errors, "schemaVersion", "Unsupported schema version")
    pathway = payload.get("pathway")
    if pathway not in PATHWAYS:
        _error(errors, "pathway", "Unsupported pathway")
    else:
        response["pathway"] = pathway
    now = _instant(payload.get("evaluatedAt"))
    if now is None:
        _error(errors, "evaluatedAt", "Trusted server must supply an offset-aware ISO timestamp")
    else:
        # Preserve the trusted instant verbatim; _instant uses UTC for rule windows.
        response["timestamp"] = payload["evaluatedAt"]
    facts = payload.get("facts")
    if not isinstance(facts, dict) or len(facts) > 500:
        _error(errors, "facts", "Expected an object with at most 500 flat primitive facts")
    else:
        for field, value in facts.items():
            if not _text(field) or (value is not None and not _primitive(value)):
                _error(errors, "facts", "Fact keys must be nonempty strings; values must be finite primitives or null")
    rules = payload.get("criteria")
    if not isinstance(rules, list) or len(rules) > 250:
        _error(errors, "criteria", "Expected an array of at most 250 criteria")
        return response
    valid = []
    ids = set()
    for index, rule in enumerate(rules):
        path = f"criteria[{index}]"
        if _validate_rule(rule, path, errors):
            if rule["id"] in ids:
                _error(errors, path + ".id", "Duplicate criteria ID")
            ids.add(rule["id"])
            valid.append((index, rule))
        else:
            response["criteriaSnapshots"].append({
                "index": index, "criteria": None, "eligible": False,
                "eligibilityReasons": ["invalid_criteria"], "evaluation": "not_evaluated",
                "missingFields": [],
            })
    for index, rule in valid:
        reasons = _eligibility(rule, now) if now is not None else ["invalid_evaluation_time"]
        if rule["pathway"] != pathway:
            reasons.append("different_pathway")
        response["criteriaSnapshots"].append({
            "index": index, "criteria": deepcopy(rule), "eligible": not reasons,
            "eligibilityReasons": reasons, "evaluation": "not_evaluated", "missingFields": [],
        })
        if rule["pathway"] == pathway:
            response["criteriaVersions"].append({"id": rule["id"], "version": rule["version"]})
            response["sourceCitations"].extend({"criteriaId": rule["id"], "source": deepcopy(source)} for source in rule["sources"])
    response["criteriaSnapshots"].sort(key=lambda snapshot: snapshot["index"])
    if errors:
        return response
    relevant = [snapshot for snapshot in response["criteriaSnapshots"] if snapshot["criteria"]["pathway"] == pathway]
    eligible = [snapshot for snapshot in relevant if snapshot["eligible"]]
    response["reviewPending"] = not eligible or any(not snapshot["eligible"] for snapshot in relevant)
    if not eligible:
        response.update(outcome="criteria_pending_approval", reasonCode="no_eligible_criteria",
                        rationale="No approved, active criteria are within their effective and review window.")
        return response
    matched, missing = [], set()
    for snapshot in eligible:
        state, fields = _assess(snapshot["criteria"], facts)
        snapshot.update(evaluation=state, missingFields=fields)
        missing.update(fields)
        if state == "matched":
            matched.append(snapshot["criteria"])
    response["missingFields"] = sorted(missing)
    response["matchedCriteria"] = [{"id": rule["id"], "version": rule["version"], "outcome": rule["outcome"]} for rule in matched]
    outcomes = {rule["outcome"] for rule in matched}
    positives = {"urgent_referral", "routine_referral"}
    if "no_referral_needed" in outcomes and outcomes.intersection(positives):
        response.update(outcome="borderline_consideration", reasonCode="conflicting_criteria",
                        rationale="Positive and negative criteria conflict; manual clinical review is required.")
    elif missing and "urgent_referral" not in outcomes:
        response.update(outcome="insufficient_information", reasonCode="incomplete_potential_match",
                        rationale="Missing or incompatible facts could change the outcome; no final recommendation was made.")
    elif not matched:
        response.update(outcome="borderline_consideration", reasonCode="no_match",
                        rationale="No eligible criteria matched; manual clinical review is required.")
    else:
        # An explicit borderline match prevents an otherwise negative conclusion.
        chosen = next(outcome for outcome in ("urgent_referral", "routine_referral", "borderline_consideration", "no_referral_needed") if outcome in outcomes)
        selected = [rule for rule in matched if rule["outcome"] == chosen]
        response.update(outcome=chosen, reasonCode="matched_criteria",
                        rationale="\n".join(dict.fromkeys(rule["rationale"] for rule in selected)),
                        destinations=sorted({rule["destination"] for rule in selected}))
    response["reviewPending"] = (
        response["reviewPending"] or bool(missing)
        or response["outcome"] in ("insufficient_information", "borderline_consideration")
    )
    return response
