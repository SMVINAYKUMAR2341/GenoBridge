import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import LandingPage from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'GenoBridge | Clinical Genetics & Antenatal Decision Support',
  description: 'Evidence-based clinical decision support for Gynecologists, OB-GYNs, and Maternal Health Nurses.',
}

export default async function RootPage() {
  const user = await appAuth.currentSessionUser()

  // If already authenticated and verified, seamlessly open their role-based clinical dashboard
  if (user && user.verificationStatus === 'APPROVED' && user.enabled) {
    if (user.role === 'provider') {
      redirect('/doctor/dashboard')
    }
    if (user.role === 'nurse') {
      redirect('/nurse/dashboard')
    }
    if (user.role === 'admin') {
      redirect('/admin/dashboard')
    }
  }

  // Otherwise, present the public Landing Page with direct Doctor/Nurse login and registration options
  return <LandingPage />
}
