import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
} from 'payload'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'
import { specialist, approvalField } from '../access/clinical'
import { governanceFields } from '../lib/workflow-governance'
import { governClinicalContent, maskUntrustedCriterion } from '../hooks/clinical-governance'
import { logWorkflowChange } from '../hooks/clinical-audit'

const afterChangeCriteria: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.criteria, CACHE_TAGS.pathways]
  const paths = ['/']
  if (doc?.pathwaySlug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.pathwaySlug))
    paths.push(`/pathways/${doc.pathwaySlug}`)
  }
  if (previousDoc?.pathwaySlug && previousDoc.pathwaySlug !== doc?.pathwaySlug) {
    tags.push(CACHE_TAGS.pathwaySlug(previousDoc.pathwaySlug))
    paths.push(`/pathways/${previousDoc.pathwaySlug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

const afterDeleteCriteria: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.criteria, CACHE_TAGS.pathways]
  const paths = ['/']
  if (doc?.pathwaySlug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.pathwaySlug))
    paths.push(`/pathways/${doc.pathwaySlug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

export const ClinicalCriteria: CollectionConfig = {
  slug: 'clinical-criteria',
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'code',
      'title',
      'pathwaySlug',
      'urgencyOutcome',
      'validationStatus',
      'versionNumber',
    ],
    group: 'Clinical Decision Support',
  },
  versions: true,
  access: {
    read: () => true,
    create: specialist,
    update: specialist,
    delete: () => false,
  },
  hooks: {
    beforeChange: [governClinicalContent],
    afterRead: [maskUntrustedCriterion],
    afterChange: [logWorkflowChange, afterChangeCriteria],
    afterDelete: [afterDeleteCriteria],
  },
  fields: [
    ...governanceFields,
    { name: 'guideline', type: 'relationship', relationTo: 'guideline-references' } as unknown as Field,
    { name: 'revisionOf', type: 'relationship', relationTo: 'clinical-criteria' },
    {
      name: 'conditions',
      type: 'json',
      admin: {
        description:
          'Optional trigger override: array of {field, equals}. All conditions must match. Review in the specialist workflow.',
      },
    },
    {
      name: 'approvalAttested',
      type: 'checkbox',
      defaultValue: false,
      access: { create: approvalField, update: approvalField },
      admin: {
        readOnly: true,
        description:
          'Explicit specialist attestation. Sample review labels are not clinical approval.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
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
      name: 'triggerKey',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'urgencyOutcome',
      type: 'select',
      required: true,
      options: [
        { label: 'Urgent Referral', value: 'urgent' },
        { label: 'Routine Referral', value: 'routine' },
        { label: 'Borderline — Further Consideration', value: 'borderline' },
        { label: 'No Referral Needed', value: 'none' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'referralTarget',
      type: 'text',
      required: true,
    },
    {
      name: 'plainLanguageRationale',
      type: 'textarea',
      required: true,
    },
    {
      name: 'guidelineCitation',
      type: 'text',
      required: true,
    },
    {
      name: 'jargonTip',
      type: 'textarea',
    },
    {
      name: 'recommendedWorkup',
      type: 'textarea',
    },
    {
      name: 'versionNumber',
      type: 'text',
      required: true,
      defaultValue: '1.0',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'validationStatus',
      type: 'select',
      required: true,
      defaultValue: 'unvalidated_placeholder',
      hooks: {
        afterRead: [
          ({ value, siblingData }) =>
            siblingData.approvalAttested ? value : 'unvalidated_placeholder',
        ],
      },
      options: [
        { label: 'Clinically Validated (Approved)', value: 'validated' },
        { label: 'NOT YET CLINICALLY VALIDATED (Placeholder)', value: 'unvalidated_placeholder' },
        { label: 'Under Specialist Review', value: 'under_review' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reviewedBySpecialist',
      type: 'text',
      hooks: {
        afterRead: [({ value, siblingData }) => (siblingData.approvalAttested ? value : null)],
      },
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'versionNotes',
      type: 'textarea',
    },
  ],
}
