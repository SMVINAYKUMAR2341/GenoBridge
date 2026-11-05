"""Synthetic logic fixtures only: no clinical thresholds or recommendations."""

from copy import deepcopy
import json
import unittest
from unittest.mock import patch

from backend.engine import PATHWAYS, evaluate


def rule(identifier="rule-a", outcome="routine_referral", **overrides):
    result = {
        "id": identifier,
        "pathway": "hereditary-cancer-risk",
        "status": "ACTIVE",
        "approvedAt": "2026-01-01T00:00:00Z",
        "reviewer": "test-reviewer",
        "effectiveDate": "2026-01-01",
        "reviewDate": "2027-01-01",
        "simulated": False,
        "sources": [{
            "title": "Synthetic software test citation", "org": "Test fixture",
            "guidelineVersion": "fixture-v1", "date": "2026-01-01",
            "page": None, "section": "Software test only",
            "url": "https://example.invalid/fixture",
        }],
        "conditions": [{"field": "testFlag", "op": "eq", "value": True}],
        "requiredFields": ["testFlag"],
        "exclusions": [],
        "outcome": outcome,
        "destination": "Synthetic destination; not clinical guidance",
        "rationale": "Synthetic logic fixture; not clinical guidance",
        "version": "fixture-v1",
    }
    result.update(overrides)
    return result


def request(criteria=None, facts=None, **overrides):
    result = {
        "schemaVersion": "1.0",
        "pathway": "hereditary-cancer-risk",
        "evaluatedAt": "2026-06-01T12:00:00Z",
        "facts": {"testFlag": True} if facts is None else facts,
        "criteria": [rule()] if criteria is None else criteria,
    }
    result.update(overrides)
    return result


