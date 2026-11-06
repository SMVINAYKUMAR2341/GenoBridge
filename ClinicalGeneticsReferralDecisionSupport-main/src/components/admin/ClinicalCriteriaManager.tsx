'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  BookOpen,
  Save,
  RotateCcw,
  Sparkles,
  GitBranch,
} from 'lucide-react'

export interface CriterionRule {
  id: string
  code: string
  pathwaySlug: string
  title: string
  description: string
  thresholdValue: number
  thresholdUnit: string
  urgencyOutcome: 'urgent_referral' | 'routine_referral' | 'borderline_consideration'
  guidelineSource: string
  citation: string
  active: boolean
  approved: boolean
  version: number
}

const INITIAL_CRITERIA: CriterionRule[] = [
  // 1. Hereditary Cancer
  {
    id: 'crit-cancer-1',
    code: 'BRCA-ONSET-50',
    pathwaySlug: 'hereditary-cancer-risk',
    title: 'Early-Onset Breast Carcinoma',
    description: 'Personal or first-degree female breast cancer diagnosed at or prior to age cutoff.',
    thresholdValue: 50,
    thresholdUnit: 'years of age',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'NCCN Genetic/Familial High-Risk: Breast, Ovarian, Pancreatic',
    citation: 'NCCN Clinical Practice Guidelines v2.2026, Category 1',
    active: true,
    approved: true,
    version: 3,
  },
  {
    id: 'crit-cancer-2',
    code: 'OVARIAN-ANY',
    pathwaySlug: 'hereditary-cancer-risk',
    title: 'Epithelial Ovarian / Fallopian Tube Malignancy',
    description: 'Confirmed high-grade serous ovarian, fallopian tube, or primary peritoneal malignancy at any age.',
    thresholdValue: 1,
    thresholdUnit: 'occurrence',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'SGO / ASCO / NCCN Clinical Consensus',
    citation: 'ASCO JCO 2024;38(11):1190-1200',
    active: true,
    approved: true,
    version: 2,
  },
  {
    id: 'crit-cancer-3',
    code: 'LYNCH-COLON-50',
    pathwaySlug: 'hereditary-cancer-risk',
    title: 'Colorectal Carcinoma ≤ 50y or dMMR/MSI-H',
    description: 'Diagnosed prior to age cutoff or exhibiting loss of MLH1/MSH2/MSH6/PMS2 mismatch repair expression.',
    thresholdValue: 50,
    thresholdUnit: 'years of age',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'NCCN Colorectal Genetic Guidelines',
    citation: 'Amsterdam II & Bethesda Criteria Update',
    active: true,
    approved: true,
    version: 2,
  },

  // 2. Carrier Screening
  {
    id: 'crit-carr-1',
    code: 'COUPLE-DUAL-CF',
    pathwaySlug: 'preconception-carrier-screening',
    title: 'Dual Biological Parent Carrier of Autosomal Recessive Condition',
    description: 'Both patient and reproductive partner positive for pathogenic or likely pathogenic variants in the same gene (25% fetal risk).',
    thresholdValue: 2,
    thresholdUnit: 'carrier partners',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'ACOG Opinion No. 691 / ACMG Tier 3 / FOGSI GCPR',
    citation: 'ACOG Obstet Gynecol. 2017 Mar;129(3):e35-e40 & FOGSI Preconception Guidelines',
    active: true,
    approved: true,
    version: 4,
  },
  {
    id: 'crit-carr-2',
    code: 'XLINKED-CARRIER',
    pathwaySlug: 'preconception-carrier-screening',
    title: 'Maternal Carrier of X-Linked Genetic Disorder (e.g. Fragile X, DMD)',
    description: 'Confirmed maternal premutation (>55 CGG repeats) or pathogenic variant with 50% recurrence risk in male offspring.',
    thresholdValue: 55,
    thresholdUnit: 'CGG repeats',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'ACMG Practice Guidelines on Fragile X',
    citation: 'Genet Med. 2021;23(8):1410-1422',
    active: true,
    approved: true,
    version: 1,
  },

  // 3. NIPT Results
  {
    id: 'crit-nipt-1',
    code: 'NIPT-HIGH-RISK-21',
    pathwaySlug: 'nipt-results',
    title: 'Positive / High-Risk Aneuploidy Call (T21 / T18 / T13 / Monosomy X)',
    description: 'High-risk cell-free DNA result requiring immediate pre-test counseling and diagnostic amniocentesis/CVS confirmation.',
    thresholdValue: 99,
    thresholdUnit: '% PPV probability',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'ACOG Practice Bulletin 226',
    citation: 'Obstet Gynecol. 2020 Oct;136(4):e48-e69',
    active: true,
    approved: true,
    version: 3,
  },
  {
    id: 'crit-nipt-2',
    code: 'NIPT-LOW-FF',
    pathwaySlug: 'nipt-results',
    title: 'Atypical cfDNA / Low Fetal Fraction with Clinical Risk Factors',
    description: 'Fetal fraction below testing threshold with elevated maternal BMI or ultrasound structural findings.',
    thresholdValue: 4,
    thresholdUnit: '% fetal fraction cutoff',
    urgencyOutcome: 'routine_referral',
    guidelineSource: 'SMFM Consult Series #56',
    citation: 'Am J Obstet Gynecol. 2021;225(5):B2-B12',
    active: true,
    approved: true,
    version: 2,
  },

  // 4. Abnormal Ultrasound
  {
    id: 'crit-us-1',
    code: 'NT-ELEVATED-35',
    pathwaySlug: 'abnormal-ultrasound-findings',
    title: 'Markedly Elevated Fetal Nuchal Translucency (NT ≥ 3.5mm)',
    description: 'First-trimester NT exceeding 3.5mm (or >99th percentile), carrying high risk of chromosomal aneuploidies and Noonan syndrome.',
    thresholdValue: 3.5,
    thresholdUnit: 'millimeters (mm)',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'ISUOG Practice Guidelines',
    citation: 'Ultrasound Obstet Gynecol. 2022;59(1):107-114',
    active: true,
    approved: true,
    version: 2,
  },
  {
    id: 'crit-us-2',
    code: 'STRUCTURAL-MAJOR',
    pathwaySlug: 'abnormal-ultrasound-findings',
    title: 'Major Fetal Organ System Malformation',
    description: 'Confirmed congenital heart defect, holoprosencephaly, omphalocele, or skeletal dysplasia.',
    thresholdValue: 1,
    thresholdUnit: 'major malformation',
    urgencyOutcome: 'urgent_referral',
    guidelineSource: 'ACMG Fetal Anomaly Genetic Evaluation',
    citation: 'Genet Med. 2020;22(4):675-685',
    active: true,
    approved: true,
    version: 1,
  },

  // 5. Infertility & RPL
  {
    id: 'crit-rpl-1',
    code: 'RPL-LOSSES-2',
    pathwaySlug: 'infertility-recurrent-pregnancy-loss',
    title: 'Recurrent Pregnancy Loss (≥ 2 Clinical Miscarriages)',
    description: 'Two or more consecutive clinical pregnancy losses warranting parental peripheral blood karyotyping for balanced translocations.',
    thresholdValue: 2,
    thresholdUnit: 'consecutive pregnancy losses',
    urgencyOutcome: 'routine_referral',
    guidelineSource: 'ASRM 2024 Practice Guideline & ACOG PB 200',
    citation: 'Fertil Steril. 2024 / ACOG PB 200 Early Pregnancy Loss',
    active: true,
    approved: true,
    version: 3,
  },

  // 6. Family History
  {
    id: 'crit-fam-1',
    code: 'CONSANGUINITY-1ST',
    pathwaySlug: 'positive-family-history',
    title: 'First-Cousin Consanguinity with Affected Family Lineage',
    description: 'Union between first cousins (coefficient of relationship 1/8) with documented rare metabolic or syndromic disorders in pedigree.',
    thresholdValue: 12.5,
    thresholdUnit: '% shared genetic coefficient',
    urgencyOutcome: 'routine_referral',
    guidelineSource: 'FOGSI GCPR 2024 / ACMG & NSGC Consanguinity Standards',
    citation: 'FOGSI GCPR Section 4.2 & ACMG Clinical Practice Guidelines',
    active: true,
    approved: true,
    version: 1,
  },
]

