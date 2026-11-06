'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  Award,
  AlertCircle,
  ArrowRight,
  Loader2,
  Stethoscope,
  HeartHandshake,
  HeartPulse,
  Microscope,
  FlaskConical,
  ChevronDown,
} from 'lucide-react'
import {
  INDIAN_STATE_MEDICAL_COUNCILS,
  INDIAN_STATE_NURSING_COUNCILS,
  INDIAN_STATES_AND_UTS,
} from '@/data/indian-councils'
import { AuthVisualPanel } from '@/components/auth/AuthVisualPanel'

type ProfessionalCategory = 'gynecologist' | 'nurse'

export function SignUp() {
  const router = useRouter()

  // Form State
  const [category, setCategory] = useState<ProfessionalCategory>('nurse')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+91 ')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Professional details
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState('')
  const [stateMedicalCouncil, setStateMedicalCouncil] = useState<string>(INDIAN_STATE_MEDICAL_COUNCILS[0])
  const [registrationState, setRegistrationState] = useState<string>(INDIAN_STATES_AND_UTS[0])

  const [nursingRegistrationNumber, setNursingRegistrationNumber] = useState('')
  const [stateNursingCouncil, setStateNursingCouncil] = useState<string>('Indian Nursing Council (INC)')

  const [hospitalClinicName, setHospitalClinicName] = useState('')
  const [department, setDepartment] = useState('Obstetrics / Clinical Genetics')
  const [designation, setDesignation] = useState('')

  // Consents
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [verificationConsent, setVerificationConsent] = useState(false)

  // Status
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide both your first and last name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.')
      return
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '')
    if (cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid Indian contact mobile number.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (category === 'gynecologist') {
      if (!medicalRegistrationNumber.trim()) {
        setErrorMessage('Medical Registration Number is required for Gynecologists.')
        return
      }
      if (!stateMedicalCouncil) {
        setErrorMessage('Please select your State Medical Council.')
        return
      }
      if (!registrationState) {
        setErrorMessage('Please select your Medical Council registration state.')
        return
      }
    }

    if (!hospitalClinicName.trim()) {
      setErrorMessage('Hospital / Clinic name is required.')
      return
    }

    if (!designation.trim()) {
      setErrorMessage('Professional designation is required.')
      return
    }

    if (!termsAccepted || !privacyAccepted || !verificationConsent) {
      setErrorMessage('You must acknowledge all three regulatory and clinical consent requirements.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          confirmPassword,
          category,
          medicalRegistrationNumber: category === 'gynecologist' ? medicalRegistrationNumber.trim() : undefined,
          stateMedicalCouncil: category === 'gynecologist' ? stateMedicalCouncil : undefined,
          registrationState: category === 'gynecologist' ? registrationState : undefined,
          nursingRegistrationNumber: category === 'nurse' ? nursingRegistrationNumber.trim() : undefined,
          stateNursingCouncil: category === 'nurse' ? stateNursingCouncil : undefined,
          hospitalClinicName: hospitalClinicName.trim(),
          department: department.trim(),
          designation: designation.trim(),
          termsAccepted,
          privacyAccepted,
          verificationConsent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please check your information.')
      }

      router.push('/account-pending')
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  const nursingCouncilsList = [
    'Indian Nursing Council (INC)',
    ...INDIAN_STATE_NURSING_COUNCILS.filter((c) => c !== 'Indian Nursing Council (INC)'),
  ]

  return (
    <div className="min-h-screen w-full lg:h-screen lg:max-h-screen bg-gradient-to-br from-[#062438] via-[#021827] to-[#011422] p-2 sm:p-4 lg:p-5 flex items-center justify-center font-sans antialiased overflow-y-auto lg:overflow-hidden">
      {/* 
        Outer Floating Application Card:
        Takes full desktop screen cleanly (100% scale fit, max height bounded, rounded 32px)
      */}
      <div className="w-full max-w-[1340px] h-auto lg:h-[calc(100vh-2rem)] rounded-[32px] sm:rounded-[36px] bg-white shadow-2xl shadow-cyan-950/60 border border-slate-200/90 p-2 sm:p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch overflow-hidden">
        
        {/* =========================================================================
            LEFT PANEL: Deep Navy Brand & Visual Panel with 4 Floating Curved Boxes
            ========================================================================= */}
        <div className="lg:col-span-5 h-[480px] sm:h-[540px] lg:h-full">
          <AuthVisualPanel className="w-full h-full" />
        </div>

        {/* =========================================================================
            RIGHT PANEL: Registration Form (Pixel-perfect matching sample image)
            Always starts at top (justify-start) so header is never clipped/cut off!
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-start px-4 sm:px-8 lg:px-10 py-5 sm:py-7 overflow-y-auto h-full max-h-full">
          <div className="w-full max-w-xl mx-auto space-y-4">
            
            {/* Header: Fully visible at top with comfortable spacing */}
            <div className="space-y-1.5 pb-1">
              <h1 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-[#061c31] leading-tight">
                Create Your GENOBRIDGE Account
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-relaxed">
                Register as a healthcare professional to access structured clinical assessment and genetic referral workflows.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* 1. SELECT PROFESSIONAL CATEGORY */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold tracking-wider text-[#008f82] uppercase">
                  Select Professional Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('gynecologist')
                      setDepartment('Obstetrics & Gynecology')
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                      category === 'gynecologist'
                        ? 'bg-[#00D8C3] text-[#031525] font-bold shadow-sm border border-[#00D8C3]'
                        : 'bg-white text-slate-700 border border-teal-300/80 hover:border-teal-400 font-medium'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>Gynecologist / OB-GYN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory('nurse')
                      setDepartment('Obstetrics / Clinical Genetics')
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                      category === 'nurse'
                        ? 'bg-[#00D8C3] text-[#031525] font-bold shadow-sm border border-[#00D8C3]'
                        : 'bg-white text-slate-700 border border-teal-300/80 hover:border-teal-400 font-medium'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 shrink-0" />
                    <span>Nurse / Medical Assistant</span>
                  </button>
                </div>
              </div>

              {/* 2. PERSONAL INFORMATION */}
              <div className="space-y-3 pt-0.5">
                <div className="flex items-center gap-2 border-b border-teal-300 pb-1">
                  <User className="w-4 h-4 text-[#008f82]" />
                  <span className="text-xs font-bold tracking-wider uppercase text-[#008f82]">
                    Personal Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="block text-xs font-semibold text-slate-800">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      placeholder="e.g. Priya"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="lastName" className="block text-xs font-semibold text-slate-800">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      placeholder="e.g. Sharma"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-800">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="doctor@hospital.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-xs font-semibold text-slate-800">
                      Mobile Number (with country code) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="+91"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-800">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. PROFESSIONAL CREDENTIALS */}
              <div className="space-y-3 pt-0.5">
                <div className="flex items-center gap-2 border-b border-teal-300 pb-1">
                  <Award className="w-4 h-4 text-[#008f82]" />
                  <span className="text-xs font-bold tracking-wider uppercase text-[#008f82]">
                    Professional Credentials ({category === 'gynecologist' ? 'Medical Council' : 'Nursing Council'})
                  </span>
                </div>

                {category === 'nurse' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="nurseRegNo" className="block text-xs font-semibold text-slate-800">
                          Nursing Registration Number (where applicable)
                        </label>
                        <input
                          id="nurseRegNo"
                          type="text"
                          placeholder="e.g. DNC/RN/87654"
                          value={nursingRegistrationNumber}
                          onChange={(e) => setNursingRegistrationNumber(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="nurseCouncil" className="block text-xs font-semibold text-slate-800">
                          State Nursing Council
                        </label>
                        <div className="relative">
                          <select
                            id="nurseCouncil"
                            value={stateNursingCouncil}
                            onChange={(e) => setStateNursingCouncil(e.target.value)}
                            className="w-full h-10 px-3.5 pr-9 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 appearance-none cursor-pointer transition-all"
                          >
                            {nursingCouncilsList.map((council) => (
                              <option key={council} value={council}>
                                {council}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="medRegNo" className="block text-xs font-semibold text-slate-800">
                          Medical Registration Number *
                        </label>
                        <input
                          id="medRegNo"
                          type="text"
                          required
                          placeholder="e.g. MMC/2026/88741"
                          value={medicalRegistrationNumber}
                          onChange={(e) => setMedicalRegistrationNumber(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="regState" className="block text-xs font-semibold text-slate-800">
                          Registration State / UT *
                        </label>
                        <div className="relative">
                          <select
                            id="regState"
                            value={registrationState}
                            onChange={(e) => setRegistrationState(e.target.value)}
                            className="w-full h-10 px-3.5 pr-9 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 appearance-none cursor-pointer transition-all"
                          >
                            {INDIAN_STATES_AND_UTS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="stateCouncil" className="block text-xs font-semibold text-slate-800">
                        State Medical Council *
                      </label>
                      <div className="relative">
                        <select
                          id="stateCouncil"
                          value={stateMedicalCouncil}
                          onChange={(e) => setStateMedicalCouncil(e.target.value)}
                          className="w-full h-10 px-3.5 pr-9 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 appearance-none cursor-pointer transition-all"
                        >
                          {INDIAN_STATE_MEDICAL_COUNCILS.map((council) => (
                            <option key={council} value={council}>
                              {council}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </>
                )}

                {/* 3-Column Practice Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label htmlFor="hospital" className="block text-xs font-semibold text-slate-800">
                      Hospital / Clinic *
                    </label>
                    <input
                      id="hospital"
                      type="text"
                      required
                      placeholder="e.g. AIIMS Delhi"
                      value={hospitalClinicName}
                      onChange={(e) => setHospitalClinicName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="dept" className="block text-xs font-semibold text-slate-800">
                      Department
                    </label>
                    <input
                      id="dept"
                      type="text"
                      placeholder="Obstetrics / Clinical Genetics"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="designation" className="block text-xs font-semibold text-slate-800">
                      Designation *
                    </label>
                    <input
                      id="designation"
                      type="text"
                      required
                      placeholder={category === 'gynecologist' ? 'e.g. Consultant OB-GYN' : 'e.g. Staff Nurse'}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 4. CONSENTS */}
              <div className="space-y-2 pt-0.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 text-teal-600 accent-[#00D8C3] focus:ring-0 shrink-0 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I agree to the{' '}
                    <span className="font-medium text-[#008f82] underline cursor-pointer">
                      Terms of Service
                    </span>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 text-teal-600 accent-[#00D8C3] focus:ring-0 shrink-0 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I acknowledge the{' '}
                    <span className="font-medium text-[#008f82] underline cursor-pointer">
                      Privacy Policy
                    </span>{' '}
                    and patient health data protection provisions.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={verificationConsent}
                    onChange={(e) => setVerificationConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 text-teal-600 accent-[#00D8C3] focus:ring-0 shrink-0 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I understand that clinical access requires professional verification and administrator approval.
                  </span>
                </label>
              </div>

              {/* 5. SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl sm:rounded-full text-sm font-bold bg-[#00D8C3] hover:bg-[#1ee7cb] text-[#031525] shadow-md shadow-[#00D8C3]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Professional Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* OAUTH SINGLE SIGN-ON (GOOGLE) */}
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                  Or register with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <a
                href={`/api/auth/oauth/google?role=${category}`}
                className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </a>
            </div>

            {/* 6. SIGN IN LINK */}
            <div className="pt-1 text-center">
              <p className="text-xs text-slate-600">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-bold text-[#008f82] underline hover:text-[#005f56] transition-colors ml-1"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
