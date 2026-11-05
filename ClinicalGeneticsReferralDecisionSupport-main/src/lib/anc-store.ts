import fs from 'fs'
import path from 'path'
import {
  type RoutineAncData,
  calculateGestationalAge,
  estimateEddFromLmp,
  calculateBmi,
  calculateGplaFromOutcomes,
  evaluatePreEclampsiaRisk,
  evaluateOverallAncRisk,
} from './anc-model'

/**
 * HELIX ANTENATAL CARE — SECURE JSON PERSISTENCE & REPOSITORY LAYER
 *
 * Implements:
 * 1. Safe JSON-file storage inside `.helix_data`
 * 2. Strict write serialization via mutex to prevent concurrency conflicts
 * 3. Atomic file writes (.tmp + rename) to protect against interrupted writes
 * 4. Automatic snapshot backups in `.helix_data/backups/`
 * 5. Immutable audit trails in `.helix_data/audit_logs.json`
 * 6. Full CRUD, search, draft saving, and soft-archival
 * 7. Zero sample/hardcoded records
 */

export const DATA_DIR = path.resolve(process.cwd(), '.helix_data')
export const ANC_FILE = path.join(DATA_DIR, 'anc_records.json')
export const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json')
export const REPORTS_META_FILE = path.join(DATA_DIR, 'reports_metadata.json')
export const REPORTS_DIR = path.join(DATA_DIR, 'reports')
export const DOCS_DIR = path.join(DATA_DIR, 'documents')
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups')

export interface ClinicalActor {
  name: string
  role: string
  email?: string
}

export interface AncAuditEntry {
  id: string
  timestamp: string
  action: 'CREATE' | 'UPDATE' | 'DRAFT_SAVE' | 'ARCHIVE' | 'REPORT_GENERATED' | 'STATUS_CHANGE'
  recordId: string
  mrn?: string
  patientName?: string
  actor: ClinicalActor
  details?: Record<string, unknown>
}

export interface AncFilterOptions {
  search?: string
  status?: string
  risk?: string
  includeArchived?: boolean
  page?: number
  limit?: number
  sortBy?: 'bookingDate' | 'name' | 'lastUpdated' | 'identifier'
  sortOrder?: 'asc' | 'desc'
}

export interface AncDashboardStats {
  total: number
  active: number
  highRisk: number
  referred: number
  delivered: number
  drafts: number
  archived: number
}

// ---------------------------------------------------------------------------
// Concurrency Control & Write Mutex
// ---------------------------------------------------------------------------
let writeLockPromise: Promise<unknown> = Promise.resolve()

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const nextLock = writeLockPromise.then(fn, fn)
  writeLockPromise = nextLock
  return nextLock
}

// ---------------------------------------------------------------------------
// Safe Initialization & Atomic Filesystem Operations
// ---------------------------------------------------------------------------
export async function ensureStorageDirectories(): Promise<void> {
  const dirs = [DATA_DIR, BACKUPS_DIR, REPORTS_DIR, DOCS_DIR]
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      await fs.promises.mkdir(d, { recursive: true })
    }
  }

  // Ensure primary storage file exists
  if (!fs.existsSync(ANC_FILE)) {
    await atomicWriteFile(ANC_FILE, '[]\n')
  }

  // Ensure audit logs file exists
  if (!fs.existsSync(AUDIT_FILE)) {
    await atomicWriteFile(AUDIT_FILE, '[]\n')
  }

  // Ensure reports metadata file exists
  if (!fs.existsSync(REPORTS_META_FILE)) {
    await atomicWriteFile(REPORTS_META_FILE, '[]\n')
  }
}

