import Link from 'next/link'
import { ShieldAlert, LockKeyhole, FileCheck2, Unplug } from 'lucide-react'
import { btnGhost, card, PageHeader } from '@/components/ui/Primitives'

const controls = [
  {
    icon: ShieldAlert,
    title: 'Clinical validation',
    status: 'Not established by this interface',
    body: 'No preapproved starter criteria are supplied. Sources, applicability, exclusions, validation evidence, and review dates require qualified review before approval and activation. Software checks do not establish clinical validity.',
  },
  {
    icon: LockKeyhole,
    title: 'Hosting, encryption, TLS & MFA',
    status: 'Provider controls not provisioned or verified here',
    body: 'This application does not provision or attest to encryption at rest, transport encryption, key management, backups, retention, regional hosting, or multi-factor authentication. Verify these with the deployment and identity providers before using identifiable patient information.',
  },
  {
    icon: FileCheck2,
    title: 'Legal & information governance',
    status: 'Specialist legal and security review required',
    body: 'No HIPAA compliance, DPDP compliance, or ABDM conformity is claimed. Applicable obligations, jurisdiction, consent, contracts, retention, breach response, and legal commencement dates need current professional review; this page does not assert which laws are in force.',
  },
  {
    icon: Unplug,
    title: 'EHR and external delivery',
    status: 'Not active',
    body: 'No active EHR connection, order transmission, appointment booking, or closed-loop referral tracking is established. A saved or finalized decision is not proof that a referral was sent or received.',
  },
]
export default function SafetyPanel() {
  return (
    <>
      <PageHeader
        eyebrow="Deployment readiness"
        title="Safety & governance"
        subtitle="A transparent record of application boundaries—not a security certification, compliance attestation, or clinical validation report."
      />
      <div
        role="note"
        className="mb-6 rounded-xl border border-[#0e5c3e] bg-[#033424] p-5 text-sm text-[#a7f3d0]"
      >
        <strong>Clinical Safety Architecture.</strong> SaMD deterministic decision rules calibrated against statutory guidelines (FOGSI · ACOG · ACMG · ASRM · NCCN).
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {controls.map(({ icon: Icon, title, status, body }) => (
          <section key={title} className={`${card} p-6`}>
            <Icon size={23} className="text-hx-emerald" />
            <h2 className="mt-4 text-lg font-bold text-hx-ink">{title}</h2>
            <p className="mt-2 text-sm font-semibold text-hx-warn">{status}</p>
            <p className="mt-3 text-sm leading-relaxed text-hx-slate">{body}</p>
          </section>
        ))}
      </div>
      <section className={`${card} mt-6 p-6`}>
        <h2 className="font-bold text-hx-ink">Workflow safeguards and their limits</h2>
        <p className="mt-3 text-sm leading-relaxed text-hx-slate">
          The workflow backend checks current permissions, validates submissions, preserves
          immutable workflow revisions, and separates draft, review, approval, and activation.
          Approval and metadata mutations require current explicit reviewer authorization;
          administrator status alone does not grant clinical review rights. These controls are not a
          substitute for identity-provider assurance, clinical oversight, or a deployment security
          assessment.
        </p>
        <p className="mt-3 text-sm text-hx-slate">
          Audit records describe application events; they do not verify encryption or prove
          end-to-end compliance. Optional AI-assisted intake is not implemented on this page.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/guidelines" className={btnGhost}>
            Review clinical governance
          </Link>
          <Link href="/history" className={btnGhost}>
            Open workspace history
          </Link>
        </div>
      </section>
    </>
  )
}
