const dns = require('dns');
const fs = require('fs');
const path = require('path');
const { renderNewsCard } = require('./news_card_renderer');

if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}
loadEnv();

const PAGE_ID = process.env.FB_PAGE_ID;
const PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const CORRUPTED_POST_ID = '1340652705797853_122108854071485169';
const SCHEDULE_UNIX = 1791162000; // 5/10/2026, 08:00:00 WIB

const CAPTION = `🌾 Senang melihat sawit umur 1,5 tahun mulai belajar berbuah? Jangan bangga dulu, segera buang bunga pasirnya!

Tiga alasan wajib kastrasi pada fase TBM:
👉 Dompet awal tidak bernilai jual dan hanya menguras energi pohon muda.
👉 Nutrisi fokus mempertebal diameter batang serta memperkuat jaringan akar.
👉 Masuk usia panen 30 bulan, TBS keluar serempak dan berukuran jumbo.

Lakukan kastrasi sanitasi rutin sebulan sekali sampai umur 24 bulan agar fondasi pohon kokoh menyangga panen raya.

Siapa Sahabat Petani yang sedang merawat kebun sawit muda? Bagikan pengalaman Anda di kolom komentar!

#SolusiSawitNusantara #KelapaSawit #PetaniSawit`;

async function renderCardOnly() {
  const bgImg = path.join(__dirname, '..', 'public', 'images', 'backgrounds', 'tandan_sawit_matang_pohon.jpg');
  const outPath = path.join(__dirname, '..', 'public', 'images', 'card_kastrasi_fixed.jpg');
  
  console.log(`🎨 Merender kartu visual baru dengan background sawit asli: ${path.basename(bgImg)}...`);
  await renderNewsCard({
    bgImagePath: bgImg,
    categoryLabel: 'SAWIT MUDA',
    categoryColor: 'red',
    headlineHtml: 'Sawit Muda Keluar Bunga Pasir? <span class="headline-highlight">Jangan Dibiarkan, Buang Sekarang!</span>',
    summaryText: 'Kastrasi umur 14–24 bulan mengalihkan nutrisi untuk membesarkan bonggol batang.',
    outputPath: outPath
  });
  console.log(`✅ Kartu visual tersimpan di: ${outPath}`);
  return outPath;
}

async function executeReplacement(cardPath) {
  console.log(`\n1. Menghapus postingan gambar baju lama (${CORRUPTED_POST_ID}) dari Facebook Cloud...`);
  const delUrl = `https://graph.facebook.com/v21.0/${CORRUPTED_POST_ID}?access_token=${PAGE_TOKEN}`;
  const delRes = await fetch(delUrl, { method: 'DELETE' });
  const delData = await delRes.json();
  console.log('   Hasil hapus:', delData);

  console.log(`\n2. Mengunggah gambar baru & menjadwalkan ulang ke Facebook Cloud (${new Date(SCHEDULE_UNIX * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })})...`);
  const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`;
  const fileBuf = fs.readFileSync(cardPath);
  const formData = new FormData();
  formData.append('source', new Blob([fileBuf], { type: 'image/jpeg' }), path.basename(cardPath));
  formData.append('caption', CAPTION);
  formData.append('published', 'false');
  formData.append('scheduled_publish_time', String(SCHEDULE_UNIX));
  formData.append('access_token', PAGE_TOKEN);

  const res = await fetch(url, { method: 'POST', body: formData });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  console.log(`🎉 BERHASIL DIJADWALKAN ULANG! ID baru: ${data.id}`);
  return data.id;
}

async function main() {
  const isRenderOnly = process.argv.includes('--render-only');
  const cardPath = await renderCardOnly();
  if (isRenderOnly) {
    console.log('Selesai tahap render. Silakan cek gambar sebelum di-upload.');
    return;
  }
  await executeReplacement(cardPath);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
