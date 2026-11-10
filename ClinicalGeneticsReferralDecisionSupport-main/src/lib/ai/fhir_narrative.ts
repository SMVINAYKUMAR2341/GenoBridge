import type { NIPTClinicalIntake } from '@/types/nipt'
import type { ReferralDecision } from '@/types/referral'

export async function generateFHIRNarrative(
  intake: NIPTClinicalIntake,
  decision: ReferralDecision
): Promise<string> {
  const prompt = `
Generate a FHIR R4 ServiceRequest.text.div narrative for this NIPT referral.
Clinical data: ${JSON.stringify({ intake, decision }, null, 2)}
Return only the HTML div string suitable for FHIR narrative. 
Follow FHIR R4 narrative rules. No markdown. No fetal sex disclosure.
`

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return defaultFHIRNarrative(intake, decision)
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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()
    return (
      data.content?.find((b: any) => b.type === "text")?.text ||
      defaultFHIRNarrative(intake, decision)
    )
  } catch {
    return defaultFHIRNarrative(intake, decision)
  }
}

function defaultFHIRNarrative(
  intake: NIPTClinicalIntake,
  decision: ReferralDecision
): string {
  return `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>NIPT Clinical Referral ServiceRequest</b></p><p>Urgency Tier: ${decision.tier} (${decision.timeframeHours})</p><p>Result: ${intake.resultType} | Gestational Age: ${intake.gestationalAgeWeeks}w</p><p>Target: ${decision.referralTarget.join(', ')}</p></div>`
}

