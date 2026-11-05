const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes("export const dynamic = 'force-dynamic'")) {
        if (content.startsWith("'use client'")) {
          content = content.replace("'use client'", "'use client'\n\nexport const dynamic = 'force-dynamic'");
        } else {
          content = "export const dynamic = 'force-dynamic'\n\n" + content;
        }
        fs.writeFileSync(fullPath, content);
        console.log('Added force-dynamic to:', fullPath);
      }
    }
  }
}

processDir('ClinicalGeneticsReferralDecisionSupport-main/src/app/(frontend)/(app)');
