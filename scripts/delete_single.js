const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
let token = '';
for (const line of lines) {
  if (line.trim().startsWith('FB_PAGE_ACCESS_TOKEN=')) {
    token = line.trim().substring('FB_PAGE_ACCESS_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
  }
}

const targetId = process.argv[2] || '122107918581485169';

async function main() {
  console.log('Menghapus postingan ID:', targetId);
  const res = await fetch(`https://graph.facebook.com/v21.0/${targetId}?access_token=${token}`, { method: 'DELETE' });
  const data = await res.json();
  console.log('Hasil penghapusan:', data);
}

main().catch(console.error);
