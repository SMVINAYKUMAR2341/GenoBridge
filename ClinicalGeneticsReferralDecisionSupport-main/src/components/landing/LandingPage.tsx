'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AuthVisualPanel from '@/components/auth/AuthVisualPanel'
import {
  Stethoscope,
  HeartHandshake,
  ShieldCheck,
  Dna,
  ArrowRight,
  Activity,
  Layers,
  FileText,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Baby,
  Sparkles,
  Terminal,
  Microscope,
  FlaskConical,
  HeartPulse,
  Users,
  Check,
  Download,
  Info,
  Shield,
  Clock,
  KeyRound,
  FileCheck2,
  Share2,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] font-sans antialiased selection:bg-[#14b8a6] selection:text-[#00201c] relative">
      {/* Top Navigation */}
      <header className="sticky top-0 w-full z-50 bg-[#051424]/90 backdrop-blur-xl border-b border-[#1c2b3c]/80 shadow-[0_4px_24px_rgba(1,15,31,0.6)]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-8 h-8 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8] group-hover:text-[#71f8e4] transition-colors shadow-[0_0_12px_rgba(20,184,166,0.2)]">
                <Microscope className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-[#d4e4fa] group-hover:text-[#4fdbc8] transition-colors">
                  GENOBRIDGE
                </span>
                <span className="font-mono text-[10px] text-[#7bd0ff] uppercase tracking-widest leading-none">
                  Genomics OB/GYN
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm text-[#bbcac6]">
              <a href="#platform-capabilities" className="hover:text-[#4fdbc8] transition-colors">
                Platform
              </a>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">
                Clinical Pathways
              </a>
              <a href="#how-it-works" className="hover:text-[#4fdbc8] transition-colors">
                How It Works
              </a>
              <a href="#pedigree-engine" className="hover:text-[#4fdbc8] transition-colors">
                Pedigree Engine
              </a>
              <a href="#guidelines" className="hover:text-[#4fdbc8] transition-colors">
                Guidelines
              </a>
              <a href="#governance" className="hover:text-[#4fdbc8] transition-colors">
                Governance
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login?role=nurse"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-[#7bd0ff] hover:text-white bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/50 transition-all"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Nurse Login</span>
            </Link>

            <Link
              href="/login?role=gynecologist"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-[#003731] bg-[#4fdbc8] hover:bg-[#71f8e4] shadow-[0_0_14px_rgba(20,184,166,0.35)] transition-all"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinician Login</span>
            </Link>

            <Link
              href="/signup"
              className="hidden md:inline-flex items-center px-3 py-1.5 rounded text-xs font-medium text-[#bbcac6] hover:text-[#d4e4fa] hover:bg-[#1c2b3c] transition-all"
            >
              Register Account
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm w-fit">
                <ShieldCheck className="w-4 h-4 text-[#4fdbc8]" />
                <span className="font-mono text-xs uppercase text-[#4fdbc8] tracking-wider font-semibold">
                  Clinical Genetics Referral Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#d4e4fa] tracking-tight leading-tight">
                Bringing Clarity to <br className="hidden sm:inline" />
                <span className="text-[#4fdbc8]">Every Genetic Referral Decision</span>
              </h1>

              <p className="text-base sm:text-lg text-[#bbcac6] max-w-2xl leading-relaxed">
                Organize clinical history, family pedigree information, and antenatal care data into structured, evidence-based genetic referral recommendations.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login?role=gynecologist"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#14b8a6] text-[#003731] font-semibold text-sm hover:bg-[#4fdbc8] transition-all shadow-[0_0_16px_rgba(20,184,166,0.35)]"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Clinician Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login?role=nurse"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#1c2b3c] text-[#d4e4fa] font-semibold text-sm hover:bg-[#273647] border border-[#3c4947] transition-all shadow-sm"
                >
                  <HeartHandshake className="w-4 h-4 text-[#7bd0ff]" />
                  <span>Nurse Intake Portal</span>
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#0d1c2d] text-[#bbcac6] hover:text-[#d4e4fa] hover:bg-[#1c2b3c] text-sm transition-all"
                >
                  <Layers className="w-4 h-4 text-[#7bd0ff]" />
                  <span>View How It Works</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-[#bbcac6] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#4fdbc8]" />
                  <span>Deterministic Rule Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#7bd0ff]" />
                  <span>Standardized Pedigree Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#4fdbc8]" />
                  <span>Calibrated to ACOG &amp; ACMG</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card (DNA Visual from Auth & Login pages) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-lg lg:max-w-none shadow-2xl shadow-cyan-950/70 rounded-[28px] overflow-hidden border border-[#164C60]/70">
                <AuthVisualPanel className="!h-[520px] sm:!h-[580px] w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLLED DEMONSTRATION NOTICE BANNER */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] p-4 md:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#1c2b3c] text-[#7bd0ff] flex-shrink-0 mt-0.5">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-[#d4e4fa]">
                    Explore GENOBRIDGE in a Controlled Demonstration Environment
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#273647] text-[#7bd0ff] font-mono text-[11px] font-semibold">
                    Synthetic Data Only
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#bbcac6] max-w-4xl">
                  GENOBRIDGE currently uses synthetic patient data to demonstrate clinical assessment, referral evaluation, workflow management, governance, and structured reporting. This environment is provisioned exclusively for operational evaluation and does not process live production Protected Health Information (PHI).
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2b3c] text-[#d4e4fa] font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-pulse" />
                Evaluation Build Active
              </span>
            </div>
          </div>
        </section>

        {/* PLATFORM CAPABILITIES (4 CARDS) */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16" id="platform-capabilities">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Functional Modules
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Integrated Clinical Workflows</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                Engineered to bridge clinical obstetric records with specialized genetic evaluation through modular data captures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#4fdbc8]/40 hover:bg-[#122131] transition-all flex flex-col justify-between shadow-sm group">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8] group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Clinical History</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Structured clinical information for pathway-specific assessments, standardizing phenotypic data capture across clinical staff.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 font-mono text-xs text-[#7bd0ff]">
                  <span>Phenotype capture</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/40 hover:bg-[#122131] transition-all flex flex-col justify-between shadow-sm group">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Family Pedigree</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Three-generation pedigree construction using standardized clinical symbols, documenting inheritance patterns and maternal lineages.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 font-mono text-xs text-[#7bd0ff]">
                  <span>Pedigree engine</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#4fdbc8]/40 hover:bg-[#122131] transition-all flex flex-col justify-between shadow-sm group">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8] group-hover:scale-105 transition-transform">
                    <Baby className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Routine Antenatal Care</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Structured obstetric history, demographics, ultrasound markers, and maternal serum screenings unified in one view.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 font-mono text-xs text-[#7bd0ff]">
                  <span>Obstetric profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/40 hover:bg-[#122131] transition-all flex flex-col justify-between shadow-sm group">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Referral Evaluation</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Server-side evaluation against configured clinical criteria and guideline algorithms to identify candidates for specialty genetics.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 font-mono text-xs text-[#7bd0ff]">
                  <span>Deterministic review</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIX CLINICAL PATHWAYS */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#010f1f]" id="pathways">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Pathway Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Six Clinical Pathways</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                Support structured genetic assessment across key clinical referral scenarios encountered in modern obstetric and gynecologic practice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pathway 1 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#4fdbc8]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#4fdbc8]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ACOG No. 793
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">Hereditary Cancer Risk</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Assess clinical and family history relevant to hereditary breast, ovarian, uterine, and colorectal cancer referral criteria.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">BRCA1/2</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Lynch Panel</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">NCCN Guidelines</span>
                </div>
              </div>

              {/* Pathway 2 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#7bd0ff]">
                    <Dna className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ACOG No. 691
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">Preconception Carrier Screening</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Support structured carrier screening assessment workflows for cystic fibrosis, spinal muscular atrophy, hemoglobinopathies, and expanded pan-ethnic panels.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">CFTR</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">SMN1</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">HBB</span>
                </div>
              </div>

              {/* Pathway 3 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#4fdbc8]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#4fdbc8]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ACOG / SMFM 2026
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">NIPT Results</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Organize and evaluate non-invasive prenatal test assessment metrics including fetal fraction, aneuploidy high-risk calls, and low fetal fraction retest criteria.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">T21/18/13</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Sex Chromosome</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">cfDNA</span>
                </div>
              </div>

              {/* Pathway 4 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#7bd0ff]">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ACOG No. 175
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">Abnormal Ultrasound Findings</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Capture relevant structural malformations and soft markers including nuchal translucency elevation, cardiac defects, and skeletal anomalies for rapid triage.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Increased NT</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Organ Anomalies</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">CMA Triage</span>
                </div>
              </div>

              {/* Pathway 5 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#4fdbc8]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#4fdbc8]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ASRM / ACOG
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">Infertility &amp; Recurrent Loss</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Support structured assessment of relevant reproductive history, prior spontaneous losses, parental karyotype indications, and microdeletions.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Karyotype</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Translocation</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Y-Deletions</span>
                </div>
              </div>

              {/* Pathway 6 */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] hover:border-[#7bd0ff]/40 transition-all flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#1c2b3c] text-[#7bd0ff]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#bbcac6]">
                    ACMG Standards
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#d4e4fa]">Positive Family History</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Document and cross-reference family history of known monogenic diseases, early onset cardiac arrest, developmental delay, or consanguineous partnerships.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#7bd0ff]">
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Monogenic</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Consanguinity</span>
                  <span className="px-2 py-0.5 rounded bg-[#010f1f] border border-[#1c2b3c]">Pedigree Map</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (4-STEP PROCESS) */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16" id="how-it-works">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Clinical Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">A Clear Process from Assessment to Clinical Review</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                Deterministic execution ensures patient data progresses through standardized checkpoints before specialist referral packaging.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#4fdbc8]">01</span>
                    <FileText className="w-5 h-5 text-[#bbcac6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Collect Clinical History</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Capture patient clinical and family history through structured questionnaires tailored to obstetric indications.
                  </p>
                </div>
                <div className="pt-4">
                  <span className="font-mono text-xs text-[#7bd0ff]">Intake standardization</span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#7bd0ff]">02</span>
                    <Share2 className="w-5 h-5 text-[#bbcac6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Build Family Pedigree</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Create a structured three-generation family pedigree using standardized symbols and documented degrees of kinship.
                  </p>
                </div>
                <div className="pt-4">
                  <span className="font-mono text-xs text-[#7bd0ff]">Pedigree generation</span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#4fdbc8]">03</span>
                    <Layers className="w-5 h-5 text-[#bbcac6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Evaluate Clinical Criteria</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Evaluate information using the server-side deterministic engine against active ACOG and ACMG guideline logic.
                  </p>
                </div>
                <div className="pt-4">
                  <span className="font-mono text-xs text-[#7bd0ff]">Server-side verification</span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#7bd0ff]">04</span>
                    <CheckCircle2 className="w-5 h-5 text-[#bbcac6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Generate Referral Package</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Generate structured outcomes and supporting evidence summaries for attending provider attestation.
                  </p>
                </div>
                <div className="pt-4">
                  <span className="font-mono text-xs text-[#7bd0ff]">Attested documentation</span>
                </div>
              </div>
            </div>

            {/* Standardized Engine Outcomes Banner */}
            <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#d4e4fa]">Standardized Engine Outcomes</span>
                <span className="font-mono text-xs text-[#bbcac6]">Strict taxonomy output without ambiguous scoring</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded bg-[#93000a]/30 border border-[#ffb4ab]/30 text-[#ffb4ab] font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" /> Urgent Referral
                </span>
                <span className="px-3 py-1 rounded bg-[#1c2b3c] text-[#4fdbc8] border border-[#4fdbc8]/30 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]" /> Routine Referral
                </span>
                <span className="px-3 py-1 rounded bg-[#1c2b3c] text-[#7bd0ff] border border-[#7bd0ff]/30 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff]" /> No Referral Needed
                </span>
                <span className="px-3 py-1 rounded bg-[#1c2b3c] text-[#ffb95f] border border-[#ffb95f]/30 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" /> Borderline Consideration
                </span>
                <span className="px-3 py-1 rounded bg-[#1c2b3c] text-[#bbcac6] font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#859490]" /> Insufficient Information
                </span>
              </div>
              <div className="pt-1 text-[#bbcac6] text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-[#7bd0ff] flex-shrink-0" />
                <span>Clinical Reminder: GENOBRIDGE does not independently diagnose patients or replace credentialed clinical judgment.</span>
              </div>
            </div>
          </div>
        </section>

        {/* THREE-GENERATION PEDIGREE BUILDER SECTION */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#010f1f]" id="pedigree-engine">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Clinical Genetics Graphics
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Three-Generation Family History Visualization</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-3xl">
                Structure family relationships and clinically relevant genetic history through an interactive pedigree compliant with standard clinical genetic nomenclature.
              </p>
            </div>

            <div className="w-full rounded-2xl bg-[#0d1c2d] border border-[#1c2b3c] p-4 sm:p-6 shadow-xl flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1c2b3c]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs sm:text-sm text-[#d4e4fa] font-bold">SYNTHETIC PEDIGREE: CASE #SYN-8492</span>
                  <span className="px-2 py-0.5 rounded bg-[#1c2b3c] text-[#7bd0ff] font-mono text-xs font-semibold">
                    Maternal Lineage Review
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#bbcac6]">
                  <span>ACOG / NSGC Standard Notation</span>
                </div>
              </div>

              {/* Pedigree Interactive SVG Tree */}
              <div className="w-full overflow-x-auto py-4 bg-[#051424] rounded-xl flex justify-center border border-[#1c2b3c]">
                <svg className="w-[860px] h-[360px] text-[#d4e4fa] select-none" viewBox="0 0 860 360">
                  {/* Generation Labels */}
                  <text fill="#859490" fontFamily="JetBrains Mono" fontSize="12" fontWeight="600" x="24" y="55">GEN I</text>
                  <text fill="#859490" fontFamily="JetBrains Mono" fontSize="12" fontWeight="600" x="24" y="175">GEN II</text>
                  <text fill="#859490" fontFamily="JetBrains Mono" fontSize="12" fontWeight="600" x="24" y="295">GEN III</text>
                  
                  {/* Guide Lines */}
                  <line stroke="#1c2b3c" strokeDasharray="4 4" strokeWidth="1" x1="80" x2="820" y1="50" y2="50" />
                  <line stroke="#1c2b3c" strokeDasharray="4 4" strokeWidth="1" x1="80" x2="820" y1="170" y2="170" />
                  <line stroke="#1c2b3c" strokeDasharray="4 4" strokeWidth="1" x1="80" x2="820" y1="290" y2="290" />

                  {/* Maternal Grandfather (I:1) Deceased Male */}
                  <rect fill="none" height="36" stroke="#d4e4fa" strokeWidth="2" width="36" x="230" y="32" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="228" x2="268" y1="70" y2="30" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="248" y="85">I:1 (d. 68)</text>

                  {/* Partnership line I:1 & I:2 */}
                  <line stroke="#d4e4fa" strokeWidth="2" x1="266" x2="330" y1="50" y2="50" />

                  {/* Maternal Grandmother (I:2) Affected Female (Ovarian Ca) */}
                  <circle cx="348" cy="50" fill="#ffb4ab" r="18" stroke="#ffb4ab" strokeWidth="2" />
                  <text fill="#ffb4ab" fontFamily="Inter" fontSize="10" textAnchor="middle" x="348" y="85">I:2 (Ov Ca 52)</text>

                  {/* Relationship branch to Gen II */}
                  <line stroke="#d4e4fa" strokeWidth="2" x1="298" x2="298" y1="50" y2="110" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="200" x2="390" y1="110" y2="110" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="200" x2="200" y1="110" y2="152" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="390" x2="390" y1="110" y2="152" />

                  {/* Paternal Grandparents */}
                  <rect fill="none" height="36" stroke="#d4e4fa" strokeWidth="2" width="36" x="540" y="32" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="558" y="85">I:3 (74)</text>
                  <line stroke="#d4e4fa" strokeWidth="2" x1="576" x2="640" y1="50" y2="50" />
                  <circle cx="658" cy="50" fill="none" r="18" stroke="#d4e4fa" strokeWidth="2" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="658" y="85">I:4 (72)</text>
                  <line stroke="#d4e4fa" strokeWidth="2" x1="608" x2="608" y1="50" y2="110" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="608" x2="608" y1="110" y2="152" />

                  {/* GENERATION II */}
                  {/* Maternal Aunt (II:1) Carrier */}
                  <circle cx="200" cy="170" fill="none" r="18" stroke="#d4e4fa" strokeWidth="2" />
                  <circle cx="200" cy="170" fill="#4fdbc8" r="5" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="200" y="205">II:1 (BRCA1+)</text>

                  {/* Mother (II:2) Affected Breast Ca */}
                  <circle cx="390" cy="170" fill="#ffb4ab" r="18" stroke="#ffb4ab" strokeWidth="2" />
                  <text fill="#ffb4ab" fontFamily="Inter" fontSize="10" textAnchor="middle" x="390" y="205">II:2 (Br Ca 41)</text>

                  {/* Father (II:3) */}
                  <rect fill="none" height="36" stroke="#d4e4fa" strokeWidth="2" width="36" x="590" y="152" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="608" y="205">II:3 (46)</text>
                  <line stroke="#d4e4fa" strokeWidth="2" x1="408" x2="590" y1="170" y2="170" />

                  {/* Offspring connector to Gen III */}
                  <line stroke="#d4e4fa" strokeWidth="2" x1="499" x2="499" y1="170" y2="230" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="390" x2="610" y1="230" y2="230" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="390" x2="390" y1="230" y2="272" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="500" x2="500" y1="230" y2="272" />
                  <line stroke="#d4e4fa" strokeWidth="2" x1="610" x2="610" y1="230" y2="272" />

                  {/* GENERATION III */}
                  {/* Brother (III:1) */}
                  <rect fill="none" height="36" stroke="#d4e4fa" strokeWidth="2" width="36" x="372" y="272" />
                  <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="390" y="325">III:1 (22)</text>

                  {/* PROBAND (III:2) Consultand Female */}
                  <circle cx="500" cy="290" fill="none" r="18" stroke="#4fdbc8" strokeWidth="3" />
                  <polygon fill="#4fdbc8" points="460,312 476,302 468,300 475,286 470,283 463,297 458,290" />
                  <text fill="#4fdbc8" fontFamily="JetBrains Mono" fontSize="12" fontWeight="700" x="445" y="325">P</text>
                  <text fill="#4fdbc8" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="500" y="325">III:2 Proband (29)</text>

                  {/* Fetus / Gestational age 14w (III:3) Diamond */}
                  <polygon fill="none" points="610,270 628,290 610,310 592,290" stroke="#7bd0ff" strokeWidth="2" />
                  <text fill="#7bd0ff" fontFamily="Inter" fontSize="10" textAnchor="middle" x="610" y="294">14w</text>
                  <text fill="#7bd0ff" fontFamily="Inter" fontSize="10" textAnchor="middle" x="610" y="325">III:3 (Pregnancy)</text>
                </svg>
              </div>

              {/* Pedigree Standardized Clinical Legend */}
              <div className="pt-2 flex flex-col gap-2">
                <span className="font-mono text-xs text-[#bbcac6] uppercase font-semibold">Standardized Clinical Nomenclature Legend</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs text-[#bbcac6]">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-transparent border border-[#d4e4fa] flex-shrink-0" />
                    <span>Male</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-transparent border border-[#d4e4fa] flex-shrink-0" />
                    <span>Female</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rotate-45 bg-transparent border border-[#d4e4fa] flex-shrink-0" />
                    <span>Unknown/Fetus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ffb4ab] flex-shrink-0" />
                    <span className="text-[#ffb4ab]">Affected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-transparent border border-[#d4e4fa] flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]" />
                    </div>
                    <span className="text-[#4fdbc8]">Carrier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-3.5 h-3.5 bg-transparent border border-[#d4e4fa] flex-shrink-0">
                      <div className="absolute inset-0 border-t border-[#d4e4fa] rotate-45 origin-center" />
                    </div>
                    <span>Deceased</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#4fdbc8] font-bold">P ↗</span>
                    <span className="text-[#4fdbc8]">Proband</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 border-t-2 border-b-2 border-[#d4e4fa] flex-shrink-0" />
                    <span>Consanguinity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GUIDELINE-INFORMED CLINICAL DECISION SUPPORT */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16" id="guidelines">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Referenced Literature
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Guideline-Informed Clinical Decision Support</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-3xl">
                GENOBRIDGE organizes clinical information and supports structured referral assessment using configurable clinical criteria calibrated against recognized professional society statements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff]">ACOG Committee Opinion No. 793</span>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Hereditary Cancer Risk</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Hereditary Cancer Syndromes and Risk Assessment. Establishes thresholds for pedigree evaluation, early onset criteria, and multi-gene panel referrals.
                  </p>
                </div>
                <div className="pt-4 font-mono text-xs text-[#4fdbc8]">NCCN Criteria Alignment</div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff]">ACOG Committee Opinion No. 691</span>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Carrier Screening</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Carrier Screening for Genetic Conditions. Details pan-ethnic cystic fibrosis, SMA, hemoglobinopathy triage, and expanded carrier screening partner testing.
                  </p>
                </div>
                <div className="pt-4 font-mono text-xs text-[#4fdbc8]">ACMG Technical Standards</div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff]">ACOG Practice Advisory (Jan 2026)</span>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">NIPT and Prenatal Screening</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Screening for Fetal Chromosomal Abnormalities, endorsing updated SMFM guidance on cell-free DNA, discordant findings, and ultrasound correlation.
                  </p>
                </div>
                <div className="pt-4 font-mono text-xs text-[#4fdbc8]">SMFM Consensus Endorsed</div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff]">ACOG Practice Bulletin No. 175</span>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Ultrasound Findings</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Ultrasound in Pregnancy. Informs indications for diagnostic testing (chorionic villus sampling and amniocentesis with chromosomal microarray) upon anomalous findings.
                  </p>
                </div>
                <div className="pt-4 font-mono text-xs text-[#4fdbc8]">Microarray Indication Rules</div>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col justify-between lg:col-span-2">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff]">ACOG Committee Statement (Feb 2026)</span>
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Ethical Considerations</h3>
                  <p className="text-xs text-[#bbcac6] leading-relaxed">
                    Ethical Considerations for Genetic Testing and Counseling in Obstetrics and Gynecology. Emphasizes patient autonomy, structured pre-test education, non-directive counseling, and management of variants of uncertain significance (VUS).
                  </p>
                </div>
                <div className="pt-4 font-mono text-xs text-[#4fdbc8]">Informed Consent &amp; Autonomy Principles</div>
              </div>
            </div>
          </div>
        </section>

        {/* CLINICAL GOVERNANCE SECTION */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#010f1f]" id="governance">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Auditability &amp; Review
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Dual-Track Clinical Governance</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                Segregated lifecycle state machines maintain total transparency across clinical referral submissions and underlying algorithmic rule configurations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clinical Workflow */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-md flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Clinical Referral Workflow</h3>
                  <span className="font-mono text-xs text-[#7bd0ff]">Patient Assessment Track</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#051424] border border-[#1c2b3c] text-center font-mono text-xs gap-2">
                  <span className="px-2 py-1 rounded bg-[#122131] text-[#bbcac6]">DRAFT</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-2 py-1 rounded bg-[#122131] text-[#bbcac6]">SUBMITTED</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-2 py-1 rounded bg-[#1c2b3c] text-[#7bd0ff]">IN_REVIEW</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-2 py-1 rounded bg-[#1c2b3c] text-[#4fdbc8] font-bold">FINALIZED</span>
                </div>
                <div className="flex flex-col gap-3 text-xs text-[#bbcac6] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Draft Saving:</strong> Clinic staff can incrementally input intake surveys, pedigree records, and antenatal labs over multiple appointments.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Submission Protocol:</strong> Immutable snapshot creation freezing pedigree graph data and clinical lab values.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Provider Review:</strong> Attending physician or genetic counselor inspects flagged risk determinants and citations.</div>
                  </div>
                </div>
              </div>

              {/* Ruleset Lifecycle */}
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-md flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#d4e4fa]">Clinical Criteria Governance</h3>
                  <span className="font-mono text-xs text-[#4fdbc8]">Ruleset Lifecycle Track</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#051424] border border-[#1c2b3c] text-center font-mono text-xs gap-1">
                  <span className="px-1.5 py-1 rounded bg-[#122131] text-[#bbcac6]">DRAFT</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-1.5 py-1 rounded bg-[#122131] text-[#bbcac6]">REVIEW</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-1.5 py-1 rounded bg-[#1c2b3c] text-[#7bd0ff]">APPROVED</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-1.5 py-1 rounded bg-[#1c2b3c] text-[#4fdbc8] font-bold">ACTIVE</span>
                  <span className="text-[#859490]">→</span>
                  <span className="px-1.5 py-1 rounded bg-[#122131] text-[#859490]">RETIRED</span>
                </div>
                <div className="flex flex-col gap-3 text-xs text-[#bbcac6] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Terminal className="w-4 h-4 text-[#7bd0ff] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Criteria Versioning:</strong> Guidelines and threshold definitions are version-controlled with deterministic hash signatures.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#7bd0ff] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Guideline Cross-Referencing:</strong> Every logic branch requires direct linkage to an active professional society statement.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#7bd0ff] flex-shrink-0 mt-0.5" />
                    <div><strong className="text-[#d4e4fa]">Audit History &amp; Superseding:</strong> Historical referrals continuously link to the exact ruleset version active on their date.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & HIPAA READINESS */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16" id="security">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Data Protection
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Privacy and Security at the Core</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                GENOBRIDGE is designed with privacy, controlled access, data integrity, and clinical accountability as foundational architectural priorities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#d4e4fa]">Role-Based Access</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Strict separation between attending gynecologists, clinical genetic counselors, nurses, and practice system administrators.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#d4e4fa]">Secure Authentication</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Multi-factor authentication protocols, session expirations, and hospital enterprise identity integration capabilities.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#d4e4fa]">Audit Accountability</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  Full audit trails capturing every record view, pedigree mutation, assessment recalculation, and report transmission.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#d4e4fa]">Data Integrity</h3>
                <p className="text-xs text-[#bbcac6] leading-relaxed">
                  SHA-256 cryptographic digest verification verifying that referral data remains unmodified during downstream transit.
                </p>
              </div>
            </div>

            {/* Architecture specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c]">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-[#4fdbc8] font-bold">Administrative Safeguards</span>
                <p className="text-xs text-[#bbcac6]">Role assignment protocols, workforce authorization workflows, and business associate governance readiness.</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-[#7bd0ff] font-bold">Technical Safeguards</span>
                <p className="text-xs text-[#bbcac6]">AES-256 resting data encryption, TLS 1.3 in-transit protections, and automated emergency session termination.</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-[#4fdbc8] font-bold">Physical Safeguards</span>
                <p className="text-xs text-[#bbcac6]">Isolated cloud data centers, zero local caching on unmanaged browser endpoints, and hardware token access limits.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STRUCTURED REPORTS FOR CLINICAL REVIEW (SAMPLE PREVIEW) */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#010f1f]" id="reports">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#4fdbc8] uppercase tracking-wider font-semibold">
                Clinical Documentation
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa]">Structured Reports for Clinical Review</h2>
              <p className="text-sm sm:text-base text-[#bbcac6] max-w-2xl">
                Automated generation of standardized referral packages designed for seamless transmission into electronic health records and geneticist consult queues.
              </p>
            </div>

            <div className="w-full max-w-5xl mx-auto rounded-2xl bg-[#0d1c2d] border border-[#1c2b3c] p-6 shadow-2xl relative overflow-hidden">
              <div className="p-6 rounded-xl bg-[#051424] border border-[#1c2b3c] text-[#d4e4fa] flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c2b3c] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8]">
                      <Microscope className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base font-bold tracking-tight">GENOBRIDGE GENOMICS DECISION SUPPORT</span>
                      <span className="font-mono text-xs text-[#bbcac6]">REFERRAL SUMMARY &amp; RISK STRATIFICATION REPORT</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-[#bbcac6]">
                    <div>REPORT ID: REF-2026-SYN-0941</div>
                    <div>DATE: MARCH 14, 2026</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[#0d1c2d] border border-[#1c2b3c] font-mono text-xs">
                  <div>
                    <span className="text-[#bbcac6] block">PATIENT:</span>
                    <span className="text-[#d4e4fa] font-semibold">DOE, JANE (SYNTHETIC)</span>
                  </div>
                  <div>
                    <span className="text-[#bbcac6] block">DOB / AGE:</span>
                    <span className="text-[#d4e4fa] font-semibold">1996-08-14 (29 YRS)</span>
                  </div>
                  <div>
                    <span className="text-[#bbcac6] block">GESTATIONAL AGE:</span>
                    <span className="text-[#d4e4fa] font-semibold">14 WEEKS 2 DAYS</span>
                  </div>
                  <div>
                    <span className="text-[#bbcac6] block">PRIMARY PATHWAY:</span>
                    <span className="text-[#4fdbc8] font-semibold">HEREDITARY CANCER</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#122131] border border-[#1c2b3c] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#4fdbc8] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-[#4fdbc8] font-bold">RECOMMENDATION: ROUTINE SPECIALTY GENETICS REFERRAL</span>
                      <span className="text-xs text-[#bbcac6]">Threshold criteria satisfied under ACOG Opinion No. 793 and NCCN HBOC v1.2026.</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#1c2b3c] text-[#4fdbc8] font-mono text-xs font-semibold hidden sm:inline">
                    CRITERIA MET
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#7bd0ff] uppercase font-semibold">Clinical Criteria Evidence Log</span>
                  <div className="flex flex-col gap-2 text-xs text-[#bbcac6]">
                    <div className="p-2.5 rounded bg-[#0d1c2d] border border-[#1c2b3c] flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                      <span><strong>Criterion HBOC-01:</strong> First-degree relative (Mother, II:2) diagnosed with invasive breast carcinoma at or under age 50 (diagnosed at age 41).</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1c2d] border border-[#1c2b3c] flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                      <span><strong>Criterion HBOC-04:</strong> Second-degree maternal relative (Maternal Grandmother, I:2) with epithelial ovarian carcinoma at age 52.</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1c2d] border border-[#1c2b3c] flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#4fdbc8] flex-shrink-0 mt-0.5" />
                      <span><strong>Criterion CARRIER-03:</strong> First-degree maternal aunt (II:1) documented BRCA1 pathogenic variant carrier.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1c2b3c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#bbcac6]">
                  <div>ATTESTING CLINICIAN: E. MORGAN, MD (OB/GYN) • SHA-256: 8f4a3c9b...e21d5904</div>
                  <div className="flex items-center gap-1.5 text-[#4fdbc8]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Electronically Attested</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-[#051424]">
          <div className="max-w-4xl mx-auto rounded-2xl bg-[#0d1c2d] border border-[#1c2b3c] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8] shadow-sm">
              <Microscope className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#d4e4fa]">
              Bring Greater Structure to Genetic Referral Decisions
            </h2>
            <p className="text-sm sm:text-base text-[#bbcac6] max-w-xl">
              Explore a more organized approach to clinical genetics assessment and referral workflows with our synthetic evaluation workbench.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?role=gynecologist"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#14b8a6] text-[#003731] font-semibold text-sm hover:bg-[#4fdbc8] transition-all shadow-[0_0_16px_rgba(20,184,166,0.35)]"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor / Clinician Login</span>
              </Link>
              <Link
                href="/login?role=nurse"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#1c2b3c] text-[#7bd0ff] font-semibold text-sm hover:bg-[#273647] border border-[#3c4947] transition-all"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Nurse Login</span>
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#051424] text-[#d4e4fa] font-medium text-sm hover:bg-[#122131] border border-[#1c2b3c] transition-all"
              >
                <span>Create New Account</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#010f1f] text-[#bbcac6] py-12 border-t border-[#1c2b3c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#1c2b3c] flex items-center justify-center text-[#4fdbc8]">
                  <Microscope className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-[#d4e4fa]">GENOBRIDGE</span>
              </div>
              <p className="text-xs text-[#bbcac6] max-w-md leading-relaxed">
                Next-generation clinical genetics decision support platform purpose-engineered for OB/GYN clinicians, maternal-fetal medicine specialists, and hereditary cancer risk triage.
              </p>
              <div className="p-3 rounded-lg bg-[#0d1c2d] border border-[#1c2b3c] text-[11px] text-[#bbcac6]">
                <strong className="text-[#7bd0ff]">Clinical Governance Notice:</strong> Recommendations are calibrated against ACMG, ACOG, and NCCN clinical guidelines. Final triage determination rests exclusively with the credentialed attending physician.
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="font-semibold text-[#d4e4fa] uppercase tracking-wider">Platform</span>
              <a href="#platform-capabilities" className="hover:text-[#4fdbc8] transition-colors">Acuity Decision Engine</a>
              <a href="#pedigree-engine" className="hover:text-[#4fdbc8] transition-colors">Pedigree Modeling</a>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">EHR Bi-directional Sync</a>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">ACMG Variant Crosswalk</a>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="font-semibold text-[#d4e4fa] uppercase tracking-wider">Clinical Pathways</span>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">Hereditary Breast &amp; Ovarian</a>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">Carrier Screening Protocols</a>
              <a href="#pathways" className="hover:text-[#4fdbc8] transition-colors">NIPT Aneuploidy Triage</a>
              <a href="#guidelines" className="hover:text-[#4fdbc8] transition-colors">Validation Studies</a>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="font-semibold text-[#d4e4fa] uppercase tracking-wider">Governance &amp; Trust</span>
              <a href="#security" className="hover:text-[#4fdbc8] transition-colors">HIPAA Readiness</a>
              <a href="#security" className="hover:text-[#4fdbc8] transition-colors">Audit Logging Architecture</a>
              <a href="#guidelines" className="hover:text-[#4fdbc8] transition-colors">Clinical Advisory Board</a>
              <a href="#security" className="hover:text-[#4fdbc8] transition-colors">Security Architecture</a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1c2b3c] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div>© 2026 GENOBRIDGE Genomics Inc. All rights reserved. • Synthetic Demo Data Mode Active</div>
            <div className="flex items-center gap-6">
              <a href="#governance" className="hover:text-[#4fdbc8] transition-colors">Privacy Policy</a>
              <a href="#governance" className="hover:text-[#4fdbc8] transition-colors">Terms of Clinical Use</a>
              <a href="#governance" className="hover:text-[#4fdbc8] transition-colors">BAA Provisions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
