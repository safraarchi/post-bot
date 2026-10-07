/**
 * Generator Konten Otomatis Facebook Page - Solusi Sawit Nusantara
 * Menggunakan agy CLI lokal (Bebas Biaya API) & Otomasi ke Google Sheets via n8n Webhook
 * 
 * Penggunaan:
 *   node scripts/generate_sawit_content.js [--days 7] [--dry-run] [--yes]
 *   npm run generate-content -- --days 7
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ==========================================
// 1. KONFIGURASI DEFAULT & PILAR KONTEN
// ==========================================
const DEFAULT_WEBHOOK_URL = 'http://localhost:5678/webhook/enqueue-sawit-content';
const AGY_PATH = process.platform === 'win32'
  ? (process.env.AGY_PATH || 'C:\\Users\\Lenovo\\AppData\\Local\\agy\\bin\\agy.exe')
  : 'agy';

// Pustaka Gambar Perkebunan Sawit & Hasil Panen Terkurasi (High Resolution)
const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1080', // Kebun sawit subur membentang
  'https://upload.wikimedia.org/wikipedia/commons/d/dd/Elaeis_guineensis_%28African_oil_palm%29_male_and_female_inflorescences_and_infructescence.jpg', // Buah & bunga sawit di pohon
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080', // Perawatan kebun dan sinar matahari
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1080', // Pohon kelapa sawit produktif
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1080'  // Tanah piringan gembur & pelepah hijau
];

// 5 Pilar Edukasi & Penjualan Resmi Solusi Sawit Nusantara
const CONTENT_PILLARS = [
  {
    topic: 'SOP 3 Langkah Aplikasi Kocor Sawit Praktis (Drum 200L + Botol 1.5L)',
    focus: 'edukasi-teknik',
    instructions: `Jelaskan tata cara pemakaian resmi 3 langkah: 
1. Siapkan 200L air di drum, masukkan 1L Biang Kocor + 1Kg Pelarut Pupuk Kimia, aduk larut (cukup untuk 1 Ha / ~133 pohon). 
2. Ambil larutan pakai botol 1,5 Liter. Dosis: 1 botol untuk 1 pohon.
3. Siram melingkar ke tanah piringan pohon tempat biasa menabur pupuk.
Sangat praktis tanpa alat semprot rumit.`
  },
  {
    topic: 'Rahasia Mengatasi Musim Trek Sawit & Memacu Munculnya Bunga Betina TBS Jumbo',
    focus: 'solusi-masalah',
    instructions: `Bahas keluhan umum petani saat pohon sawit mengalami musim trek, bunga jantan mendominasi, atau tandan buah kecil. 
Jelaskan peran Biang Kocor sebagai hormon booster pembungaan dan pemacu bobot buah agar tonase timbangan di PKS melonjak drastis.`
  },
  {
    topic: 'Strategi Hemat Biaya Pupuk Kimia Hingga 50% Tanpa Kurangi Timbangan Panen',
    focus: 'efisiensi-biaya',
    instructions: `Ulas mahalnya harga pupuk kimia karungan (NPK, Urea, KCL). 
Jelaskan peran Pelarut Pupuk Kimia sebagai bio-katalisator yang melarutkan sisa residu pupuk di tanah, menggemburkan piringan keras, dan memaksimalkan serapan akar hingga hemat modal pupuk s/d 50%.`
  },
  {
    topic: 'Paket Kombo Sawit Kocor Rp 395.000 Mencukupi Perawatan 2 Hektar Kebun',
    focus: 'penawaran-resmi',
    instructions: `Perkenalkan Paket Kombo Resmi Solusi Sawit Nusantara (1 Kg Pelarut + 1 Liter Biang Kocor) seharga cuma Rp 395.000,- untuk perawatan penuh 2 Hektar (260 - 280 pokok sawit).
Bandingkan efisiensi luar biasa ini dibanding ratusan ribu beli pupuk tabur biasa.`
  },
  {
    topic: 'Bisa Bayar di Tempat (COD) ke Seluruh Indonesia - Garansi Asli Pabrikan',
    focus: 'garansi-cod',
    instructions: `Berikan rasa aman dan percaya diri kepada pekebun di pelosok daerah: Paket dikirim langsung ke alamat rumah atau kebun, barang sampai baru bayar (COD). 
Jaminan produk 100% original pabrikan dan didampingi konsultasi perawatan kebun sawit gratis.`
  }
];

// ==========================================
// 2. PARSER ARGUMEN TERMINAL
// ==========================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    days: 7,
    dryRun: false,
    yes: false,
    webhookUrl: DEFAULT_WEBHOOK_URL
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--days' || arg === '-d') {
      options.days = parseInt(args[++i], 10) || 7;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--webhook-url' || arg === '-w') {
      options.webhookUrl = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Penggunaan:
  node scripts/generate_sawit_content.js [opsi]

Opsi:
  --days, -d <angka>       Jumlah hari konten yang ingin dibuat (Default: 7 hari = 14 postingan)
  --dry-run                Hanya hasilkan dan tampilkan preview di terminal (tanpa kirim ke n8n/Sheets)
  --yes, -y                Langsung kirim batch konten ke webhook tanpa meminta konfirmasi manual
  --webhook-url, -w <url>  URL endpoint webhook n8n lokal (Default: ${DEFAULT_WEBHOOK_URL})
  --help, -h               Tampilkan bantuan ini
      `);
      process.exit(0);
    }
  }

  return options;
}

// ==========================================
// 3. PEMANGGIL AGY CLI (Bebas Biaya API)
// ==========================================
function callAgyPrompt(promptText) {
  return new Promise((resolve, reject) => {
    const child = execFile(AGY_PATH, ['-p', promptText], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
      env: { ...process.env }
    }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Gagal memanggil agy CLI: ${error.message}\nStderr: ${stderr}`));
      }
      resolve(stdout.trim());
    });
  });
}

// Format waktu 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// ==========================================
// 4. GENERATOR NASKAH FACEBOOK
// ==========================================
async function generatePostCaption(pillar, postType) {
  const prompt = `Anda adalah copywriter profesional untuk Facebook Page resmi "Solusi Sawit Nusantara".
Tugas Anda adalah menulis naskah postingan Facebook yang sangat memikat, rapi, bersih, edukatif, dan nyaman dibaca di layar HP bagi pekebun/petani kelapa sawit.

Topik: "${pillar.topic}"
Tipe Postingan: ${postType}
Fokus Pembahasan:
${pillar.instructions}

Pedoman Penulisan (Standar Mutlak):
1. DILARANG MENGGUNAKAN SIMBOL BINTANG (MARKDOWN ** ATAU *)! Facebook tidak mendukung pemformatan tebal markdown, sehingga tanda bintang akan tampil mentah dan merusak kerapian teks. Gunakan HURUF KAPITAL atau emoji (📌, 💡, ✅, 👉) untuk penekanan.
2. TATA LETAK RAPI (BERI JEDA 1 BARIS KOSONG):
   - Hook pembuka dengan emoji natural (🌴, 🌱, 💡).
   - [Jeda 1 baris kosong]
   - Poin-poin edukasi singkat ber-bullet emoji rapi (📌 atau ✅).
   - [Jeda 1 baris kosong]
   - Solusi praktis kebun / SOP resmi / penawaran kombo Rp 395.000 untuk 2 Ha (Bisa COD).
   - [Jeda 1 baris kosong]
   - Pertanyaan interaktif / Call to Action (CTA) ramah mengajak diskusi di komentar atau pesan.
   - [Jeda 1 baris kosong]
   - Tepat 3-4 hashtag resmi di baris paling bawah: #SolusiSawitNusantara #KelapaSawit #PetaniSawit
3. PENTING: Keluarkan HANYA teks naskah bersih tanpa pengantar dan tanpa codeblock.`;

  const rawCaption = await callAgyPrompt(prompt);
  
  return rawCaption
    .replace(/^\[.*?\]\s*/gm, '')
    .replace(/^[A-Z\s:]{5,}\?[^\n]*\n*/gm, '')
    .replace(/^[A-Z\s:]{5,}:[^\n]*\n*/gm, '')
    .replace(/^```[a-z]*\s*/gmi, '')
    .replace(/```$/gmi, '')
    .replace(/^(Berikut|Ini|Tentu|Berikut ini|Draf|Naskah)\s+(adalah\s+)?(draf|naskah|postingan|teks|revisi|caption)[^:\n]*:\s*\n*/i, '')
    .replace(/^\s*[\*\-]\s+/gm, '📌 ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\*{2,}/g, '')
    .replace(/(?<=\s|^)\*(?=\s|$)/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^["'“]([\s\S]*)["'”]$/, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ==========================================
// 5. EKSEKUSI UTAMA (MAIN LOOP)
// ==========================================
async function main() {
  const options = parseArgs();
  const totalPosts = options.days * 2; // 2 kali sehari

  console.log(`\n======================================================`);
  console.log(`🌴 GENERATOR KONTEN LOKAL SOLUSI SAWIT NUSANTARA 🌴`);
  console.log(`======================================================`);
  console.log(`📅 Jumlah Hari: ${options.days} hari`);
  console.log(`📝 Total Postingan: ${totalPosts} konten (2 post/hari: 08:00 & 18:30 WIB)`);
  console.log(`⚙️  Target Webhook: ${options.webhookUrl}`);
  console.log(`🔍 Mode Dry-Run: ${options.dryRun ? 'AKTIF (Hanya Preview)' : 'TIDAK (Siap Kirim)'}`);
  console.log(`------------------------------------------------------\n`);

  const generatedItems = [];
  const now = new Date();
  
  // Mulai penjadwalan dari besok
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);

  let postCount = 0;
  for (let dayOffset = 0; dayOffset < options.days; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    // Dua jadwal per hari
    const scheduleSlots = [
      { hour: 8, minute: 0, label: 'Pagi' },
      { hour: 18, minute: 30, label: 'Sore/Malam' }
    ];

    for (const slot of scheduleSlots) {
      postCount++;
      const scheduleTime = new Date(currentDate);
      scheduleTime.setHours(slot.hour, slot.minute, 0, 0);

      // Pilih pilar secara bergantian
      const pillarIndex = (postCount - 1) % CONTENT_PILLARS.length;
      const pillar = CONTENT_PILLARS[pillarIndex];

      // Format tipe: Bergantian antara IMAGE dan TEXT
      const isImage = postCount % 2 === 1;
      const postType = isImage ? 'IMAGE' : 'TEXT';
      const mediaUrl = isImage ? CURATED_IMAGES[(postCount - 1) % CURATED_IMAGES.length] : '';

      const scheduledTimeStr = formatDateTime(scheduleTime);
      const postDateCode = `${scheduleTime.getFullYear()}${String(scheduleTime.getMonth() + 1).padStart(2, '0')}${String(scheduleTime.getDate()).padStart(2, '0')}`;
      const uniqueId = `SSN-${postDateCode}-${String(slot.hour).padStart(2, '0')}`;

      console.log(`[${postCount}/${totalPosts}] Sedang merancang postingan ${slot.label} (${scheduledTimeStr})...`);
      console.log(`   📌 Topik: ${pillar.topic}`);
      console.log(`   🖼️  Tipe : ${postType}`);

      try {
        const caption = await generatePostCaption(pillar, postType);
        
        const item = {
          id: uniqueId,
          topic_or_prompt: pillar.topic,
          post_type: postType,
          scheduled_time: scheduledTimeStr,
          generated_caption: caption,
          media_url: mediaUrl,
          link_url: '',
          status: 'READY'
        };

        generatedItems.push(item);
        console.log(`   ✅ Selesai dibuat (${caption.length} karakter)\n`);
      } catch (err) {
        console.error(`   ❌ Gagal membuat konten: ${err.message}\n`);
      }
    }
  }

  if (generatedItems.length === 0) {
    console.error('❌ Tidak ada konten yang berhasil dibuat.');
    process.exit(1);
  }

  // Simpan arsip lokal (backup JSON)
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const backupFile = path.join(dataDir, `generated_batch_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(generatedItems, null, 2), 'utf-8');
  console.log(`💾 Arsip batch tersimpan di: ${backupFile}`);

  // Tampilkan Ringkasan & Cuplikan Konten Pertama
  console.log(`\n======================================================`);
  console.log(`📋 CONTOH PRATINJAU KONTEN PERTAMA:`);
  console.log(`======================================================`);
  console.log(`ID: ${generatedItems[0].id}`);
  console.log(`Jadwal: ${generatedItems[0].scheduled_time} | Tipe: ${generatedItems[0].post_type}`);
  console.log(`Foto: ${generatedItems[0].media_url || '-'}`);
  console.log(`---------------- CAPTION PREVIEW ---------------------`);
  console.log(generatedItems[0].generated_caption);
  console.log(`------------------------------------------------------\n`);

  if (options.dryRun) {
    console.log(`✨ Mode Dry-Run selesai. Konten TIDAK dikirim ke n8n webhook.`);
    process.exit(0);
  }

  // Konfirmasi pengiriman jika bukan mode --yes
  if (!options.yes) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((res) => {
      rl.question(`Kirim ${generatedItems.length} konten ini ke n8n Webhook & Google Sheets? (Y/n): `, (ans) => {
        rl.close();
        res(ans.trim().toLowerCase());
      });
    });

    if (answer !== '' && answer !== 'y' && answer !== 'yes') {
      console.log(`Pengiriman dibatalkan oleh pengguna.`);
      process.exit(0);
    }
  }

  // Kirim batch payload ke n8n webhook lokal
  console.log(`\n🚀 Mengirim ${generatedItems.length} konten ke Webhook n8n: ${options.webhookUrl}...`);
  try {
    const response = await fetch(options.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: generatedItems })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const resJson = await response.json();
    console.log(`🎉 SUKSES! Respon dari n8n:`);
    console.log(JSON.stringify(resJson, null, 2));
    console.log(`\n👉 Seluruh baris antrean sudah masuk ke Google Sheets.`);
    console.log(`👉 Workflow 01_facebook_publisher di n8n akan otomatis menerbitkan postingan sesuai jadwal!`);
  } catch (err) {
    console.error(`\n⚠️  Gagal mengirim data ke n8n Webhook: ${err.message}`);
    console.log(`Catatan Troubleshooting:`);
    console.log(`1. Pastikan n8n sedang berjalan (npx n8n atau buka http://localhost:5678).`);
    console.log(`2. Pastikan workflow '03_Sawit_Content_Receiver_Webhook' sudah diimpor dan diaktifkan (Active) di n8n.`);
    console.log(`3. Data konten Anda tetap aman tersimpan di arsip: ${backupFile}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
