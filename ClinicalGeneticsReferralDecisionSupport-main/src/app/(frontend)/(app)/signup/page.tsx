export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { SignUp } from '@/components/ui/sign-up'

export const metadata: Metadata = {
  title: 'Register as Healthcare Professional | GenoBridge Clinical Genetics',
  description: 'Register as a Gynecologist or Nurse for clinical genetics decision support with GenoBridge',
}

export default function SignUpPage() {
  return <SignUp />
}
