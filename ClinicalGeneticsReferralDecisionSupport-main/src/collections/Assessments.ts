import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  FieldAccess,
} from 'payload'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'
import { clinicalStaff } from '../access/clinical'
import { logRecordRead, logWorkflowChange } from '../hooks/clinical-audit'

const workflowWrite: FieldAccess = ({ req }) =>
  req.user?.collection === 'users' && req.context.assessmentWorkflow === true
const immutableField: FieldAccess = () => false
const snapshotAccess = { create: workflowWrite, update: immutableField }

const afterChangeAssessment: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.assessments]
  const paths = ['/']
  if (doc?.pathwaySlug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.pathwaySlug))
    paths.push(`/pathways/${doc.pathwaySlug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

const afterDeleteAssessment: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.assessments]
  const paths = ['/']
  if (doc?.pathwaySlug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.pathwaySlug))
    paths.push(`/pathways/${doc.pathwaySlug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

export const Assessments: CollectionConfig = {
  slug: 'assessments',
  admin: {
    useAsTitle: 'assessmentCode',
    defaultColumns: [
      'assessmentCode',
      'patientName',
      'pathwayTitle',
      'decision',
      'referralTarget',
      'createdAt',
    ],
    group: 'Patient PHI & Records',
  },
  access: {
    read: clinicalStaff,
    // Legacy snapshots are retained read-only. New work uses clinical-workflows.
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    afterRead: [logRecordRead],
    beforeChange: [
      () => { throw new Error('Legacy assessments are read-only. Use the versioned clinical workflow.') },
    ],
    afterChange: [logWorkflowChange, afterChangeAssessment],
    afterDelete: [afterDeleteAssessment],
  },
  fields: [
    {
      name: 'patient',
      access: snapshotAccess,
      type: 'relationship',
      relationTo: 'patients',
      admin: {
        description:
          'Stable patient link for new assessments. Older records retain their MRN snapshot.',
      },
    },
    {
      name: 'assessmentCode',
      access: snapshotAccess,
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'patientMrn',
      access: snapshotAccess,
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'patientName',
      access: snapshotAccess,
      type: 'text',
      required: true,
    },
    {
      name: 'patientAge',
      type: 'number',
    },
    {
      name: 'gestationalContext',
      type: 'text',
    },
    {
      name: 'pathwaySlug',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Hereditary Cancer Risk', value: 'hereditary-cancer-risk' },
        { label: 'Preconception Carrier Screening', value: 'preconception-carrier-screening' },
        { label: 'NIPT Results', value: 'nipt-results' },
        { label: 'Abnormal Ultrasound Findings', value: 'abnormal-ultrasound-findings' },
        {
          label: 'Infertility / Recurrent Pregnancy Loss',
          value: 'infertility-recurrent-pregnancy-loss',
        },
        { label: 'Positive Family History of Genetic Disorder', value: 'positive-family-history' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'pathwayTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'decision',
      access: snapshotAccess,
      type: 'select',
      required: true,
      options: [
        { label: 'Urgent Referral', value: 'urgent_referral' },
        { label: 'Routine Referral', value: 'routine_referral' },
        { label: 'Borderline — Further Consideration', value: 'borderline_consideration' },
        { label: 'No Referral Needed', value: 'no_referral_needed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'referralTarget',
      access: snapshotAccess,
      type: 'text',
      required: true,
    },
    {
      name: 'rationale',
      access: snapshotAccess,
      type: 'textarea',
      required: true,
    },
    {
      name: 'guidelineCitations',
      access: snapshotAccess,
      type: 'text',
      required: true,
    },
    {
      name: 'triggeredCriteriaCodes',
      access: snapshotAccess,
      type: 'text',
    },
    {
      name: 'containsUnvalidatedCriteria',
      access: snapshotAccess,
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'clinicalInputsSummary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'structuredInputsJson',
      type: 'json',
    },
    {
      name: 'actionTaken',
      access: snapshotAccess,
      type: 'select',
      required: true,
      options: [
        { label: 'Referral Order Generated', value: 'referral_generated' },
        { label: 'Saved — No Referral Needed', value: 'logged_no_referral' },
        { label: 'Logged — Borderline Watchlist / Consult', value: 'borderline_watchlist' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'referralOrderSummary',
      access: snapshotAccess,
      type: 'textarea',
    },
    {
      name: 'providerName',
      access: snapshotAccess,
      type: 'text',
      required: true,
    },
    {
      name: 'providerRole',
      access: snapshotAccess,
      type: 'select',
      required: true,
      defaultValue: 'obgyn_provider',
      options: [
        { label: 'OB/GYN Provider', value: 'obgyn_provider' },
        { label: 'Nurse / Medical Assistant', value: 'nurse_ma' },
        { label: 'Genetic Counselor', value: 'genetic_counselor' },
        { label: 'Clinic Administrator', value: 'clinic_admin' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'durationSeconds',
      type: 'number',
    },
  ],
}
