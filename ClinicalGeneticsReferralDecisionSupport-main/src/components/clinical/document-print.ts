/** Browser-only exports. No upload, persistence, or PDF-generation service. */
export function downloadSvg(svg: SVGSVGElement, filename = 'pedigree.svg'): void {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function escapeDocumentText(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}
/** Opens a dedicated print view. The user chooses Print / Save as PDF in their browser. */
export function printClinicalDocument(title: string, content: SVGSVGElement | string): boolean {
  const popup = window.open('', '_blank', 'width=1100,height=800')
  if (!popup) return false
  popup.opener = null
  const body =
    typeof content === 'string'
      ? `<pre>${escapeDocumentText(content)}</pre>`
      : new XMLSerializer().serializeToString(content)
  popup.document.open()
  popup.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeDocumentText(title)}</title><style>body{font:14px system-ui;color:#0b1220;margin:24px}svg{width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}button{padding:10px} @page{size:landscape;margin:12mm}@media print{button{display:none}body{margin:0}}</style></head><body><button type="button">Print / Save as PDF</button><h1>${escapeDocumentText(title)}</h1><p>Clinical preview · source PDFs unavailable; pending source verification. Not clinically validated.</p>${body}</body></html>`,
  )
  popup.document.close()
  popup.document.querySelector('button')?.addEventListener('click', () => popup.print())
  popup.focus()
  return true
}
