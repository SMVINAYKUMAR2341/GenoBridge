import { revalidateTag } from 'next/cache'
import { genoBridgeCache } from './postgres-cache'

export { genoBridgeCache }

export const CACHE_TAGS = {
  pathways: 'clinical-pathways',
  criteria: 'clinical-criteria',
  patients: 'patients',
  assessments: 'assessments',
  auditLogs: 'audit-logs',
  userSession: (userId: string) => `user-session-${userId}`,
  pathwaySlug: (slug: string) => `pathway-${slug}`,
} as const

export function invalidateClinicalCache(tags: string[], _paths: string[] = ['/']) {
  // 1. Invalidate PostgreSQL & RAM multi-tier cache
  genoBridgeCache.invalidateTags(tags).catch(() => {})

  // 2. Invalidate Next.js edge tags
  try {
    for (const tag of tags) {
      revalidateTag(tag, { expire: 0 })
    }
  } catch (error) {
    // CLI data operations have no Next cache context; make failures visible.
    console.warn(
      'Clinical cache invalidation unavailable in this execution context.',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
}
