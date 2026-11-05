import type { CollectionConfig, Field } from 'payload'
import { specialist } from '../access/clinical'
import { isAppAdmin, isClinicalStaff } from '../lib/workflow-security'
import { governanceFields } from '../lib/workflow-governance'
import { governClinicalContent, maskInactiveGuideline } from '../hooks/clinical-governance'
import { logWorkflowChange } from '../hooks/clinical-audit'

export const GuidelineReferences: CollectionConfig = {
  slug: 'guideline-references',
  admin: { useAsTitle: 'title', group: 'Compliance & Governance' },
  versions: true,
  access: {
    read: ({ req }) => isClinicalStaff(req.user) || isAppAdmin(req.user) ? true : { lifecycle: { equals: 'ACTIVE' } },
    create: specialist, update: specialist, delete: () => false,
  },
  hooks: { beforeChange: [governClinicalContent], afterRead: [maskInactiveGuideline], afterChange: [logWorkflowChange] },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'revisionOf', type: 'relationship', relationTo: 'guideline-references' } as unknown as Field,
    ...governanceFields,
  ],
}
