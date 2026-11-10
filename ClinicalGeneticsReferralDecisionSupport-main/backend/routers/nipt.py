from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
# Ensure root and parent can find rules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from rules.nipt_rules import evaluate_nipt, NIPTRuleInput

router = APIRouter(prefix="/api/nipt", tags=["NIPT"])

class NIPTEvaluateRequest(BaseModel):
    patient_mrn: str
    result_type: str
    fetal_fraction: float
    is_nocall_low_ff: bool
    is_discordant_with_ultrasound: bool
    gestational_age_weeks: int        # NEW — required
    maternal_age: int                  # NEW — required
    soft_markers: dict                 # NEW — SoftMarkerProfile
    major_structural_anomaly: bool     # NEW
    pedigree_linked: bool

@router.post("/evaluate")
async def evaluate_nipt_referral(req: NIPTEvaluateRequest):
    if req.gestational_age_weeks < 6 or req.gestational_age_weeks > 42:
        raise HTTPException(422, "Gestational age must be between 6–42 weeks")

    data = req.model_dump(exclude={"patient_mrn"}) if hasattr(req, "model_dump") else req.dict(exclude={"patient_mrn"})
    rule_input = NIPTRuleInput(**data)
    result = evaluate_nipt(rule_input)

    return {
        "patient_mrn": req.patient_mrn,
        "tier": result.tier,
        "timeframe_label": result.timeframe_label,
        "timeframe_hours": result.timeframe_hours,
        "referral_target": result.referral_target,
        "rule_id": result.rule_id,
        "guideline_match": result.guideline_match,
        "triggering_criteria": result.triggering_criteria,
        "counterfactuals": result.counterfactuals,
        "rationale_summary": result.rationale_summary,
        "is_urgent": result.tier in ["TIME_CRITICAL", "SAME_DAY"],
    }

