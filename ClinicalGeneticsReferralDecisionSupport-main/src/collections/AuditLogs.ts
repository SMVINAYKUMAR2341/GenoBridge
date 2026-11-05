import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'
import { cmsAdmin } from '../access/clinical'
import { commandFor } from '../lib/workflow-security'

const afterChangeAudit: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  invalidateClinicalCache([CACHE_TAGS.auditLogs], ['/'])
  return doc
}

const afterDeleteAudit: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  invalidateClinicalCache([CACHE_TAGS.auditLogs], ['/'])
  return doc
}

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'eventCode',
    defaultColumns: [
      'eventCode',
      'actorName',
      'actorRole',
      'actionType',
      'resourceRef',
      'createdAt',
    ],
    group: 'Compliance & Governance',
  },
  access: {
    read: cmsAdmin,
    create: ({ req }) => commandFor(req)?.kind === 'audit',
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeDelete: [() => { throw new Error('Audit history cannot be deleted.') }],
    beforeChange: [({ req, data, operation }) => {
      if (operation !== 'create' || commandFor(req)?.kind !== 'audit') throw new Error('Audit history is immutable and server-authored.')
      return data
    }],
    afterChange: [afterChangeAudit],
    afterDelete: [afterDeleteAudit],
  },
  fields: [
    {
      name: 'eventCode',
      type: 'text',
      required: true,
    },
    {
      name: 'actorName',
      type: 'text',
      required: true,
    },
    {
      name: 'actorRole',
      type: 'select',
      required: true,
      options: [
        { label: 'OB/GYN Provider', value: 'OB/GYN Provider' },
        { label: 'Nurse / MA', value: 'Nurse / MA' },
        { label: 'Genetic Counselor', value: 'Genetic Counselor' },
        { label: 'Specialist Admin', value: 'Specialist Admin' },
        { label: 'Clinic Administrator', value: 'Clinic Administrator' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'actionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Staff Permissions Changed', value: 'STAFF_ACCESS_CHANGED' },
        { label: 'PHI Record Access', value: 'PHI_ACCESS' },
        { label: 'Assessment Logged', value: 'ASSESSMENT_SAVED' },
        { label: 'Referral Order Generated', value: 'REFERRAL_GENERATED' },
        { label: 'Clinical Criterion Modified', value: 'CRITERIA_UPDATED' },
        { label: 'Clinical Criterion Validated', value: 'CRITERIA_VALIDATED' },
        { label: 'De-Identified Metrics Viewed', value: 'METRICS_EXPORT' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'resourceRef',
      type: 'text',
      required: true,
    },
    {
      name: 'details',
      type: 'textarea',
      required: true,
    },
    {
      name: 'encryptionVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
