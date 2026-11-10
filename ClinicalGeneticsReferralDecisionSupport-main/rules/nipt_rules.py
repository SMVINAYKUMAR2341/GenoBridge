from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum

class ReferralTier(str, Enum):
    ROUTINE = "ROUTINE"
    EXPEDITED = "EXPEDITED"
    URGENT = "URGENT"
    TIME_CRITICAL = "TIME_CRITICAL"
    SAME_DAY = "SAME_DAY"
    COUNSEL_AND_REASSESS = "COUNSEL_AND_REASSESS"

@dataclass
class NIPTRuleInput:
    result_type: str
    fetal_fraction: float
    is_nocall_low_ff: bool
    is_discordant_with_ultrasound: bool
    gestational_age_weeks: int           # NEW — required
    maternal_age: int                    # NEW
    soft_markers: dict                   # SoftMarkerProfile as dict
    major_structural_anomaly: bool       # NEW
    pedigree_linked: bool

@dataclass
class RuleOutput:
    tier: ReferralTier
    timeframe_label: str
    timeframe_hours: str
    referral_target: List[str]
    rule_id: str
    guideline_match: int
    triggering_criteria: List[dict]
    counterfactuals: List[dict]
    rationale_summary: str


COMMON_ANEUPLOIDIES = {"screen_positive_T21", "screen_positive_T18", "screen_positive_T13"}

def soft_markers_present(markers: dict) -> bool:
    """Returns True if any soft marker is flagged (excluding nonePresent)."""
    return any(
        v for k, v in markers.items()
        if k != "nonePresent" and isinstance(v, bool) and v
    )

def count_soft_markers(markers: dict) -> int:
    return sum(
        1 for k, v in markers.items()
        if k != "nonePresent" and isinstance(v, bool) and v
    )


