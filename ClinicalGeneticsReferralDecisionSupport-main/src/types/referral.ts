export type ReferralUrgencyTier =
  | 'ROUTINE'          // >2 weeks - low risk, standard monitoring
  | 'EXPEDITED'        // 1-2 weeks - positive screen, stable, no anomalies, GA<22w
  | 'URGENT'           // 3-5 days - positive + soft markers present
  | 'TIME_CRITICAL'    // 48-72 hours - positive + structural anomaly OR GA>22w
  | 'SAME_DAY'         // <24 hours - positive + major anomaly + GA>24w
  | 'COUNSEL_AND_REASSESS'  // monitor, re-screen

export interface TriggeringCriterion {
  criterion: string
  urgency?: string
  action?: string
  note?: string
  citation?: string
}

export interface Counterfactual {
  factor: string
  current: string
  alternative: string
  resulting_tier: string
  explanation: string
}

export interface ReferralDecision {
  tier: ReferralUrgencyTier
  timeframeLabel: string       // human-readable, generated from tier
  timeframeHours: string       // e.g. "within 1-2 weeks"
  referralTarget: string[]     // e.g. ["MFM", "Prenatal Genetic Counselor"]
  ruleId: string
  guidelineMatch: number       // 0-100
  isUrgent: boolean            // tier === 'TIME_CRITICAL' || tier === 'SAME_DAY'
  triggeringCriteria: TriggeringCriterion[]
  counterfactuals: Counterfactual[]
}

export interface TierDisplayConfig {
  label: string
  sublabel: string
  color: string
  badge: string
  icon: string
  isUrgent: boolean
}

export const TIER_DISPLAY: Record<ReferralUrgencyTier, TierDisplayConfig> = {
  SAME_DAY: {
    label: 'Same-Day Emergency Referral',
    sublabel: 'Within 24 hours',
    color: 'bg-red-700',
    badge: 'EMERGENCY',
    icon: '🚨',
    isUrgent: true,
  },
  TIME_CRITICAL: {
    label: 'Time-Critical Clinical Referral',
    sublabel: '< 48–72 hours',
    color: 'bg-red-600',
    badge: 'URGENT',
    icon: '⚠️',
    isUrgent: true,
  },
  URGENT: {
    label: 'Urgent Referral Recommended',
    sublabel: 'Within 3–5 days',
    color: 'bg-orange-600',
    badge: 'URGENT',
    icon: '⚠️',
    isUrgent: true,
  },
  EXPEDITED: {
    label: 'Expedited Referral Recommended',
    sublabel: 'Within 1–2 weeks',
    color: 'bg-amber-600',
    badge: 'EXPEDITED',
    icon: 'ℹ️',
    isUrgent: false,
  },
  ROUTINE: {
    label: 'Routine Monitoring',
    sublabel: 'No referral required',
    color: 'bg-emerald-600',
    badge: 'LOW RISK',
    icon: '✓',
    isUrgent: false,
  },
  COUNSEL_AND_REASSESS: {
    label: 'Counsel & Reassess',
    sublabel: 'Follow-up recommended',
    color: 'bg-blue-600',
    badge: 'MONITOR',
    icon: 'ℹ️',
    isUrgent: false,
  },
}

