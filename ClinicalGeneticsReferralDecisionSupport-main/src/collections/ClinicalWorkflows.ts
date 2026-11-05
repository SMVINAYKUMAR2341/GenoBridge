import type { CollectionConfig, Field } from 'payload'
import { serverOwned, workflowCreate, workflowRead } from '../access/clinical'
import { enforceClinicalWorkflow } from '../hooks/clinical-workflow'
import { logRecordRead, logWorkflowChange } from '../hooks/clinical-audit'

export const ClinicalWorkflows: CollectionConfig = {
  slug: 'clinical-workflows',
  admin: { useAsTitle: 'workflowKey', group: 'Patient PHI & Records', description: 'Append-only revisions. Edit through clinical workflow actions.' },
  access: { read: workflowRead, create: workflowCreate, update: () => false, delete: () => false },
  hooks: {
    // Derive required server-owned fields before Payload field validation.
    beforeValidate: [enforceClinicalWorkflow],
    beforeDelete: [() => { throw new Error('Workflow history cannot be deleted.') }],
    afterRead: [logRecordRead], afterChange: [logWorkflowChange],
  },
  fields: [
    { name: 'workflowKey', type: 'text', index: true },
    { name: 'revision', type: 'number' },
    // Uniqueness on this NEW collection is the concurrency boundary: only one
    // revision can consume a predecessor, including two simultaneous signoffs.
    { name: 'revisionKey', type: 'text', unique: true, required: true },
    { name: 'state', type: 'select', options: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'FINALIZED'], index: true },
    { name: 'patient', type: 'relationship', relationTo: 'patients' },
    { name: 'syntheticPatientReference', type: 'text' },
    { name: 'pathwaySlug', type: 'text', index: true },
    ...['intake', 'pedigree', 'anc', 'assessmentInputs', 'evaluationSnapshot', 'signoff'].map((name): Field => ({ name, type: 'json' })),
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'decision', type: 'text', index: true },
    { name: 'reviewNote', type: 'textarea' },
  ].map((field): Field => ({ ...field, access: { create: serverOwned, update: () => false } } as Field)),
}
