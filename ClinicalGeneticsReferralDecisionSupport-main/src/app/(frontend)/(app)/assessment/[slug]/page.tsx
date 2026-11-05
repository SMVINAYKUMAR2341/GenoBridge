import { notFound } from 'next/navigation'
import AssessmentFlow from '@/components/assessment/AssessmentFlow'
import { PATHWAYS, pathwayBySlug } from '@/data/pathways'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return PATHWAYS.map(({ slug }) => ({ slug }))
}

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pathway = pathwayBySlug(slug)
  if (!pathway) notFound()
  // Patient/workflow reads occur after authorized client hydration, not at build time.
  return <AssessmentFlow pathway={pathway} />
}
