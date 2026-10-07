/**
 * Solusi Sawit Nusantara - Facebook Cloud Auto-Scheduler & Editorial Reviewer
 * Menggunakan agy CLI lokal (Bebas Biaya API) & Meta Graph API resmi
 * 
 * Fitur Utama:
 * 1. Naskah Ringkas, Padat, & Memikat (80-110 kata, scannable di HP)
 * 2. Visual Berita Sawit Otomatis (Headline Hook + Kategori Badge di Atas Foto Realistis)
 * 3. Matriks Konten Seimbang (40% Edukasi Murni, 30% Riset Berita, 30% Solusi Kombo)
 * 4. Chief Editor QA (Pembersihan Header, Anti-overclaim, SOP Aman)
 * 5. Pendaftaran langsung ke Server Facebook Cloud (Anti-Dobel)
 */

const { execFile, exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { renderNewsCard, renderPromoCard } = require('./news_card_renderer');
const {
  PILLARS,
  getTargetPillar,
  extractHistorySummary,
  cleanCaption,
  generateSmartPost,
  getSemanticImage
} = require('./smart_content_engine');

// Prioritaskan IPv4 untuk menghindari delay/timeout koneksi ke Graph API Facebook
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// ==========================================
// 1. LOAD CONFIG & KREDENSIAL DARI .ENV
// ==========================================
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

const PAGE_ID = process.env.FB_PAGE_ID || '1340652705797853';
const PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const AGY_PATH = process.platform === 'win32'
  ? (process.env.AGY_PATH || 'C:\\Users\\Lenovo\\AppData\\Local\\agy\\bin\\agy.exe')
  : 'agy';

// ==========================================
// 2. META GRAPH API (FACEBOOK)
// ==========================================

// ==========================================
// 3. FUNGSI META GRAPH API (FACEBOOK)
// ==========================================
async function getScheduledPosts() {
  const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/scheduled_posts?fields=id,message,scheduled_publish_time,created_time,full_picture,attachments{media,description,title,type}&access_token=${PAGE_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.data || []).map(post => {
    if (!post.full_picture && post.attachments?.data?.[0]?.media?.image?.src) {
      post.full_picture = post.attachments.data[0].media.image.src;
    }
    return post;
  });
}

async function scheduleLocalImagePost(localImagePath, caption, unixTimestamp) {
  const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`;
  const fileBuf = fs.readFileSync(localImagePath);
  const formData = new FormData();
  formData.append('source', new Blob([fileBuf], { type: 'image/jpeg' }), path.basename(localImagePath));
  formData.append('caption', caption);
  formData.append('published', 'false');
  formData.append('scheduled_publish_time', String(unixTimestamp));
  formData.append('access_token', PAGE_TOKEN);

  const res = await fetch(url, { method: 'POST', body: formData });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function scheduleTextPost(message, unixTimestamp) {
  const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`;
  const body = new URLSearchParams({
    access_token: PAGE_TOKEN,
    message: message,
    published: 'false',
    scheduled_publish_time: String(unixTimestamp)
  });
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function deleteScheduledPost(postId) {
  const url = `https://graph.facebook.com/v21.0/${postId}?access_token=${PAGE_TOKEN}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// ==========================================
// 4. PIPELINE PENULIS & REVIEWER QA RINGKAS
// ==========================================
async function generateAndReviewPost(pillar, postType) {
  const masterPrompt = `Anda adalah copywriter profesional media sosial sekaligus Chief Editor untuk Facebook Page resmi "Solusi Sawit Nusantara".
Tugas Anda menulis 1 postingan Facebook resmi yang SANGAT RAPI, BERSIH, MEMIKAT, dan ENAK DIBACA DI LAYAR HP (Panjang: 80 - 110 kata saja).

Topik: "${pillar.topic}"
Tipe Postingan: ${postType}

Petunjuk Khusus:
${pillar.instructions}

ATURAN FORMAT & AUDIT MUTU (MUTLAK):
1. DILARANG MENGGUNAKAN SIMBOL BINTANG (MARKDOWN ** ATAU *)! Facebook TIDAK mendukung format tebal markdown, sehingga tanda bintang akan tampil mentah (contoh cacat: **Kurang Magnesium:**) dan membuat postingan terlihat kotor/kurang rapi. Untuk penekanan kata penting, gunakan HURUF KAPITAL secara wajar atau emoji bullet yang rapi (📌, 💡, ✅, 👉). JANGAN PERNAH gunakan tanda bintang (**).
2. TATA LETAK RAPI & SCANNABLE (BERI JEDA 1 BARIS KOSONG):
   - Paragraf 1: Hook memikat dengan emoji pembuka (langsung menusuk masalah/fakta lapangan petani).
   - [Jeda 1 baris kosong]
   - Paragraf 2: 2-3 Poin inti ringkas ber-bullet emoji rapi (contoh: 📌 atau 👉). Kalimat to-the-point, jangan bertele-tele.
   - [Jeda 1 baris kosong]
   - Paragraf 3: Solusi lapangan / SOP praktis yang solutif dan jelas.
   - [Jeda 1 baris kosong]
   - Paragraf 4: Pertanyaan interaktif / Call to Action (CTA) ramah yang memancing diskusi petani di kolom komentar.
   - [Jeda 1 baris kosong]
   - Paragraf 5: Tepat 3 hashtag resmi di baris paling bawah: #SolusiSawitNusantara #KelapaSawit #PetaniSawit
3. DILARANG MENULISKAN LABEL KATEGORI seperti "[RISET BERITA]", "[EDUKASI MURNI]", ATAU JUDUL ARTIKEL DI AWAL TEKS!
4. SOP Keselamatan & Dosis Resmi: Drum 200L + Botol 1.5L per pokok ke tanah piringan. Jangan pernah campur racun rumput (herbisida).
5. Klaim hasil harus realistis biologis sawit (pelepah hijau 2-4 pekan, bunga betina 1-2 bulan, kenaikan bobot bulan ke-3 ke atas).
6. MAKSIMAL 80-110 KATA SAJA! Keluarkan HANYA naskah bersih siap terbit tanpa tanda codeblock (\`\`\`), tanpa tanda kutip pembungkus, dan tanpa kata pengantar apa pun.`;

  const raw = await callAgyPrompt(masterPrompt);
  return cleanCaption(raw);
}

// ==========================================
// 5. KALKULATOR SLOT JADWAL ANTI-DOBEL
// ==========================================
function getAvailableSlots(existingPosts, countNeeded = 3) {
  const existingTimestamps = new Set(existingPosts.map(p => p.scheduled_publish_time));
  const slots = [];
  const now = new Date();

  const dailySlots = [
    { hour: 8, minute: 0, label: 'Pagi' },
    { hour: 18, minute: 30, label: 'Sore/Malam' }
  ];

  let dayOffset = 0;
  while (slots.length < countNeeded) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + dayOffset);

    for (const slot of dailySlots) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);

      const unixTime = Math.floor(slotTime.getTime() / 1000);
      const diffMinutes = (slotTime.getTime() - now.getTime()) / (1000 * 60);

      if (diffMinutes >= 15) {
        const isAlreadyBooked = Array.from(existingTimestamps).some(ts => Math.abs(ts - unixTime) < 1800);
        if (!isAlreadyBooked) {
          slots.push({
            date: slotTime,
            unix: unixTime,
            label: `${slot.label} (${slotTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} ${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')} WIB)`
          });
          existingTimestamps.add(unixTime);
          if (slots.length >= countNeeded) break;
        }
      }
    }
    dayOffset++;
  }
  return slots;
}

