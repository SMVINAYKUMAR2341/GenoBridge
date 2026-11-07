import { dbQuery } from './db-pool'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ANC_FILE, REPORTS_META_FILE } from './anc-store'
import type { RoutineAncData } from './anc-model'
import type { PedigreeDataModel } from '@/components/clinical/pedigree-model'

export interface UnifiedPatientSummary {
  id: string
  mrn: string
  name: string
  dob: string
  age: number
  pregnancyStatus: string
  gestationalAge?: string
  gpla?: string
  contactPhone?: string
  email?: string
  address?: string
  hospital?: string
  ancIdentifier?: string
  hasAnc: boolean
  hasPedigree: boolean
  assessmentCount: number
  documentCount: number
  sourcePortals: string[]
  registeredAt: string
  lastActivityAt: string
}

export interface PatientTimelineEvent {
  id: string
  timestamp: string
  portalSource: 'ANC Portal' | 'Doctor Portal' | 'Nurse Portal' | 'Pedigree Studio' | 'Hospital Portal' | 'Reporting Module'
  eventType:
    | 'REGISTRATION'
    | 'ANC_BOOKING'
    | 'ANC_VISIT'
    | 'PEDIGREE_CREATED'
    | 'PEDIGREE_UPDATED'
    | 'LAB_INVESTIGATION'
    | 'ULTRASOUND_RECORD'
    | 'ASSESSMENT_SAVED'
    | 'ASSESSMENT_FINALIZED'
    | 'DOCUMENT_GENERATED'
    | 'CLINICAL_SIGN_OFF'
  title: string
  description: string
  actorName: string
  actorRole: string
  status?: string
  recordRef?: string
  metadata?: Record<string, unknown>
}

export interface UnifiedPatientDossier {
  patient: UnifiedPatientSummary
  ancRecord: RoutineAncData | null
  pedigree: PedigreeDataModel | null
  assessments: Array<{
    id: string
    code: string
    type: string
    portalSource: string
    decision: string
    referralTarget?: string
    state: string
    revision: number
    date: string
    actorName: string
    actorRole: string
    reviewNote?: string
  }>
  timeline: PatientTimelineEvent[]
  documents: Array<{
    id: string
    fileName: string
    filePath: string
    fileSize: number
    generatedAt: string
    generatedBy: { name: string; role: string }
    portalSource: string
    documentType: string
  }>
}

/**
 * Searches and aggregates unified patients from PostgreSQL patients table and ANC registry.
 * Deduplicates automatically by MRN and patient ID.
 */
