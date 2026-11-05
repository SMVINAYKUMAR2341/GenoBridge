const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:\\Users\\AsusUser\\.gemini\\antigravity\\brain\\d627de7a-8af9-4a29-85fd-bd567f9b7894\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('"step_index":422')) {
      const data = JSON.parse(line);
      let content = data.content;
      content = content.replace(/<\/?USER_REQUEST>/g, '').trim();
      fs.writeFileSync('C:\\Users\\AsusUser\\New folder\\Downloads\\ClinicalGeneticsReferralDecisionSupport-main\\landing-page\\user_pasted.html', content, 'utf8');
      console.log('Saved user_pasted.html, length:', content.length);
      break;
    }
  }
}
extract();