// ==========================================
// 6. HELPER DISPATCH & GAMBAR VISUAL OTENTIK
// ==========================================
async function createImagePost(postData, itemIndex) {
  const { pillar, visualHook, visualSummary, imageTag, isSpecialAI } = postData;

  // 1. Jika Pilar Promo Solusi Produk: Gunakan banner promo atau render kartu produk transparan resmi
  if (pillar.key === 'SOLUSI_PRODUK' || imageTag === 'PRODUK_OFFICIAL') {
    const promoAsset = getSemanticImage({ pillar, imageTag, itemIndex });
    if (promoAsset.path && fs.existsSync(promoAsset.path) && (itemIndex % 2 === 0)) {
      console.log(`   🎨 [Promo Banner Resmi] Menggunakan banner siap pakai: ${path.basename(promoAsset.path)}...`);
      return promoAsset.path;
    }

    const outPromo = path.join(__dirname, '..', 'public', 'images', `promo_card_${Date.now()}_${itemIndex}.jpg`);
    try {
      console.log(`   🎨 [Render Promo Resmi] Merender kartu produk transparan 1080x1080 (tanpa distorsi AI)...`);
      await renderPromoCard({
        headlineHtml: visualHook || 'Paket Kombo Solusi Sawit Nusantara',
        summaryText: visualSummary || 'Paket Kombo Rp 395.000 untuk 2 Hektar. Bisa COD.',
        outputPath: outPromo
      });
      return outPromo;
    } catch (e) {
      console.warn(`Gagal render promo card (${e.message}), beralih ke banner promo siap pakai...`);
      if (promoAsset.path) return promoAsset.path;
    }
  }

  // 2. Untuk Edukasi Murni, Riset Berita, atau Mode AI Visual Berkala:
  const matched = getSemanticImage({ pillar, imageTag, isSpecialAI, itemIndex });
  const bgImg = matched.path;
  const outNews = path.join(__dirname, '..', 'public', 'images', `card_news_${Date.now()}_${itemIndex}.jpg`);

  try {
    const visualBadge = isSpecialAI ? 'KORAN SAWIT AI' : (pillar.badgeLabel || 'INFO SAWIT');
    console.log(`   🎨 [Renderer Berita] Merender visual "${visualBadge}" [${matched.type}] dengan latar: ${path.basename(bgImg)}...`);
    await renderNewsCard({
      bgImagePath: bgImg,
      categoryLabel: visualBadge,
      categoryColor: isSpecialAI ? 'orange' : (pillar.badgeColor || 'blue'),
      headlineHtml: visualHook,
      summaryText: visualSummary,
      outputPath: outNews
    });
    return outNews;
  } catch (err) {
    console.warn(`Gagal render kartu berita dengan Chromium: ${err.message}. Menggunakan gambar dasar.`);
    return bgImg;
  }
}

