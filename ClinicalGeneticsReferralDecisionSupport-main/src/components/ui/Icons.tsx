import { createLucideIcon } from 'lucide-react'

/** Four ascending bars, matching the reports glyph in the navigation. */
export const ChartBars = createLucideIcon('ChartBars', [
  ['path', { d: 'M4.5 20v-4.5', key: 'bar-1' }],
  ['path', { d: 'M9.5 20v-9', key: 'bar-2' }],
  ['path', { d: 'M14.5 20V4', key: 'bar-3' }],
  ['path', { d: 'M19.5 20V7.5', key: 'bar-4' }],
])

/** Pedigree-style family tree: one node branching to three. */
export const FamilyTree = createLucideIcon('FamilyTree', [
  ['circle', { cx: '12', cy: '5', r: '2.5', key: 'root' }],
  ['circle', { cx: '5', cy: '18.5', r: '2.5', key: 'left' }],
  ['circle', { cx: '12', cy: '18.5', r: '2.5', key: 'middle' }],
  ['circle', { cx: '19', cy: '18.5', r: '2.5', key: 'right' }],
  ['path', { d: 'M12 7.5V16M5 16v-3.5h14V16', key: 'links' }],
])

/** Abstract ultrasound scan sector. */
export const UltrasoundScan = createLucideIcon('UltrasoundScan', [
  ['path', { d: 'M3 7.2Q12 3.4 21 7.2L17.4 16Q12 19.6 6.6 16Z', key: 'sector' }],
  ['path', { d: 'M8.4 13.2Q12 15.2 15.6 13.2', key: 'echo' }],
  ['path', { d: 'M10.6 8.4h2.8', key: 'probe' }],
])