class EngineTests(unittest.TestCase):
    def assert_outcome(self, expected, payload):
        result = evaluate(payload)
        self.assertEqual(result["outcome"], expected, result)
        for key in ("matchedCriteria", "missingFields", "criteriaSnapshots", "sourceCitations",
                    "criteriaVersions", "timestamp", "reviewPending", "engineVersion", "schemaVersion"):
            self.assertIn(key, result)
        json.dumps(result, allow_nan=False)
        return result

    def test_positive_match_and_provenance(self):
        payload = request()
        result = self.assert_outcome("routine_referral", payload)
        self.assertEqual(result["matchedCriteria"], [{"id": "rule-a", "version": "fixture-v1", "outcome": "routine_referral"}])
        self.assertEqual(result["criteriaSnapshots"][0]["criteria"], payload["criteria"][0])
        self.assertEqual(result["sourceCitations"][0]["source"], payload["criteria"][0]["sources"][0])
        self.assertEqual(result["timestamp"], payload["evaluatedAt"])
        self.assertFalse(result["reviewPending"])

    def test_all_six_exact_pathways(self):
        self.assertEqual(len(PATHWAYS), 6)
        for pathway in PATHWAYS:
            with self.subTest(pathway=pathway):
                self.assert_outcome("routine_referral", request([rule(pathway=pathway)], pathway=pathway))
        self.assert_outcome("insufficient_information", request(pathway="NIPT-results"))

    def test_deterministic_immutable_and_dependency_free(self):
        payload = request()
        original = deepcopy(payload)
        with patch.dict("os.environ", {}, clear=True):
            first = evaluate(payload)
            self.assertEqual(first, evaluate(payload))
        self.assertEqual(payload, original)
        first["criteriaSnapshots"][0]["criteria"]["sources"][0]["title"] = "changed"
        self.assertEqual(payload, original)

    def test_no_eligible_is_pending_not_negative(self):
        for criteria in ([], [rule(status="DRAFT")], [rule(approvedAt=None)],
                         [rule(reviewer=None)], [rule(approvedAt="2026-07-01T00:00:00Z")],
                         [rule(effectiveDate="2026-07-01")], [rule(reviewDate="2026-06-01")],
                         [rule(pathway="nipt-results")]):
            with self.subTest(criteria=criteria):
                result = self.assert_outcome("criteria_pending_approval", request(criteria))
                self.assertTrue(result["reviewPending"])

    def test_eligibility_dates_use_utc_and_exclusive_review_date(self):
        self.assert_outcome("routine_referral", request(evaluatedAt="2026-01-01T00:00:00Z"))
        self.assert_outcome("criteria_pending_approval", request(evaluatedAt="2027-01-01T00:00:00Z"))
        self.assert_outcome("criteria_pending_approval", request(evaluatedAt="2026-12-31T23:30:00-02:00"))

    def test_unmatched_is_borderline_not_negative(self):
        self.assert_outcome("borderline_consideration", request(facts={"testFlag": False}))
        self.assert_outcome("borderline_consideration", request([rule(outcome="no_referral_needed")], {"testFlag": False}))

    def test_only_explicit_complete_negative(self):
        self.assert_outcome("no_referral_needed", request([rule(outcome="no_referral_needed")]))
        result = self.assert_outcome("insufficient_information", request([rule(outcome="no_referral_needed", requiredFields=["testFlag", "otherFact"])]))
        self.assertEqual(result["missingFields"], ["otherFact"])

    def test_missing_null_and_incompatible_are_unknown(self):
        for facts in ({}, {"testFlag": None}, {"testFlag": "true"}, {"testFlag": 1}):
            result = self.assert_outcome("insufficient_information", request(facts=facts))
            self.assertEqual(result["missingFields"], ["testFlag"])

    def test_missing_other_rule_can_change_urgency(self):
        other = rule("other", "urgent_referral", conditions=[{"field": "otherFlag", "op": "eq", "value": True}], requiredFields=["otherFlag"])
        for outcome in ("routine_referral", "no_referral_needed", "borderline_consideration"):
            with self.subTest(outcome=outcome):
                self.assert_outcome("insufficient_information", request([rule(outcome=outcome), other]))
        result = self.assert_outcome("urgent_referral", request([rule(outcome="urgent_referral"), other]))
        self.assertEqual(result["missingFields"], ["otherFlag"])

    def test_missing_irrelevant_rule_does_not_block(self):
        other = rule("other", "urgent_referral", conditions=[
            {"field": "testFlag", "op": "eq", "value": False},
            {"field": "unknown", "op": "eq", "value": True},
        ], requiredFields=["unknown"])
        self.assert_outcome("routine_referral", request([rule(), other]))

    def test_positive_negative_conflicts_override_even_urgent(self):
        for positive in ("routine_referral", "urgent_referral"):
            result = self.assert_outcome("borderline_consideration", request([rule(outcome=positive), rule("negative", "no_referral_needed")]))
            self.assertEqual(result["reasonCode"], "conflicting_criteria")
            self.assertEqual(result["destinations"], [])

    def test_borderline_prevents_negative_and_urgent_wins_positive(self):
        self.assert_outcome("borderline_consideration", request([rule(outcome="no_referral_needed"), rule("other", "borderline_consideration")]))
        self.assert_outcome("urgent_referral", request([rule(), rule("other", "urgent_referral")]))

    def test_exclusions_are_any_and_unknown_is_not_false(self):
        exclusions = [{"field": "excluded", "op": "eq", "value": True}]
        criteria = [rule(exclusions=exclusions)]
        self.assert_outcome("borderline_consideration", request(criteria, {"testFlag": True, "excluded": True}))
        self.assert_outcome("routine_referral", request(criteria, {"testFlag": True, "excluded": False}))
        self.assert_outcome("insufficient_information", request(criteria))
        criteria[0]["exclusions"].append({"field": "unknown", "op": "eq", "value": True})
        self.assert_outcome("borderline_consideration", request(criteria, {"testFlag": True, "excluded": True}))

    def test_operators(self):
        cases = [
            ("eq", "a", "a", True), ("eq", "a", "b", False),
            ("ne", "a", "b", True), ("ne", "a", "a", False),
            ("in", ["a", "b"], "a", True), ("in", ["a"], "b", False),
            ("gte", 2, 2, True), ("gte", 2, 1, False),
            ("lte", 2, 2, True), ("lte", 2, 3, False),
            ("eq", 2.0, 2, True), ("in", [False, "a"], False, True),
        ]
        for op, value, fact, match in cases:
            with self.subTest(op=op, value=value, fact=fact):
                criteria = [rule(conditions=[{"field": "testFlag", "op": op, "value": value}])]
                self.assert_outcome("routine_referral" if match else "borderline_consideration", request(criteria, {"testFlag": fact}))

    def test_exists_and_explicit_required_field(self):
        for value, facts in ((True, {"testFlag": False}), (False, {}), (False, {"testFlag": None})):
            criteria = [rule(conditions=[{"field": "testFlag", "op": "exists", "value": value}], requiredFields=[])]
            self.assert_outcome("routine_referral", request(criteria, facts))
        criteria = [rule(conditions=[{"field": "testFlag", "op": "exists", "value": False}])]
        self.assert_outcome("insufficient_information", request(criteria, {}))
        criteria[0].update(outcome="no_referral_needed", requiredFields=[])
        self.assert_outcome("insufficient_information", request(criteria, {}))

    def test_no_type_coercion_even_ne_and_membership(self):
        for op, value, fact in (("ne", True, 1), ("in", [True], 1), ("gte", 2, "3"), ("lte", 2, False)):
            self.assert_outcome("insufficient_information", request([rule(conditions=[{"field": "testFlag", "op": op, "value": value}])], {"testFlag": fact}))

    def test_simulated_criteria_rejected_not_silently_skipped(self):
        for value in (True, None, 0, "false"):
            result = self.assert_outcome("insufficient_information", request([rule(), rule("other", simulated=value)]))
            self.assertTrue(result["validationErrors"])

    def test_bad_inputs_fail_closed(self):
        payloads = [None, [], {}, request(facts=None, schemaVersion="wrong"),
                    request(evaluatedAt="2026-06-01"), request(evaluatedAt="2026-06-01T12:00:00"),
                    request(facts={"testFlag": []}), request(facts={"testFlag": float("nan")}),
                    request(facts={"testFlag": float("inf")}), request(criteria=None, unknown=True),
                    request(criteria=[None]), request(criteria=[{}]), request(criteria="not an array"),
                    request(criteria=[rule(), rule()])]
        for payload in payloads:
            with self.subTest(payload=payload):
                self.assert_outcome("insufficient_information", payload)

    def test_invalid_criteria_fields(self):
        changes = [
            {"approvedAt": "bad"}, {"reviewer": ""}, {"status": ""},
            {"effectiveDate": "bad"}, {"reviewDate": "2025-01-01"},
            {"conditions": []}, {"conditions": [{"field": "x", "op": "custom", "value": 1}]},
            {"conditions": [{"field": "x", "op": "gte", "value": True}]},
            {"conditions": [{"field": "x", "op": "eq", "value": None}]},
            {"conditions": [{"field": "x", "op": "exists", "value": 1}]},
            {"conditions": [{"field": "x", "op": "in", "value": []}]},
            {"requiredFields": ["x", "x"]}, {"sources": []}, {"outcome": "negative"},
            {"sources": [{"title": "missing metadata"}]},
            {"pathway": ["nipt-results"]}, {"exclusions": {}}, {"version": ""},
        ]
        for change in changes:
            with self.subTest(change=change):
                self.assert_outcome("insufficient_information", request([rule(**change)]))

    def test_unknown_or_missing_rule_fields_rejected(self):
        for key in list(rule()):
            invalid = rule()
            del invalid[key]
            self.assert_outcome("insufficient_information", request([invalid]))
        self.assert_outcome("insufficient_information", request([rule(extra="unknown")]))

    def test_invalid_sources_and_url_schemes(self):
        for key, value in (("url", "javascript:alert(1)"), ("url", "https://user:password@example.invalid"),
                           ("date", "not-a-date"), ("page", 3), ("org", "")):
            invalid = rule()
            invalid["sources"][0][key] = value
            self.assert_outcome("insufficient_information", request([invalid]))

    def test_pending_rules_are_snapshotted_not_applied(self):
        result = self.assert_outcome("routine_referral", request([rule(), rule("pending", "urgent_referral", status="DRAFT")]))
        self.assertTrue(result["reviewPending"])
        self.assertEqual(len(result["criteriaSnapshots"]), 2)
        self.assertEqual(len(result["criteriaVersions"]), 2)
        self.assertFalse(result["criteriaSnapshots"][1]["eligible"])

    def test_malformed_shapes_never_raise(self):
        replacements = [None, True, 0, "", [], {}, [True], {"bad": True}]
        for key in rule():
            for replacement in replacements:
                with self.subTest(field=key, replacement=replacement):
                    result = evaluate(request([rule(**{key: replacement})]))
                    allowed = ("routine_referral",) if key in ("requiredFields", "exclusions") and replacement == [] else ("insufficient_information", "criteria_pending_approval")
                    self.assertIn(result["outcome"], allowed)
                    json.dumps(result, allow_nan=False)

    def test_invalid_unicode_is_not_reflected(self):
        invalid = "\ud800"
        self.assert_outcome("insufficient_information", request([rule(rationale=invalid)]))
        self.assert_outcome("insufficient_information", request(facts={"testFlag": invalid}))

    def test_large_integers_and_extreme_timestamps_fail_safely(self):
        self.assert_outcome("insufficient_information", request(facts={"testFlag": 10 ** 1000}))
        self.assert_outcome("insufficient_information", request(evaluatedAt="0001-01-01T00:00:00+14:00"))
        self.assert_outcome("insufficient_information", request(evaluatedAt="9999-12-31T23:59:59-14:00"))

    def test_safety_outcomes_and_urgent_missing_data_mark_review_pending(self):
        result = self.assert_outcome("borderline_consideration", request(facts={"testFlag": False}))
        self.assertTrue(result["reviewPending"])
        result = self.assert_outcome("insufficient_information", request(facts={}))
        self.assertTrue(result["reviewPending"])
        other = rule("other", requiredFields=["testFlag", "otherFact"])
        result = self.assert_outcome("urgent_referral", request([rule(outcome="urgent_referral"), other]))
        self.assertTrue(result["reviewPending"])

    def test_limits_and_missing_fields_are_stably_sorted(self):
        self.assert_outcome("insufficient_information", request([rule(str(i)) for i in range(251)]))
        result = self.assert_outcome("insufficient_information", request([rule(requiredFields=["z", "a", "testFlag"])]))
        self.assertEqual(result["missingFields"], ["a", "z"])


if __name__ == "__main__":
    unittest.main()
