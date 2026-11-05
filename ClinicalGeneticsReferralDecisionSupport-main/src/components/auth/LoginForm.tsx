'use client'

import React from 'react'
import { SignIn, SignInProps, ProfessionalRole } from '@/components/ui/sign-in'

export type { ProfessionalRole, SignInProps }

export function LoginForm(props: SignInProps) {
  return <SignIn {...props} />
}

export default LoginForm
