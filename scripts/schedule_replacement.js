const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
let token = '', pageId = '';
for (const line of lines) {
  if (line.trim().startsWith('FB_PAGE_ACCESS_TOKEN=')) {
    token = line.trim().substring('FB_PAGE_ACCESS_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
  }
  if (line.trim().startsWith('FB_PAGE_ID=')) {
    pageId = line.trim().substring('FB_PAGE_ID='.length).trim().replace(/^["']|["']$/g, '');
  }
}

const imagePath = path.join(__dirname, '..', 'public', 'images', 'card_daun_kuning.jpg');
const caption = `🌴 Daun sawit menguning atau pelepah memendek? Jangan buru-buru vonis penyakit jamur! 💡

Kenali 2 penyebab utamanya di lapangan:
📌 Kurang Magnesium (Mg): Pelepah tua menguning hingga muncul bintik oranye (orange spotting) akibat keasaman tanah piringan.
📌 Kurang Boron (B): Ujung anak daun keriting kaku dan bakal buah rontok sebelum mekar.

Solusi dasar: Gemburkan tanah piringan dan pastikan akar serabut sehat agar serapan nutrisi optimal.

Ada yang daun sawit di kebunnya mengalami gejala ini? Ceritakan di kolom komentar! 👇

#SolusiSawitNusantara #KelapaSawit #PetaniSawit #AgronomiSawit`;

const unixTimestamp = 1790767800; // Rabu, 30 Sep 18:30 WIB

async function main() {
  console.log('Mengunggah gambar gaya berita & menjadwalkan ke Facebook Cloud...');
  const fileBuf = fs.readFileSync(imagePath);
  const formData = new FormData();
  formData.append('source', new Blob([fileBuf], { type: 'image/jpeg' }), 'card_daun_kuning.jpg');
  formData.append('caption', caption);
  formData.append('published', 'false');
  formData.append('scheduled_publish_time', String(unixTimestamp));
  formData.append('access_token', token);

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  console.log('Hasil pendaftaran ke Facebook Cloud:', data);
}

main().catch(console.error);