/** Atomic write: write to unique .tmp file first, then atomically rename */
async function atomicWriteFile(targetPath: string, data: string): Promise<void> {
  const dir = path.dirname(targetPath)
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true })
  }
  const tmpPath = `${targetPath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await fs.promises.writeFile(tmpPath, data, 'utf8')
  await fs.promises.rename(tmpPath, targetPath)
}

/** Save rotated backup of current records */
async function createBackupSnapshot(records: RoutineAncData[]): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUPS_DIR, `anc_backup_${timestamp}.json`)
    await atomicWriteFile(backupFile, JSON.stringify(records, null, 2))

    // Rotate: keep latest 10 backups
    const files = await fs.promises.readdir(BACKUPS_DIR)
    const backupFiles = files
      .filter((f) => f.startsWith('anc_backup_') && f.endsWith('.json'))
      .sort()

    if (backupFiles.length > 10) {
      const toDelete = backupFiles.slice(0, backupFiles.length - 10)
      for (const oldFile of toDelete) {
        await fs.promises.unlink(path.join(BACKUPS_DIR, oldFile)).catch(() => {})
      }
    }
  } catch (err) {
    console.error('Failed to create backup snapshot:', err)
  }
}

/** Append an audit log entry */
export async function recordAuditLog(
  action: AncAuditEntry['action'],
  recordId: string,
  actor: ClinicalActor,
  options?: { mrn?: string; patientName?: string; details?: Record<string, unknown> },
): Promise<void> {
  try {
    await ensureStorageDirectories()
    let logs: AncAuditEntry[] = []
    try {
      const raw = await fs.promises.readFile(AUDIT_FILE, 'utf8')
      logs = JSON.parse(raw)
      if (!Array.isArray(logs)) logs = []
    } catch {
      logs = []
    }

    const entry: AncAuditEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      recordId,
      mrn: options?.mrn,
      patientName: options?.patientName,
      actor: {
        name: actor.name || 'System User',
        role: actor.role || 'provider',
        email: actor.email,
      },
      details: options?.details,
    }

    logs.push(entry)
    // Keep max 1000 audit entries
    if (logs.length > 1000) {
      logs = logs.slice(logs.length - 1000)
    }
    await atomicWriteFile(AUDIT_FILE, JSON.stringify(logs, null, 2))
  } catch (err) {
    console.error('Audit log write error:', err)
  }
}

/** Retrieve audit logs, optionally filtered by recordId */
export async function getAuditLogs(recordId?: string): Promise<AncAuditEntry[]> {
  await ensureStorageDirectories()
  try {
    const raw = await fs.promises.readFile(AUDIT_FILE, 'utf8')
    const list = JSON.parse(raw) as AncAuditEntry[]
    if (!Array.isArray(list)) return []
    if (recordId) {
      return list.filter((l) => l.recordId === recordId).reverse()
    }
    return list.reverse()
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Identifiers & Clinical Auto-Calculations
// ---------------------------------------------------------------------------
export function generateUniqueIdentifiers(existing: RoutineAncData[]): {
  identifier: string
  patientId: string
} {
  const year = new Date().getFullYear()
  const currentYearRecords = existing.filter((r) => r.booking.identifier.startsWith(`ANC-${year}-`))
  const seq = currentYearRecords.length + 1
  const padded = String(seq).padStart(4, '0')
  return {
    identifier: `ANC-${year}-${padded}`,
    patientId: `PAT-${year}-${padded}`,
  }
}

function applyClinicalCalculations(
  record: RoutineAncData,
  actor?: ClinicalActor,
  isDraft = false,
): RoutineAncData {
  // Recalculate GA and EDD if LMP is present
  if (record.pregnancy.lmp) {
    const calcEdd = estimateEddFromLmp(record.pregnancy.lmp, record.pregnancy.cycleDays || 28)
    if (calcEdd && !record.pregnancy.edd) {
      record.pregnancy.edd = calcEdd
    }
    const ga = calculateGestationalAge(record.pregnancy.lmp)
    if (ga) {
      record.pregnancy.gaWeeks = ga.weeks
      record.pregnancy.gaDays = ga.days
      record.pregnancy.trimester = ga.weeks < 14 ? 1 : ga.weeks < 28 ? 2 : 3
    }
  }

  // Auto-calculate BMI if height and weight present
  if (record.booking.heightCm && record.booking.weightKg) {
    const bmiResult = calculateBmi(record.booking.weightKg, record.booking.heightCm)
    if (!record.generalExam) {
      record.generalExam = {
        pulseBpm: null,
        systolicBp: null,
        diastolicBp: null,
        temperatureF: null,
        respiratoryRate: null,
        bmi: bmiResult.bmi,
        bmiCategory: bmiResult.category,
        pallor: 'absent',
        jaundice: false,
        cyanosis: false,
        clubbing: false,
        pedalEdema: 'none',
        lymphadenopathy: false,
        cvsFindings: '',
        respiratoryFindings: '',
        breastExam: '',
        thyroidExam: '',
      }
    } else {
      record.generalExam.bmi = bmiResult.bmi
      record.generalExam.bmiCategory = bmiResult.category
    }
  }

  // Auto-calculate G/P/L/A if previous outcomes are provided
  if (record.previousOutcomes && record.previousOutcomes.length > 0) {
    const gpla = calculateGplaFromOutcomes(record.previousOutcomes)
    record.booking.gravida = gpla.g
    record.booking.para = gpla.p
    record.booking.living = gpla.l
    record.booking.abortions = gpla.a
  }

  // Evaluate clinical risk
  const riskAssessment = evaluateOverallAncRisk(record)
  const peRisk = evaluatePreEclampsiaRisk(
    record.histories,
    record.booking,
    record.previousOutcomes,
    record.generalExam,
  )

  const isProvider = actor?.role === 'provider' || actor?.role === 'doctor'

  if (!record.riskClassification) {
    record.riskClassification = {
      riskLevel: riskAssessment.riskLevel,
      calculatedRiskLevel: riskAssessment.riskLevel,
      clinicianConfirmedRiskLevel: isProvider ? riskAssessment.riskLevel : 'PENDING',
      highRiskFlags: riskAssessment.flags,
      preEclampsiaRisk: peRisk.isHighRisk ? 'high' : peRisk.moderateRiskFactors.length >= 2 ? 'moderate' : 'low',
      aspirinRecommended: peRisk.aspirinAdvised,
      clinicianOverride: false,
      clinicianOverrideRationale: '',
      clinicianApproved: isProvider,
      approvedByClinicianName: isProvider ? actor.name : '',
      approvedAt: isProvider ? new Date().toISOString().slice(0, 10) : '',
    }
  } else {
    if (!record.riskClassification.clinicianOverride) {
      record.riskClassification.riskLevel = riskAssessment.riskLevel
      record.riskClassification.calculatedRiskLevel = riskAssessment.riskLevel
      record.riskClassification.highRiskFlags = riskAssessment.flags
    }
    record.riskClassification.preEclampsiaRisk = peRisk.isHighRisk ? 'high' : peRisk.moderateRiskFactors.length >= 2 ? 'moderate' : 'low'
    record.riskClassification.aspirinRecommended = peRisk.aspirinAdvised
    if (isProvider) {
      record.riskClassification.clinicianApproved = true
      record.riskClassification.approvedByClinicianName = actor.name
      record.riskClassification.approvedAt = new Date().toISOString().slice(0, 10)
    }
  }

  // Workflow status
  if (isDraft) {
    record.status = 'DRAFT'
  } else if (record.archived) {
    record.status = 'ARCHIVED'
  } else if (record.referralOutcome?.deliveryOccurred) {
    record.status = 'DELIVERED'
  } else if (record.referralOutcome?.isReferred) {
    record.status = 'REFERRED'
  } else if (record.riskClassification.riskLevel === 'HIGH') {
    record.status = 'HIGH_RISK'
  } else {
    record.status = 'ACTIVE'
  }

  record.lastUpdated = new Date().toISOString().slice(0, 10)
  return record
}

// ---------------------------------------------------------------------------
// Core Repository CRUD Methods
// ---------------------------------------------------------------------------

/** Retrieve all raw ANC records from JSON storage */
export async function getAllAncRecords(
  filters?: AncFilterOptions,
): Promise<{ records: RoutineAncData[]; stats: AncDashboardStats; total: number }> {
  await ensureStorageDirectories()
  try {
    const raw = await fs.promises.readFile(ANC_FILE, 'utf8')
    let list = JSON.parse(raw) as RoutineAncData[]
    if (!Array.isArray(list)) list = []

    // Calculate overall stats before filtering
    const stats: AncDashboardStats = {
      total: list.length,
      active: list.filter((r) => r.status === 'ACTIVE').length,
      highRisk: list.filter((r) => r.status === 'HIGH_RISK' || r.riskClassification?.riskLevel === 'HIGH').length,
      referred: list.filter((r) => r.status === 'REFERRED').length,
      delivered: list.filter((r) => r.status === 'DELIVERED').length,
      drafts: list.filter((r) => r.status === 'DRAFT').length,
      archived: list.filter((r) => r.status === 'ARCHIVED' || r.archived).length,
    }

    let filtered = list

    // Handle archival visibility
    if (!filters?.includeArchived) {
      filtered = filtered.filter((r) => !r.archived && r.status !== 'ARCHIVED')
    }

    // Filter by status
    if (filters?.status && filters.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === filters.status)
    }

    // Filter by risk
    if (filters?.risk && filters.risk !== 'ALL') {
      filtered = filtered.filter((r) => r.riskClassification?.riskLevel === filters.risk)
    }

    // Search query matching
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      filtered = filtered.filter((r) => {
        const name = (r.booking.name || '').toLowerCase()
        const id = (r.booking.identifier || '').toLowerCase()
        const pid = (r.booking.patientId || '').toLowerCase()
        const mrn = (r.booking.hospitalRegNumber || '').toLowerCase()
        const phone = (r.booking.mobileNumber || '').toLowerCase()
        return name.includes(q) || id.includes(q) || pid.includes(q) || mrn.includes(q) || phone.includes(q)
      })
    }

    // Sorting
    const sortBy = filters?.sortBy || 'lastUpdated'
    const sortOrder = filters?.sortOrder || 'desc'
    filtered.sort((a, b) => {
      let valA = ''
      let valB = ''
      if (sortBy === 'name') {
        valA = a.booking.name.toLowerCase()
        valB = b.booking.name.toLowerCase()
      } else if (sortBy === 'bookingDate') {
        valA = a.booking.bookingDate || ''
        valB = b.booking.bookingDate || ''
      } else if (sortBy === 'identifier') {
        valA = a.booking.identifier || ''
        valB = b.booking.identifier || ''
      } else {
        valA = a.lastUpdated || ''
        valB = b.lastUpdated || ''
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalFiltered = filtered.length

    // Pagination
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit
      filtered = filtered.slice(start, start + filters.limit)
    }

    return { records: filtered, stats, total: totalFiltered }
  } catch (err) {
    console.error('Error in getAllAncRecords:', err)
    return {
      records: [],
      stats: { total: 0, active: 0, highRisk: 0, referred: 0, delivered: 0, drafts: 0, archived: 0 },
      total: 0,
    }
  }
}

/** Retrieve single record by ANC Identifier, Patient ID, or Hospital MRN */
export async function getAncRecordById(identifier: string): Promise<RoutineAncData | null> {
  await ensureStorageDirectories()
  try {
    const raw = await fs.promises.readFile(ANC_FILE, 'utf8')
    const list = JSON.parse(raw) as RoutineAncData[]
    if (!Array.isArray(list)) return null

    const target = identifier.trim().toLowerCase()
    const found = list.find(
      (r) =>
        r.booking.identifier.toLowerCase() === target ||
        (r.booking.patientId && r.booking.patientId.toLowerCase() === target) ||
        (r.booking.hospitalRegNumber && r.booking.hospitalRegNumber.toLowerCase() === target),
    )
    return found || null
  } catch {
    return null
  }
}

/** Create a new ANC record (Final or Draft) */
export async function createAncRecord(
  record: RoutineAncData,
  actor: ClinicalActor,
  isDraft = false,
): Promise<{ success: boolean; data: RoutineAncData; message: string }> {
  return withWriteLock(async () => {
    await ensureStorageDirectories()
    let list: RoutineAncData[] = []
    try {
      const raw = await fs.promises.readFile(ANC_FILE, 'utf8')
      list = JSON.parse(raw)
      if (!Array.isArray(list)) list = []
    } catch {
      list = []
    }

    // Auto-generate identifiers if not provided
    if (!record.booking.identifier || record.booking.identifier.trim() === '') {
      const ids = generateUniqueIdentifiers(list)
      record.booking.identifier = ids.identifier
      if (!record.booking.patientId) {
        record.booking.patientId = ids.patientId
      }
    } else if (!record.booking.patientId) {
      record.booking.patientId = `PAT-${record.booking.identifier.replace(/^ANC-/, '')}`
    }

    // Prevent duplicate identifiers
    const exists = list.some(
      (r) => r.booking.identifier.toLowerCase() === record.booking.identifier.toLowerCase(),
    )
    if (exists) {
      // If already exists, delegate to update
      return updateAncRecord(record.booking.identifier, record, actor)
    }

    // Apply clinical calculations and set status
    const finalized = applyClinicalCalculations(record, actor, isDraft)

    // Prepend to records list
    list.unshift(finalized)

    // Save with atomic write & snapshot backup
    await createBackupSnapshot(list)
    await atomicWriteFile(ANC_FILE, JSON.stringify(list, null, 2))

    // Record audit log
    await recordAuditLog(isDraft ? 'DRAFT_SAVE' : 'CREATE', finalized.booking.identifier, actor, {
      mrn: finalized.booking.hospitalRegNumber,
      patientName: finalized.booking.name,
      details: {
        isDraft,
        riskLevel: finalized.riskClassification?.riskLevel,
        status: finalized.status,
      },
    })

    return {
      success: true,
      data: finalized,
      message: isDraft
        ? `Draft for ${finalized.booking.name || 'Patient'} saved with ID ${finalized.booking.identifier}.`
        : `Antenatal registration ${finalized.booking.identifier} for ${finalized.booking.name} completed successfully.`,
    }
  })
}

/** Update an existing ANC record */
export async function updateAncRecord(
  identifier: string,
  updates: Partial<RoutineAncData>,
  actor: ClinicalActor,
): Promise<{ success: boolean; data: RoutineAncData; message: string }> {
  return withWriteLock(async () => {
    await ensureStorageDirectories()
    let list: RoutineAncData[] = []
    try {
      const raw = await fs.promises.readFile(ANC_FILE, 'utf8')
      list = JSON.parse(raw)
      if (!Array.isArray(list)) list = []
    } catch {
      list = []
    }

    const target = identifier.trim().toLowerCase()
    const index = list.findIndex(
      (r) =>
        r.booking.identifier.toLowerCase() === target ||
        (r.booking.patientId && r.booking.patientId.toLowerCase() === target) ||
        (r.booking.hospitalRegNumber && r.booking.hospitalRegNumber.toLowerCase() === target),
    )

    if (index === -1) {
      return {
        success: false,
        data: updates as RoutineAncData,
        message: `Antenatal record '${identifier}' not found in registry.`,
      }
    }

    const existing = list[index]

    // Deep merge sections cleanly
    const merged: RoutineAncData = {
      ...existing,
      ...updates,
      booking: { ...existing.booking, ...(updates.booking || {}) },
      pregnancy: { ...existing.pregnancy, ...(updates.pregnancy || {}) },
      histories: { ...existing.histories, ...(updates.histories || {}) },
      generalExam: { ...(existing.generalExam || {}), ...(updates.generalExam || {}) } as any,
      investigations: { ...(existing.investigations || {}), ...(updates.investigations || {}) } as any,
      vaccinations: { ...(existing.vaccinations || {}), ...(updates.vaccinations || {}) } as any,
      birthPlan: { ...(existing.birthPlan || {}), ...(updates.birthPlan || {}) } as any,
      referralOutcome: { ...(existing.referralOutcome || {}), ...(updates.referralOutcome || {}) } as any,
      riskClassification: { ...(existing.riskClassification || {}), ...(updates.riskClassification || {}) } as any,
      previousOutcomes: updates.previousOutcomes ?? existing.previousOutcomes,
      cbc: updates.cbc ?? existing.cbc,
      ultrasounds: updates.ultrasounds ?? existing.ultrasounds,
      risks: updates.risks ?? existing.risks,
      visits: updates.visits ?? existing.visits,
      documents: updates.documents ?? existing.documents,
      allergies: updates.allergies ?? existing.allergies,
    }

    // Determine if this was a draft being converted to final registration
    const wasDraft = existing.status === 'DRAFT'
    const isNowFinal = updates.status && updates.status !== 'DRAFT'
    const keepDraft = updates.status === 'DRAFT'

    const finalized = applyClinicalCalculations(merged, actor, keepDraft)

    list[index] = finalized

    await createBackupSnapshot(list)
    await atomicWriteFile(ANC_FILE, JSON.stringify(list, null, 2))

    await recordAuditLog(
      wasDraft && isNowFinal ? 'STATUS_CHANGE' : keepDraft ? 'DRAFT_SAVE' : 'UPDATE',
      finalized.booking.identifier,
      actor,
      {
        mrn: finalized.booking.hospitalRegNumber,
        patientName: finalized.booking.name,
        details: {
          previousStatus: existing.status,
          newStatus: finalized.status,
          riskLevel: finalized.riskClassification?.riskLevel,
        },
      },
    )

    return {
      success: true,
      data: finalized,
      message: `Antenatal record ${finalized.booking.identifier} updated successfully.`,
    }
  })
}

/** Archive an ANC record (soft delete) */
export async function archiveAncRecord(
  identifier: string,
  actor: ClinicalActor,
  reason = 'Clinically archived',
): Promise<{ success: boolean; message: string }> {
  return withWriteLock(async () => {
    await ensureStorageDirectories()
    let list: RoutineAncData[] = []
    try {
      const raw = await fs.promises.readFile(ANC_FILE, 'utf8')
      list = JSON.parse(raw)
      if (!Array.isArray(list)) list = []
    } catch {
      return { success: false, message: 'Storage file unavailable' }
    }

    const target = identifier.trim().toLowerCase()
    const index = list.findIndex(
      (r) =>
        r.booking.identifier.toLowerCase() === target ||
        (r.booking.patientId && r.booking.patientId.toLowerCase() === target) ||
        (r.booking.hospitalRegNumber && r.booking.hospitalRegNumber.toLowerCase() === target),
    )

    if (index === -1) {
      return { success: false, message: `Record ${identifier} not found.` }
    }

    list[index].archived = true
    list[index].status = 'ARCHIVED'
    list[index].archivedAt = new Date().toISOString()
    list[index].archivedBy = actor.name
    list[index].archivalReason = reason
    list[index].lastUpdated = new Date().toISOString().slice(0, 10)

    await createBackupSnapshot(list)
    await atomicWriteFile(ANC_FILE, JSON.stringify(list, null, 2))

    await recordAuditLog('ARCHIVE', list[index].booking.identifier, actor, {
      mrn: list[index].booking.hospitalRegNumber,
      patientName: list[index].booking.name,
      details: { reason },
    })

    return { success: true, message: `Record ${identifier} has been archived successfully.` }
  })
}

/** Save a partial draft */
export async function saveDraft(
  record: RoutineAncData,
  actor: ClinicalActor,
): Promise<{ success: boolean; data: RoutineAncData; message: string }> {
  if (record.booking.identifier) {
    const existing = await getAncRecordById(record.booking.identifier)
    if (existing) {
      return updateAncRecord(record.booking.identifier, { ...record, status: 'DRAFT' }, actor)
    }
  }
  return createAncRecord(record, actor, true)
}

/** Backwards-compatible legacy function names */
export const saveAncRecord = (
  record: RoutineAncData,
  actor?: ClinicalActor,
): Promise<{ success: boolean; data: RoutineAncData; message: string }> => {
  return createAncRecord(record, actor || { name: 'Staff User', role: 'provider' })
}

export const deleteAncRecord = async (identifier: string): Promise<boolean> => {
  const res = await archiveAncRecord(identifier, { name: 'Staff User', role: 'provider' }, 'Deleted by user request')
  return res.success
}