def evaluate_nipt(inp: NIPTRuleInput) -> RuleOutput:
    """
    Glass-box deterministic NIPT referral rule engine.
    Implements ACOG PB 226 + SMFM 2015 urgency stratification.
    """

    has_soft_markers = soft_markers_present(inp.soft_markers)
    n_soft_markers = count_soft_markers(inp.soft_markers)
    ga = inp.gestational_age_weeks
    is_common_aneuploidy = inp.result_type in COMMON_ANEUPLOIDIES
    is_low_risk = inp.result_type == "low_risk"
    is_nocall = inp.result_type in {"nocall", "low_fetal_fraction"}

    triggering_criteria = []
    counterfactuals = []

    # ─── BRANCH 1: Low risk result ────────────────────────────────────────────
    if is_low_risk and not inp.is_discordant_with_ultrasound:
        tier = ReferralTier.ROUTINE
        triggering_criteria.append({
            "criterion": "Low-risk cfDNA result without ultrasound discordance",
            "urgency": "ROUTINE",
            "action": "Standard obstetric monitoring",
            "citation": "ACOG PB 226 — Low-Risk cfDNA Management"
        })
        counterfactuals = [
            {
                "factor": "Cell-free DNA screening result",
                "current": "Low-risk",
                "alternative": "Screen positive for T21/T18/T13",
                "resulting_tier": "EXPEDITED",
                "explanation": "A common aneuploidy positive would require expedited genetic counseling."
            }
        ]
        return RuleOutput(
            tier=tier,
            timeframe_label="Routine monitoring",
            timeframe_hours="No referral required",
            referral_target=["Obstetrician — standard monitoring"],
            rule_id="nipt_low_risk_no_discordance",
            guideline_match=100,
            triggering_criteria=triggering_criteria,
            counterfactuals=counterfactuals,
            rationale_summary="Low-risk cfDNA with no ultrasound discordance. Standard monitoring per ACOG PB 226."
        )

    # ─── BRANCH 2: No-call / Low fetal fraction ───────────────────────────────
    if is_nocall or inp.is_nocall_low_ff:
        tier = ReferralTier.EXPEDITED
        triggering_criteria.append({
            "criterion": "No-call result or insufficient fetal fraction",
            "urgency": "EXPEDITED",
            "action": "Redraw or offer diagnostic testing",
            "citation": "ACOG PB 226 — No-Call cfDNA Management"
        })
        return RuleOutput(
            tier=tier,
            timeframe_label="Expedited referral",
            timeframe_hours="Within 1–2 weeks",
            referral_target=["MFM", "Prenatal Genetic Counselor"],
            rule_id="nipt_nocall_low_ff",
            guideline_match=100,
            triggering_criteria=triggering_criteria,
            counterfactuals=[],
            rationale_summary="No-call or low FF result. Repeat cfDNA or proceed to diagnostic testing (CVS/amnio)."
        )

    # ─── BRANCH 3: Common aneuploidy positive ─────────────────────────────────
    if is_common_aneuploidy:
        triggering_criteria.append({
            "criterion": f"Screen positive for {inp.result_type.replace('screen_positive_', '').upper()}",
            "urgency": "see branch logic",
            "action": "Confirm via CVS or amniocentesis before irreversible steps",
            "note": "Positive cfDNA is a screening test — NOT diagnostic.",
            "citation": "ACMG 2023 & ACOG PB 226 — Screening for Common Autosomal Aneuploidies"
        })

        # SUB-BRANCH 3a: Major structural anomaly → most urgent
        if inp.major_structural_anomaly and ga >= 22:
            tier = ReferralTier.SAME_DAY
            tfl = "Same-day referral"
            tfh = "Same day (<24 hours)"
            rationale = (
                f"Screen positive for {inp.result_type} with major structural anomaly "
                f"at {ga} weeks. Time-critical — same-day MFM consultation required."
            )
            triggering_criteria.append({
                "criterion": "Major structural anomaly on ultrasound + GA ≥22w",
                "urgency": "SAME_DAY",
                "action": "Immediate MFM consultation",
                "citation": "SMFM 2015 — Ultrasound anomaly + cfDNA positive"
            })

        elif inp.major_structural_anomaly or (inp.is_discordant_with_ultrasound and has_soft_markers):
            tier = ReferralTier.TIME_CRITICAL
            tfl = "Time-critical referral"
            tfh = "Within 48–72 hours"
            rationale = (
                f"Screen positive with structural anomaly or discordant ultrasound "
                f"+ soft markers at {ga}w. URGENT MFM + genetics referral."
            )
            triggering_criteria.append({
                "criterion": "Structural anomaly OR discordant ultrasound + soft markers",
                "urgency": "TIME_CRITICAL",
                "citation": "ACOG PB 226 + SMFM 2015"
            })

        # SUB-BRANCH 3b: Advanced GA, no anomaly
        elif ga >= 22 and not has_soft_markers:
            tier = ReferralTier.URGENT
            tfl = "Urgent referral"
            tfh = "Within 3–5 days"
            rationale = (
                f"Screen positive at {ga} weeks. Advanced GA creates time-sensitive "
                f"decision window for diagnostic testing and counseling."
            )
            triggering_criteria.append({
                "criterion": f"Gestational age {ga}w — advanced GA narrows diagnostic window",
                "urgency": "URGENT",
                "citation": "ACOG PB 226 — Gestational age and decision timing"
            })

        # SUB-BRANCH 3c: Soft markers present, GA <22w
        elif has_soft_markers:
            tier = ReferralTier.URGENT
            tfl = "Urgent referral"
            tfh = "Within 3–5 days"
            rationale = (
                f"Screen positive with {n_soft_markers} soft marker(s) at {ga}w. "
                f"Concordant ultrasound findings increase PPV — expedited genetics referral."
            )
            triggering_criteria.append({
                "criterion": f"{n_soft_markers} ultrasound soft marker(s) present",
                "urgency": "URGENT",
                "citation": "ISUOG + ACOG — Soft markers concordance with cfDNA"
            })

        # SUB-BRANCH 3d: DEFAULT — positive, no soft markers, no anomaly, GA <22w
        # THIS IS THE CASE IN THE SCREENSHOT — was incorrectly flagged as SAME_DAY
        else:
            tier = ReferralTier.EXPEDITED
            tfl = "Expedited referral"
            tfh = "Within 1–2 weeks"
            rationale = (
                f"Screen positive for {inp.result_type.replace('screen_positive_', '').upper()} "
                f"at {ga} weeks. No soft markers, no ultrasound discordance. "
                f"Pre-diagnostic genetic counseling and offer of CVS/amniocentesis. "
                f"Not a clinical emergency — expedited referral within 1–2 weeks per ACOG PB 226."
            )
            triggering_criteria.append({
                "criterion": "Screen positive — no additional escalating factors",
                "urgency": "EXPEDITED",
                "note": "Positive cfDNA without soft markers or structural anomaly does NOT require same-day referral.",
                "citation": "ACOG PB 226 — Expedited genetic counseling pathway"
            })

        # Build counterfactuals for Branch 3
        counterfactuals = _build_common_aneuploidy_counterfactuals(inp, tier, ga, has_soft_markers)

        return RuleOutput(
            tier=tier,
            timeframe_label=tfl,
            timeframe_hours=tfh,
            referral_target=["Maternal-Fetal Medicine (MFM)", "Prenatal Genetic Counselor"],
            rule_id="nipt_common_aneuploidy_positive_v2",
            guideline_match=100,
            triggering_criteria=triggering_criteria,
            counterfactuals=counterfactuals,
            rationale_summary=rationale
        )

    # ─── BRANCH 4: Discordant only (no aneuploidy positive) ───────────────────
    if inp.is_discordant_with_ultrasound:
        return RuleOutput(
            tier=ReferralTier.URGENT,
            timeframe_label="Urgent referral",
            timeframe_hours="Within 3–5 days",
            referral_target=["MFM", "Prenatal Genetic Counselor"],
            rule_id="nipt_discordant_ultrasound",
            guideline_match=100,
            triggering_criteria=[{
                "criterion": "Discordant cfDNA and ultrasound findings",
                "urgency": "URGENT",
                "citation": "ACOG PB 226 — Discordant Results Management"
            }],
            counterfactuals=[],
            rationale_summary="cfDNA result discordant with ultrasound. MFM review required to reconcile findings."
        )

    # Fallback
    return RuleOutput(
        tier=ReferralTier.EXPEDITED,
        timeframe_label="Expedited review",
        timeframe_hours="Within 1–2 weeks",
        referral_target=["MFM"],
        rule_id="nipt_fallback",
        guideline_match=80,
        triggering_criteria=[],
        counterfactuals=[],
        rationale_summary="Unable to fully classify — expedited review recommended."
    )


