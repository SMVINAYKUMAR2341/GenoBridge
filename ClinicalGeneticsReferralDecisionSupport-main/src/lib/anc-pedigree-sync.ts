import type { RoutineAncData } from './anc-model'
import type {
  FamilyMember,
  FamilyRelationship,
  PedigreeConditionItem,
  PedigreeDataModel,
} from '@/components/clinical/pedigree-model'
import { dbQuery } from './db-pool'
import { randomUUID } from 'crypto'

function uid(prefix = 'm'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Automatically maps an ANC clinical record into a multi-generational PedigreeDataModel.
 * Preserves maternal and paternal branches, consanguinity, thalassaemia carrier status,
 * previous pregnancy outcomes, and patient identity.
 */
export function generatePedigreeFromAnc(
  anc: RoutineAncData,
  existingPedigree?: PedigreeDataModel | null,
): PedigreeDataModel {
  const patientId = anc.booking.patientId || anc.booking.identifier
  const patientName = anc.booking.name || 'Proband (Patient)'
  const patientAge = anc.booking.ageAtBooking ?? null
  const partnerName = anc.booking.partnerName || 'Spouse / Partner'

  // If existing pedigree exists, preserve custom added members while updating Proband & Partner
  if (existingPedigree && existingPedigree.members && existingPedigree.members.length > 0) {
    const updatedMembers = existingPedigree.members.map((m) => {
      if (m.isProband) {
        return {
          ...m,
          name: patientName,
          age: patientAge,
          geneticStatus:
            anc.thalassaemia?.maternalStatus === 'carrier'
              ? ('carrier' as const)
              : anc.thalassaemia?.maternalStatus === 'affected'
              ? ('affected' as const)
              : m.geneticStatus,
        }
      }
      if (m.relation === 'partner' && partnerName) {
        return {
          ...m,
          name: partnerName,
          geneticStatus:
            anc.thalassaemia?.partnerStatus === 'carrier'
              ? ('carrier' as const)
              : anc.thalassaemia?.partnerStatus === 'affected'
              ? ('affected' as const)
              : m.geneticStatus,
        }
      }
      return m
    })

    const isConsanguineous =
      anc.consanguinity?.status === 'yes' || Boolean(anc.consanguinity?.relationship) || existingPedigree.consanguinity

    return {
      ...existingPedigree,
      consanguinity: isConsanguineous,
      members: updatedMembers,
      updatedAt: new Date().toISOString(),
    }
  }

  // 1. Proband (ANC Patient)
  const probandId = uid('prob')
  const partnerId = uid('part')
  const fatherId = uid('fat')
  const motherId = uid('mot')
  const pgfId = uid('pgf')
  const pgmId = uid('pgm')
  const mgfId = uid('mgf')
  const mgmId = uid('mgm')

  // Proband conditions from ANC
  const probandConditions: PedigreeConditionItem[] = []
  let probandGeneticStatus: FamilyMember['geneticStatus'] = 'unaffected'

  if (anc.thalassaemia?.maternalStatus === 'carrier') {
    probandGeneticStatus = 'carrier'
    probandConditions.push({
      id: uid('c'),
      name: 'Beta-Thalassaemia Trait',
      status: 'carrier',
      notes: anc.thalassaemia.haemoglobinAnalysis || 'ANC Screening positive',
    })
  } else if (anc.thalassaemia?.maternalStatus === 'affected') {
    probandGeneticStatus = 'affected'
    probandConditions.push({
      id: uid('c'),
      name: 'Beta-Thalassaemia Major',
      status: 'affected',
    })
  }

  // Partner conditions from ANC
  const partnerConditions: PedigreeConditionItem[] = []
  let partnerGeneticStatus: FamilyMember['geneticStatus'] = 'unaffected'

  if (anc.thalassaemia?.partnerStatus === 'carrier') {
    partnerGeneticStatus = 'carrier'
    partnerConditions.push({
      id: uid('c'),
      name: 'Beta-Thalassaemia Trait',
      status: 'carrier',
    })
  }

  // Children / Pregnancy Nodes
  const childrenIds: string[] = []
  const childMembers: FamilyMember[] = []

  // Living children
  const livingCount = anc.booking.living ?? 0
  for (let i = 1; i <= livingCount; i++) {
    const cId = uid('chld')
    childrenIds.push(cId)
    childMembers.push({
      id: cId,
      name: `Child ${i}`,
      relation: 'child_u',
      generation: 4,
      sex: 'U',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unknown',
      isProband: false,
      isConsultand: false,
      notes: 'Recorded in ANC obstetric history',
      conditions: [],
      parentIds: [probandId, partnerId],
      partnerIds: [],
      childrenIds: [],
    })
  }

  // Abortions / Pregnancy Losses
  const abortionCount = anc.booking.abortions ?? 0
  for (let i = 1; i <= abortionCount; i++) {
    const lossId = uid('loss')
    childrenIds.push(lossId)
    childMembers.push({
      id: lossId,
      name: `Loss ${i}`,
      relation: 'child_u',
      generation: 4,
      sex: 'U',
      age: null,
      deceased: true,
      ageAtDeath: null,
      causeOfDeath: 'Pregnancy loss',
      geneticStatus: 'unknown',
      isProband: false,
      isConsultand: false,
      pregnancyOutcome: 'miscarriage',
      notes: 'Prior clinical loss recorded in ANC',
      conditions: [],
      parentIds: [probandId, partnerId],
      partnerIds: [],
      childrenIds: [],
    })
  }

  // Current Ongoing Pregnancy
  const currentPregId = uid('preg')
  childrenIds.push(currentPregId)
  childMembers.push({
    id: currentPregId,
    name: 'Current Pregnancy',
    relation: 'child_u',
    generation: 4,
    sex: 'U',
    age: null,
    deceased: false,
    ageAtDeath: null,
    geneticStatus: 'unknown',
    isProband: false,
    isConsultand: false,
    pregnancyOutcome: 'pregnancy',
    notes: `Active gestation · LMP: ${anc.pregnancy?.lmp || 'recorded in ANC'}`,
    conditions: [],
    parentIds: [probandId, partnerId],
    partnerIds: [],
    childrenIds: [],
  })

  // Mother / Maternal family conditions
  const motherConditions: PedigreeConditionItem[] = []
  let motherGeneticStatus: FamilyMember['geneticStatus'] = 'unaffected'
  if (anc.histories?.familyMedicalHistory?.toLowerCase().includes('diabetes')) {
    motherConditions.push({ id: uid('c'), name: 'Type 2 Diabetes', status: 'affected' })
    motherGeneticStatus = 'affected'
  }
  if (anc.histories?.familyMedicalHistory?.toLowerCase().includes('hypertension')) {
    motherConditions.push({ id: uid('c'), name: 'Hypertension', status: 'affected' })
    motherGeneticStatus = 'affected'
  }

  const members: FamilyMember[] = [
    // Generation 1: Grandparents
    {
      id: pgfId,
      name: 'Paternal Grandfather',
      relation: 'paternal_grandfather',
      generation: 1,
      sex: 'M',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [],
      partnerIds: [pgmId],
      childrenIds: [fatherId],
    },
    {
      id: pgmId,
      name: 'Paternal Grandmother',
      relation: 'paternal_grandmother',
      generation: 1,
      sex: 'F',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [],
      partnerIds: [pgfId],
      childrenIds: [fatherId],
    },
    {
      id: mgfId,
      name: 'Maternal Grandfather',
      relation: 'maternal_grandfather',
      generation: 1,
      sex: 'M',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [],
      partnerIds: [mgmId],
      childrenIds: [motherId],
    },
    {
      id: mgmId,
      name: 'Maternal Grandmother',
      relation: 'maternal_grandmother',
      generation: 1,
      sex: 'F',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [],
      partnerIds: [mgfId],
      childrenIds: [motherId],
    },

    // Generation 2: Parents
    {
      id: fatherId,
      name: 'Father',
      relation: 'father',
      generation: 2,
      sex: 'M',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [pgfId, pgmId],
      partnerIds: [motherId],
      childrenIds: [probandId],
    },
    {
      id: motherId,
      name: 'Mother',
      relation: 'mother',
      generation: 2,
      sex: 'F',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: motherGeneticStatus,
      isProband: false,
      isConsultand: false,
      notes: anc.histories?.familyMedicalHistory || '',
      conditions: motherConditions,
      parentIds: [mgfId, mgmId],
      partnerIds: [fatherId],
      childrenIds: [probandId],
    },

    // Generation 3: Proband & Partner
    {
      id: probandId,
      name: patientName,
      relation: 'proband',
      generation: 3,
      sex: 'F',
      age: patientAge,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: probandGeneticStatus,
      isProband: true,
      isConsultand: true,
      notes: `ANC Patient ID: ${patientId} · MRN: ${anc.booking.hospitalRegNumber || 'N/A'}`,
      conditions: probandConditions,
      parentIds: [fatherId, motherId],
      partnerIds: [partnerId],
      childrenIds,
    },
    {
      id: partnerId,
      name: partnerName,
      relation: 'partner',
      generation: 3,
      sex: 'M',
      age: null,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: partnerGeneticStatus,
      isProband: false,
      isConsultand: false,
      notes: 'Recorded in ANC booking',
      conditions: partnerConditions,
      parentIds: [],
      partnerIds: [probandId],
      childrenIds,
    },

    // Generation 4: Children & Pregnancies
    ...childMembers,
  ]

  const isConsanguineous =
    anc.consanguinity?.status === 'yes' ||
    Boolean(anc.consanguinity?.relationship && anc.consanguinity.relationship !== 'none')

  const relationships: FamilyRelationship[] = [
    { id: uid('r'), type: 'partner', members: [pgfId, pgmId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [mgfId, mgmId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [fatherId, motherId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [probandId, partnerId], consanguineous: isConsanguineous },
  ]

  const totalMembers = members.length
  const gens = new Set(members.map((m) => m.generation))
  const affectedCount = members.filter((m) => m.geneticStatus === 'affected').length
  const carrierCount = members.filter(
    (m) => m.geneticStatus === 'carrier' || m.geneticStatus === 'suspected_carrier',
  ).length
  const unknownCount = members.filter((m) => m.geneticStatus === 'unknown').length

  return {
    id: existingPedigree?.id || uid('ped'),
    title: `Pedigree: ${patientName} (${anc.booking.identifier})`,
    version: 2,
    consanguinity: isConsanguineous,
    ancestries: ['South Asian / Indian'],
    notes: `Automatically generated from ANC Record ${anc.booking.identifier}. ${anc.consanguinity?.familyHistory || ''}`.trim(),
    members,
    relationships,
    canvasLayout: { zoom: 1, panX: 0, panY: 0 },
    summary: {
      totalMembers,
      numGenerations: gens.size,
      affectedCount,
      carrierCount,
      unknownCount,
    },
    createdAt: existingPedigree?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Persists an auto-generated or synchronized pedigree for an ANC patient in Neon PostgreSQL.
 */
export async function syncAndPersistAncPedigree(
  anc: RoutineAncData,
  userId: string,
): Promise<PedigreeDataModel> {
  const patientId = anc.booking.patientId || anc.booking.identifier
  const mrn = anc.booking.hospitalRegNumber || `MRN-${anc.booking.identifier}`

  // Check if patient exists in PostgreSQL patients table
  let dbPatientId: string | null = null
  const patientQuery = await dbQuery<{ id: string }>(
    'SELECT id FROM patients WHERE mrn = $1 OR full_name = $2 LIMIT 1;',
    [mrn, anc.booking.name],
  )
  if (patientQuery.rows.length > 0) {
    dbPatientId = patientQuery.rows[0].id
  }

  // Check if a pedigree already exists for this patient in PostgreSQL
  let existingPedigree: PedigreeDataModel | null = null
  let existingPedigreeId: string | null = null

  if (dbPatientId) {
    const pedQuery = await dbQuery<{ id: string; members: any; relationships: any; title: string; consanguinity: boolean; ancestries: any; notes: string; summary: any; canvas_layout: any; created_at: any; updated_at: any }>(
      'SELECT * FROM pedigrees WHERE patient_id = $1 LIMIT 1;',
      [dbPatientId],
    )
    if (pedQuery.rows.length > 0) {
      const row = pedQuery.rows[0]
      existingPedigreeId = row.id
      existingPedigree = {
        id: row.id,
        title: row.title,
        version: 2,
        consanguinity: row.consanguinity,
        ancestries: row.ancestries || [],
        notes: row.notes || '',
        members: row.members || [],
        relationships: row.relationships || [],
        canvasLayout: row.canvas_layout || {},
        summary: row.summary || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    }
  }

  const generated = generatePedigreeFromAnc(anc, existingPedigree)
  const pedigreeId = existingPedigreeId || generated.id || randomUUID()

  // Upsert into pedigrees table
  const upsertSql = `
    INSERT INTO pedigrees (
      id, user_id, patient_id, title, consanguinity, ancestries, notes,
      summary, members, relationships, canvas_layout, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      consanguinity = EXCLUDED.consanguinity,
      ancestries = EXCLUDED.ancestries,
      notes = EXCLUDED.notes,
      summary = EXCLUDED.summary,
      members = EXCLUDED.members,
      relationships = EXCLUDED.relationships,
      canvas_layout = EXCLUDED.canvas_layout,
      updated_at = NOW()
    RETURNING *;
  `

  await dbQuery(upsertSql, [
    pedigreeId,
    userId,
    dbPatientId,
    generated.title,
    generated.consanguinity,
    JSON.stringify(generated.ancestries),
    generated.notes,
    JSON.stringify(generated.summary),
    JSON.stringify(generated.members),
    JSON.stringify(generated.relationships),
    JSON.stringify(generated.canvasLayout || {}),
  ])

  return generated
}