export async function getUnifiedPatients(searchQuery = ''): Promise<UnifiedPatientSummary[]> {
  const patientMap = new Map<string, UnifiedPatientSummary>()

  // 1. Fetch from PostgreSQL patients table
  try {
    const dbRes = await dbQuery<{
      id: string
      full_name: string
      mrn: string
      dob: string
      age: number
      pregnancy_status: string
      gestational_age_weeks: number
      gravida_para: string
      ancestry_notes: string
      created_at: string
      updated_at: string
    }>(
      `SELECT id, full_name, mrn, dob, age, pregnancy_status, gestational_age_weeks,
              gravida_para, ancestry_notes, created_at, updated_at
       FROM patients ORDER BY updated_at DESC;`,
    )

    for (const r of dbRes.rows) {
      const mrnKey = (r.mrn || r.id).toLowerCase()
      patientMap.set(mrnKey, {
        id: r.id,
        mrn: r.mrn || 'MRN-PENDING',
        name: r.full_name,
        dob: r.dob || 'Not recorded',
        age: Number(r.age || 0),
        pregnancyStatus: (r.pregnancy_status || 'not_recorded').replace(/_/g, ' '),
        gestationalAge: r.gestational_age_weeks ? `${r.gestational_age_weeks} weeks` : undefined,
        gpla: r.gravida_para,
        hospital: 'GenoBridge Clinical Center',
        hasAnc: false,
        hasPedigree: false,
        assessmentCount: 0,
        documentCount: 0,
        sourcePortals: ['Hospital Portal'],
        registeredAt: r.created_at || new Date().toISOString(),
        lastActivityAt: r.updated_at || r.created_at || new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn('Could not query PostgreSQL patients:', err)
  }

  // 2. Aggregate ANC records
  try {
    if (fs.existsSync(ANC_FILE)) {
      const content = await fs.promises.readFile(ANC_FILE, 'utf-8')
      const ancRecords: RoutineAncData[] = JSON.parse(content || '[]')

      for (const anc of ancRecords) {
        const mrn = anc.booking.hospitalRegNumber || `MRN-${anc.booking.identifier}`
        const mrnKey = mrn.toLowerCase()
        const existing = patientMap.get(mrnKey)

        const ancPortal = 'ANC Portal'
        const gpla = `G${anc.booking.gravida ?? 1} P${anc.booking.para ?? 0} L${anc.booking.living ?? 0} A${anc.booking.abortions ?? 0}`
        const portals = existing ? Array.from(new Set([...existing.sourcePortals, ancPortal])) : [ancPortal]

        patientMap.set(mrnKey, {
          id: existing?.id || anc.booking.patientId || anc.booking.identifier,
          mrn,
          name: anc.booking.name || existing?.name || 'Unnamed Patient',
          dob: anc.booking.dateOfBirth || existing?.dob || 'Not recorded',
          age: anc.booking.ageAtBooking || existing?.age || 0,
          pregnancyStatus: anc.status || 'Active ANC Care',
          gestationalAge: anc.pregnancy?.edd ? 'In gestation' : undefined,
          gpla,
          contactPhone: anc.booking.mobileNumber || undefined,
          address: anc.booking.city ? `${anc.booking.city}, ${anc.booking.state}` : undefined,
          hospital: 'GenoBridge Maternal Care Hub',
          ancIdentifier: anc.booking.identifier,
          hasAnc: true,
          hasPedigree: false,
          assessmentCount: existing?.assessmentCount || 0,
          documentCount: (anc.documents?.length || 0) + (existing?.documentCount || 0),
          sourcePortals: portals,
          registeredAt: existing?.registeredAt || anc.booking.bookingDate || new Date().toISOString(),
          lastActivityAt: anc.lastUpdated || existing?.lastActivityAt || new Date().toISOString(),
        })
      }
    }
  } catch (err) {
    console.warn('Could not aggregate ANC records for patients:', err)
  }

  // 3. Check connected Pedigrees in PostgreSQL
  try {
    const pedRes = await dbQuery<{ patient_id: string; title: string }>(
      'SELECT patient_id, title FROM pedigrees WHERE patient_id IS NOT NULL;',
    )
    for (const ped of pedRes.rows) {
      for (const [key, p] of patientMap.entries()) {
        if (p.id === ped.patient_id || ped.title.toLowerCase().includes(p.name.toLowerCase())) {
          p.hasPedigree = true
          if (!p.sourcePortals.includes('Pedigree Studio')) {
            p.sourcePortals.push('Pedigree Studio')
          }
        }
      }
    }
  } catch {}

  // 4. Check connected Clinical Workflows & Assessments in PostgreSQL
  try {
    const wfRes = await dbQuery<{ patient_id: string; decision: string }>(
      'SELECT patient_id, decision FROM clinical_workflows WHERE patient_id IS NOT NULL;',
    )
    for (const wf of wfRes.rows) {
      for (const [key, p] of patientMap.entries()) {
        if (p.id === wf.patient_id) {
          p.assessmentCount += 1
          if (!p.sourcePortals.includes('Doctor Portal')) {
            p.sourcePortals.push('Doctor Portal')
          }
        }
      }
    }
  } catch {}

  // Filter by search query
  let results = Array.from(patientMap.values())
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.contactPhone && p.contactPhone.toLowerCase().includes(q)) ||
        (p.ancIdentifier && p.ancIdentifier.toLowerCase().includes(q)),
    )
  }

  // Sort by last activity descending
  return results.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
}

/**
 * Compiles a comprehensive, cross-portal patient history dossier with unified timeline.
 */