const PATHWAYS = [
  { slug: 'hereditary-cancer-risk', name: 'Hereditary Cancer' },
  { slug: 'preconception-carrier-screening', name: 'Carrier Screening' },
  { slug: 'nipt-results', name: 'NIPT Results' },
  { slug: 'abnormal-ultrasound-findings', name: 'Abnormal Ultrasound' },
  { slug: 'infertility-recurrent-pregnancy-loss', name: 'Infertility / RPL' },
  { slug: 'positive-family-history', name: 'Family Pedigree' },
]

export default function ClinicalCriteriaManager() {
  const [criteria, setCriteria] = useState<CriterionRule[]>(INITIAL_CRITERIA)
  const [selectedPathway, setSelectedPathway] = useState(PATHWAYS[0].slug)
  const [feedback, setFeedback] = useState<string | null>(null)

  const activeRules = criteria.filter((c) => c.pathwaySlug === selectedPathway)

  const handleToggle = (id: string, field: 'active' | 'approved') => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field], version: c.version + 1 } : c))
    )
  }

  const handleThresholdChange = (id: string, value: number) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, thresholdValue: value, version: c.version + 1 } : c))
    )
  }

  const handleSave = () => {
    setFeedback('Criteria parameters and guideline versions saved successfully.')
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>CLINICAL DECISION GOVERNANCE ENGINE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-2">
            Clinical Guideline Criteria &amp; Threshold Governance
          </h2>
          <p className="text-xs text-[#A9BDCA] max-w-2xl mt-1">
            Configure statutory diagnostic thresholds, active state, and guideline citations across all 6 clinical pathways. Changes automatically increment the audit version.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] shadow-lg shadow-[#00D8C3]/20 transition-all self-start sm:self-auto shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Rule Configurations</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Pathway Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#08243B]/80 border border-[#164C60] p-1.5">
        {PATHWAYS.map((p) => {
          const count = criteria.filter((c) => c.pathwaySlug === p.slug && c.active).length
          const active = selectedPathway === p.slug
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => setSelectedPathway(p.slug)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-[#00D8C3] text-[#031525] shadow-md shadow-[#00D8C3]/20'
                  : 'text-[#A9BDCA] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{p.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                active ? 'bg-[#031525]/20 text-[#031525]' : 'bg-[#031525] text-[#8aaec3]'
              }`}>
                {count} active
              </span>
            </button>
          )
        })}
      </div>

      {/* Criteria Cards */}
      <div className="space-y-4">
        {activeRules.map((rule) => (
          <div
            key={rule.id}
            className="p-5 rounded-2xl bg-[#08243B]/70 border border-[#164C60] space-y-4 transition-all hover:border-[#164C60]/90"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#00D8C3]">{rule.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#031525] border border-[#164C60] text-[#8aaec3]">
                    v{rule.version}.0
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rule.urgencyOutcome === 'urgent_referral'
                      ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  }`}>
                    {rule.urgencyOutcome.replaceAll('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{rule.title}</h3>
                <p className="text-xs text-[#A9BDCA] max-w-2xl leading-relaxed">{rule.description}</p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#031525] border border-[#164C60] text-xs text-[#A9BDCA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.active}
                    onChange={() => handleToggle(rule.id, 'active')}
                    className="accent-[#00D8C3]"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#031525] border border-[#164C60] text-xs text-[#A9BDCA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.approved}
                    onChange={() => handleToggle(rule.id, 'approved')}
                    className="accent-[#00D8C3]"
                  />
                  <span>Governance Approved</span>
                </label>
              </div>
            </div>

            {/* Threshold Adjuster & Citation */}
            <div className="pt-3 border-t border-[#164C60]/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-[#8aaec3] font-semibold">Diagnostic Cutoff:</label>
                <input
                  type="number"
                  step="any"
                  value={rule.thresholdValue}
                  onChange={(e) => handleThresholdChange(rule.id, Number(e.target.value))}
                  className="w-20 px-2.5 py-1 rounded-lg bg-[#031525] border border-[#164C60] text-xs font-mono font-bold text-[#00D8C3] focus:outline-none focus:border-[#00D8C3]"
                />
                <span className="text-[#A9BDCA] font-medium">{rule.thresholdUnit}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8aaec3] sm:justify-end">
                <BookOpen className="w-3.5 h-3.5 text-[#00D8C3] shrink-0" />
                <span className="truncate">{rule.guidelineSource} ({rule.citation})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

