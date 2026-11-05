import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './payload'
import { CACHE_TAGS } from './cache'

export const getClinicalCatalog = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const [pathways, criteria] = await Promise.all([
      payload.find({
        collection: 'clinical-pathways',
        overrideAccess: false,
        limit: 50,
        sort: 'createdAt',
        depth: 0,
      }),
      payload.find({
        collection: 'clinical-criteria',
        overrideAccess: false,
        limit: 100,
        sort: 'code',
        depth: 0,
      }),
    ])
    return {
      pathways: pathways.docs,
      criteria: criteria.docs.map((c) => ({
        ...c,
        validationStatus: c.approvalAttested
          ? c.validationStatus
          : ('unvalidated_placeholder' as const),
        reviewedBySpecialist: c.approvalAttested ? c.reviewedBySpecialist : null,
        lastReviewedAt: c.approvalAttested ? c.lastReviewedAt : null,
      })),
    }
  },
  ['public-clinical-catalog-v3'],
  { tags: [CACHE_TAGS.pathways, CACHE_TAGS.criteria] },
)