export async function getUnifiedPatientDossier(
  identifier: string,
): Promise<UnifiedPatientDossier | null> {
  const allPatients = await getUnifiedPatients()
  const idLower = identifier.toLowerCase()

  const patient = allPatients.find(
    (p) =>
      p.id.toLowerCase() === idLower ||
      p.mrn.toLowerCase() === idLower ||
      (p.ancIdentifier && p.ancIdentifier.toLowerCase() === idLower),
  )

  if (!patient) return null

  // 1. Fetch ANC Record
  let ancRecord: RoutineAncData | null = null
  try {
    if (fs.existsSync(ANC_FILE)) {
      const content = await fs.promises.readFile(ANC_FILE, 'utf-8')
      const ancRecords: RoutineAncData[] = JSON.parse(content || '[]')
      ancRecord =
        ancRecords.find(
          (a) =>
            a.booking.identifier.toLowerCase() === (patient.ancIdentifier || '').toLowerCase() ||
            (a.booking.hospitalRegNumber && a.booking.hospitalRegNumber.toLowerCase() === patient.mrn.toLowerCase()) ||
            a.booking.name.toLowerCase() === patient.name.toLowerCase(),
        ) || null
    }
  } catch {}

  // 2. Fetch Connected Pedigree
  let pedigree: PedigreeDataModel | null = null
  try {
    const pedRes = await dbQuery<{
      id: string
      title: string
      consanguinity: boolean
      ancestries: any
      notes: string
      members: any
      relationships: any
      canvas_layout: any
      summary: any
      created_at: string
      updated_at: string
    }>(
      `SELECT * FROM pedigrees 
       WHERE patient_id = $1 OR title ILIKE $2 
       ORDER BY updated_at DESC LIMIT 1;`,
      [patient.id, `%${patient.name}%`],
    )

    if (pedRes.rows.length > 0) {
      const r = pedRes.rows[0]
      pedigree = {
        id: r.id,
        title: r.title,
        version: 2,
        consanguinity: Boolean(r.consanguinity),
        ancestries: r.ancestries || [],
        notes: r.notes || '',
        members: r.members || [],
        relationships: r.relationships || [],
        canvasLayout: r.canvas_layout || {},
        summary: r.summary || {},
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    }
  } catch {}

  // 3. Fetch Assessments from PostgreSQL
  const assessments: UnifiedPatientDossier['assessments'] = []
  try {
    const wfRes = await dbQuery<{
      id: string
      workflow_key: string
      pathway_slug: string
      decision: string
      state: string
      revision: number
      created_at: string
      review_note: string
    }>(
      `SELECT id, workflow_key, pathway_slug, decision, state, revision, created_at, review_note
       FROM clinical_workflows 
       WHERE patient_id = $1 
       ORDER BY created_at DESC;`,
      [patient.id],
    )

    for (const w of wfRes.rows) {
      assessments.push({
        id: w.id,
        code: w.workflow_key || w.id.slice(0, 8),
        type: (w.pathway_slug || 'Clinical Genetics').replace(/-/g, ' ').toUpperCase(),
        portalSource: 'Doctor Portal',
        decision: w.decision || 'UNDER_EVALUATION',
        state: w.state || 'FINALIZED',
        revision: Number(w.revision || 1),
        date: w.created_at,
        actorName: 'Attending Clinician, MD',
        actorRole: 'OB-GYN Provider',
        reviewNote: w.review_note,
      })
    }
  } catch {}

  // 4. Fetch Generated Reports & Documents
  const documents: UnifiedPatientDossier['documents'] = []
  try {
    if (fs.existsSync(REPORTS_META_FILE)) {
      const metaContent = await fs.promises.readFile(REPORTS_META_FILE, 'utf-8')
      const allMeta: any[] = JSON.parse(metaContent || '[]')
      const patientDocs = allMeta.filter(
        (m) =>
          (m.patientId && m.patientId.toLowerCase() === (patient.ancIdentifier || patient.id).toLowerCase()) ||
          (m.mrn && m.mrn.toLowerCase() === patient.mrn.toLowerCase()),
      )

      for (const d of patientDocs) {
        documents.push({
          id: d.id,
          fileName: d.fileName || 'Clinical_Document.pdf',
          filePath: d.filePath || '',
          fileSize: d.fileSize || 0,
          generatedAt: d.generatedAt || new Date().toISOString(),
          generatedBy: d.generatedBy || { name: 'Clinician', role: 'Doctor' },
          portalSource: 'Reporting Module',
          documentType: 'Clinical Referral & Decision Brief (PDF)',
        })
      }
    }
  } catch {}

  // 5. Construct Unified Chronological Timeline (Phase 3.4)
  const timeline: PatientTimelineEvent[] = []

  // Event: Patient Registration
  timeline.push({
    id: `tl_reg_${patient.id}`,
    timestamp: patient.registeredAt,
    portalSource: 'Hospital Portal',
    eventType: 'REGISTRATION',
    title: 'Patient Registered in GenoBridge',
    description: `Universal Patient ID allocated (${patient.id.slice(0, 12)}) with MRN ${patient.mrn}`,
    actorName: 'Admissions & Records',
    actorRole: 'System Administrator',
  })

  // Events from ANC Record
  if (ancRecord) {
    timeline.push({
      id: `tl_anc_book_${ancRecord.booking.identifier}`,
      timestamp: ancRecord.booking.bookingDate || patient.registeredAt,
      portalSource: 'ANC Portal',
      eventType: 'ANC_BOOKING',
      title: 'Antenatal Care Intake & Booking Completed',
      description: `ANC Case #${ancRecord.booking.identifier} opened. Gravida: ${ancRecord.booking.gravida ?? 1}, Para: ${ancRecord.booking.para ?? 0}`,
      actorName: ancRecord.booking.clinician || 'Nurse Intake Staff',
      actorRole: 'Nurse / MA',
      recordRef: ancRecord.booking.identifier,
    })

    // Visits
    if (Array.isArray(ancRecord.visits)) {
      ancRecord.visits.forEach((v, idx) => {
        timeline.push({
          id: `tl_anc_v_${v.id || idx}`,
          timestamp: v.date || patient.registeredAt,
          portalSource: 'ANC Portal',
          eventType: 'ANC_VISIT',
          title: `ANC Clinical Encounter: Visit #${idx + 1}`,
          description: `Gestational Age: ${v.gaWeeks ?? '?'}w · Weight: ${v.weightKg ?? '?'}kg · BP: ${v.systolic ?? '?'}/${v.diastolic ?? '?'} mmHg`,
          actorName: v.clinician || 'Attending Clinician',
          actorRole: 'Provider',
          recordRef: ancRecord.booking.identifier,
        })
      })
    }

    // Ultrasounds
    if (Array.isArray(ancRecord.ultrasounds)) {
      ancRecord.ultrasounds.forEach((u, idx) => {
        const scanName = u.purpose || (u.scanType ? u.scanType.replace(/_/g, ' ').toUpperCase() : 'Ultrasound Scan')
        timeline.push({
          id: `tl_us_${u.id || idx}`,
          timestamp: u.date || patient.registeredAt,
          portalSource: 'ANC Portal',
          eventType: 'ULTRASOUND_RECORD',
          title: `Obstetric Ultrasound: ${scanName}`,
          description: `Gestational Age: ${u.gaWeeks ?? '?'}w · Findings: ${u.findings || u.impression || 'Documented on file'}`,
          actorName: ancRecord.booking.clinician || 'Fetal Medicine Specialist',
          actorRole: 'Radiologist / Sonographer',
          recordRef: ancRecord.booking.identifier,
        })
      })
    }
  }

  // Event: Pedigree Generated / Updated
  if (pedigree) {
    timeline.push({
      id: `tl_ped_${pedigree.id}`,
      timestamp: pedigree.updatedAt || pedigree.createdAt || patient.registeredAt,
      portalSource: 'Pedigree Studio',
      eventType: 'PEDIGREE_CREATED',
      title: 'Multigenerational Genetic Pedigree Charted',
      description: `Mapped ${pedigree.summary?.totalMembers || pedigree.members.length} relatives across ${pedigree.summary?.numGenerations || 3} generations. Consanguinity: ${pedigree.consanguinity ? 'Yes' : 'No'}`,
      actorName: 'Clinical Genetics Counselor',
      actorRole: 'Specialist',
      recordRef: pedigree.id,
    })
  }

  // Events from Assessments
  for (const a of assessments) {
    timeline.push({
      id: `tl_asm_${a.id}`,
      timestamp: a.date,
      portalSource: 'Doctor Portal',
      eventType: 'ASSESSMENT_SAVED',
      title: `Clinical Referral Evaluation: ${a.type}`,
      description: `Triage decision: ${a.decision.replace(/_/g, ' ')} · State: ${a.state} (Rev ${a.revision})`,
      actorName: a.actorName,
      actorRole: a.actorRole,
      recordRef: a.id,
    })
  }

  // Events from Generated Documents
  for (const d of documents) {
    timeline.push({
      id: `tl_doc_${d.id}`,
      timestamp: d.generatedAt,
      portalSource: 'Reporting Module',
      eventType: 'DOCUMENT_GENERATED',
      title: `Clinical Report Generated: ${d.fileName}`,
      description: `Formal clinical decision memorandum and referral letter compiled (${Math.round(d.fileSize / 1024)} KB)`,
      actorName: d.generatedBy.name,
      actorRole: d.generatedBy.role,
      recordRef: d.id,
    })
  }

  // Sort timeline chronologically (most recent first)
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    patient,
    ancRecord,
    pedigree,
    assessments,
    timeline,
    documents,
  }
}
