import { Buffer } from 'node:buffer'
import { digest } from './workflow-governance'
import { FORM_FIELDS } from './form-fields'
import { repeated, singular, specs } from './anc-model'
import { parsePedigree, type PedigreePerson } from '../components/clinical/pedigree-model'
import type { WorkflowRecord } from './workflow-store'

const outcomes: Record<string, string> = {
  urgent_referral: 'Urgent referral', routine_referral: 'Routine referral', no_referral_needed: 'No referral needed',
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim()
const validTime = (value: unknown) => nonempty(value) && Number.isFinite(Date.parse(value))

/** Reject incomplete, unsigned, stale or non-synthetic exports, even when called outside the route. */
export function assertReferralExport(workflow: WorkflowRecord) {
  const snapshot = record(workflow.evaluationSnapshot), result = record(snapshot.result), signoff = record(workflow.signoff)
  const { evaluationDigest, evaluatedAt, ...stableSnapshot } = snapshot
  const { timestamp: _timestamp, ...stableResult } = result
  if (workflow.state !== 'FINALIZED' || !Object.hasOwn(outcomes, String(workflow.decision)) ||
    result.decision !== workflow.decision || result.reviewPending !== false || result.containsUnvalidatedCriteria !== false ||
    workflow.patient || !/^SYN-[A-Za-z0-9_-]{1,90}$/.test(workflow.syntheticPatientReference ?? '') ||
    signoff.synthetic !== true || signoff.attested !== true || signoff.role !== 'provider' ||
    !nonempty(signoff.name) || !nonempty(signoff.actor) || signoff.actor !== workflow.actor ||
    !nonempty(signoff.signatureId) || !validTime(signoff.at) || !validTime(evaluatedAt) ||
    !nonempty(evaluationDigest) || !/^[a-f0-9]{64}$/.test(evaluationDigest) || signoff.evaluationDigest !== evaluationDigest ||
    digest({ ...stableSnapshot, result: stableResult }) !== evaluationDigest ||
    digest(snapshot.inputs) !== digest(workflow.assessmentInputs) || digest(snapshot.intake) !== digest(workflow.intake) ||
    digest(snapshot.anc) !== digest(workflow.anc) || digest(snapshot.pedigree) !== digest(workflow.pedigree) ||
    record(snapshot.patient).syntheticPatientReference !== workflow.syntheticPatientReference) {
    throw new Error('Referral export unavailable.')
  }
  return { snapshot, result, signoff }
}

// Standard PDF fonts do not cover all Unicode. Visible ASCII escapes preserve every
// unsupported code point without silently replacing clinical text or needing a font dependency.
function ascii(value: string) {
  return Array.from(value).map((c) => {
    const n = c.codePointAt(0)!
    return n >= 32 && n <= 126 || c === '\n' ? c : `\\u{${n.toString(16).toUpperCase()}}`
  }).join('')
}
const literal = (value: string) => ascii(value).replace(/([\\()])/g, '\\$1')
const label = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase())
const display = (value: unknown): string => value === null || value === undefined || value === '' ? 'Not supplied' :
  typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)

