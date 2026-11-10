import type { NIPTClinicalIntake, SoftMarkerProfile } from '@/types/nipt'

export interface AIRationale {
  clinicianSummary: string
  patientSummary: string
  patientSummaryHindi: string
}

export async function generateNIPTRationale(
  intake: NIPTClinicalIntake,
  ruleOutput: {
    tier: string
    timeframe_hours: string
    rule_id: string
    rationale_summary: string
  }
): Promise<AIRationale> {
  const prompt = `
You are a clinical AI assistant for GenoBridge AI, a maternal-fetal medicine referral tool.

A deterministic rule engine has already computed this referral decision:
- Result: ${intake.resultType}
- Gestational Age: ${intake.gestationalAgeWeeks} weeks
- Fetal Fraction: ${intake.fetalFraction}%
- Soft Markers: ${JSON.stringify(softMarkersActive(intake.softMarkers))}
- Ultrasound Discordant: ${intake.isDiscordantWithUltrasound}
- Major Structural Anomaly: ${intake.ultrasoundFindings?.majorStructuralAnomaly}
- Maternal Age: ${intake.maternalAge}

Rule Engine Decision:
- Tier: ${ruleOutput.tier}
- Timeframe: ${ruleOutput.timeframe_hours}
- Rule ID: ${ruleOutput.rule_id}
- Rationale: ${ruleOutput.rationale_summary}

Your task: Generate THREE components in JSON:

1. "clinicianSummary" (3–4 sentences, clinical language):
   Explain WHY this tier was assigned, citing the specific clinical factors.
   Mention what distinguishes this case from a higher/lower tier.

2. "patientSummary" (5th-grade reading level, 2–3 sentences):
   What this result means and why they are being referred.
   NEVER mention fetal sex. NEVER say "you have a baby with Down syndrome."
   Always say "this is a screening result, not a diagnosis."

3. "patientSummaryHindi" (same as patientSummary but in Hindi):
   Natural spoken Hindi, avoid overly clinical terms.

IMPORTANT RULES:
- Never override the rule engine's tier decision
- Never state or imply fetal sex (PC&PNDT Act compliance)
- Never diagnose — always use "screen positive" language
- Cite ACOG PB 226 or SMFM 2015 where relevant
- Return ONLY valid JSON, no markdown fences

JSON format:
{
  "clinicianSummary": "...",
  "patientSummary": "...",
  "patientSummaryHindi": "..."
}
`

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return fallbackRationale(ruleOutput)
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.find((b: any) => b.type === "text")?.text || "{}"
    return JSON.parse(text)
  } catch {
    return fallbackRationale(ruleOutput)
  }
}

function fallbackRationale(ruleOutput: { rationale_summary: string }): AIRationale {
  return {
    clinicianSummary: ruleOutput.rationale_summary,
    patientSummary:
      "Your doctor has reviewed your prenatal screening result and recommends a specialist consultation. This is a screening test and not a diagnosis.",
    patientSummaryHindi:
      "आपके डॉक्टर ने आपकी प्रसवपूर्व जांच के परिणाम की समीक्षा की है और एक विशेषज्ञ से परामर्श की सलाह देते हैं। यह केवल एक प्रारंभिक जांच है, कोई अंतिम निदान नहीं।",
  }
}

function softMarkersActive(markers?: SoftMarkerProfile): string[] {
  if (!markers) return []
  return Object.entries(markers)
    .filter(([k, v]) => k !== 'nonePresent' && v === true)
    .map(([k]) => k)
}