def _build_common_aneuploidy_counterfactuals(inp: NIPTRuleInput, current_tier: ReferralTier, ga: int, has_soft_markers: bool) -> List[dict]:
    """Generate sensitivity analysis counterfactuals based on current inputs."""
    cfs = []

    # Factor 1: cfDNA result
    cfs.append({
        "factor": "Cell-free DNA screening result",
        "current": f"Screen positive — {inp.result_type.replace('screen_positive_','')}",
        "alternative": "Low-risk cfDNA result",
        "resulting_tier": "ROUTINE",
        "explanation": "If cfDNA were low-risk without ultrasound discordance, referral would not be indicated."
    })

    # Factor 2: Soft markers (only if currently none)
    if not has_soft_markers:
        cfs.append({
            "factor": "Ultrasound soft markers",
            "current": "No soft markers present",
            "alternative": "≥1 soft marker present (e.g., echogenic bowel, nuchal fold)",
            "resulting_tier": "URGENT",
            "explanation": "Concordant soft markers with cfDNA positive increases PPV and escalates urgency to 3–5 days."
        })

    # Factor 3: Gestational age
    if ga < 22:
        cfs.append({
            "factor": "Gestational age",
            "current": f"{ga} weeks — within standard diagnostic window",
            "alternative": "Gestational age ≥22 weeks",
            "resulting_tier": "URGENT",
            "explanation": "Advanced GA narrows the window for CVS/amnio and counseling — escalates to urgent 3–5 days."
        })

    # Factor 4: Structural anomaly
    cfs.append({
        "factor": "Ultrasound structural findings",
        "current": "No major structural anomaly",
        "alternative": "Major structural anomaly present",
        "resulting_tier": "TIME_CRITICAL",
        "explanation": "Structural anomaly concordant with NIPT positive requires 48–72h MFM consultation."
    })

    return cfs

