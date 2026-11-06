import React from 'react'
import type { Metadata } from 'next'
import { SignIn } from '@/components/ui/sign-in'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In | GENOBRIDGE Clinical Genetics',
  description: 'Sign in to access your clinical decision-support workspace',
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#031525]" />}>
      <SignIn />
    </React.Suspense>
  )
}
