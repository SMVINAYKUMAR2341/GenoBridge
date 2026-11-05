'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Baby,
  Calendar,
  User,
  Heart,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Printer,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  X,
  FileSpreadsheet,
  Syringe,
  Building2,
  Check,
} from 'lucide-react'
import {
  type RoutineAncData,
  createEmptyRoutineAnc,
  estimateEddFromLmp,
  calculateGestationalAge,
  calculateBmi,
  calculateGplaFromOutcomes,
  evaluatePreEclampsiaRisk,
  evaluateOverallAncRisk,
  type AncPreviousOutcome,
  type AncUltrasound,
  type VaccinationRecordEntry,
  type AdditionalHistoryEntry,
  type OtherLabTest,
} from '@/lib/anc-model'
import { card, btnPrimary, btnGhost, inputCls } from '@/components/ui/Primitives'

interface AncFormProps {
  initialData?: RoutineAncData
  userRole?: string
  userName?: string
  onCancel?: () => void
}

export function AncForm({ initialData, userRole = 'nurse', userName = 'Staff Nurse', onCancel }: AncFormProps) {
  const router = useRouter()
  const isDoctor = userRole === 'provider'

  // Open completely empty for new patient
  const [record, setRecord] = useState<RoutineAncData>(() => initialData || createEmptyRoutineAnc())
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Section titles
  const sections = [
    { num: 1, title: 'Patient Registration', short: 'Patient' },
    { num: 2, title: 'Pregnancy Details', short: 'Pregnancy' },
    { num: 3, title: 'Obstetric History', short: 'Obstetric' },
    { num: 4, title: 'Medical History', short: 'Medical' },
    { num: 5, title: 'Risk Assessment', short: 'Risk' },
    { num: 6, title: 'General Examination', short: 'Exam' },
    { num: 7, title: 'Investigations', short: 'Labs' },
    { num: 8, title: 'Ultrasound', short: 'Ultrasound' },
    { num: 9, title: 'Vaccination', short: 'Vaccines' },
    { num: 10, title: 'Birth Plan & Referrals', short: 'Birth Plan' },
    { num: 11, title: 'Review & Submit', short: 'Review' },
  ]

  // Auto-dating effect: calculate EDD and Gestational Age when LMP or Cycle days change
  useEffect(() => {
    if (record.pregnancy.lmp) {
      const edd = estimateEddFromLmp(record.pregnancy.lmp, record.pregnancy.cycleDays || 28)
      const ga = calculateGestationalAge(record.pregnancy.lmp)
      if (edd) {
        setRecord((prev) => ({
          ...prev,
          pregnancy: {
            ...prev.pregnancy,
            edd,
            gaWeeks: ga ? ga.weeks : prev.pregnancy.gaWeeks,
            gaDays: ga ? ga.days : prev.pregnancy.gaDays,
            trimester: ga ? (ga.weeks < 14 ? 1 : ga.weeks < 28 ? 2 : 3) : 1,
          },
        }))
      }
    }
  }, [record.pregnancy.lmp, record.pregnancy.cycleDays])

  // Auto-BMI effect: calculate BMI when height and weight change
  useEffect(() => {
    if (record.booking.heightCm && record.booking.weightKg) {
      const bmiRes = calculateBmi(record.booking.weightKg, record.booking.heightCm)
      setRecord((prev) => ({
        ...prev,
        generalExam: {
          ...prev.generalExam!,
          bmi: bmiRes.bmi,
          bmiCategory: bmiRes.category,
        },
      }))
    }
  }, [record.booking.heightCm, record.booking.weightKg])

  // Auto-tally G/P/L/A when previous outcomes change
  useEffect(() => {
    if (record.previousOutcomes && record.previousOutcomes.length > 0) {
      const gpla = calculateGplaFromOutcomes(record.previousOutcomes)
      setRecord((prev) => ({
        ...prev,
        booking: {
          ...prev.booking,
          gravida: gpla.g,
          para: gpla.p,
          living: gpla.l,
          abortions: gpla.a,
        },
      }))
    }
  }, [record.previousOutcomes.length])

  // Automated Risk Calculations (separate calculated from confirmed)
  const overallRisk = useMemo(() => evaluateOverallAncRisk(record), [record])
  const peRisk = useMemo(
    () => evaluatePreEclampsiaRisk(record.histories, record.booking, record.previousOutcomes, record.generalExam),
    [record.histories, record.booking, record.previousOutcomes, record.generalExam],
  )

  // Update helper functions
  const updateBooking = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, booking: { ...prev.booking, [field]: value } }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const updatePregnancy = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, pregnancy: { ...prev.pregnancy, [field]: value } }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const updateHistories = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, histories: { ...prev.histories, [field]: value } }))
  }

  const updateGeneralExam = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, generalExam: { ...prev.generalExam!, [field]: value } }))
  }

  const updateInvestigations = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, investigations: { ...prev.investigations!, [field]: value } }))
  }

  const updateBirthPlan = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, birthPlan: { ...prev.birthPlan!, [field]: value } }))
  }

  // Field level validation
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!record.booking.name.trim()) errors.name = 'Patient full name is required'
      if (!record.booking.hospitalRegNumber?.trim()) errors.hospitalRegNumber = 'Hospital registration number (MRN) is required'
      if (!record.booking.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
      if (!record.booking.mobileNumber?.trim()) errors.mobileNumber = 'Mobile number is required'
      if (record.booking.mobileNumber && !/^\+?[0-9\s-]{10,15}$/.test(record.booking.mobileNumber.trim())) {
        errors.mobileNumber = 'Enter a valid 10-15 digit phone number'
      }
    }

    if (currentStep === 2) {
      if (!record.pregnancy.lmp) errors.lmp = 'Last Menstrual Period (LMP) date is required'
      if (record.booking.gravida === null || record.booking.gravida === undefined || record.booking.gravida < 1) {
        errors.gravida = 'Gravida must be at least 1 (current pregnancy)'
      }
    }

    if (currentStep === 6) {
      if (!record.booking.heightCm) errors.heightCm = 'Maternal height is required'
      if (!record.booking.weightKg) errors.weightKg = 'Booking weight is required'
      if (!record.generalExam?.systolicBp) errors.systolicBp = 'Systolic BP is required'
      if (!record.generalExam?.diastolicBp) errors.diastolicBp = 'Diastolic BP is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(sections.length, prev + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Save Patient or Draft
  const handleSave = async (isFinalSubmit: boolean = false) => {
    if (isFinalSubmit) {
      // Validate core required fields
      const errors: Record<string, string> = {}
      if (!record.booking.name.trim()) errors.name = 'Patient full name is required'
      if (!record.booking.hospitalRegNumber?.trim()) errors.hospitalRegNumber = 'Hospital registration number is required'
      if (!record.pregnancy.lmp) errors.lmp = 'LMP is required for gestational dating'
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setFeedback({ type: 'error', message: 'Please complete all required fields marked with * before saving.' })
        return
      }
    }

    setSaving(true)
    setFeedback(null)

    // Prepare complete record
    const updated: RoutineAncData = {
      ...record,
      booking: {
        ...record.booking,
        identifier: record.booking.identifier || `ANC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      },
      riskClassification: {
        ...record.riskClassification!,
        riskLevel: overallRisk.riskLevel,
        calculatedRiskLevel: overallRisk.riskLevel,
        highRiskFlags: overallRisk.flags,
        preEclampsiaRisk: peRisk.isHighRisk ? 'high' : peRisk.moderateRiskFactors.length >= 2 ? 'moderate' : 'low',
        aspirinRecommended: peRisk.aspirinAdvised,
        clinicianConfirmedRiskLevel: isDoctor ? overallRisk.riskLevel : record.riskClassification?.clinicianConfirmedRiskLevel || 'PENDING',
        clinicianApproved: isDoctor,
        approvedByClinicianName: isDoctor ? userName : '',
        approvedAt: isDoctor ? new Date().toISOString().slice(0, 10) : '',
      },
      status: !isFinalSubmit ? 'DRAFT' : overallRisk.riskLevel === 'HIGH' ? 'HIGH_RISK' : 'ACTIVE',
      lastUpdated: new Date().toISOString().slice(0, 10),
    }

    try {
      const res = await fetch('/api/anc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const data = await res.json()

      if (res.ok && data.data) {
        const persistedId = data.data.booking?.identifier || updated.booking.identifier
        setFeedback({
          type: 'success',
          message: isFinalSubmit
            ? `Patient ${updated.booking.name} registered successfully with ID ${persistedId}.`
            : `Draft for ${updated.booking.name || 'new patient'} saved successfully with ID ${persistedId}.`,
        })
        if (isFinalSubmit) {
          setTimeout(() => {
            router.push(`/anc/${encodeURIComponent(persistedId)}`)
          }, 1200)
        } else {
          // Update local state with generated identifier
          setRecord((prev) => ({
            ...prev,
            booking: {
              ...prev.booking,
              identifier: persistedId,
              patientId: data.data.booking?.patientId || prev.booking.patientId,
            },
            status: 'DRAFT',
          }))
        }
      } else {
        setFeedback({
          type: 'error',
          message: data.error || (data.details ? data.details.join(', ') : 'Failed to save record'),
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setFeedback({ type: 'error', message: `Save error: ${msg}` })
    } finally {
      setSaving(false)
    }
  }

  // Repeatable section helpers: Previous Outcomes
  const addPreviousOutcome = () => {
    const newOutcome: AncPreviousOutcome = {
      id: crypto.randomUUID(),
      pregnancyNumber: (record.previousOutcomes?.length || 0) + 1,
      year: null,
      gaWeeks: null,
      gaDays: null,
      deliveryType: 'Normal Vaginal Delivery',
      modeOfBirth: 'Normal Vaginal Delivery',
      birthOutcome: 'livebirth',
      outcome: 'livebirth',
      babyWeight: null,
      birthweightGrams: null,
      livingStatus: 'Alive and well',
      complications: '',
      conditionDetails: '',
      remarks: '',
    }
    setRecord((prev) => ({ ...prev, previousOutcomes: [...prev.previousOutcomes, newOutcome] }))
  }

  const removePreviousOutcome = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      previousOutcomes: prev.previousOutcomes.filter((o) => o.id !== id),
    }))
  }

  // Repeatable section helpers: Ultrasounds
  const addUltrasound = () => {
    const newScan: AncUltrasound = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      scanDate: new Date().toISOString().slice(0, 10),
      gaWeeks: record.pregnancy.gaWeeks,
      gaDays: record.pregnancy.gaDays || 0,
      fetalNumber: record.pregnancy.plurality || 1,
      fetalPresentation: 'Cephalic',
      placentalLocation: 'Posterior',
      placentalPosition: 'posterior',
      amnioticFluid: 'Adequate',
      estimatedFetalWeight: null,
      purpose: 'Routine Obstetric Ultrasound',
      findings: '',
      placentation: 'Posterior',
      impression: '',
      reportReference: '',
      attachmentName: '',
      reportAttachmentName: '',
    }
    setRecord((prev) => ({ ...prev, ultrasounds: [...prev.ultrasounds, newScan] }))
  }

  const removeUltrasound = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      ultrasounds: prev.ultrasounds.filter((u) => u.id !== id),
    }))
  }

  // Repeatable section helpers: Vaccinations
  const addVaccination = () => {
    const newVac: VaccinationRecordEntry = {
      id: crypto.randomUUID(),
      vaccineName: 'Td (Tetanus-Diphtheria)',
      dose: '1st Dose',
      dateAdministered: new Date().toISOString().slice(0, 10),
      nextDoseDate: '',
      remarks: '',
    }
    const currentRecords = record.vaccinations?.records || []
    setRecord((prev) => ({
      ...prev,
      vaccinations: {
        ...prev.vaccinations!,
        records: [...currentRecords, newVac],
      },
    }))
  }

  const removeVaccination = (id: string) => {
    const currentRecords = record.vaccinations?.records || []
    setRecord((prev) => ({
      ...prev,
      vaccinations: {
        ...prev.vaccinations!,
        records: currentRecords.filter((v) => v.id !== id),
      },
    }))
  }

  // Repeatable section helpers: Other Lab Tests
  const addOtherTest = () => {
    const newTest: OtherLabTest = {
      id: crypto.randomUUID(),
      testName: '',
      result: '',
      date: new Date().toISOString().slice(0, 10),
      referenceRange: '',
    }
    const currentTests = record.investigations?.otherTests || []
    setRecord((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations!,
        otherTests: [...currentTests, newTest],
      },
    }))
  }

  const removeOtherTest = (id: string) => {
    const currentTests = record.investigations?.otherTests || []
    setRecord((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations!,
        otherTests: currentTests.filter((t) => t.id !== id),
      },
    }))
  }

  // Repeatable section helpers: Additional Medical Histories
  const addAdditionalHistory = () => {
    const newHist: AdditionalHistoryEntry = {
      id: crypto.randomUUID(),
      condition: '',
      diagnosedYear: null,
      notes: '',
    }
    const list = record.histories.additionalHistories || []
    setRecord((prev) => ({
      ...prev,
      histories: {
        ...prev.histories,
        additionalHistories: [...list, newHist],
      },
    }))
  }

  const removeAdditionalHistory = (id: string) => {
    const list = record.histories.additionalHistories || []
    setRecord((prev) => ({
      ...prev,
      histories: {
        ...prev.histories,
        additionalHistories: list.filter((h) => h.id !== id),
      },
    }))
  }

  // Progress percentage
  const progressPercent = Math.round(((currentStep - 1) / (sections.length - 1)) * 100)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#031525] border border-[#164C60] shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00D8C3]/20 border border-[#00D8C3]/40 text-[#00D8C3]">
              {record.booking.identifier || 'NEW REGISTRATION'}
            </span>
            {overallRisk.riskLevel === 'HIGH' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                HIGH RISK DETECTED
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {record.booking.name || 'New Antenatal Patient Registration'}
          </h1>
          <p className="text-xs text-[#A9BDCA]">
            {sections[currentStep - 1].title} • Step {currentStep} of {sections.length} • Nurse Intake Workspace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCancel || (() => router.push('/anc'))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-transparent hover:bg-white/10 text-slate-300 border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#102B43] hover:bg-[#164C60] text-white border border-[#164C60] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] shadow-lg shadow-[#00D8C3]/20 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Patient</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Step Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-white">
          <span>Registration Progress</span>
          <span className="text-[#00D8C3]">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-[#031525] h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#00D8C3] to-[#22C9EE] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Buttons (Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-11 gap-1.5 pt-2">
          {sections.map((s) => {
            const isActive = currentStep === s.num
            const isCompleted = currentStep > s.num
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (validateCurrentStep() || s.num < currentStep) {
                    setCurrentStep(s.num)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className={`py-2 px-1.5 rounded-xl text-center border transition-all text-xs ${
                  isActive
                    ? 'bg-[#00D8C3]/15 border-[#00D8C3] text-slate-900 dark:text-white font-bold'
                    : isCompleted
                    ? 'bg-slate-50 dark:bg-[#031525]/60 border-slate-200 dark:border-[#164C60] text-slate-600 dark:text-[#A9BDCA]'
                    : 'bg-transparent border-transparent text-slate-400 dark:text-[#A9BDCA]/60 hover:border-slate-200 dark:hover:border-[#164C60]/40'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                      isActive
                        ? 'bg-[#00D8C3] text-[#031525]'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-[#164C60] text-slate-600 dark:text-[#A9BDCA]'
                    }`}
                  >
                    {isCompleted ? '✓' : s.num}
                  </span>
                </div>
                <div className="mt-1 truncate text-[10px] font-semibold">{s.short}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-red-500/15 border-red-500/30 text-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline hover:no-underline ml-4 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: PATIENT REGISTRATION */}
      {/* ==================================================================== */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <User className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 1: Patient Registration</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">Patient socio-demographics, contact, and administrative details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Patient ID <span className="text-slate-400 font-normal">(Generated on save)</span>
              </label>
              <input
                type="text"
                readOnly
                placeholder="Auto-assigned (e.g. ANC-2026-XXXX)"
                value={record.booking.identifier}
                className={`${inputCls} bg-slate-100 dark:bg-[#031525] font-mono`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Hospital Registration Number (MRN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MRN-884920"
                value={record.booking.hospitalRegNumber || ''}
                onChange={(e) => updateBooking('hospitalRegNumber', e.target.value)}
                className={`${inputCls} ${validationErrors.hospitalRegNumber ? 'border-red-500' : ''}`}
              />
              {validationErrors.hospitalRegNumber && (
                <p className="text-[11px] text-red-500 mt-1">{validationErrors.hospitalRegNumber}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Patient Full Name"
                value={record.booking.name}
                onChange={(e) => updateBooking('name', e.target.value)}
                className={`${inputCls} ${validationErrors.name ? 'border-red-500' : ''}`}
              />
              {validationErrors.name && <p className="text-[11px] text-red-500 mt-1">{validationErrors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={record.booking.dateOfBirth}
                onChange={(e) => {
                  const dob = e.target.value
                  updateBooking('dateOfBirth', dob)
                  if (dob) {
                    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    updateBooking('ageAtBooking', age > 0 ? age : null)
                  }
                }}
                className={`${inputCls} ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {validationErrors.dateOfBirth && <p className="text-[11px] text-red-500 mt-1">{validationErrors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Age (Years) <span className="text-slate-400 font-normal">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                min="10"
                max="65"
                placeholder="Age"
                value={record.booking.ageAtBooking ?? ''}
                onChange={(e) => updateBooking('ageAtBooking', e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Registration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={record.booking.bookingDate}
                onChange={(e) => updateBooking('bookingDate', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={record.booking.mobileNumber || ''}
                onChange={(e) => updateBooking('mobileNumber', e.target.value)}
                className={`${inputCls} ${validationErrors.mobileNumber ? 'border-red-500' : ''}`}
              />
              {validationErrors.mobileNumber && (
                <p className="text-[11px] text-red-500 mt-1">{validationErrors.mobileNumber}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Alternate Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43211"
                value={record.booking.alternatePhone || ''}
                onChange={(e) => updateBooking('alternatePhone', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                placeholder="Emergency Contact"
                value={record.booking.emergencyContact || ''}
                onChange={(e) => updateBooking('emergencyContact', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Relationship with Emergency Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Husband, Mother, Brother"
                value={record.booking.emergencyRelationship || ''}
                onChange={(e) => updateBooking('emergencyRelationship', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Occupation
              </label>
              <input
                type="text"
                placeholder="e.g. Teacher, Homemaker, Engineer"
                value={record.booking.occupation || ''}
                onChange={(e) => updateBooking('occupation', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Education Level
              </label>
              <select
                value={record.booking.literacyLevel || 'high_school'}
                onChange={(e) => {
                  updateBooking('literacyLevel', e.target.value)
                  updateBooking('education', e.target.value)
                }}
                className={inputCls}
              >
                <option value="illiterate">Illiterate</option>
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School</option>
                <option value="high_school">High School</option>
                <option value="graduate">Graduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Residential Address
              </label>
              <input
                type="text"
                placeholder="House / Flat No, Street, Landmark"
                value={record.booking.address || ''}
                onChange={(e) => updateBooking('address', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">City / Town</label>
              <input
                type="text"
                placeholder="City"
                value={record.booking.city || ''}
                onChange={(e) => updateBooking('city', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">State</label>
              <input
                type="text"
                placeholder="State"
                value={record.booking.state || ''}
                onChange={(e) => updateBooking('state', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Postal / PIN Code</label>
              <input
                type="text"
                placeholder="Postal Code"
                value={record.booking.postalCode || ''}
                onChange={(e) => updateBooking('postalCode', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: PREGNANCY DETAILS */}
      {/* ==================================================================== */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <Calendar className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 2: Pregnancy Details</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Obstetric dating, LMP, EDD (Naegele's rule), parity, and pregnancy classification
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Last Menstrual Period (LMP) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={record.pregnancy.lmp}
                onChange={(e) => updatePregnancy('lmp', e.target.value)}
                className={`${inputCls} ${validationErrors.lmp ? 'border-red-500' : ''}`}
              />
              {validationErrors.lmp && <p className="text-[11px] text-red-500 mt-1">{validationErrors.lmp}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Estimated Due Date (EDD) <span className="text-slate-400 font-normal">(Auto-calculated)</span>
              </label>
              <input
                type="date"
                value={record.pregnancy.edd}
                onChange={(e) => updatePregnancy('edd', e.target.value)}
                className={`${inputCls} bg-slate-100 dark:bg-[#031525] font-semibold text-[#00D8C3]`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Gestational Age <span className="text-slate-400 font-normal">(Auto-calculated)</span>
              </label>
              <input
                type="text"
                readOnly
                value={
                  record.pregnancy.gaWeeks !== null
                    ? `${record.pregnancy.gaWeeks} Weeks ${record.pregnancy.gaDays ?? 0} Days (Trimester ${record.pregnancy.trimester || 1})`
                    : 'Enter valid LMP to calculate'
                }
                className={`${inputCls} bg-slate-100 dark:bg-[#031525] font-semibold`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Gravida (G) — Total Pregnancies <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={record.booking.gravida ?? ''}
                onChange={(e) => updateBooking('gravida', e.target.value ? Number(e.target.value) : null)}
                placeholder="1 (Current pregnancy)"
                className={`${inputCls} ${validationErrors.gravida ? 'border-red-500' : ''}`}
              />
              {validationErrors.gravida && <p className="text-[11px] text-red-500 mt-1">{validationErrors.gravida}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Para (P) — Deliveries &gt; 28 Weeks
              </label>
              <input
                type="number"
                min="0"
                value={record.booking.para ?? ''}
                onChange={(e) => updateBooking('para', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Living Children (L)
              </label>
              <input
                type="number"
                min="0"
                value={record.booking.living ?? ''}
                onChange={(e) => updateBooking('living', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Abortions / Early Losses (A)
              </label>
              <input
                type="number"
                min="0"
                value={record.booking.abortions ?? ''}
                onChange={(e) => updateBooking('abortions', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Stillbirths
              </label>
              <input
                type="number"
                min="0"
                value={record.pregnancy.stillbirths ?? ''}
                onChange={(e) => updatePregnancy('stillbirths', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Pregnancy Type
              </label>
              <select
                value={record.pregnancy.pregnancyType || 'singleton'}
                onChange={(e) => {
                  const val = e.target.value
                  updatePregnancy('pregnancyType', val)
                  updatePregnancy('multiplePregnancy', val !== 'singleton')
                  updatePregnancy('plurality', val === 'singleton' ? 1 : val === 'twin' ? 2 : val === 'triplet' ? 3 : 4)
                }}
                className={inputCls}
              >
                <option value="singleton">Singleton (1 Fetus)</option>
                <option value="twin">Twin Gestation (2 Fetuses)</option>
                <option value="triplet">Triplet (3 Fetuses)</option>
                <option value="higher_order">Higher Order Multiple</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Previous Pregnancy Complications (if any)
              </label>
              <input
                type="text"
                placeholder="e.g. Previous pre-eclampsia, gestational diabetes, preterm birth, postpartum hemorrhage"
                value={record.pregnancy.previousPregnancyComplications || ''}
                onChange={(e) => updatePregnancy('previousPregnancyComplications', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: OBSTETRIC HISTORY */}
      {/* ==================================================================== */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#00D8C3]" />
                Section 3: Obstetric History (Past Pregnancies)
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Chronological list of all past pregnancies, outcomes, delivery modes, and complications
              </p>
            </div>
            <button
              type="button"
              onClick={addPreviousOutcome}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Pregnancy</span>
            </button>
          </div>

          {record.previousOutcomes.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-[#164C60] text-center space-y-2">
              <Baby className="w-8 h-8 mx-auto text-slate-400 dark:text-[#164C60]" />
              <div className="text-sm font-bold text-slate-700 dark:text-white">No Previous Pregnancies Documented</div>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA] max-w-sm mx-auto">
                If this patient is a Primigravida (first pregnancy), you can proceed to the next section. Otherwise, click above to add previous pregnancy details.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {record.previousOutcomes.map((out, index) => (
                <div
                  key={out.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00D8C3] text-[#031525] flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      Past Pregnancy #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePreviousOutcome(out.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Pregnancy Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2021"
                        value={out.year ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) => (o.id === out.id ? { ...o, year: val } : o)),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">GA at Delivery (Weeks)</label>
                      <input
                        type="number"
                        placeholder="Weeks (e.g. 39)"
                        value={out.gaWeeks ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) => (o.id === out.id ? { ...o, gaWeeks: val } : o)),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Delivery Type</label>
                      <select
                        value={out.deliveryType || out.modeOfBirth || 'Normal Vaginal Delivery'}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) =>
                              o.id === out.id ? { ...o, deliveryType: val, modeOfBirth: val } : o,
                            ),
                          }))
                        }}
                        className={inputCls}
                      >
                        <option value="Normal Vaginal Delivery">Normal Vaginal Delivery</option>
                        <option value="Assisted Vaginal (Forceps/Vacuum)">Assisted Vaginal (Forceps/Vacuum)</option>
                        <option value="Elective LSCS">Elective Caesarean (LSCS)</option>
                        <option value="Emergency LSCS">Emergency Caesarean (LSCS)</option>
                        <option value="Surgical Abortion / D&C">Surgical Abortion / D&C</option>
                        <option value="Medical Abortion">Medical Abortion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Birth Outcome</label>
                      <select
                        value={out.birthOutcome || out.outcome || 'livebirth'}
                        onChange={(e) => {
                          const val = e.target.value as any
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) =>
                              o.id === out.id ? { ...o, birthOutcome: val, outcome: val } : o,
                            ),
                          }))
                        }}
                        className={inputCls}
                      >
                        <option value="livebirth">Livebirth</option>
                        <option value="miscarriage">Miscarriage (&lt;20 Weeks)</option>
                        <option value="stillbirth">Stillbirth / IUFD (&gt;20 Weeks)</option>
                        <option value="elective-abortion">Elective Abortion / MTP</option>
                        <option value="ectopic">Ectopic Pregnancy</option>
                        <option value="molar">Molar Pregnancy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Baby Weight (kg / grams)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3.1 or 3100"
                        value={out.babyWeight ?? out.birthweightGrams ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) =>
                              o.id === out.id ? { ...o, babyWeight: val, birthweightGrams: val } : o,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Complications</label>
                      <input
                        type="text"
                        placeholder="e.g. None, Pre-eclampsia, PPH"
                        value={out.complications || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) => (o.id === out.id ? { ...o, complications: val } : o)),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1">Remarks &amp; Child Status</label>
                      <input
                        type="text"
                        placeholder="e.g. Healthy child, breastfed 1 year, no NICU admission"
                        value={out.remarks || out.conditionDetails || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            previousOutcomes: prev.previousOutcomes.map((o) =>
                              o.id === out.id ? { ...o, remarks: val, conditionDetails: val } : o,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: MEDICAL HISTORY */}
      {/* ==================================================================== */}
      {currentStep === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <Heart className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 4: Medical History</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Chronic illnesses, surgical history, family diseases, allergies, and ongoing medications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* Condition Checkboxes */}
            {[
              { key: 'diabetes', label: 'Diabetes Mellitus' },
              { key: 'hypertension', label: 'Hypertension (High BP)' },
              { key: 'thyroidDisorders', label: 'Thyroid Disorder' },
              { key: 'cardiacConditions', label: 'Cardiac Condition' },
              { key: 'renalConditions', label: 'Renal / Kidney Disease' },
              { key: 'epilepsy', label: 'Epilepsy / Seizures' },
              { key: 'tuberculosis', label: 'Tuberculosis (TB)' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#164C60] bg-slate-50 dark:bg-[#031525] cursor-pointer hover:border-[#00D8C3] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(record.histories as any)[key] ?? false}
                  onChange={(e) => updateHistories(key, e.target.checked)}
                  className="rounded text-[#00D8C3] w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Previous Surgeries</label>
              <textarea
                rows={2}
                placeholder="e.g. Previous C-section, Appendectomy, Cholecystectomy, Myomectomy"
                value={record.histories.previousSurgeries || record.histories.surgical}
                onChange={(e) => {
                  updateHistories('previousSurgeries', e.target.value)
                  updateHistories('surgical', e.target.value)
                }}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Family Medical History</label>
              <textarea
                rows={2}
                placeholder="e.g. Maternal diabetes, hypertension, congenital anomalies, twin pregnancies"
                value={record.histories.familyMedicalHistory || record.histories.family}
                onChange={(e) => {
                  updateHistories('familyMedicalHistory', e.target.value)
                  updateHistories('family', e.target.value)
                }}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Known Allergies</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa, NSAIDs, Food allergens (or None Known)"
                value={record.histories.allergiesNotes || ''}
                onChange={(e) => updateHistories('allergiesNotes', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Current Medications</label>
              <input
                type="text"
                placeholder="e.g. Tab Folic Acid 5mg, Thyroxine 50mcg, Labetalol 100mg"
                value={record.histories.currentMedications || record.histories.medications}
                onChange={(e) => {
                  updateHistories('currentMedications', e.target.value)
                  updateHistories('medications', e.target.value)
                }}
                className={inputCls}
              />
            </div>
          </div>

          {/* Repeatable Additional Histories */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 dark:text-white">Additional Medical Conditions</span>
              <button
                type="button"
                onClick={addAdditionalHistory}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#102B43] hover:bg-slate-200 dark:hover:bg-[#164C60] text-slate-800 dark:text-white border border-slate-200 dark:border-[#164C60]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Additional Condition</span>
              </button>
            </div>

            {(record.histories.additionalHistories || []).map((h) => (
              <div key={h.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60]">
                <input
                  type="text"
                  placeholder="Condition Name"
                  value={h.condition}
                  onChange={(e) => {
                    const val = e.target.value
                    const list = (record.histories.additionalHistories || []).map((item) =>
                      item.id === h.id ? { ...item, condition: val } : item,
                    )
                    updateHistories('additionalHistories', list)
                  }}
                  className={inputCls}
                />
                <input
                  type="number"
                  placeholder="Year Diagnosed"
                  value={h.diagnosedYear ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    const list = (record.histories.additionalHistories || []).map((item) =>
                      item.id === h.id ? { ...item, diagnosedYear: val } : item,
                    )
                    updateHistories('additionalHistories', list)
                  }}
                  className={inputCls}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Notes / Management"
                    value={h.notes}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.histories.additionalHistories || []).map((item) =>
                        item.id === h.id ? { ...item, notes: val } : item,
                      )
                      updateHistories('additionalHistories', list)
                    }}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => removeAdditionalHistory(h.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 5: RISK ASSESSMENT */}
      {/* ==================================================================== */}
      {currentStep === 5 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 5: Risk Assessment</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Calculated clinical risk factors displayed separately from clinician-confirmed status
              </p>
            </div>
          </div>

          {/* Calculated vs Confirmed Risk Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border ${
              overallRisk.riskLevel === 'HIGH'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Algorithmic Screening Risk</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  overallRisk.riskLevel === 'HIGH' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {overallRisk.riskLevel === 'HIGH' ? 'HIGH RISK' : 'LOW RISK'}
                </span>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {overallRisk.flags.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {overallRisk.flags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No high-risk criteria detected. Patient qualifies for routine antenatal care.</p>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A9BDCA]">
                  2. Clinician-Confirmed Status
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Requires Clinician Review</span>
              </div>
              <select
                value={record.riskClassification?.clinicianConfirmedRiskLevel || 'PENDING'}
                onChange={(e) =>
                  setRecord((prev) => ({
                    ...prev,
                    riskClassification: {
                      ...prev.riskClassification!,
                      clinicianConfirmedRiskLevel: e.target.value as any,
                      clinicianOverride: true,
                    },
                  }))
                }
                className={inputCls}
              >
                <option value="PENDING">Pending Clinician Review</option>
                <option value="LOW">Confirmed: Low Risk (Routine ANC)</option>
                <option value="HIGH">Confirmed: High Risk (Specialized Care)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-[#A9BDCA]">
                Clinical safety protocol: Automated rules advise triage; final diagnosis must be confirmed by an attending physician.
              </p>
            </div>
          </div>

          {/* Pre-eclampsia Aspirin Indication */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700 dark:text-slate-200">
              <span className="font-bold text-amber-400">Pre-eclampsia Screening (ACOG / MoHFW): </span>
              {peRisk.aspirinAdvised ? (
                <span>
                  High-risk or multi-moderate risk criteria met. Low-Dose Aspirin (75–150 mg daily) is recommended between 12 and 36 weeks.
                </span>
              ) : (
                <span>Standard pre-eclampsia risk. Low-dose aspirin prophylaxis is not routinely indicated.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-xs text-slate-700 dark:text-slate-200">
              Clinical Risk Remarks / Clinician Documentation
            </label>
            <textarea
              rows={3}
              placeholder="Enter specific risk assessment observations, ultrasound correlation, or referral notes"
              value={record.riskClassification?.clinicalRemarks || ''}
              onChange={(e) =>
                setRecord((prev) => ({
                  ...prev,
                  riskClassification: { ...prev.riskClassification!, clinicalRemarks: e.target.value },
                }))
              }
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 6: GENERAL EXAMINATION */}
      {/* ==================================================================== */}
      {currentStep === 6 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <Activity className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 6: General Physical Examination</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Maternal anthropometry, BMI classification, vital signs, pallor, and edema assessment
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Height (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                max="250"
                required
                placeholder="e.g. 158"
                value={record.booking.heightCm ?? ''}
                onChange={(e) => updateBooking('heightCm', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} ${validationErrors.heightCm ? 'border-red-500' : ''}`}
              />
              {validationErrors.heightCm && <p className="text-[11px] text-red-500 mt-1">{validationErrors.heightCm}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="30"
                max="200"
                required
                placeholder="e.g. 55"
                value={record.booking.weightKg ?? ''}
                onChange={(e) => updateBooking('weightKg', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} ${validationErrors.weightKg ? 'border-red-500' : ''}`}
              />
              {validationErrors.weightKg && <p className="text-[11px] text-red-500 mt-1">{validationErrors.weightKg}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                BMI (kg/m²) <span className="text-slate-400 font-normal">(Auto-calculated)</span>
              </label>
              <input
                type="text"
                readOnly
                value={
                  record.generalExam?.bmi
                    ? `${record.generalExam.bmi} (${record.generalExam.bmiCategory?.toUpperCase()})`
                    : '—'
                }
                className={`${inputCls} bg-slate-100 dark:bg-[#031525] font-bold`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Pulse (BPM)
              </label>
              <input
                type="number"
                min="40"
                max="180"
                placeholder="e.g. 76"
                value={record.generalExam?.pulseBpm ?? ''}
                onChange={(e) => updateGeneralExam('pulseBpm', e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Systolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="60"
                max="260"
                required
                placeholder="110"
                value={record.generalExam?.systolicBp ?? ''}
                onChange={(e) => updateGeneralExam('systolicBp', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} ${validationErrors.systolicBp ? 'border-red-500' : ''}`}
              />
              {validationErrors.systolicBp && <p className="text-[11px] text-red-500 mt-1">{validationErrors.systolicBp}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Diastolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="40"
                max="160"
                required
                placeholder="70"
                value={record.generalExam?.diastolicBp ?? ''}
                onChange={(e) => updateGeneralExam('diastolicBp', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} ${validationErrors.diastolicBp ? 'border-red-500' : ''}`}
              />
              {validationErrors.diastolicBp && <p className="text-[11px] text-red-500 mt-1">{validationErrors.diastolicBp}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="98.4"
                value={record.generalExam?.temperatureF ?? ''}
                onChange={(e) => updateGeneralExam('temperatureF', e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Pallor
              </label>
              <select
                value={record.generalExam?.pallor || 'absent'}
                onChange={(e) => updateGeneralExam('pallor', e.target.value)}
                className={inputCls}
              >
                <option value="absent">Absent</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Pedal Edema
              </label>
              <select
                value={record.generalExam?.pedalEdema || 'none'}
                onChange={(e) => updateGeneralExam('pedalEdema', e.target.value)}
                className={inputCls}
              >
                <option value="none">None</option>
                <option value="1+">1+ Mild</option>
                <option value="2+">2+ Moderate</option>
                <option value="3+">3+ Marked</option>
                <option value="4+">4+ Severe / Anasarca</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                General Examination Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Chest clear, heart sounds normal S1 S2 heard, thyroid non-palpable"
                value={record.generalExam?.generalExamNotes || ''}
                onChange={(e) => updateGeneralExam('generalExamNotes', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 7: INVESTIGATIONS */}
      {/* ==================================================================== */}
      {currentStep === 7 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <FileText className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 7: Laboratory Investigations</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Blood grouping, hemoglobin, CBC, blood sugar, urine analysis, and infectious disease screening
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Blood Group</label>
              <select
                value={record.booking.bloodGroup}
                onChange={(e) => updateBooking('bloodGroup', e.target.value)}
                className={inputCls}
              >
                <option value="unknown">Unknown</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Rh Factor</label>
              <select
                value={record.booking.rhesus}
                onChange={(e) => updateBooking('rhesus', e.target.value)}
                className={inputCls}
              >
                <option value="unknown">Unknown</option>
                <option value="positive">Rh Positive (+)</option>
                <option value="negative">Rh Negative (-) [High Risk]</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Hemoglobin (g/dL)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 11.5"
                value={record.investigations?.hemoglobin ?? ''}
                onChange={(e) =>
                  updateInvestigations('hemoglobin', e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">TSH (mIU/L)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1.8"
                value={record.investigations?.tshValueMiuL ?? ''}
                onChange={(e) =>
                  updateInvestigations('tshValueMiuL', e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Fasting Blood Sugar (mg/dL)</label>
              <input
                type="number"
                placeholder="e.g. 85"
                value={record.investigations?.fastingBloodSugarMgDl ?? ''}
                onChange={(e) =>
                  updateInvestigations('fastingBloodSugarMgDl', e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">DIPSI Glucose (75g, mg/dL)</label>
              <input
                type="number"
                placeholder="e.g. 110"
                value={record.investigations?.dipsiBloodSugarMgDl ?? ''}
                onChange={(e) =>
                  updateInvestigations('dipsiBloodSugarMgDl', e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Urine Protein / Albumin</label>
              <select
                value={record.investigations?.urineRoutineProtein || 'nil'}
                onChange={(e) => updateInvestigations('urineRoutineProtein', e.target.value)}
                className={inputCls}
              >
                <option value="nil">Nil</option>
                <option value="trace">Trace</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
                <option value="3+">3+</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Urine Sugar</label>
              <select
                value={record.investigations?.urineRoutineSugar || 'nil'}
                onChange={(e) => updateInvestigations('urineRoutineSugar', e.target.value)}
                className={inputCls}
              >
                <option value="nil">Nil</option>
                <option value="trace">Trace</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">HIV 1 &amp; 2 Screening</label>
              <select
                value={record.investigations?.hivStatus || 'pending'}
                onChange={(e) => updateInvestigations('hivStatus', e.target.value)}
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="non_reactive">Non-Reactive (Negative)</option>
                <option value="reactive">Reactive (Positive)</option>
                <option value="not_tested">Not Tested</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Hepatitis B (HBsAg)</label>
              <select
                value={record.investigations?.hbsAgStatus || 'pending'}
                onChange={(e) => updateInvestigations('hbsAgStatus', e.target.value)}
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="non_reactive">Non-Reactive (Negative)</option>
                <option value="reactive">Reactive (Positive)</option>
                <option value="not_tested">Not Tested</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Syphilis (VDRL / RPR)</label>
              <select
                value={record.investigations?.vdrlRprStatus || 'pending'}
                onChange={(e) => updateInvestigations('vdrlRprStatus', e.target.value)}
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="non_reactive">Non-Reactive (Negative)</option>
                <option value="reactive">Reactive (Positive)</option>
                <option value="not_tested">Not Tested</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Rubella IgG</label>
              <select
                value={record.investigations?.rubellaIgg || 'pending'}
                onChange={(e) => updateInvestigations('rubellaIgg', e.target.value)}
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="immune">Immune (Positive)</option>
                <option value="non_immune">Non-Immune (Negative)</option>
                <option value="not_tested">Not Tested</option>
              </select>
            </div>
          </div>

          {/* Repeatable Other Lab Tests */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 dark:text-white">Additional Laboratory Tests</span>
              <button
                type="button"
                onClick={addOtherTest}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#102B43] hover:bg-slate-200 dark:hover:bg-[#164C60] text-slate-800 dark:text-white border border-slate-200 dark:border-[#164C60]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Result</span>
              </button>
            </div>

            {(record.investigations?.otherTests || []).map((t) => (
              <div key={t.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60]">
                <input
                  type="text"
                  placeholder="Test Name (e.g. Serum Creatinine)"
                  value={t.testName}
                  onChange={(e) => {
                    const val = e.target.value
                    const list = (record.investigations?.otherTests || []).map((item) =>
                      item.id === t.id ? { ...item, testName: val } : item,
                    )
                    updateInvestigations('otherTests', list)
                  }}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Result"
                  value={t.result}
                  onChange={(e) => {
                    const val = e.target.value
                    const list = (record.investigations?.otherTests || []).map((item) =>
                      item.id === t.id ? { ...item, result: val } : item,
                    )
                    updateInvestigations('otherTests', list)
                  }}
                  className={inputCls}
                />
                <input
                  type="date"
                  value={t.date}
                  onChange={(e) => {
                    const val = e.target.value
                    const list = (record.investigations?.otherTests || []).map((item) =>
                      item.id === t.id ? { ...item, date: val } : item,
                    )
                    updateInvestigations('otherTests', list)
                  }}
                  className={inputCls}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reference Range"
                    value={t.referenceRange || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.investigations?.otherTests || []).map((item) =>
                        item.id === t.id ? { ...item, referenceRange: val } : item,
                      )
                      updateInvestigations('otherTests', list)
                    }}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => removeOtherTest(t.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 8: ULTRASOUND */}
      {/* ==================================================================== */}
      {currentStep === 8 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00D8C3]" />
                Section 8: Obstetric Ultrasound Reports
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Record dating scans, NT/NB, anomaly scans, growth ultrasounds, and placental localization
              </p>
            </div>
            <button
              type="button"
              onClick={addUltrasound}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ultrasound Record</span>
            </button>
          </div>

          {record.ultrasounds.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-[#164C60] text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-400 dark:text-[#164C60]" />
              <div className="text-sm font-bold text-slate-700 dark:text-white">No Ultrasound Scans Recorded</div>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA] max-w-sm mx-auto">
                Ultrasound reports can be documented as they are performed throughout pregnancy. Click above to add an ultrasound record.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {record.ultrasounds.map((u, i) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00D8C3] text-[#031525] flex items-center justify-center font-bold text-[10px]">
                        {i + 1}
                      </span>
                      Ultrasound Scan #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeUltrasound(u.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Scan Date</label>
                      <input
                        type="date"
                        value={u.scanDate || u.date}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, scanDate: val, date: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Gestational Age (Weeks)</label>
                      <input
                        type="number"
                        placeholder="e.g. 18"
                        value={u.gaWeeks ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, gaWeeks: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Fetal Presentation</label>
                      <select
                        value={u.fetalPresentation || 'Cephalic'}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, fetalPresentation: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      >
                        <option value="Cephalic">Cephalic (Vertex)</option>
                        <option value="Breech">Breech</option>
                        <option value="Transverse">Transverse Lie</option>
                        <option value="Unstable">Unstable / Variable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Placental Location</label>
                      <select
                        value={u.placentalLocation || u.placentalPosition || 'Posterior'}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, placentalLocation: val, placentalPosition: val as any } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      >
                        <option value="Anterior">Anterior</option>
                        <option value="Posterior">Posterior</option>
                        <option value="Fundal">Fundal</option>
                        <option value="Low-lying">Low-lying (Close to os)</option>
                        <option value="Placenta Previa">Placenta Previa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Amniotic Fluid</label>
                      <select
                        value={u.amnioticFluid || 'Adequate'}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, amnioticFluid: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      >
                        <option value="Adequate">Adequate / Normal</option>
                        <option value="Oligohydramnios">Oligohydramnios (Reduced)</option>
                        <option value="Polyhydramnios">Polyhydramnios (Excess)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Estimated Fetal Weight (g)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2100"
                        value={u.estimatedFetalWeight ?? u.fetalWeightGrams ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, estimatedFetalWeight: val, fetalWeightGrams: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1">Ultrasound Findings &amp; Biometry</label>
                      <input
                        type="text"
                        placeholder="e.g. Normal fetal anatomy survey, CRL 58mm, BPD normal, no anomalies"
                        value={u.findings || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecord((prev) => ({
                            ...prev,
                            ultrasounds: prev.ultrasounds.map((item) =>
                              item.id === u.id ? { ...item, findings: val } : item,
                            ),
                          }))
                        }}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 9: VACCINATION */}
      {/* ==================================================================== */}
      {currentStep === 9 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Syringe className="w-5 h-5 text-[#00D8C3]" />
                Section 9: Maternal Vaccinations (MoHFW)
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Document Td/TT doses, Tdap (27–36 weeks), Influenza, and COVID-19 immunizations
              </p>
            </div>
            <button
              type="button"
              onClick={addVaccination}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vaccine Entry</span>
            </button>
          </div>

          {/* Standard MoHFW Schedule Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-5 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60]">
            <div>
              <label className="block font-semibold mb-1">Td1 Dose Date</label>
              <input
                type="date"
                value={record.vaccinations?.td1Date || ''}
                onChange={(e) =>
                  setRecord((prev) => ({
                    ...prev,
                    vaccinations: { ...prev.vaccinations!, td1Date: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Td2 Dose Date (4 weeks later)</label>
              <input
                type="date"
                value={record.vaccinations?.td2Date || ''}
                onChange={(e) =>
                  setRecord((prev) => ({
                    ...prev,
                    vaccinations: { ...prev.vaccinations!, td2Date: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tdap Dose (27–36 Weeks)</label>
              <input
                type="date"
                value={record.vaccinations?.tdapDate || ''}
                onChange={(e) =>
                  setRecord((prev) => ({
                    ...prev,
                    vaccinations: { ...prev.vaccinations!, tdapDate: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* Dynamic Repeatable List */}
          {(record.vaccinations?.records || []).length > 0 && (
            <div className="space-y-3">
              <span className="font-bold text-xs text-slate-800 dark:text-white">Additional Vaccines Administered</span>
              {(record.vaccinations?.records || []).map((v) => (
                <div key={v.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60]">
                  <input
                    type="text"
                    placeholder="Vaccine Name"
                    value={v.vaccineName}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.vaccinations?.records || []).map((item) =>
                        item.id === v.id ? { ...item, vaccineName: val } : item,
                      )
                      setRecord((prev) => ({ ...prev, vaccinations: { ...prev.vaccinations!, records: list } }))
                    }}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="Dose"
                    value={v.dose}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.vaccinations?.records || []).map((item) =>
                        item.id === v.id ? { ...item, dose: val } : item,
                      )
                      setRecord((prev) => ({ ...prev, vaccinations: { ...prev.vaccinations!, records: list } }))
                    }}
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={v.dateAdministered}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.vaccinations?.records || []).map((item) =>
                        item.id === v.id ? { ...item, dateAdministered: val } : item,
                      )
                      setRecord((prev) => ({ ...prev, vaccinations: { ...prev.vaccinations!, records: list } }))
                    }}
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={v.nextDoseDate}
                    onChange={(e) => {
                      const val = e.target.value
                      const list = (record.vaccinations?.records || []).map((item) =>
                        item.id === v.id ? { ...item, nextDoseDate: val } : item,
                      )
                      setRecord((prev) => ({ ...prev, vaccinations: { ...prev.vaccinations!, records: list } }))
                    }}
                    className={inputCls}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={v.remarks}
                      onChange={(e) => {
                        const val = e.target.value
                        const list = (record.vaccinations?.records || []).map((item) =>
                          item.id === v.id ? { ...item, remarks: val } : item,
                        )
                        setRecord((prev) => ({ ...prev, vaccinations: { ...prev.vaccinations!, records: list } }))
                      }}
                      className={inputCls}
                    />
                    <button type="button" onClick={() => removeVaccination(v.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 10: BIRTH PLAN AND REFERRALS */}
      {/* ==================================================================== */}
      {currentStep === 10 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <Building2 className="w-5 h-5 text-[#00D8C3]" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 10: Birth Plan &amp; Referrals</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Delivery facility planning, emergency readiness, and tertiary care referral documentation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Expected Delivery Facility
              </label>
              <select
                value={record.birthPlan?.expectedDeliveryFacility || record.birthPlan?.preferredPlaceOfDelivery || 'district_hospital'}
                onChange={(e) => {
                  updateBirthPlan('expectedDeliveryFacility', e.target.value)
                  updateBirthPlan('preferredPlaceOfDelivery', e.target.value)
                }}
                className={inputCls}
              >
                <option value="district_hospital">District Civil Hospital</option>
                <option value="medical_college">Medical College / Tertiary Center</option>
                <option value="sub_district_hospital">Sub-District Hospital / FRU</option>
                <option value="private_tertiary">Private Maternity Hospital</option>
                <option value="primary_health_centre">Primary Health Centre (PHC)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Identified Hospital Name
              </label>
              <input
                type="text"
                placeholder="e.g. City District Maternity Hospital"
                value={record.birthPlan?.identifiedHospitalName || ''}
                onChange={(e) => updateBirthPlan('identifiedHospitalName', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Birth Preferences
              </label>
              <input
                type="text"
                placeholder="e.g. Birth companion presence, skin-to-skin contact, exclusive breastfeeding"
                value={record.birthPlan?.birthPreferences || ''}
                onChange={(e) => updateBirthPlan('birthPreferences', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                Delivery Planning &amp; Transport Notes
              </label>
              <input
                type="text"
                placeholder="e.g. 108 Emergency ambulance booked, husband driving, blood donor on call"
                value={record.birthPlan?.deliveryPlanningNotes || record.birthPlan?.emergencyTransportContact || ''}
                onChange={(e) => updateBirthPlan('deliveryPlanningNotes', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Referral Sub-Panel */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-4">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Specialist Referral Details (If Required)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Referral Facility</label>
                <input
                  type="text"
                  placeholder="e.g. Dept of OB-GYN, Apex Medical College"
                  value={record.birthPlan?.referralFacility || ''}
                  onChange={(e) => updateBirthPlan('referralFacility', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Referral Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Severe pre-eclampsia / High-risk multiple pregnancy"
                  value={record.birthPlan?.referralReason || ''}
                  onChange={(e) => updateBirthPlan('referralReason', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Referral Date</label>
                <input
                  type="date"
                  value={record.birthPlan?.referralDate || ''}
                  onChange={(e) => updateBirthPlan('referralDate', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Referral Status</label>
                <select
                  value={record.birthPlan?.referralStatus || 'none'}
                  onChange={(e) => updateBirthPlan('referralStatus', e.target.value)}
                  className={inputCls}
                >
                  <option value="none">Not Referred</option>
                  <option value="pending">Pending Transfer</option>
                  <option value="in_transit">In Transit</option>
                  <option value="accepted">Accepted by Tertiary Center</option>
                  <option value="completed">Consultation Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 11: REVIEW & SUBMIT */}
      {/* ==================================================================== */}
      {currentStep === 11 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-[#164C60]">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Section 11: Review &amp; Submit Registration</h2>
              <p className="text-xs text-slate-500 dark:text-[#A9BDCA]">
                Verify all entered information before final registration and dispatch
              </p>
            </div>
          </div>

          {/* Summary Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Patient &amp; Demographics</span>
                <button type="button" onClick={() => setCurrentStep(1)} className="text-[#00D8C3] hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-[#A9BDCA]">
                <div>Name: <strong className="text-slate-800 dark:text-white">{record.booking.name || 'Not provided'}</strong></div>
                <div>MRN: <strong className="text-slate-800 dark:text-white">{record.booking.hospitalRegNumber || 'Not provided'}</strong></div>
                <div>Age: {record.booking.ageAtBooking ? `${record.booking.ageAtBooking} Years` : '—'}</div>
                <div>Phone: {record.booking.mobileNumber || '—'}</div>
                <div>Address: {record.booking.city ? `${record.booking.city}, ${record.booking.state}` : record.booking.address || '—'}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Obstetric Dating &amp; Formula</span>
                <button type="button" onClick={() => setCurrentStep(2)} className="text-[#00D8C3] hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-[#A9BDCA]">
                <div>LMP: <strong className="text-slate-800 dark:text-white">{record.pregnancy.lmp || '—'}</strong></div>
                <div>Calculated EDD: <strong className="text-[#00D8C3]">{record.pregnancy.edd || '—'}</strong></div>
                <div>Gestational Age: {record.pregnancy.gaWeeks !== null ? `${record.pregnancy.gaWeeks}w ${record.pregnancy.gaDays ?? 0}d` : '—'}</div>
                <div>Obstetric Formula: <strong>G{record.booking.gravida ?? 1} P{record.booking.para ?? 0} L{record.booking.living ?? 0} A{record.booking.abortions ?? 0}</strong></div>
                <div>Pregnancy Type: {record.pregnancy.pregnancyType || 'Singleton'}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Vitals &amp; Anthropometry</span>
                <button type="button" onClick={() => setCurrentStep(6)} className="text-[#00D8C3] hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-[#A9BDCA]">
                <div>Height / Weight: {record.booking.heightCm ?? '—'} cm / {record.booking.weightKg ?? '—'} kg</div>
                <div>BMI: {record.generalExam?.bmi ? `${record.generalExam.bmi} (${record.generalExam.bmiCategory})` : '—'}</div>
                <div>Blood Pressure: {record.generalExam?.systolicBp ? `${record.generalExam.systolicBp}/${record.generalExam.diastolicBp} mmHg` : '—'}</div>
                <div>Pallor / Edema: {record.generalExam?.pallor || 'Absent'} / {record.generalExam?.pedalEdema || 'None'}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60] space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Calculated Risk Classification</span>
                <button type="button" onClick={() => setCurrentStep(5)} className="text-[#00D8C3] hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-[#A9BDCA]">
                <div className="flex items-center gap-2">
                  <span>Risk Level:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${overallRisk.riskLevel === 'HIGH' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {overallRisk.riskLevel}
                  </span>
                </div>
                <div>Pre-eclampsia Aspirin: {peRisk.aspirinAdvised ? 'RECOMMENDED (75-150mg)' : 'Not indicated'}</div>
                <div>Past Deliveries Documented: {record.previousOutcomes.length}</div>
                <div>Ultrasound Records: {record.ultrasounds.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B]/80 border border-slate-200 dark:border-[#164C60] flex items-center justify-between shadow-sm">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={handlePrevious}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#102B43] dark:hover:bg-[#164C60] text-slate-800 dark:text-white disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-xs text-slate-500 dark:text-[#A9BDCA] font-medium hidden sm:block">
          Step {currentStep} of {sections.length}: <strong>{sections[currentStep - 1].title}</strong>
        </div>

        {currentStep < sections.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] shadow-lg shadow-[#00D8C3]/20 transition-all"
          >
            <span>Next: {sections[currentStep].title}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-[#00D8C3] hover:bg-[#22C9EE] text-[#031525] shadow-lg shadow-[#00D8C3]/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Complete Registration &amp; Save Patient</span>
          </button>
        )}
      </div>
    </div>
  )
}
export default AncForm