class Pdf {
  pages: string[][] = []
  y = 0
  page() {
    this.pages.push(['0 G 0 g 0.8 w'])
    this.y = 785
    this.at('SYNTHETIC DATA ONLY - NOT FOR REAL PATIENT CARE', 42, this.y, 10, true)
    this.y -= 25
  }
  add(command: string) { this.pages[this.pages.length - 1].push(command) }
  at(text: string, x: number, y: number, size = 10, bold = false) {
    this.add(`BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${literal(text)}) Tj ET`)
  }
  text(text: string, bold = false, size = 10) {
    // Courier's fixed glyph advance makes wrapping exact, including escaped text.
    const width = Math.floor(510 / (size * 0.6))
    for (const paragraph of ascii(text).split('\n')) {
      let remaining = paragraph
      do {
        let end = Math.min(width, remaining.length)
        if (end < remaining.length) {
          const space = remaining.lastIndexOf(' ', end)
          if (space > width / 2) end = space
        }
        if (this.y < 60) this.page()
        this.at(remaining.slice(0, end), 42, this.y, size, bold)
        this.y -= size + 4
        remaining = remaining.slice(end).replace(/^ /, '')
      } while (remaining.length)
    }
  }
  heading(title: string) {
    if (this.y < 105) this.page()
    this.y -= 10
    this.text(title, true, 12)
  }
  line(x: number, y: number, x2: number, y2: number) { this.add(`${x} ${y} m ${x2} ${y2} l S`) }
  finish(): Buffer {
    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>', '',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>',
    ]
    const kids: string[] = []
    this.pages.forEach((commands, i) => {
      this.atFooter(commands, i)
      const pageId = objects.length + 1, streamId = pageId + 1
      kids.push(`${pageId} 0 R`)
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`)
      const stream = commands.join('\n') + '\n'
      objects.push(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}endstream`)
    })
    objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`
    const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')]
    const offsets = [0]
    let length = chunks[0].length
    objects.forEach((obj, i) => {
      offsets.push(length)
      const chunk = Buffer.from(`${i + 1} 0 obj\n${obj}\nendobj\n`, 'ascii')
      chunks.push(chunk); length += chunk.length
    })
    chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`, 'ascii'))
    return Buffer.concat(chunks)
  }
  private atFooter(commands: string[], i: number) {
    commands.push(`BT /F1 9 Tf 1 0 0 1 42 30 Tm (Synthetic referral | Page ${i + 1} of ${this.pages.length}) Tj ET`)
  }
}

function structured(pdf: Pdf, value: unknown, prefix = '') {
  if (Array.isArray(value)) {
    if (!value.length) pdf.text(`${prefix}: None recorded`)
    value.forEach((item, index) => structured(pdf, item, `${prefix} [${index + 1}]`))
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (!entries.length) pdf.text(`${prefix}: Not supplied`)
    for (const [key, item] of entries) structured(pdf, item, prefix ? `${prefix} / ${label(key)}` : label(key))
  } else pdf.text(`${prefix}: ${display(value)}`)
}

function personSymbol(pdf: Pdf, person: PedigreePerson, x: number, y: number, tag: string) {
  const affected = person.conditions.some((c) => c.status === 'affected')
  const carrier = person.conditions.some((c) => c.status === 'carrier')
  const loss = ['miscarriage', 'elective-abortion'].includes(person.outcome)
  pdf.add('q')
  const r = 10, k = 5.523
  let path: string
  if (loss) path = `${x} ${y + r} m ${x - r} ${y - r} l ${x + r} ${y - r} l h`
  else if (person.sex === 'male') path = `${x - r} ${y - r} 20 20 re`
  else if (person.sex === 'female') path = `${x + r} ${y} m ${x + r} ${y + k} ${x + k} ${y + r} ${x} ${y + r} c ${x - k} ${y + r} ${x - r} ${y + k} ${x - r} ${y} c ${x - r} ${y - k} ${x - k} ${y - r} ${x} ${y - r} c ${x + k} ${y - r} ${x + r} ${y - k} ${x + r} ${y} c h`
  else path = `${x} ${y + r} m ${x + r} ${y} l ${x} ${y - r} l ${x - r} ${y} l h`
  pdf.add(`${affected ? '0' : '1'} g ${path} B 0 g`)
  if (carrier) pdf.add(`${affected ? '1' : '0'} g ${x + 2} ${y} m ${x + 2} ${y + 1.1} ${x + 1.1} ${y + 2} ${x} ${y + 2} c ${x - 1.1} ${y + 2} ${x - 2} ${y + 1.1} ${x - 2} ${y} c ${x - 2} ${y - 1.1} ${x - 1.1} ${y - 2} ${x} ${y - 2} c ${x + 1.1} ${y - 2} ${x + 2} ${y - 1.1} ${x + 2} ${y} c h f 0 g`)
  if (person.deceased || person.outcome === 'stillbirth' || person.outcome === 'elective-abortion') pdf.line(x - 14, y - 14, x + 14, y + 14)
  if (person.proband) {
    pdf.line(x - 26, y - 24, x - 12, y - 10)
    pdf.line(x - 12, y - 10, x - 19, y - 12)
    pdf.line(x - 12, y - 10, x - 14, y - 17)
  }
  if (person.consultand) pdf.at('C', x + 15, y + 10, 9)
  if (person.outcome === 'ongoing') {
    pdf.add(`${affected ? '1' : '0'} g`)
    pdf.at('P', x - 3, y - 3, 8)
    pdf.add('0 g')
  }
  if (person.outcome === 'stillbirth') pdf.at('SB', x + 15, y - 4, 8)
  pdf.at(tag, x - 14, y - 30, 9)
  pdf.add('Q')
}

