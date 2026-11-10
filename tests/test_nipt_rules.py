from rules.nipt_rules import evaluate_nipt, NIPTRuleInput

def test_1_bug_case():
    # Test 1 — THE BUG CASE (screenshot)
    # Expected: EXPEDITED, 1–2 weeks (NOT same-day)
    test_1 = NIPTRuleInput(
        result_type="screen_positive_T21",
        fetal_fraction=23.0,
        is_nocall_low_ff=False,
        is_discordant_with_ultrasound=False,
        gestational_age_weeks=16,
        maternal_age=32,
        soft_markers={"nonePresent": True},
        major_structural_anomaly=False,
        pedigree_linked=True
    )
    res = evaluate_nipt(test_1)
    assert res.tier == "EXPEDITED"
    assert "1–2 weeks" in res.timeframe_hours

def test_2_soft_markers_urgent():
    # Test 2 — Soft markers present → URGENT
    test_2 = NIPTRuleInput(
        result_type="screen_positive_T21",
        fetal_fraction=18.0,
        is_nocall_low_ff=False,
        is_discordant_with_ultrasound=False,
        gestational_age_weeks=18,
        maternal_age=35,
        soft_markers={"echogenicBowel": True, "shortFemur": True, "nonePresent": False},
        major_structural_anomaly=False,
        pedigree_linked=False
    )
    res = evaluate_nipt(test_2)
    assert res.tier == "URGENT"

def test_3_structural_anomaly_same_day():
    # Test 3 — Structural anomaly + GA 24w → SAME_DAY
    test_3 = NIPTRuleInput(
        result_type="screen_positive_T18",
        fetal_fraction=12.0,
        is_nocall_low_ff=False,
        is_discordant_with_ultrasound=True,
        gestational_age_weeks=24,
        maternal_age=38,
        soft_markers={"clubfoot": True, "choroidPlexusCysts": True, "nonePresent": False},
        major_structural_anomaly=True,
        pedigree_linked=True
    )
    res = evaluate_nipt(test_3)
    assert res.tier == "SAME_DAY"

def test_4_low_risk_routine():
    # Test 4 — Low risk → ROUTINE
    test_4 = NIPTRuleInput(
        result_type="low_risk",
        fetal_fraction=9.0,
        is_nocall_low_ff=False,
        is_discordant_with_ultrasound=False,
        gestational_age_weeks=14,
        maternal_age=28,
        soft_markers={"nonePresent": True},
        major_structural_anomaly=False,
        pedigree_linked=False
    )
    res = evaluate_nipt(test_4)
    assert res.tier == "ROUTINE"

if __name__ == "__main__":
    test_1_bug_case()
    test_2_soft_markers_urgent()
    test_3_structural_anomaly_same_day()
    test_4_low_risk_routine()
    print("All 4 validation tests passed successfully!")

