'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  FileCode,
  FileText,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  Plus,
  Printer,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type {
  FamilyMember,
  FamilyRelationship,
  GeneticStatus,
  PedigreeConditionItem,
  PedigreeDataModel,
} from '@/components/clinical/pedigree-model'

// ---------------------------------------------------------------------------
// Constants & Options
// ---------------------------------------------------------------------------
export const PRESET_RELATIONS = [
  { key: 'father', label: 'Father', sex: 'M' as const, generation: 2 },
  { key: 'mother', label: 'Mother', sex: 'F' as const, generation: 2 },
  { key: 'paternal_grandfather', label: 'Paternal Grandfather', sex: 'M' as const, generation: 1 },
  { key: 'paternal_grandmother', label: 'Paternal Grandmother', sex: 'F' as const, generation: 1 },
  { key: 'maternal_grandfather', label: 'Maternal Grandfather', sex: 'M' as const, generation: 1 },
  { key: 'maternal_grandmother', label: 'Maternal Grandmother', sex: 'F' as const, generation: 1 },
  { key: 'brother', label: 'Brother', sex: 'M' as const, generation: 3 },
  { key: 'sister', label: 'Sister', sex: 'F' as const, generation: 3 },
  { key: 'sibling_u', label: 'Sibling (Unknown Sex)', sex: 'U' as const, generation: 3 },
  { key: 'son', label: 'Son', sex: 'M' as const, generation: 4 },
  { key: 'daughter', label: 'Daughter', sex: 'F' as const, generation: 4 },
  { key: 'child_u', label: 'Child (Unknown Sex)', sex: 'U' as const, generation: 4 },
  { key: 'paternal_uncle', label: 'Paternal Uncle', sex: 'M' as const, generation: 2 },
  { key: 'paternal_aunt', label: 'Paternal Aunt', sex: 'F' as const, generation: 2 },
  { key: 'maternal_uncle', label: 'Maternal Uncle', sex: 'M' as const, generation: 2 },
  { key: 'maternal_aunt', label: 'Maternal Aunt', sex: 'F' as const, generation: 2 },
  { key: 'paternal_cousin', label: 'Paternal Cousin', sex: 'U' as const, generation: 3 },
  { key: 'maternal_cousin', label: 'Maternal Cousin', sex: 'U' as const, generation: 3 },
  { key: 'half_brother', label: 'Half-Brother', sex: 'M' as const, generation: 3 },
  { key: 'half_sister', label: 'Half-Sister', sex: 'F' as const, generation: 3 },
  { key: 'partner', label: 'Spouse / Partner', sex: 'M' as const, generation: 3 },
  { key: 'other', label: 'Additional Relative', sex: 'U' as const, generation: 3 },
]

export const GENETIC_STATUS_OPTIONS: { value: GeneticStatus; label: string; desc: string }[] = [
  { value: 'unaffected', label: 'Unaffected', desc: 'No reported clinical disease or carrier status' },
  { value: 'affected', label: 'Affected', desc: 'Diagnosed with the genetic condition or phenotype' },
  { value: 'carrier', label: 'Carrier (Obligate / Confirmed)', desc: 'Confirmed heterozygous gene carrier' },
  { value: 'suspected_carrier', label: 'Suspected Carrier', desc: 'Pending molecular test or pedigree inference' },
  { value: 'unknown', label: 'Unknown Status', desc: 'Status unverified or pedigree info unavailable' },
  { value: 'not_assessed', label: 'Not Assessed', desc: 'Not yet clinically evaluated' },
]

export const COMMON_CONDITIONS = [
  'Breast Cancer',
  'Ovarian Cancer',
  'Colorectal / Lynch Syndrome',
  'Endometrial Cancer',
  'Beta-Thalassemia',
  'Sickle Cell Anemia',
  'Cystic Fibrosis',
  'Spinal Muscular Atrophy (SMA)',
  'Fragile X Syndrome',
  'Hemophilia A / B',
  'Huntington Disease',
  'Hypertrophic Cardiomyopathy',
  'Marfan Syndrome',
  'Polycystic Kidney Disease (PKD)',
  'Neurofibromatosis Type 1',
]

export const ANCESTRY_OPTIONS = [
  'Ashkenazi Jewish',
  'South Asian / Indian',
  'Mediterranean',
  'African / African-American',
  'European (Northern / Western)',
  'East Asian',
  'Southeast Asian',
  'Hispanic / Latino',
  'Middle Eastern',
  'Indigenous / Native',
]

const FIRST_DEGREE = new Set(['father', 'mother', 'brother', 'sister', 'sibling', 'child', 'son', 'daughter'])
const SECOND_DEGREE = new Set([
  'paternal_grandfather',
  'paternal_grandmother',
  'maternal_grandfather',
  'maternal_grandmother',
  'paternal_uncle',
  'paternal_aunt',
  'maternal_uncle',
  'maternal_aunt',
  'paternal_uncle_aunt',
  'maternal_uncle_aunt',
  'half_brother',
  'half_sister',
  'half_sibling',
])

export function deriveFeatures(pedigree: any) {
  if (!pedigree) return {}
  const members = pedigree.members || []
  const nonProband = members.filter((m: any) => !m.isProband && m.relation !== 'proband')
  const firstDegree = members.filter((m: any) => FIRST_DEGREE.has(m.relation))
  const secondDegree = members.filter((m: any) => SECOND_DEGREE.has(m.relation))

  const hasCond = (m: any, term: string) => {
    const isAff = m.geneticStatus === 'affected' || Boolean(m.affected)
    return isAff && (m.conditions || []).some((c: any) => {
      const name = typeof c === 'string' ? c : c.name || ''
      return name.toLowerCase().includes(term.toLowerCase())
    })
  }

  const breastFirst = firstDegree.filter((m: any) => hasCond(m, 'breast')).length
  const ovarianAny = nonProband.filter((m: any) => hasCond(m, 'ovarian')).length
  const colonAny = nonProband.filter((m: any) => hasCond(m, 'colon') || hasCond(m, 'colorectal') || hasCond(m, 'lynch')).length
  const maleBreast = nonProband.some((m: any) => m.sex === 'M' && hasCond(m, 'breast'))
  const familyRecessive = nonProband.some((m: any) => hasCond(m, 'recessive') || hasCond(m, 'thalassemia') || hasCond(m, 'sickle') || hasCond(m, 'cystic'))

  const firstDegreeAffected = firstDegree.filter((m: any) => m.geneticStatus === 'affected' || m.affected)
  const secondDegreeAffected = secondDegree.filter((m: any) => m.geneticStatus === 'affected' || m.affected)
  const totalAffected = nonProband.filter((m: any) => m.geneticStatus === 'affected' || m.affected).length

  let closest: 'first' | 'second' | null = null
  if (firstDegreeAffected.length > 0) closest = 'first'
  else if (secondDegreeAffected.length > 0) closest = 'second'

  const ancestries = [...(pedigree.ancestries || [])]
  if (pedigree.ashkenazi_ancestry && !ancestries.includes('ashkenazi')) {
    ancestries.push('ashkenazi')
  }

  return {
    family_breast_cancer_first_degree_count: breastFirst,
    family_ovarian_cancer_count: ovarianAny,
    family_colon_cancer_count: colonAny,
    male_breast_cancer_family: maleBreast,
    ashkenazi_ancestry: Boolean(pedigree.ashkenazi_ancestry || ancestries.some((a: string) => a.toLowerCase().includes('ashkenazi'))),
    consanguinity: Boolean(pedigree.consanguinity),
    ancestries,
    family_history_recessive_condition: familyRecessive,
    multiple_affected: totalAffected >= 2,
    closest_affected_degree: closest,
    total_affected: totalAffected,
  }
}