function pedigree(pdf: Pdf, input: unknown) {
  const parsed = parsePedigree(input)
  pdf.page(); pdf.heading('Vector pedigree - family panels')
  pdf.text('Square: male; circle: female; diamond: unknown sex.')
  pdf.text('Filled: affected; central dot: carrier; labels list every condition.')
  pdf.text('Slash: deceased / loss; arrow: proband; C: consultand; P: ongoing.')
  pdf.text('Triangle: miscarriage / termination; SB: stillbirth. See outcome labels.')
  pdf.text('Double partner line: consanguinity; horizontal bar: siblings.')
  pdf.text('Panels repeat people by stable P-number; they are not new individuals.')
  pdf.text('Source verification: pending. Full details in structured appendix.')
  if (!parsed.success) {
    pdf.text('No renderable pedigree; original persisted structure follows in appendix.')
    return
  }
  const model = parsed.data
  const tags = new Map(model.people.map((p, i) => [p.id, `P${i + 1}`]))
  const people = new Map(model.people.map((p) => [p.id, p]))
  const related = new Set(model.families.flatMap((f) => [...f.parents, ...f.children]))
  for (const family of model.families) {
    const groups = Math.max(1, Math.ceil(family.children.length / 5))
    for (let group = 0; group < groups; group++) {
      pdf.page(); pdf.heading(`Family panel ${model.families.indexOf(family) + 1} - part ${group + 1}/${groups}`)
      const parentY = 650, childY = 500
      const xs = family.parents.length === 2 ? [220, 370] : [295]
      family.parents.forEach((id, i) => personSymbol(pdf, people.get(id)!, xs[i], parentY, tags.get(id)!))
      if (xs.length === 2) {
        pdf.line(xs[0] + 10, parentY, xs[1] - 10, parentY)
        if (family.consanguineous) pdf.line(xs[0] + 10, parentY + 4, xs[1] - 10, parentY + 4)
      }
      const children = family.children.slice(group * 5, group * 5 + 5)
      const childXs = children.map((_, i) => children.length === 1 ? 295 : 90 + i * (415 / (children.length - 1)))
      if (children.length) {
        pdf.line(295, parentY, 295, 555)
        pdf.line(Math.min(295, childXs[0]), 555, Math.max(295, childXs[childXs.length - 1]), 555)
        children.forEach((id, i) => {
          pdf.line(childXs[i], 555, childXs[i], childY + 10)
          personSymbol(pdf, people.get(id)!, childXs[i], childY, tags.get(id)!)
        })
      }
      pdf.y = 445
      pdf.text(`Relationship: ${family.id}; consanguineous: ${family.consanguineous ? 'Yes' : 'No'}`)
      for (const id of [...family.parents, ...children]) {
        const p = people.get(id)!
        pdf.text(`${tags.get(id)}: ${p.name}; ID: ${p.id}; generation ${p.generation}; ${p.outcome}; ${p.sex}`)
        pdf.text(`Conditions: ${p.conditions.map((c) => `${c.name} [${c.status}]`).join('; ') || 'None recorded'}`)
      }
    }
  }
  for (const p of model.people.filter((p) => !related.has(p.id))) {
    if (pdf.y < 160) pdf.page()
    pdf.y -= 40
    personSymbol(pdf, p, 65, pdf.y, tags.get(p.id)!)
    pdf.y -= 50
    pdf.text(`${tags.get(p.id)}: ${p.name}; generation ${p.generation}; ${p.outcome}`)
    pdf.text(`Conditions: ${p.conditions.map((c) => `${c.name} [${c.status}]`).join('; ') || 'None recorded'}`)
  }
}

