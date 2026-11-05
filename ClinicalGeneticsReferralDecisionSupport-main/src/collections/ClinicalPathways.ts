import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'
import { CACHE_TAGS, invalidateClinicalCache } from '../lib/cache'
import { specialist } from '../access/clinical'

const afterChangePathway: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.pathways]
  const paths = ['/']
  if (doc?.slug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.slug))
    paths.push(`/pathways/${doc.slug}`)
  }
  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    tags.push(CACHE_TAGS.pathwaySlug(previousDoc.slug))
    paths.push(`/pathways/${previousDoc.slug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

const afterDeletePathway: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const tags: string[] = [CACHE_TAGS.pathways]
  const paths = ['/']
  if (doc?.slug) {
    tags.push(CACHE_TAGS.pathwaySlug(doc.slug))
    paths.push(`/pathways/${doc.slug}`)
  }
  invalidateClinicalCache(tags, paths)
  return doc
}

export const ClinicalPathways: CollectionConfig = {
  slug: 'clinical-pathways',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'shortCode', 'category', 'primaryGuidelines'],
    group: 'Clinical Decision Support',
  },
  access: {
    read: () => true,
    create: specialist,
    update: specialist,
    delete: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    afterChange: [afterChangePathway],
    afterDelete: [afterDeletePathway],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'title',
    },
    {
      name: 'shortCode',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Gynecologic & Hereditary Oncology', value: 'gynecology' },
        { label: 'Obstetrics & Prenatal Diagnostics', value: 'obstetrics' },
        { label: 'Reproductive & Family Genetics', value: 'reproductive-genetics' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'estimatedSeconds',
      type: 'number',
      required: true,
      defaultValue: 75,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'primaryGuidelines',
      type: 'text',
      required: true,
    },
    {
      name: 'defaultReferralTargetRoutine',
      type: 'text',
      required: true,
    },
    {
      name: 'defaultReferralTargetUrgent',
      type: 'text',
      required: true,
    },
    {
      name: 'clinicalPearls',
      type: 'array',
      fields: [
        {
          name: 'term',
          type: 'text',
          required: true,
        },
        {
          name: 'plainExplanation',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
