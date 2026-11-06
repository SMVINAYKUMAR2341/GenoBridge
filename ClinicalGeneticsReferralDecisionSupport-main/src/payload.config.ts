import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { en as adminLanguage } from '@payloadcms/translations/languages/en'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { ClinicalPathways } from './collections/ClinicalPathways'
import { ClinicalCriteria } from './collections/ClinicalCriteria'
import { Patients } from './collections/Patients'
import { Assessments } from './collections/Assessments'
import { AuditLogs } from './collections/AuditLogs'
import { Users } from './collections/Users'
import { ClinicalWorkflows } from './collections/ClinicalWorkflows'
import { GuidelineReferences } from './collections/GuidelineReferences'
import { GovernanceCommands } from './collections/GovernanceCommands'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [],
      defaultLayout: [
        { widgetSlug: 'activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgresql://genobridge_app:genobridge_dev_password_2026@localhost:5432/genobridge_staging',
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DATABASE_URI?.includes('sslmode=require') || process.env.DATABASE_URI?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    },
    idType: 'uuid',
  }),
  secret: process.env.PAYLOAD_SECRET || 'GENOBRIDGE-dev-secret-key-change-in-production-min-32-chars',
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en: adminLanguage },
  },
  collections: [
    Admins,
    Media,
    Folders,
    Tags,
    ClinicalPathways,
    ClinicalCriteria,
    Patients,
    Assessments,
    AuditLogs,
    Users,
    ClinicalWorkflows,
    GuidelineReferences,
    GovernanceCommands,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
})