/** Generates actual PDF bytes using only the persisted, signed server workflow. No network or writes. */
export function generateReferralPdf(workflow: WorkflowRecord, generatedAt = new Date()): Buffer {
  const { snapshot, result, signoff } = assertReferralExport(workflow)
  const pdf = new Pdf()
  pdf.page(); pdf.heading('Clinical genetics referral decision summary')
  pdf.text('SYNTHETIC / SIMULATION NOTICE: not a real patient referral or clinical order.')
  pdf.text('Unsupported font characters use reversible Unicode escapes: \\u{HEX}.')
  pdf.text(`Generated at (UTC): ${generatedAt.toISOString()}`)
  pdf.text(`Synthetic reference: ${workflow.syntheticPatientReference}`)
  pdf.text(`Workflow: ${workflow.workflowKey}; revision: ${workflow.revision}; FINALIZED`)
  pdf.text(`Pathway: ${workflow.pathwaySlug}`)
  pdf.heading(`Signed outcome: ${outcomes[workflow.decision!]}`)
  for (const key of ['referralTarget', 'rationale', 'recommendedTimeframe', 'recommendedWorkup', 'reasonCode', 'engineVersion', 'timestamp']) {
    pdf.text(`${label(key)}: ${display(result[key])}`)
  }
  pdf.heading('Matched criteria, reasoning and guideline version citations')
  structured(pdf, result.matchedCriteria, 'Matched criteria')
  structured(pdf, result.guidelineCitations, 'Guideline citations')
  structured(pdf, result.sourceCitations, 'Source citations')
  structured(pdf, result.criteriaVersions, 'Criteria versions')
  pdf.heading('Reviewer signoff and attestation')
  structured(pdf, signoff)
  pdf.text(`Evaluation digest: ${snapshot.evaluationDigest}`)
  pdf.text(`Evaluated at: ${snapshot.evaluatedAt}`)
  pdf.heading('Clinical intake and history')
  structured(pdf, workflow.intake)
  pdf.heading('Clinical assessment inputs (labels and stored values)')
  const fields = FORM_FIELDS[workflow.pathwaySlug] ?? []
  for (const field of fields) {
    const value = workflow.assessmentInputs[field.key]
    const option = field.options?.find(([key]) => key === value)
    pdf.text(`${field.label} [${field.key}]: ${option ? `${option[1]} (${value})` : display(value)}`)
  }
  for (const [key, value] of Object.entries(workflow.assessmentInputs)) {
    if (!fields.some((field) => field.key === key)) structured(pdf, value, label(key))
  }
  pdf.heading('Routine ANC, history and investigations')
  const anc = record(workflow.anc)
  pdf.text(`Source verification: ${display(anc.sourceVerification)}`)
  pdf.text(`Allergies status: ${display(anc.allergiesStatus)}`)
  for (const section of [...singular, ...repeated]) {
    pdf.heading(label(section))
    const rows = Array.isArray(anc[section]) ? anc[section] as unknown[] : [anc[section]]
    if (!rows.length) pdf.text('None recorded')
    rows.forEach((row, index) => {
      if (Array.isArray(anc[section])) pdf.text(`Entry ${index + 1}; ID: ${display(record(row).id)}`, true)
      for (const spec of specs(section)) pdf.text(`${spec.label}: ${display(record(row)[spec.key])}`)
    })
  }
  pdf.text('Investigation documents are metadata only. No attachments retrieved or verified.')
  pedigree(pdf, workflow.pedigree)
  pdf.page(); pdf.heading('Appendix A - complete structured pedigree')
  structured(pdf, workflow.pedigree)
  pdf.heading('Appendix B - persisted evaluation and guideline provenance')
  structured(pdf, snapshot)
  pdf.heading('Appendix C - review note')
  pdf.text(display(workflow.reviewNote))
  return pdf.finish()
}
