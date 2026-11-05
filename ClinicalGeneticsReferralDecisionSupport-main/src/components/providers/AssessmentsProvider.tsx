'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Priority = 'routine' | 'priority' | 'urgent'
export type SavedAssessment = {
  id: string
  slug: string
  title: string
  patientId: string
  priority: Priority
  notes: string
  summary: string
  date: string
  seed?: boolean
}
const seed = (
  id: string,
  slug: string,
  title: string,
  patientId: string,
  priority: Priority,
  date: string,
): SavedAssessment => ({
  id,
  slug,
  title,
  patientId,
  priority,
  date,
  seed: true,
  notes: 'Simulated example entry for interface demonstration.',
  summary: `SIMULATED EXAMPLE — NOT A CLINICAL RECORD\nPathway: ${title}\nSimulated patient: ${patientId}\nClinician-selected priority: ${priority}`,
})
const SEEDS = [
  seed(
    'SIM-1',
    'hereditary-cancer-risk',
    'Hereditary Cancer Risk',
    'OB-002',
    'routine',
    '2025-03-04',
  ),
  seed(
    'SIM-2',
    'prenatal-screening-diagnostic-testing',
    'Prenatal Screening & Diagnostic Testing',
    'OB-003',
    'urgent',
    '2025-03-06',
  ),
  seed(
    'SIM-3',
    'preconception-carrier-screening',
    'Preconception Carrier Screening',
    'OB-001',
    'priority',
    '2025-03-11',
  ),
  seed(
    'SIM-4',
    'fetal-anomalies-ultrasound',
    'Fetal Anomalies & Ultrasound Findings',
    'OB-004',
    'priority',
    '2025-03-14',
  ),
]
type Ctx = {
  items: SavedAssessment[]
  add: (a: Omit<SavedAssessment, 'id' | 'date'>) => void
  remove: (id: string) => void
  patientId: string
  setPatientId: (id: string) => void
}
const C = createContext<Ctx | null>(null)
export const useAssessments = () => {
  const v = useContext(C)
  if (!v) throw new Error('AssessmentsProvider missing')
  return v
}

export default function AssessmentsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedAssessment[]>([])
  const [patientId, setPatient] = useState('OB-001')
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem('helix-sim-assessments') || '[]'))
      setPatient(localStorage.getItem('helix-sim-patient') || 'OB-001')
    } catch {
      /* ignore corrupt simulated storage */
    }
  }, [])
  const persist = (next: SavedAssessment[]) => {
    setSaved(next)
    localStorage.setItem('helix-sim-assessments', JSON.stringify(next))
  }
  const add = useCallback(
    (a: Omit<SavedAssessment, 'id' | 'date'>) =>
      persist([
        { ...a, id: `SIM-${Date.now().toString(36)}`, date: new Date().toISOString().slice(0, 10) },
        ...saved,
      ]),
    [saved],
  )
  const remove = useCallback((id: string) => persist(saved.filter((s) => s.id !== id)), [saved])
  const setPatientId = (id: string) => {
    setPatient(id)
    localStorage.setItem('helix-sim-patient', id)
  }
  const value = useMemo(
    () => ({
      items: [...saved, ...SEEDS].sort((a, b) => b.date.localeCompare(a.date)),
      add,
      remove,
      patientId,
      setPatientId,
    }),
    [saved, add, remove, patientId],
  )
  return <C.Provider value={value}>{children}</C.Provider>
}
