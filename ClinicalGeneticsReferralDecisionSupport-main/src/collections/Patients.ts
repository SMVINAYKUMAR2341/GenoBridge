import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'
import { clinicalStaff } from '../access/clinical'
import { logRecordRead } from '../hooks/clinical-audit'

const afterChangePatient: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  invalidateClinicalCache([CACHE_TAGS.patients], ['/'])
  return doc
}

const afterDeletePatient: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  invalidateClinicalCache([CACHE_TAGS.patients], ['/'])
  return doc
}

export const Patients: CollectionConfig = {
  slug: 'patients',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'mrn', 'age', 'pregnancyStatus', 'gestationalAgeWeeks'],
    group: 'Patient PHI & Records',
  },
  access: {
    read: clinicalStaff,
    create: clinicalStaff,
    update: clinicalStaff,
    delete: () => false,
  },
  hooks: {
    afterRead: [logRecordRead],
    afterChange: [afterChangePatient],
    afterDelete: [afterDeletePatient],
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'mrn',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dob',
      type: 'text',
      required: true,
    },
    {
      name: 'age',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'pregnancyStatus',
      type: 'select',
      required: true,
      options: [
        { label: 'Pregnant — 1st Trimester', value: 'pregnant_first_trimester' },
        { label: 'Pregnant — 2nd Trimester', value: 'pregnant_second_trimester' },
        { label: 'Pregnant — 3rd Trimester', value: 'pregnant_third_trimester' },
        { label: 'Preconception Planning', value: 'preconception' },
        { label: 'Not Currently Pregnant (Gynecology)', value: 'not_pregnant' },
        { label: 'Postpartum', value: 'postpartum' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'gestationalAgeWeeks',
      type: 'number',
    },
    {
      name: 'gravidaPara',
      type: 'text',
    },
    {
      name: 'ancestryNotes',
      type: 'text',
    },
    {
      name: 'intakeSummary',
      type: 'textarea',
    },
    {
      name: 'intakeCompletedBy',
      type: 'text',
    },
  ],
}