function uid(prefix = 'm'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// ---------------------------------------------------------------------------
// Default Starting Pedigree (Fully dynamic, all members removable/editable)
// ---------------------------------------------------------------------------
function createDefaultPedigree(): PedigreeDataModel {
  const pgfId = uid('pgf')
  const pgmId = uid('pgm')
  const mgfId = uid('mgf')
  const mgmId = uid('mgm')
  const fatherId = uid('fat')
  const motherId = uid('mot')
  const probandId = uid('prob')
  const partnerId = uid('part')
  const childId = uid('chld')

  const members: FamilyMember[] = [
    // Generation 1: Grandparents
    {
      id: pgfId,
      name: 'Paternal Grandfather',
      relation: 'paternal_grandfather',
      generation: 1,
      sex: 'M',
      age: 78,
      deceased: true,
      ageAtDeath: 76,
      causeOfDeath: 'Natural causes',
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
      age: 74,
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
      age: 80,
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
      age: 77,
      deceased: true,
      ageAtDeath: 68,
      causeOfDeath: 'Ovarian malignancy',
      geneticStatus: 'affected',
      isProband: false,
      isConsultand: false,
      notes: 'Diagnosed at age 65',
      conditions: [{ id: uid('c'), name: 'Ovarian Cancer', status: 'affected', ageAtDiagnosis: 65 }],
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
      age: 52,
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
      age: 50,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'carrier',
      isProband: false,
      isConsultand: false,
      notes: 'Carrier of BRCA1 pathogenic variant',
      conditions: [{ id: uid('c'), name: 'Breast Cancer', status: 'carrier', notes: 'Heterozygous' }],
      parentIds: [mgfId, mgmId],
      partnerIds: [fatherId],
      childrenIds: [probandId],
    },

    // Generation 3: Proband & Partner
    {
      id: probandId,
      name: 'Proband (Patient)',
      relation: 'proband',
      generation: 3,
      sex: 'F',
      age: 28,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'suspected_carrier',
      isProband: true,
      isConsultand: true,
      notes: 'Consulting for preconception genetic risk assessment',
      conditions: [],
      parentIds: [fatherId, motherId],
      partnerIds: [partnerId],
      childrenIds: [childId],
    },
    {
      id: partnerId,
      name: 'Partner / Spouse',
      relation: 'partner',
      generation: 3,
      sex: 'M',
      age: 30,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: '',
      conditions: [],
      parentIds: [],
      partnerIds: [probandId],
      childrenIds: [childId],
    },

    // Generation 4: Child
    {
      id: childId,
      name: 'Child 1',
      relation: 'child_u',
      generation: 4,
      sex: 'U',
      age: 2,
      deceased: false,
      ageAtDeath: null,
      geneticStatus: 'unknown',
      isProband: false,
      isConsultand: false,
      notes: 'Routine pediatric monitoring',
      conditions: [],
      parentIds: [probandId, partnerId],
      partnerIds: [],
      childrenIds: [],
    },
  ]

  const relationships: FamilyRelationship[] = [
    { id: uid('r'), type: 'partner', members: [pgfId, pgmId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [mgfId, mgmId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [fatherId, motherId], consanguineous: false },
    { id: uid('r'), type: 'partner', members: [probandId, partnerId], consanguineous: false },
  ]

  return {
    id: uid('ped'),
    title: 'Multi-Generation Clinical Pedigree',
    version: 2,
    consanguinity: false,
    ancestries: ['South Asian / Indian'],
    notes: 'Pedigree intake performed at point-of-care. All 4 generations mapped with genetic status.',
    members,
    relationships,
    canvasLayout: { zoom: 1, panX: 0, panY: 0 },
    summary: {
      totalMembers: members.length,
      numGenerations: 4,
      affectedCount: 1,
      carrierCount: 2,
      unknownCount: 1,
    },
  }
}

// ---------------------------------------------------------------------------
// Main Pedigree Studio Client Component
// ---------------------------------------------------------------------------
export default function PedigreeStudioClient({
  userName,
  userRole,
}: {
  userName: string
  userRole: string
}) {
  const [pedigree, setPedigree] = useState<PedigreeDataModel>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('genobridge_pedigree_v2')
        if (local) return JSON.parse(local)
      } catch {}
    }
    return createDefaultPedigree()
  })

  // Undo / Redo stacks
  const [past, setPast] = useState<PedigreeDataModel[]>([])
  const [future, setFuture] = useState<PedigreeDataModel[]>([])

  // Selection & Editor state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<FamilyMember | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Commit mutation with Undo history
  const commitMutation = useCallback(
    (updater: (prev: PedigreeDataModel) => PedigreeDataModel) => {
      setPedigree((prev) => {
        const next = updater(prev)
        setPast((p) => [...p.slice(-25), prev])
        setFuture([])
        if (typeof window !== 'undefined') {
          localStorage.setItem('genobridge_pedigree_v2', JSON.stringify(next))
        }
        return next
      })
    },
    [],
  )

  const undo = () => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setFuture((f) => [pedigree, ...f])
    setPast((p) => p.slice(0, -1))
    setPedigree(prev)
    if (typeof window !== 'undefined') {
      localStorage.setItem('genobridge_pedigree_v2', JSON.stringify(prev))
    }
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[0]
    setPast((p) => [...p, pedigree])
    setFuture((f) => f.slice(1))
    setPedigree(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('genobridge_pedigree_v2', JSON.stringify(next))
    }
  }

  // Load from Neon PostgreSQL on initial mount
  useEffect(() => {
    async function loadDatabasePedigree() {
      try {
        const res = await fetch('/api/pedigree')
        if (res.ok) {
          const json = await res.json()
          if (json?.pedigree?.members && json.pedigree.members.length > 0) {
            setPedigree(json.pedigree)
            if (typeof window !== 'undefined') {
              localStorage.setItem('genobridge_pedigree_v2', JSON.stringify(json.pedigree))
            }
          }
        }
      } catch (err) {
        console.warn('Could not load pedigree from server, using local buffer:', err)
      }
    }
    loadDatabasePedigree()
  }, [])

  // Save to database
  const saveToDatabase = async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/pedigree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedigree),
      })
      if (!res.ok) throw new Error('Server returned ' + res.status)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to save pedigree to DB:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }

  // Descriptive Summary Metrics
  const summary = useMemo(() => {
    const total = pedigree.members.length
    const gens = new Set(pedigree.members.map((m) => m.generation))
    const affected = pedigree.members.filter((m) => m.geneticStatus === 'affected').length
    const carrier = pedigree.members.filter(
      (m) => m.geneticStatus === 'carrier' || m.geneticStatus === 'suspected_carrier',
    ).length
    const unknown = pedigree.members.filter(
      (m) => m.geneticStatus === 'unknown' || m.geneticStatus === 'not_assessed',
    ).length
    const deceased = pedigree.members.filter((m) => m.deceased).length
    return {
      total,
      generations: gens.size || 1,
      affected,
      carrier,
      unknown,
      deceased,
    }
  }, [pedigree.members])

  // Selected member object
  const selectedMember = useMemo(
    () => pedigree.members.find((m) => m.id === selectedMemberId) || null,
    [pedigree.members, selectedMemberId],
  )

  // Filtered member list for Table/Cards
  const filteredMembers = useMemo(() => {
    return pedigree.members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.relation.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.conditions.some((c) => c.name.toLowerCase().includes(searchFilter.toLowerCase()))
      if (!matchesSearch) return false
      if (statusFilter === 'all') return true
      if (statusFilter === 'affected') return m.geneticStatus === 'affected'
      if (statusFilter === 'carrier')
        return m.geneticStatus === 'carrier' || m.geneticStatus === 'suspected_carrier'
      if (statusFilter === 'deceased') return m.deceased
      return true
    })
  }, [pedigree.members, searchFilter, statusFilter])

  // Handle Add Member
  const handleAddMember = (newMem: Partial<FamilyMember>) => {
    const memberId = uid('m')
    const created: FamilyMember = {
      id: memberId,
      name: newMem.name || 'Unnamed Relative',
      relation: newMem.relation || 'other',
      generation: newMem.generation || 3,
      sex: newMem.sex || 'U',
      age: newMem.age ?? null,
      dob: newMem.dob || null,
      deceased: Boolean(newMem.deceased),
      ageAtDeath: newMem.ageAtDeath ?? null,
      causeOfDeath: newMem.causeOfDeath || '',
      geneticStatus: newMem.geneticStatus || 'unaffected',
      isProband: false,
      isConsultand: false,
      notes: newMem.notes || '',
      conditions: newMem.conditions || [],
      parentIds: newMem.parentIds || [],
      partnerIds: newMem.partnerIds || [],
      childrenIds: newMem.childrenIds || [],
      canvasX: null,
      canvasY: null,
    }

    commitMutation((prev) => {
      // Connect reciprocally
      const updatedMembers = prev.members.map((m) => {
        let updated = { ...m }
        if (created.parentIds.includes(m.id)) {
          updated = { ...updated, childrenIds: Array.from(new Set([...updated.childrenIds, created.id])) }
        }
        if (created.partnerIds.includes(m.id)) {
          updated = { ...updated, partnerIds: Array.from(new Set([...updated.partnerIds, created.id])) }
        }
        if (created.childrenIds.includes(m.id)) {
          updated = { ...updated, parentIds: Array.from(new Set([...updated.parentIds, created.id])) }
        }
        return updated
      })
      return {
        ...prev,
        members: [...updatedMembers, created],
      }
    })

    setSelectedMemberId(created.id)
    setIsAddModalOpen(false)
  }

  // Handle Update Member
  const handleUpdateMember = (id: string, patch: Partial<FamilyMember>) => {
    commitMutation((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }

  // Handle Delete Member Confirmation
  const confirmDeleteMember = (member: FamilyMember) => {
    setDeleteConfirmMember(member)
  }

  const executeDeleteMember = () => {
    if (!deleteConfirmMember) return
    const targetId = deleteConfirmMember.id

    commitMutation((prev) => {
      // Remove target and clean up references from other members
      const cleaned = prev.members
        .filter((m) => m.id !== targetId)
        .map((m) => ({
          ...m,
          parentIds: m.parentIds.filter((pid) => pid !== targetId),
          partnerIds: m.partnerIds.filter((pid) => pid !== targetId),
          childrenIds: m.childrenIds.filter((cid) => cid !== targetId),
        }))

      // Clean up relationships
      const cleanedRelationships = prev.relationships.filter(
        (r) => !r.members.includes(targetId),
      )

      return {
        ...prev,
        members: cleaned,
        relationships: cleanedRelationships,
      }
    })

    if (selectedMemberId === targetId) {
      setSelectedMemberId(null)
      setIsDetailDrawerOpen(false)
    }
    setDeleteConfirmMember(null)
  }

  // Auto Layout calculation
  const autoLayout = () => {
    commitMutation((prev) => {
      const reset = prev.members.map((m) => ({ ...m, canvasX: null, canvasY: null }))
      return { ...prev, members: reset }
    })
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  // Export as SVG
  const exportAsSvg = () => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svgRef.current)
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `GenoBridge_Pedigree_${new Date().toISOString().slice(0, 10)}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export as PNG
  const exportAsPng = () => {
    if (!svgRef.current) return
    const svgElement = svgRef.current
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgElement)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const URLObject = window.URL || window.webkitURL || window
    const blobURL = URLObject.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1000
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `GenoBridge_Pedigree_${new Date().toISOString().slice(0, 10)}.png`
        downloadLink.click()
      }
      URLObject.revokeObjectURL(blobURL)
    }
    img.src = blobURL
  }

  // Export JSON Bundle
  const exportAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pedigree, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `GenoBridge_Pedigree_Bundle_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import JSON Bundle
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (parsed.members && Array.isArray(parsed.members)) {
          commitMutation(() => ({
            ...parsed,
            id: parsed.id || uid('ped'),
          }))
          alert('Pedigree imported successfully.')
        } else {
          alert('Invalid pedigree JSON format.')
        }
      } catch (err) {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }

  // Print Pedigree
  const printPedigree = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 bg-white text-slate-900 print:p-0">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase font-bold text-slate-500">
            <Layers size={14} className="text-slate-900" />
            <span>Interactive Genetic Pedigree Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Family History &amp; Pedigree Chart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic multigenerational pedigree editor with standard genetic symbols (ACMG/NSGC) and database persistence.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="p-1.5 rounded text-slate-700 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 rounded text-slate-700 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add Family Member</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 hidden group-hover:block z-50">
              <button
                type="button"
                onClick={exportAsSvg}
                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <FileCode size={13} /> Export Vector SVG
              </button>
              <button
                type="button"
                onClick={exportAsPng}
                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <FileText size={13} /> Export High-Res PNG
              </button>
              <button
                type="button"
                onClick={printPedigree}
                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Printer size={13} /> Print Pedigree
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={exportAsJson}
                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Download size={13} /> Export JSON Data
              </button>
              <label className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer">
                <Upload size={13} /> Import JSON Data
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>

          {/* Save to PostgreSQL */}
          <button
            type="button"
            onClick={saveToDatabase}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving to Database…</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Saved to Database!</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <ShieldAlert size={14} className="text-rose-400" />
                <span>Save Error</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Pedigree</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Descriptive Pedigree Summary Metrics (Phase 7A) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Total Members</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.total}</div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Generations</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.generations}</div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Affected</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.affected}</div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Carriers</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.carrier}</div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Unknown Status</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.unknown}</div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-[11px] font-mono uppercase text-slate-500">Deceased</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary.deceased}</div>
        </div>
      </div>

      {/* 3. Interactive SVG Pedigree Live Canvas (Phase 5 & 6) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              Interactive Canvas View
            </span>
            <span className="text-[11px] text-slate-500">
              Drag symbols to reposition · Click symbol to select &amp; edit
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <span className="text-xs font-mono text-slate-600 px-1">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={autoLayout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-1"
              title="Reset Zoom & Auto Layout"
            >
              <RotateCcw size={12} />
              <span>Auto Layout</span>
            </button>
          </div>
        </div>

        {/* SVG Viewport */}
        <div
          className="relative bg-white min-h-[440px] select-none cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
              setIsPanning(true)
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
            }
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
            } else if (isDraggingNode) {
              const rect = svgRef.current?.getBoundingClientRect()
              if (!rect) return
              const rawX = (e.clientX - rect.left - pan.x) / zoom
              const rawY = (e.clientY - rect.top - pan.y) / zoom
              handleUpdateMember(isDraggingNode, { canvasX: Math.round(rawX), canvasY: Math.round(rawY) })
            }
          }}
          onMouseUp={() => {
            setIsPanning(false)
            setIsDraggingNode(null)
          }}
        >
          <PedigreeSvgCanvas
            ref={svgRef}
            pedigree={pedigree}
            zoom={zoom}
            pan={pan}
            selectedMemberId={selectedMemberId}
            onSelectMember={(id) => {
              setSelectedMemberId(id)
              setIsDetailDrawerOpen(true)
            }}
            onStartDragNode={(id) => setIsDraggingNode(id)}
          />
        </div>

        {/* Visible Legend (Phase 3) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px] text-slate-700">
          <div className="font-mono font-bold uppercase tracking-wider text-slate-500">
            Pedigree Legend:
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-slate-900 bg-white inline-block" />
            <span>Male</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-slate-900 rounded-full bg-white inline-block" />
            <span>Female</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-slate-900 rotate-45 bg-white inline-block" />
            <span>Unknown Sex</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-slate-900 inline-block" />
            <span>Affected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border border-slate-900 inline-flex overflow-hidden">
              <span className="w-1/2 h-full bg-slate-900" />
              <span className="w-1/2 h-full bg-white" />
            </span>
            <span>Carrier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border border-dashed border-slate-900 inline-flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </span>
            <span>Suspected Carrier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border border-slate-900 font-bold inline-flex items-center justify-center text-[9px]">
              ?
            </span>
            <span>Unknown Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative w-3.5 h-3.5 border border-slate-900 inline-block">
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-slate-900 -rotate-45" />
            </span>
            <span>Deceased (Slash)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">P ↗</span>
            <span>Proband</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="border-b-2 border-t-2 border-slate-900 w-4 h-1 inline-block" />
            <span>Consanguineous Union</span>
          </div>
        </div>
      </div>

      {/* 4. Pedigree-Level Factors (Phase 8) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Pedigree-Level Factors &amp; Ancestry
          </div>
          <span className="text-[11px] text-slate-500">Non-inferred clinical documentation</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Consanguinity Toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Consanguineous Partnership</span>
              <span className="text-[11px] text-slate-500">
                Biological relationship between parents (renders double marriage line on canvas)
              </span>
            </div>
            <input
              type="checkbox"
              checked={pedigree.consanguinity}
              onChange={(e) => commitMutation((p) => ({ ...p, consanguinity: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
            />
          </label>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Family History Clinical Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Maternal ovarian cancer cluster; documented cascade testing..."
              value={pedigree.notes}
              onChange={(e) => commitMutation((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Ancestries Chips */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-2">
            Reported Ancestries
          </label>
          <div className="flex flex-wrap gap-2">
            {ANCESTRY_OPTIONS.map((anc) => {
              const active = pedigree.ancestries.includes(anc)
              return (
                <button
                  key={anc}
                  type="button"
                  onClick={() => {
                    const set = new Set(pedigree.ancestries)
                    if (set.has(anc)) set.delete(anc)
                    else set.add(anc)
                    commitMutation((p) => ({ ...p, ancestries: Array.from(set) }))
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {anc}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. Family Member List & Card Grid (Phase 7B) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-900" />
            <h2 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              Family Members ({pedigree.members.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member / condition..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="all">All Members</option>
              <option value="affected">Affected Only</option>
              <option value="carrier">Carriers Only</option>
              <option value="deceased">Deceased Only</option>
            </select>

            {/* Add Member Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((m) => {
            const isSelected = m.id === selectedMemberId
            return (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMemberId(m.id)
                  setIsDetailDrawerOpen(true)
                }}
                className={`rounded-xl border p-4 transition shadow-xs cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : m.geneticStatus === 'affected'
                    ? 'border-slate-800 bg-slate-50/80 hover:border-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Visual Sex Symbol */}
                    <span className="shrink-0">
                      {m.sex === 'M' ? (
                        <span className={`w-4 h-4 border-2 border-slate-900 inline-block ${m.geneticStatus === 'affected' ? 'bg-slate-900' : 'bg-white'}`} />
                      ) : m.sex === 'F' ? (
                        <span className={`w-4 h-4 border-2 border-slate-900 rounded-full inline-block ${m.geneticStatus === 'affected' ? 'bg-slate-900' : 'bg-white'}`} />
                      ) : (
                        <span className={`w-3.5 h-3.5 border-2 border-slate-900 rotate-45 inline-block ${m.geneticStatus === 'affected' ? 'bg-slate-900' : 'bg-white'}`} />
                      )}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.isProband && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-900 text-white">
                            PROBAND
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        Gen {m.generation} · {m.relation.replace(/_/g, ' ')} {m.age ? `(${m.age}y)` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(m.id)
                        setIsDetailDrawerOpen(true)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit member"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteMember(m)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      m.geneticStatus === 'affected'
                        ? 'bg-slate-900 text-white'
                        : m.geneticStatus === 'carrier'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : m.geneticStatus === 'suspected_carrier'
                        ? 'bg-amber-50 text-amber-800 border border-dashed border-amber-300'
                        : m.geneticStatus === 'unknown'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.geneticStatus.toUpperCase().replace('_', ' ')}
                  </span>

                  {m.deceased && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                      DECEASED {m.ageAtDeath ? `(d. ${m.ageAtDeath}y)` : ''}
                    </span>
                  )}

                  {m.conditions.map((c) => (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                    >
                      {c.name} {c.ageAtDiagnosis ? `(${c.ageAtDiagnosis}y)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. Add Family Member Modal (Phase 2 & 7C) */}
      {isAddModalOpen && (
        <AddMemberModal
          members={pedigree.members}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMember}
        />
      )}

      {/* 7. Member Detail / Edit Drawer (Phase 2 & 7D) */}
      {isDetailDrawerOpen && selectedMember && (
        <MemberDetailDrawer
          member={selectedMember}
          allMembers={pedigree.members}
          onClose={() => setIsDetailDrawerOpen(false)}
          onUpdate={(patch) => handleUpdateMember(selectedMember.id, patch)}
          onDelete={() => confirmDeleteMember(selectedMember)}
        />
      )}

      {/* 8. Delete Confirmation Modal (Phase 2) */}
      {deleteConfirmMember && (
        <DeleteConfirmModal
          member={deleteConfirmMember}
          allMembers={pedigree.members}
          onCancel={() => setDeleteConfirmMember(null)}
          onConfirm={executeDeleteMember}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SVG Canvas Component (Calculates Tree Layout, Renders Standard Symbols)
// ---------------------------------------------------------------------------
const PedigreeSvgCanvas = React.forwardRef<
  SVGSVGElement,
  {
    pedigree: PedigreeDataModel
    zoom: number
    pan: { x: number; y: number }
    selectedMemberId: string | null
    onSelectMember: (id: string) => void
    onStartDragNode: (id: string) => void
  }
>(function PedigreeSvgCanvas(
  { pedigree, zoom, pan, selectedMemberId, onSelectMember, onStartDragNode },
  ref,
) {
  // Compute positions by generation
  const layout = useMemo(() => {
    const W = 1200
    const genYMap: Record<number, number> = {
      1: 80,
      2: 210,
      3: 350,
      4: 490,
      5: 630,
    }

    // Group members by generation
    const byGen = new Map<number, FamilyMember[]>()
    for (const m of pedigree.members) {
      const g = m.generation || 1
      if (!byGen.has(g)) byGen.set(g, [])
      byGen.get(g)!.push(m)
    }

    // Node coordinate map
    const nodeCoords = new Map<string, { x: number; y: number }>()

    // Sort generations
    const sortedGens = Array.from(byGen.keys()).sort((a, b) => a - b)
    for (const g of sortedGens) {
      const row = byGen.get(g)!
      const y = genYMap[g] || (g * 140)
      const count = row.length
      const spacing = Math.max(120, Math.min(220, (W - 160) / (count + 1)))
      const startX = (W - (count - 1) * spacing) / 2

      row.forEach((m, idx) => {
        // Use user-dragged coordinates if present, otherwise auto-calculate
        const x = typeof m.canvasX === 'number' ? m.canvasX : startX + idx * spacing
        const finalY = typeof m.canvasY === 'number' ? m.canvasY : y
        nodeCoords.set(m.id, { x, y: finalY })
      })
    }

    // Generate relationship lines
    const partnerLines: { id: string; x1: number; y1: number; x2: number; y2: number; consanguineous: boolean }[] = []
    const parentChildTrees: {
      key: string
      topX: number
      topY: number
      dropY: number
      childDrops: { x: number; y: number }[]
    }[] = []

    // 1. Partner Lines
    const processedPairs = new Set<string>()
    for (const m of pedigree.members) {
      for (const pid of m.partnerIds) {
        const pairKey = [m.id, pid].sort().join('--')
        if (processedPairs.has(pairKey)) continue
        processedPairs.add(pairKey)

        const c1 = nodeCoords.get(m.id)
        const c2 = nodeCoords.get(pid)
        if (c1 && c2) {
          const isConsanguineous = Boolean(pedigree.consanguinity)
          partnerLines.push({
            id: pairKey,
            x1: Math.min(c1.x, c2.x) + 16,
            y1: c1.y,
            x2: Math.max(c1.x, c2.x) - 16,
            y2: c2.y,
            consanguineous: isConsanguineous,
          })

          // Children from this couple
          const sharedKids = pedigree.members.filter(
            (k) => k.parentIds.includes(m.id) && k.parentIds.includes(pid),
          )
          if (sharedKids.length > 0) {
            const midX = (c1.x + c2.x) / 2
            const dropY = Math.min(c1.y, c2.y) + 55
            const childDrops = sharedKids
              .map((k) => nodeCoords.get(k.id))
              .filter(Boolean) as { x: number; y: number }[]

            parentChildTrees.push({
              key: `tree_${pairKey}`,
              topX: midX,
              topY: Math.min(c1.y, c2.y),
              dropY,
              childDrops,
            })
          }
        }
      }
    }

    // 2. Single-parent child trees (e.g. only 1 parent recorded)
    for (const m of pedigree.members) {
      if (m.parentIds.length === 1) {
        const parentId = m.parentIds[0]
        const parentCoord = nodeCoords.get(parentId)
        const childCoord = nodeCoords.get(m.id)
        if (parentCoord && childCoord) {
          // Add drop directly from single parent
          parentChildTrees.push({
            key: `single_${parentId}_${m.id}`,
            topX: parentCoord.x,
            topY: parentCoord.y + 16,
            dropY: parentCoord.y + 55,
            childDrops: [childCoord],
          })
        }
      }
    }

    return { nodeCoords, partnerLines, parentChildTrees }
  }, [pedigree])

  return (
    <svg
      ref={ref}
      id="pedigree-live-svg"
      className="w-full h-[580px] bg-white"
      viewBox="0 0 1200 680"
    >
      <defs>
        {/* Proband Arrow Marker */}
        <marker
          id="proband-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
        </marker>
      </defs>

      {/* Background for Panning */}
      <rect id="canvas-bg" width="100%" height="100%" fill="transparent" />

      {/* Root transform group for Zoom & Pan */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Generation Roman Numerals Bar on left */}
        {[1, 2, 3, 4, 5].map((gen) => {
          const genY = gen === 1 ? 80 : gen === 2 ? 210 : gen === 3 ? 350 : gen === 4 ? 490 : 630
          const roman = gen === 1 ? 'I' : gen === 2 ? 'II' : gen === 3 ? 'III' : gen === 4 ? 'IV' : 'V'
          return (
            <text
              key={gen}
              x={35}
              y={genY + 5}
              fontSize="13"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
            >
              {roman}
            </text>
          )
        })}

        {/* 1. Partnership Lines */}
        {layout.partnerLines.map((l) => (
          <g key={l.id}>
            {l.consanguineous ? (
              <>
                <line x1={l.x1} y1={l.y1 - 2.5} x2={l.x2} y2={l.y2 - 2.5} stroke="#0f172a" strokeWidth="1.8" />
                <line x1={l.x1} y1={l.y1 + 2.5} x2={l.x2} y2={l.y2 + 2.5} stroke="#0f172a" strokeWidth="1.8" />
              </>
            ) : (
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#0f172a" strokeWidth="1.8" />
            )}
          </g>
        ))}

        {/* 2. Parent-to-Children Tree Lines */}
        {layout.parentChildTrees.map((tree) => {
          if (tree.childDrops.length === 0) return null
          const minChildX = Math.min(...tree.childDrops.map((c) => c.x))
          const maxChildX = Math.max(...tree.childDrops.map((c) => c.x))

          return (
            <g key={tree.key}>
              {/* Vertical stem from parents */}
              <line
                x1={tree.topX}
                y1={tree.topY}
                x2={tree.topX}
                y2={tree.dropY}
                stroke="#0f172a"
                strokeWidth="1.6"
              />
              {/* Horizontal crossbar across all children */}
              <line
                x1={minChildX}
                y1={tree.dropY}
                x2={maxChildX}
                y2={tree.dropY}
                stroke="#0f172a"
                strokeWidth="1.6"
              />
              {/* Vertical drops to each individual child */}
              {tree.childDrops.map((c, i) => (
                <line
                  key={i}
                  x1={c.x}
                  y1={tree.dropY}
                  x2={c.x}
                  y2={c.y - 18}
                  stroke="#0f172a"
                  strokeWidth="1.6"
                />
              ))}
            </g>
          )
        })}

        {/* 3. Family Member Nodes */}
        {pedigree.members.map((m) => {
          const coord = layout.nodeCoords.get(m.id)
          if (!coord) return null
          const isSelected = m.id === selectedMemberId

          return (
            <g
              key={m.id}
              transform={`translate(${coord.x}, ${coord.y})`}
              className="cursor-pointer transition-transform"
              onClick={(e) => {
                e.stopPropagation()
                onSelectMember(m.id)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                onStartDragNode(m.id)
              }}
            >
              {/* Selection Ring */}
              {isSelected && (
                <circle cx={0} cy={0} r={28} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4 2" />
              )}

              {/* Pedigree Shape by Sex & Genetic Status */}
              <PedigreeSymbolNode member={m} />

              {/* Text Label Below Node */}
              <text
                x={0}
                y={28}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#0f172a"
                className="select-none"
              >
                {m.name}
              </text>
              <text
                x={0}
                y={41}
                textAnchor="middle"
                fontSize="9.5"
                fill="#64748b"
                className="select-none capitalize"
              >
                {m.relation.replace(/_/g, ' ')} {m.age ? `(${m.age})` : ''}
              </text>
              {m.conditions.length > 0 && (
                <text
                  x={0}
                  y={53}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#991b1b"
                  className="select-none"
                >
                  {m.conditions[0].name.slice(0, 16)}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
})

// ---------------------------------------------------------------------------
// Standard Genetic Pedigree Symbol Node (ACMG / NSGC standard)
// ---------------------------------------------------------------------------
function PedigreeSymbolNode({ member }: { member: FamilyMember }) {
  const { sex, geneticStatus, deceased, isProband, adopted, pregnancyOutcome } = member
  const R = 16

  // Base shape component
  const renderShape = () => {
    // 1. Male: Square
    if (sex === 'M') {
      if (geneticStatus === 'affected') {
        return <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#0f172a" stroke="#0f172a" strokeWidth="2" />
      }
      if (geneticStatus === 'carrier') {
        // Vertical half-fill (standard clinical genetics)
        return (
          <g>
            <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <rect x={-R} y={-R} width={R} height={R * 2} fill="#0f172a" />
          </g>
        )
      }
      if (geneticStatus === 'suspected_carrier') {
        return (
          <g>
            <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#ffffff" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx={0} cy={0} r={4} fill="#0f172a" />
          </g>
        )
      }
      if (geneticStatus === 'unknown') {
        return (
          <g>
            <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <text x={0} y={4.5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0f172a">?</text>
          </g>
        )
      }
      // Unaffected / Not assessed
      return <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
    }

    // 2. Female: Circle
    if (sex === 'F') {
      if (geneticStatus === 'affected') {
        return <circle cx={0} cy={0} r={R} fill="#0f172a" stroke="#0f172a" strokeWidth="2" />
      }
      if (geneticStatus === 'carrier') {
        // Semi-circle left half filled
        return (
          <g>
            <circle cx={0} cy={0} r={R} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <path d={`M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} Z`} fill="#0f172a" />
          </g>
        )
      }
      if (geneticStatus === 'suspected_carrier') {
        return (
          <g>
            <circle cx={0} cy={0} r={R} fill="#ffffff" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx={0} cy={0} r={4} fill="#0f172a" />
          </g>
        )
      }
      if (geneticStatus === 'unknown') {
        return (
          <g>
            <circle cx={0} cy={0} r={R} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <text x={0} y={4.5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0f172a">?</text>
          </g>
        )
      }
      return <circle cx={0} cy={0} r={R} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
    }

    // 3. Unknown Sex / Pregnancy Loss: Diamond or Triangle
    if (pregnancyOutcome === 'miscarriage' || pregnancyOutcome === 'stillbirth') {
      return (
        <polygon
          points={`0,${-R} ${R},${R} ${-R},${R}`}
          fill={geneticStatus === 'affected' ? '#0f172a' : '#ffffff'}
          stroke="#0f172a"
          strokeWidth="2"
        />
      )
    }

    // Diamond
    const D = 18
    const points = `0,${-D} ${D},0 0,${D} ${-D},0`
    if (geneticStatus === 'affected') {
      return <polygon points={points} fill="#0f172a" stroke="#0f172a" strokeWidth="2" />
    }
    if (geneticStatus === 'carrier') {
      return (
        <g>
          <polygon points={points} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points={`0,${-D} ${-D},0 0,${D}`} fill="#0f172a" />
        </g>
      )
    }
    if (geneticStatus === 'suspected_carrier') {
      return (
        <g>
          <polygon points={points} fill="#ffffff" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={0} cy={0} r={3.5} fill="#0f172a" />
        </g>
      )
    }
    if (geneticStatus === 'unknown') {
      return (
        <g>
          <polygon points={points} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <text x={0} y={4.5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0f172a">?</text>
        </g>
      )
    }
    return <polygon points={points} fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
  }

  return (
    <g>
      {/* Base Shape */}
      {renderShape()}

      {/* Deceased Diagonal Slash across symbol */}
      {deceased && (
        <line
          x1={-R - 6}
          y1={R + 6}
          x2={R + 6}
          y2={-R - 6}
          stroke="#0f172a"
          strokeWidth="2.5"
        />
      )}

      {/* Proband Arrow */}
      {isProband && (
        <g>
          <line
            x1={-R - 16}
            y1={R + 16}
            x2={-R - 4}
            y2={R + 4}
            stroke="#0f172a"
            strokeWidth="2.5"
            markerEnd="url(#proband-arrow)"
          />
          <text
            x={-R - 22}
            y={R + 22}
            fontSize="12"
            fontWeight="bold"
            fill="#0f172a"
            fontFamily="sans-serif"
          >
            P
          </text>
        </g>
      )}

      {/* Adopted Brackets */}
      {adopted && (
        <g>
          <path d={`M ${-R - 5} ${-R - 2} L ${-R - 9} ${-R - 2} L ${-R - 9} ${R + 2} L ${-R - 5} ${R + 2}`} fill="none" stroke="#0f172a" strokeWidth="2" />
          <path d={`M ${R + 5} ${-R - 2} L ${R + 9} ${-R - 2} L ${R + 9} ${R + 2} L ${R + 5} ${R + 2}`} fill="none" stroke="#0f172a" strokeWidth="2" />
        </g>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Add Family Member Modal (Phase 2 & 7C)
// ---------------------------------------------------------------------------
function AddMemberModal({
  members,
  onClose,
  onAdd,
}: {
  members: FamilyMember[]
  onClose: () => void
  onAdd: (member: Partial<FamilyMember>) => void
}) {
  const [relationKey, setRelationKey] = useState('brother')
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'M' | 'F' | 'U'>('M')
  const [generation, setGeneration] = useState(3)
  const [age, setAge] = useState<number | ''>('')
  const [geneticStatus, setGeneticStatus] = useState<GeneticStatus>('unaffected')
  const [deceased, setDeceased] = useState(false)
  const [ageAtDeath, setAgeAtDeath] = useState<number | ''>('')
  const [conditionInput, setConditionInput] = useState('')
  const [notes, setNotes] = useState('')

  // Relationship dropdown links
  const [selectedParent1, setSelectedParent1] = useState('')
  const [selectedParent2, setSelectedParent2] = useState('')
  const [selectedPartner, setSelectedPartner] = useState('')

  // Handle Preset Change
  const handlePresetChange = (key: string) => {
    setRelationKey(key)
    const preset = PRESET_RELATIONS.find((p) => p.key === key)
    if (preset) {
      setSex(preset.sex)
      setGeneration(preset.generation)
      if (!name) setName(preset.label)

      // Auto-populate parent/partner links based on Proband
      const proband = members.find((m) => m.isProband)
      const father = members.find((m) => m.relation === 'father')
      const mother = members.find((m) => m.relation === 'mother')
      const pgf = members.find((m) => m.relation === 'paternal_grandfather')
      const pgm = members.find((m) => m.relation === 'paternal_grandmother')
      const mgf = members.find((m) => m.relation === 'maternal_grandfather')
      const mgm = members.find((m) => m.relation === 'maternal_grandmother')

      if (key === 'brother' || key === 'sister' || key === 'sibling_u') {
        if (father) setSelectedParent1(father.id)
        if (mother) setSelectedParent2(mother.id)
      } else if (key === 'son' || key === 'daughter' || key === 'child_u') {
        if (proband) setSelectedParent1(proband.id)
      } else if (key === 'paternal_uncle' || key === 'paternal_aunt') {
        if (pgf) setSelectedParent1(pgf.id)
        if (pgm) setSelectedParent2(pgm.id)
      } else if (key === 'maternal_uncle' || key === 'maternal_aunt') {
        if (mgf) setSelectedParent1(mgf.id)
        if (mgm) setSelectedParent2(mgm.id)
      } else if (key === 'partner') {
        if (proband) setSelectedPartner(proband.id)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parentIds: string[] = []
    if (selectedParent1) parentIds.push(selectedParent1)
    if (selectedParent2 && selectedParent2 !== selectedParent1) parentIds.push(selectedParent2)

    const partnerIds: string[] = []
    if (selectedPartner) partnerIds.push(selectedPartner)

    const conditions: PedigreeConditionItem[] = []
    if (conditionInput.trim()) {
      conditions.push({
        id: uid('c'),
        name: conditionInput.trim(),
        status: geneticStatus === 'carrier' ? 'carrier' : 'affected',
      })
    }

    onAdd({
      name: name.trim() || PRESET_RELATIONS.find((p) => p.key === relationKey)?.label || 'Relative',
      relation: relationKey,
      sex,
      generation,
      age: typeof age === 'number' ? age : null,
      deceased,
      ageAtDeath: typeof ageAtDeath === 'number' ? ageAtDeath : null,
      geneticStatus,
      conditions,
      notes,
      parentIds,
      partnerIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-slate-900" />
            <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
              Add Family Member
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Preset Relation */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Relationship to Proband</label>
            <select
              value={relationKey}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            >
              {PRESET_RELATIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label} (Gen {r.generation})
                </option>
              ))}
            </select>
          </div>

          {/* Name & Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name or Label</label>
              <input
                type="text"
                placeholder="e.g. John Doe / Brother 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Biological Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value="M">Male (Square)</option>
                <option value="F">Female (Circle)</option>
                <option value="U">Unknown Sex (Diamond)</option>
              </select>
            </div>
          </div>

          {/* Generation & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Generation</label>
              <select
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value={1}>Gen I (Grandparents / Earlier)</option>
                <option value={2}>Gen II (Parents / Aunts / Uncles)</option>
                <option value={3}>Gen III (Proband / Siblings / Cousins)</option>
                <option value={4}>Gen IV (Children / Descendants)</option>
                <option value={5}>Gen V (Grandchildren)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Age</label>
              <input
                type="number"
                placeholder="Age in years"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Genetic Status */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Genetic Status</label>
            <select
              value={geneticStatus}
              onChange={(e) => setGeneticStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            >
              {GENETIC_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Deceased Toggle */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={deceased}
                onChange={(e) => setDeceased(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 accent-slate-900"
              />
              <span>Mark as Deceased (Renders diagonal slash)</span>
            </label>
            {deceased && (
              <input
                type="number"
                placeholder="Age at death (years)"
                value={ageAtDeath}
                onChange={(e) => setAgeAtDeath(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            )}
          </div>

          {/* Condition Tag */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Associated Condition or Trait</label>
            <input
              type="text"
              placeholder="e.g. Breast cancer, Beta-thalassemia carrier..."
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Relationship Connections */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <span className="font-mono uppercase font-bold text-slate-700 text-[11px] block">
              Relationship Links (Optional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Parent 1:</span>
                <select
                  value={selectedParent1}
                  onChange={(e) => setSelectedParent1(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relation.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Parent 2:</span>
                <select
                  value={selectedParent2}
                  onChange={(e) => setSelectedParent2(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relation.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">Partner / Spouse:</span>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              >
                <option value="">None</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relation.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
            >
              Add Member to Pedigree
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Member Detail Drawer (Phase 2 & 7D)
// ---------------------------------------------------------------------------
function MemberDetailDrawer({
  member,
  allMembers,
  onClose,
  onUpdate,
  onDelete,
}: {
  member: FamilyMember
  allMembers: FamilyMember[]
  onClose: () => void
  onUpdate: (patch: Partial<FamilyMember>) => void
  onDelete: () => void
}) {
  const [newConditionName, setNewConditionName] = useState('')
  const [newConditionAge, setNewConditionAge] = useState<number | ''>('')

  const addCondition = () => {
    if (!newConditionName.trim()) return
    const newCond: PedigreeConditionItem = {
      id: uid('c'),
      name: newConditionName.trim(),
      status: member.geneticStatus === 'carrier' ? 'carrier' : 'affected',
      ageAtDiagnosis: typeof newConditionAge === 'number' ? newConditionAge : null,
    }
    onUpdate({
      conditions: [...member.conditions, newCond],
    })
    setNewConditionName('')
    setNewConditionAge('')
  }

  const removeCondition = (cIdOrName: string) => {
    onUpdate({
      conditions: member.conditions.filter((c) => (c.id || c.name) !== cIdOrName),
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
            Family Member Details
          </div>
          <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Name */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Full Name or Label</label>
          <input
            type="text"
            value={member.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Sex & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Biological Sex</label>
            <select
              value={member.sex}
              onChange={(e) => onUpdate({ sex: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="M">Male (Square)</option>
              <option value="F">Female (Circle)</option>
              <option value="U">Unknown (Diamond)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Age</label>
            <input
              type="number"
              value={member.age ?? ''}
              onChange={(e) =>
                onUpdate({ age: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Genetic Status */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Genetic Status</label>
          <select
            value={member.geneticStatus}
            onChange={(e) => onUpdate({ geneticStatus: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
          >
            {GENETIC_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Deceased Status */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
            <input
              type="checkbox"
              checked={member.deceased}
              onChange={(e) => onUpdate({ deceased: e.target.checked })}
              className="rounded border-slate-300 text-slate-900 accent-slate-900"
            />
            <span>Deceased (Renders diagonal slash)</span>
          </label>
          {member.deceased && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="number"
                placeholder="Age at death"
                value={member.ageAtDeath ?? ''}
                onChange={(e) =>
                  onUpdate({ ageAtDeath: e.target.value === '' ? null : Number(e.target.value) })
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <input
                type="text"
                placeholder="Cause of death"
                value={member.causeOfDeath || ''}
                onChange={(e) => onUpdate({ causeOfDeath: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Associated Conditions (Phase 4) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 font-bold">Associated Conditions / Traits</label>
            <span className="text-[10px] text-slate-500 font-mono">({member.conditions.length})</span>
          </div>

          <div className="space-y-1.5 mb-2">
            {member.conditions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  {c.ageAtDiagnosis && (
                    <span className="text-[11px] text-slate-500 ml-1.5">
                      (Dx at {c.ageAtDiagnosis}y)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeCondition(c.id || c.name)}
                  className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Add condition (e.g. Ovarian Cancer)"
              value={newConditionName}
              onChange={(e) => setNewConditionName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-slate-900"
            />
            <input
              type="number"
              placeholder="Dx Age"
              value={newConditionAge}
              onChange={(e) =>
                setNewConditionAge(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-slate-900"
            />
            <button
              type="button"
              onClick={addCondition}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Clinical Notes */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Notes</label>
          <textarea
            rows={3}
            placeholder="Clinical observations, genetic test findings..."
            value={member.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Remove Member</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal (Explains Relationship Impact - Phase 2)
// ---------------------------------------------------------------------------
function DeleteConfirmModal({
  member,
  allMembers,
  onCancel,
  onConfirm,
}: {
  member: FamilyMember
  allMembers: FamilyMember[]
  onCancel: () => void
  onConfirm: () => void
}) {
  const childrenImpacted = allMembers.filter((m) => m.parentIds.includes(member.id))
  const partnersImpacted = allMembers.filter((m) => m.partnerIds.includes(member.id))

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm font-mono uppercase">
          <ShieldAlert size={18} />
          <span>Confirm Member Deletion</span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Are you sure you want to remove <strong>{member.name}</strong> ({member.relation.replace(/_/g, ' ')})?
        </p>

        {(childrenImpacted.length > 0 || partnersImpacted.length > 0) && (
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Relationship Connections Affected:</span>
            {childrenImpacted.length > 0 && (
              <p className="text-[11px]">
                • Will be unlinked as a parent from: {childrenImpacted.map((c) => c.name).join(', ')}
              </p>
            )}
            {partnersImpacted.length > 0 && (
              <p className="text-[11px]">
                • Will unlink partnership with: {partnersImpacted.map((p) => p.name).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
          >
            Confirm &amp; Delete Member
          </button>
        </div>
      </div>
    </div>
  )
}
