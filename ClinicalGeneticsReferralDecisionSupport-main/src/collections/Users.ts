import type { CollectionConfig } from 'payload'
import { cmsAdmin } from '../access/clinical'
import { logStaffAccessChange } from '../hooks/clinical-audit'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: false,
    tokenExpiration: 3600,
    maxLoginAttempts: 5,
    lockTime: 600000,
  },
  admin: { useAsTitle: 'name', group: 'Staff access' },
  access: {
    admin: () => false,
    create: cmsAdmin,
    read: ({ req }) =>
      req.user?.collection === 'admins'
        ? true
        : req.user?.collection === 'users'
          ? { id: { equals: req.user.id } }
          : false,
    update: cmsAdmin,
    delete: () => false,
  },
  hooks: {
    afterChange: [
      logStaffAccessChange,
      ({ doc }) => {
        if (doc?.id) {
          invalidateClinicalCache([CACHE_TAGS.userSession(String(doc.id))])
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'phone', type: 'text' },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Gynecologist / OB-GYN', value: 'gynecologist' },
        { label: 'Nurse / Medical Assistant', value: 'nurse' },
      ],
      saveToJWT: true,
    },
    // Gynecologist-specific professional fields
    { name: 'medicalRegistrationNumber', type: 'text' },
    { name: 'stateMedicalCouncil', type: 'text' },
    { name: 'registrationState', type: 'text' },
    // Nurse-specific professional fields
    { name: 'nursingRegistrationNumber', type: 'text' },
    { name: 'stateNursingCouncil', type: 'text' },
    // Common practice fields
    { name: 'hospitalClinicName', type: 'text' },
    { name: 'department', type: 'text' },
    { name: 'designation', type: 'text' },
    // Consent checkboxes
    { name: 'termsAccepted', type: 'checkbox', defaultValue: false },
    { name: 'privacyAccepted', type: 'checkbox', defaultValue: false },
    { name: 'verificationConsent', type: 'checkbox', defaultValue: false },
    // Account verification state machine
    {
      name: 'verificationStatus',
      type: 'select',
      options: [
        { label: 'REGISTERED', value: 'REGISTERED' },
        { label: 'EMAIL_VERIFICATION_PENDING', value: 'EMAIL_VERIFICATION_PENDING' },
        { label: 'EMAIL_VERIFIED', value: 'EMAIL_VERIFIED' },
        { label: 'PROFESSIONAL_VERIFICATION_PENDING', value: 'PROFESSIONAL_VERIFICATION_PENDING' },
        { label: 'APPROVED', value: 'APPROVED' },
        { label: 'REJECTED', value: 'REJECTED' },
        { label: 'SUSPENDED', value: 'SUSPENDED' },
      ],
      defaultValue: 'PROFESSIONAL_VERIFICATION_PENDING',
      saveToJWT: true,
    },
    { name: 'emailVerified', type: 'checkbox', defaultValue: false },
    { name: 'emailVerificationToken', type: 'text' },
    { name: 'emailVerificationTokenExpiresAt', type: 'date' },
    { name: 'rejectionReason', type: 'text' },
    { name: 'reviewedBy', type: 'text' },
    { name: 'reviewedAt', type: 'date' },
    { name: 'additionalInfoRequested', type: 'text' },
    { name: 'submittedAt', type: 'date' },
    ...['clinicalQualification', 'reviewerQualification'].map((name) => ({
      name,
      type: 'text' as const,
      access: {
        create: ({ req }: { req: import('payload').PayloadRequest }) => req.user?.collection === 'admins',
        update: ({ req }: { req: import('payload').PayloadRequest }) => req.user?.collection === 'admins',
      },
    })),
    {
      name: 'reviewerAuthorized',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Explicit clinical governance permission; only qualified providers are eligible.' },
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'reviewerAuthorizationExpiresAt',
      type: 'date',
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      saveToJWT: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'GYNECOLOGIST', value: 'provider' },
        { label: 'ADMIN', value: 'admin' },
        { label: 'NURSE', value: 'nurse' },
      ],
      defaultValue: 'provider',
      saveToJWT: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
  ],
}
