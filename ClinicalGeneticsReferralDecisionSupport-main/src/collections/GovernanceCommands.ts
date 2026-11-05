import type { CollectionConfig } from 'payload'
import { commandFor, isReviewer } from '../lib/workflow-security'

// Internal immutable concurrency receipts, not a user-facing record store.
export const GovernanceCommands: CollectionConfig = {
  slug: 'governance-commands',
  admin: { hidden: true },
  access: {
    read: () => false,
    create: ({ req }) => isReviewer(req.user) && commandFor(req)?.kind === 'governance',
    update: () => false, delete: () => false,
  },
  hooks: { beforeChange: [({ req, data, operation }) => {
    if (operation !== 'create' || !isReviewer(req.user) || commandFor(req)?.kind !== 'governance') throw new Error('Internal governance receipt only.')
    return data
  }] },
  fields: [
    { name: 'commandKey', type: 'text', required: true, unique: true },
    { name: 'target', type: 'text', required: true },
    { name: 'actor', type: 'relationship', relationTo: 'users', required: true },
  ],
}
