import { randomUUID } from 'node:crypto'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import { workflowStore, payloadWorkflowUser, type WorkflowUser } from '@/lib/workflow-store'
import { isProvider, workflowContext } from '@/lib/workflow-security'
import { assertReferralExport, generateReferralPdf } from '@/lib/referral-pdf'
import { buildFhirGenomicsBundle } from '@/lib/fhir-genomics-bundle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  Vary: 'Cookie',
}
const failure = (status: number) => Response.json({ error: 'Referral download unavailable.' }, { status, headers })

export async function GET(_request: Request, context: { params: Promise<{ workflowKey: string }> }) {
  try {
    const session = await appAuth.currentUser()
    if (!session || session.collection !== 'users') return failure(401)
    const store = workflowStore(await getPayloadClient())
    let current
    try {
      current = await store.findByID({ collection: 'users', id: session.id, overrideAccess: false, user: session, depth: 0 })
    } catch { return failure(403) }
    const user: WorkflowUser = { ...current, collection: 'users' }
    if (user.enabled !== true || !isProvider(user) || !user.name?.trim()) return failure(403)
    const { workflowKey } = await context.params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workflowKey)) return failure(400)
    const found = await store.find({
      collection: 'clinical-workflows', overrideAccess: false, user, depth: 0,
      where: { workflowKey: { equals: workflowKey } }, sort: '-revision', limit: 1,
    })
    const workflow = found.docs[0]
    if (!workflow || workflow.workflowKey !== workflowKey) return failure(404)
    try { assertReferralExport(workflow) } catch { return failure(409) }

    const url = new URL(_request.url)
    const isFhir = url.searchParams.get('format') === 'fhir'

    if (isFhir) {
      const evaluationSnapshot = (workflow.evaluationSnapshot as any) || {}
      const result = evaluationSnapshot.result || {}
      const fhirBundle = buildFhirGenomicsBundle(null, {
        pathwayTitle: workflow.pathwaySlug?.replaceAll('-', ' ') || 'Genetics Referral',
        decisionLabel: workflow.decision?.replaceAll('_', ' ') || 'Genetic Referral',
        rationale: result.rationale || 'Clinical evaluation meets guideline criteria.',
        practitionerName: user.name || 'Referring Gynecologist',
        hospitalName: 'GENOBRIDGE Healthcare Network (ABDM Facility)',
      })

      const jsonStr = JSON.stringify(fhirBundle, null, 2)
      await store.create({
        collection: 'audit-logs', overrideAccess: false, user,
        context: workflowContext(payloadWorkflowUser(user), { kind: 'audit', key: workflowKey }),
        data: {
          eventCode: randomUUID(), actorName: user.name, actorRole: 'OB/GYN Provider',
          actionType: 'REFERRAL_GENERATED', resourceRef: workflow.id,
          details: 'Standardized HL7 FHIR Genomics R4 Bundle (ABDM) generated; revision ' + workflow.revision + '.',
          encryptionVerified: false,
        },
      })

      return new Response(jsonStr, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/fhir+json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="genobridge-hl7-fhir-genomics-abdm.json"',
        },
      })
    }

    const bytes = generateReferralPdf(workflow)
    // Fail closed: never return the document if its generation cannot be audited.
    await store.create({
      collection: 'audit-logs', overrideAccess: false, user,
      context: workflowContext(payloadWorkflowUser(user), { kind: 'audit', key: workflowKey }),
      data: {
        eventCode: randomUUID(), actorName: user.name, actorRole: 'OB/GYN Provider',
        actionType: 'REFERRAL_GENERATED', resourceRef: workflow.id,
        details: 'Synthetic signed referral PDF generated; revision ' + workflow.revision + '.',
        encryptionVerified: false,
      },
    })
    return new Response(new Uint8Array(bytes), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="clinical-genetics-referral.pdf"',
        'Content-Length': String(bytes.length) },
    })
  } catch {
    // Payload and authentication exceptions may contain PHI, session tokens or internal details.
    return failure(500)
  }
}
