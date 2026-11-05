export const STAFF = { name: 'Clinical Staff', initials: 'CS', role: 'Staff · OB/GYN' }
export const PATIENTS = [
  { id: 'OB-001', label: 'Simulated patient (OB-001)', note: 'Simulated record' },
  { id: 'OB-002', label: 'Simulated patient (OB-002)', note: 'Simulated record' },
  { id: 'OB-003', label: 'Simulated patient (OB-003)', note: 'Simulated record' },
  { id: 'OB-004', label: 'Simulated patient (OB-004)', note: 'Simulated record' },
]
export const GUIDELINES = [
  {
    org: 'ACOG',
    full: 'American College of Obstetricians and Gynecologists',
    topics: ['Carrier screening', 'Prenatal screening', 'Hereditary cancer'],
    url: 'https://www.acog.org/clinical',
  },
  {
    org: 'NCCN',
    full: 'National Comprehensive Cancer Network',
    topics: ['Hereditary cancer'],
    url: 'https://www.nccn.org/guidelines',
  },
  {
    org: 'ACMG',
    full: 'American College of Medical Genetics and Genomics',
    topics: ['Carrier screening', 'Family history', 'Referral indications'],
    url: 'https://www.acmg.net',
  },
  {
    org: 'SMFM',
    full: 'Society for Maternal-Fetal Medicine',
    topics: ['Prenatal screening', 'Fetal findings'],
    url: 'https://www.smfm.org',
  },
  {
    org: 'ISUOG',
    full: 'International Society of Ultrasound in Obstetrics and Gynecology',
    topics: ['Fetal findings'],
    url: 'https://www.isuog.org',
  },
  {
    org: 'AAP',
    full: 'American Academy of Pediatrics',
    topics: ['Family history'],
    url: 'https://www.aap.org',
  },
]
export const KNOWLEDGE = [
  {
    term: 'First-degree relative',
    body: 'A parent, full sibling or child. These relatives share about half of their DNA with the patient.',
  },
  {
    term: 'Second-degree relative',
    body: 'A grandparent, aunt, uncle, niece, nephew or half-sibling.',
  },
  {
    term: 'Screening vs. diagnostic testing',
    body: 'Screening estimates the chance of a condition. Diagnostic testing is intended to confirm or exclude it.',
  },
  {
    term: 'Carrier',
    body: 'A person with one copy of a gene variant linked to a recessive condition. Carriers are usually unaffected.',
  },
  {
    term: 'Variant of uncertain significance (VUS)',
    body: 'A genetic change whose effect on health is not yet known. A VUS alone is generally not actionable.',
  },
  {
    term: 'Penetrance',
    body: 'The proportion of people with a variant who go on to show the associated condition.',
  },
  {
    term: 'Consanguinity',
    body: 'A reproductive partnership between biological relatives, which can raise the chance of shared recessive variants.',
  },
  {
    term: 'Pedigree',
    body: 'A diagram or structured list of family members and their health conditions across generations.',
  },
]