async function dispatchPostSmart(postData, slotUnix, isImage, itemIndex) {
  if (!isImage) {
    return await scheduleTextPost(postData.caption, slotUnix);
  }

  try {
    const imagePath = await createImagePost(postData, itemIndex);
    if (fs.existsSync(imagePath)) {
      console.log(`   📸 Mengunggah gambar visual: ${path.basename(imagePath)} ke Facebook Cloud...`);
      return await scheduleLocalImagePost(imagePath, postData.caption, slotUnix);
    }
  } catch (errImg) {
    console.warn(`Gagal buat gambar visual (${errImg.message}). Beralih ke teks murni...`);
  }

  // Fallback Teks Murni (Anti-Gagal)
  return await scheduleTextPost(postData.caption, slotUnix);
}

// ==========================================
// 7. HELPER INTERAKTIF TERMINAL
// ==========================================
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

function openWebDashboard() {
  console.log('\n🌐 Membuka Visual Web Dashboard di browser Anda...');
  const dashboardScript = path.join(__dirname, 'dashboard_server.js');
  const child = spawn('node', [dashboardScript], { detached: true, stdio: 'ignore' });
  child.unref();

  setTimeout(() => {
    exec('start http://localhost:3300');
    console.log('✅ Dashboard visual terbuka di http://localhost:3300');
  }, 1000);
}

