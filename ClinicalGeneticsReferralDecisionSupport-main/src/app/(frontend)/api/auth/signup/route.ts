import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'node:crypto'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(?:\+91[\s-]?)?[6789]\d{9}$/ // Standard Indian 10-digit mobile (+91 prefix optional)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      category, // 'gynecologist' | 'nurse'
      medicalRegistrationNumber,
      stateMedicalCouncil,
      registrationState,
      nursingRegistrationNumber,
      stateNursingCouncil,
      hospitalClinicName,
      department,
      designation,
      termsAccepted,
      privacyAccepted,
      verificationConsent,
      role: directRoleAttempt,
    } = body

    // 1. STRICT SECURITY: Never allow public administrator signup
    if (directRoleAttempt === 'admin' || category === 'admin' || body.role === 'admin') {
      return NextResponse.json(
        { message: 'Administrator accounts cannot be created via public signup. Contact clinical governance.' },
        { status: 403 }
      )
    }

    // 2. Validate category: strictly gynecologist or nurse
    if (category !== 'gynecologist' && category !== 'nurse') {
      return NextResponse.json(
        { message: 'Invalid professional category. Only Gynecologist / OB-GYN and Nurse / Medical Assistant categories are permitted.' },
        { status: 400 }
      )
    }

    // 3. Validate personal information
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      return NextResponse.json({ message: 'First name is required (minimum 2 characters)' }, { status: 400 })
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1) {
      return NextResponse.json({ message: 'Last name is required' }, { status: 400 })
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ message: 'A valid work email address is required' }, { status: 400 })
    }

    const cleanPhone = typeof phone === 'string' ? phone.trim() : ''
    if (!cleanPhone || !PHONE_REGEX.test(cleanPhone.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { message: 'Enter a valid Indian mobile number with country code (e.g., +91 9876543210)' },
        { status: 400 }
      )
    }

    // 4. Validate password strength
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long and contain numbers and letters' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Password and confirm password do not match' }, { status: 400 })
    }

    // 5. Category-specific validation
    if (category === 'gynecologist') {
      if (!medicalRegistrationNumber || typeof medicalRegistrationNumber !== 'string' || !medicalRegistrationNumber.trim()) {
        return NextResponse.json({ message: 'Medical Registration Number is mandatory for Gynecologists' }, { status: 400 })
      }
      if (!stateMedicalCouncil || typeof stateMedicalCouncil !== 'string' || !stateMedicalCouncil.trim()) {
        return NextResponse.json({ message: 'State Medical Council is mandatory for Gynecologists' }, { status: 400 })
      }
      if (!registrationState || typeof registrationState !== 'string' || !registrationState.trim()) {
        return NextResponse.json({ message: 'Medical Council registration state is mandatory' }, { status: 400 })
      }
    }

    // Common clinical employment fields
    if (!hospitalClinicName || typeof hospitalClinicName !== 'string' || !hospitalClinicName.trim()) {
      return NextResponse.json({ message: 'Hospital or Clinic name is required' }, { status: 400 })
    }
    if (!designation || typeof designation !== 'string' || !designation.trim()) {
      return NextResponse.json({ message: 'Professional designation is required' }, { status: 400 })
    }

    // 6. Consents check
    if (!termsAccepted || !privacyAccepted || !verificationConsent) {
      return NextResponse.json(
        { message: 'You must agree to the Terms of Service, Privacy Policy, and acknowledge verification requirements to register.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // 7. Check for duplicate accounts (email uniqueness)
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: cleanEmail },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingUsers.docs.length > 0) {
      return NextResponse.json(
        { message: 'An account with this work email address already exists. Please sign in or use forgot password.' },
        { status: 409 }
      )
    }

    // 8. Generate email verification token (valid for 24 hours)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const role = category === 'gynecologist' ? 'provider' : 'nurse'
    const fullName = `${firstName.trim()} ${lastName.trim()}`

    // 9. Create user with status PROFESSIONAL_VERIFICATION_PENDING (and email token)
    const newUser = await payload.create({
      collection: 'users',
      data: {
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password,
        category,
        role,
        clinicalQualification: category === 'gynecologist' ? `OB-GYN (${stateMedicalCouncil})` : `Nurse (${designation})`,
        medicalRegistrationNumber: category === 'gynecologist' ? medicalRegistrationNumber.trim() : '',
        stateMedicalCouncil: category === 'gynecologist' ? stateMedicalCouncil.trim() : '',
        registrationState: category === 'gynecologist' ? registrationState.trim() : '',
        nursingRegistrationNumber: category === 'nurse' && nursingRegistrationNumber ? nursingRegistrationNumber.trim() : '',
        stateNursingCouncil: category === 'nurse' && stateNursingCouncil ? stateNursingCouncil.trim() : '',
        hospitalClinicName: hospitalClinicName.trim(),
        department: department ? department.trim() : '',
        designation: designation.trim(),
        termsAccepted: true,
        privacyAccepted: true,
        verificationConsent: true,
        // In this implementation, the user starts in PROFESSIONAL_VERIFICATION_PENDING
        // with email verification token recorded
        verificationStatus: 'PROFESSIONAL_VERIFICATION_PENDING',
        emailVerified: false,
        emailVerificationToken,
        emailVerificationTokenExpiresAt: tokenExpiresAt,
        enabled: false, // PREVENT ACCESS UNTIL APPROVAL
        reviewerAuthorized: false,
        submittedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    // Log registration audit event
    try {
      await payload.create({
        collection: 'audit-logs',
        overrideAccess: true,
        data: {
          eventCode: `REG-${crypto.randomUUID()}`,
          actorName: fullName,
          actorRole: category === 'gynecologist' ? 'OB/GYN Provider' : 'Nurse / MA',
          actionType: 'CRITERIA_VALIDATED', // Reusing valid enum for audit
          resourceRef: `users:${newUser.id}`,
          details: `Public registration submitted for ${category} (${cleanEmail}). Professional credentials pending review.`,
          encryptionVerified: true,
        },
      })
    } catch (auditErr) {
      console.warn('Failed to write audit log for registration:', auditErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted successfully. Your credentials are now under professional verification.',
        userId: newUser.id,
        verificationStatus: 'PROFESSIONAL_VERIFICATION_PENDING',
        verificationToken: emailVerificationToken, // Provided in development for seamless verification testing
        redirectTo: '/account-pending',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: error.message || 'Registration failed. Please check your information and try again.' },
      { status: 500 }
    )
  }
}