async function runSmartBatchSchedule(count = 3) {
  console.log(`\n==================================================================`);
  console.log(`🌴 PIPELINE KONTEN CERDAS & PILAR 40:30:30 (SOLUSI SAWIT) 🌴`);
  console.log(`==================================================================`);

  console.log(`🔍 [Langkah 1/4] Memeriksa kalender Facebook Page agar tidak ada jadwal bentrok...`);
  const existingPosts = await getScheduledPosts();
  console.log(`   Ditemukan ${existingPosts.length} postingan yang sudah ada di antrean.\n`);

  const historySummary = extractHistorySummary(existingPosts);

  console.log(`🎯 [Langkah 2/4] Alokasi Slot Terjadwal Baru (${count} Postingan):`);
  const slots = getAvailableSlots(existingPosts, count);
  slots.forEach((s, idx) => {
    console.log(`   ${idx + 1}. ${s.label}`);
  });
  console.log(`------------------------------------------------------------------\n`);

  const BATCH_SIZE = 3;
  let successCount = 0;
  for (let b = 0; b < slots.length; b += BATCH_SIZE) {
    const batchSlots = slots.slice(b, b + BATCH_SIZE);
    const batchItems = batchSlots.map((slot, idx) => {
      const overallIdx = b + idx;
      const itemIndex = existingPosts.length + overallIdx;
      const pillar = getTargetPillar(existingPosts.length, overallIdx);
      const isImage = (count === 1) ? true : (overallIdx % 3 === 2);
      const isSpecialAI = isImage && (itemIndex % 6 === 2);
      const postType = isSpecialAI ? 'AI_VISUAL' : (isImage ? (pillar.key === 'SOLUSI_PRODUK' ? 'PROMO_IMAGE' : 'NEWS_IMAGE') : 'TEXT');
      return { slot, pillar, isImage, isSpecialAI, postType, overallIdx, itemIndex };
    });

    console.log(`==================================================================`);
    console.log(`⏳ Memproses Batch [${b + 1} - ${Math.min(b + BATCH_SIZE, slots.length)} dari ${slots.length}] secara Paralel...`);
    console.log(`✍️  Meriset naskah AI orisinal (Anti-Duplikasi & Hemat Token)...`);
    const t0 = Date.now();
    const generatedBatch = await Promise.all(
      batchItems.map(item => generateSmartPost({
        pillar: item.pillar,
        existingSummary: historySummary,
        isImage: item.isImage,
        isSpecialAI: item.isSpecialAI
      }))
    );
    console.log(`✅ ${batchItems.length} Naskah AI selesai dalam ${((Date.now() - t0)/1000).toFixed(1)}s!\n`);

    for (let j = 0; j < batchItems.length; j++) {
      const item = batchItems[j];
      const postData = generatedBatch[j];
      const currentNum = item.overallIdx + 1;

      console.log(`[POSTINGAN ${currentNum}/${slots.length}] Pilar: [${item.pillar.badgeLabel}] "${postData.visualHook}"`);
      console.log(`⏰ Jadwal: ${item.slot.label}`);
      console.log(`🖼️  Format: ${item.postType}`);

      try {
        console.log(`📤 Mendaftarkan ke server Facebook Cloud...`);
        const result = await dispatchPostSmart(postData, item.slot.unix, item.isImage, item.itemIndex);
        console.log(`🎉 BERHASIL DIJADWALKAN DI SERVER FACEBOOK! (ID: ${result.id})\n`);
        successCount++;
      } catch (err) {
        console.error(`❌ GAGAL PADA POSTINGAN INI: ${err.message}\n`);
      }
    }
  }

  console.log(`==================================================================`);
  console.log(`🎉 SELESAI PENUH! ${successCount} dari ${slots.length} postingan lolos review dan terjadwal.`);
  console.log(`☁️  Semua postingan sudah aman di SERVER FACEBOOK CLOUD.`);
  console.log(`💡 Anda sekarang bebas mematikan atau menutup laptop Anda!`);
  console.log(`==================================================================\n`);
}

// ==========================================
// 8. MENU UTAMA
// ==========================================
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--dashboard')) {
    openWebDashboard();
    return;
  }

  if (args.includes('--auto')) {
    const countIdx = args.indexOf('--count');
    const count = (countIdx !== -1 && args[countIdx + 1]) ? parseInt(args[countIdx + 1], 10) : 3;
    await runSmartBatchSchedule(count);
    return;
  }

  // Jika tanpa argumen, default buka dashboard
  openWebDashboard();
}

main().catch(err => {
  console.error('Fatal error:', err);
});
