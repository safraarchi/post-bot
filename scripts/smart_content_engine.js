/**
 * Solusi Sawit Nusantara - Smart Content Engine & Semantic Visual Matcher
 * 
 * Fitur Utama:
 * 1. Penegasan Rasio Pilar Konten: 40% Edukasi Murni, 30% Riset Berita, 30% Solusi Kombo Produk
 * 2. Deteksi Anti-Duplikasi Hemat Token: Ekstraksi ringkasan padat (<100 token) dari histori FB Cloud
 * 3. AI Dynamic Visual Hook: AI merumuskan headline kartu gambar (5-7 kata) & tag visual on-the-fly
 * 4. Semantic Smart Matching: Pencocokan latar foto nyata berdasarkan tag konten
 * 5. Siklus Visual AI Berkala: Pilihan visual khusus AI photorealistic sawit setiap interval 2 hari
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const BACKGROUNDS_DIR = path.join(__dirname, '..', 'public', 'images', 'backgrounds');
const PROMO_DIR = path.join(__dirname, '..', 'public', 'images', 'promo');
const AI_GEN_DIR = path.join(__dirname, '..', 'public', 'images', 'ai_generated');

const AGY_PATH = process.platform === 'win32'
  ? (process.env.AGY_PATH || 'C:\\Users\\Lenovo\\AppData\\Local\\agy\\bin\\agy.exe')
  : 'agy';

// ==========================================
// 1. DEFINISI 3 PILAR KONTEN STRATEGIS
// ==========================================
const PILLARS = {
  EDUKASI_MURNI: {
    key: 'EDUKASI_MURNI',
    name: 'Edukasi Murni Agronomi',
    ratio: 0.40, // 40%
    badgeLabel: 'EDUKASI SAWIT',
    badgeColor: 'red',
    coreInstruction: `MURNI EDUKASI & TEKNIS LAPANGAN TANPA JUALAN.
Bahas salah satu topik spesifik agronomi sawit:
- Fisiologi pohon & akar serabut pada piringan pohon
- Kastrasi sanitasi bunga pasir pada sawit muda (TBM)
- Manajemen tajuk & aturan baku songgo 2 (bahaya over-pruning)
- Diagnosa defisiensi hara (Magnesium bintik oranye vs Boron daun keriting)
- Perawatan tanah piringan lembap & gembur
Tujuan: Membangun reputasi ahli agronomi terpercaya bagi petani.`
  },
  BERITA_AKTUAL: {
    key: 'BERITA_AKTUAL',
    name: 'Riset Berita & Dinamika Sawit',
    ratio: 0.30, // 30%
    badgeLabel: 'RISET & PASAR',
    badgeColor: 'blue',
    coreInstruction: `FAKTA RISET LAPANGAN & DINAMIKA INDUSTRI SAWIT.
Bahas fakta objektif terkini:
- Fluktuasi harga TBS di PKS & kaitannya dengan efisiensi biaya perawatan
- Kebijakan hilirisasi biodiesel nasional (B40/B50) yang menuntut tonase TBS stabil
- Fakta riset: hingga 50% pupuk kimia tabur karungan menguap/membatu di tanah masam
- Perbandingan efisiensi pupuk tunggal vs majemuk di tengah kenaikan harga input
Tujuan: Membuka wawasan petani bahwa boros pupuk mahal bukanlah solusi terbaik.`
  },
  SOLUSI_PRODUK: {
    key: 'SOLUSI_PRODUK',
    name: 'Solusi Produk & Promo Kombo',
    ratio: 0.30, // 30%
    badgeLabel: 'SOLUSI KOMBO',
    badgeColor: 'green',
    coreInstruction: `PENAWARAN SOLUTIF PRODUK RESMI SOLUSI SAWIT NUSANTARA.
Soroti solusi konkret keluhan petani:
- Mengatasi musim trek, bunga jantan mendominasi, dan bunga dompet rontok
- Memacu serempak keluarnya bunga betina dan mempertebal bobot janjang TBS
- Paket Kombo Resmi: 1 Kg Pelarut Kimia + 1 Liter Biang Kocor = Rp 395.000 untuk 2 Hektar
- SOP 3 Langkah Praktis: Drum 200L air + Dosis 1 Botol (1.5L) per pokok ke piringan
- Garansi COD (Bayar di Tempat saat paket sampai di kebun/rumah)
- Ajakan bertindak (CTA): Ketik 'MAU COD' atau Inbox WhatsApp kami sekarang.`
  }
};

// ==========================================
// 2. TAGGED IMAGE LIBRARY (SMART MATCHER)
// ==========================================
const TAGGED_BACKGROUNDS = {
  BUAH_TBS: [
    'buah_sawit_jumbo.jpg',
    'panen_buah_klaster.jpg',
    'tandan_buah_matang.jpg',
    'transport_panen_tph.jpg',
    'buah_sawit_detail.jpg',
    'buah_sawit_hijau_segar.jpg',
    'buah_sawit_hijau_lebat_5.jpg',
    'buah_sawit_hijau_lebat_6.jpg'
  ],
  PELEPAH_TAJUK: [
    'tandan_sawit_matang_pohon.jpg',
    'daun_sawit_pelepah.jpg',
    'tajuk_pelepah_lebat.jpg',
    'buah_sawit_pohon.jpg',
    'tandan_sawit_pohon_emas.jpg'
  ],
  KEBUN_TERAWAT: [
    'ladang_sawit_malaysia.jpg',
    'hutan_sawit_produktif.jpg',
    'kebun_sawit_rapi_2.jpg',
    'kebun_sawit_rapi_3.jpg',
    'perkebunan_sawit_melaka.jpg',
    'perkebunan_sawit_sarawak.jpg',
    'hamparan_sawit_lestari.jpg',
    'lautan_sawit_lamandau.jpg',
    'sawit_subur_emas.jpg'
  ],
  PIRINGAN_TANAH: [
    'tanah_piringan_kebun.jpg',
    'kebun_sawit_rapi_4.jpg',
    'kebun_sawit_rapi_5.jpg',
    'kebun_sawit_rapi_2.jpg',
    'kebun_sawit_rapi_3.jpg',
    'ladang_sawit_malaysia.jpg',
    'sawit_subur_emas.jpg'
  ]
};

// Memori riwayat foto latar (Anti-Repeat Image Memory) agar tidak pernah kembar
const recentlyUsedBackgrounds = new Set();


// ==========================================
// 3. FUNGSI LOGIKA PILAR & ANTI-DUPLIKASI
// ==========================================

/**
 * Menghitung pilar berikutnya berdasarkan rasio seimbang 40:30:30
 * Pola 10 siklus terstandarisasi:
 * 1: Edukasi, 2: Berita, 3: Promo (Img), 4: Edukasi, 5: Edukasi,
 * 6: Promo (Img), 7: Berita, 8: Edukasi, 9: Berita (Img), 10: Promo
 */
function getTargetPillar(existingTotal, offset = 0) {
  const sequence = [
    PILLARS.EDUKASI_MURNI, // 0: Edukasi
    PILLARS.BERITA_AKTUAL, // 1: Berita
    PILLARS.SOLUSI_PRODUK, // 2: Promo
    PILLARS.EDUKASI_MURNI, // 3: Edukasi
    PILLARS.EDUKASI_MURNI, // 4: Edukasi
    PILLARS.SOLUSI_PRODUK, // 5: Promo
    PILLARS.BERITA_AKTUAL, // 6: Berita
    PILLARS.EDUKASI_MURNI, // 7: Edukasi
    PILLARS.BERITA_AKTUAL, // 8: Berita
    PILLARS.SOLUSI_PRODUK  // 9: Promo
  ];
  return sequence[(existingTotal + offset) % sequence.length];
}

/**
 * Ekstraksi ringkasan ultra-hemat token (<80 token) dari histori FB Cloud
 */
function extractHistorySummary(existingPosts) {
  if (!Array.isArray(existingPosts) || existingPosts.length === 0) {
    return 'Belum ada postingan sebelumnya.';
  }

  const lines = existingPosts.slice(0, 10).map((p, idx) => {
    const raw = (p.message || '').replace(/[\r\n]+/g, ' ').trim();
    // Ambil maksimal 10 kata pertama sebagai intisari
    const summary = raw.split(' ').slice(0, 10).join(' ');
    return `${idx + 1}. ${summary}...`;
  });

  return lines.join('\n');
}

// ==========================================
// 4. PEMANGGILAN agy CLI DENGAN MULTI-OUTPUT
// ==========================================
function callAgyPrompt(promptText) {
  return new Promise((resolve, reject) => {
    execFile(AGY_PATH, ['-p', promptText], {
      maxBuffer: 1024 * 1024 * 8,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Filter pembersih caption (Quality Assurance)
 */
function cleanCaption(text) {
  if (!text) return '';
  return text
    // Hapus tanda kutip pembungkus
    .replace(/^["'“]([\s\S]*)["'”]$/, '$1')
    // Hapus simbol markdown tebal ** atau *
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Hapus header intro AI
    .replace(/^(Tentu|Berikut|Ini|Baiklah|Tentu saja)[^\n]*\n+/i, '')
    .replace(/^(Caption Facebook|Postingan Facebook|Naskah Facebook):?\s*/i, '')
    // Normalisasi baris
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Menghasilkan konten dinamis lengkap (Teks + Visual Hook + Tag Visual)
 * Mendukung Multi-Produk dengan basis data Knowledge Base teks mentah
 */
async function generateSmartPost({ product, pillar, existingSummary, isImage, isSpecialAI = false }) {
  const productName = product?.name || 'Solusi Sawit Nusantara';
  const rawKnowledge = product?.rawKnowledge || `PRODUK: Solusi Sawit Nusantara
Paket Kombo Pelarut Pupuk Kimia + Biang Kocor seharga Rp 395.000 untuk 2 Hektar.
SOP 3 Langkah: Drum 200L air + 1L Biang Kocor + 1Kg Pelarut, dosis 1 botol 1.5L per pokok ke piringan.
Atasi musim trek, pacu bunga betina, hemat pupuk 50%. COD via WA: +62 858-1576-8319`;

  const isPromo = (pillar.key === 'SOLUSI_PRODUK');
  const cleanTag = productName.replace(/[^a-zA-Z0-9]/g, '');

  const ctaRule = isPromo
    ? `ATURAN KHUSUS KONTEN PROMO / CLOSING JUALAN:
- Naskah ini bertujuan penawaran solusi produk / closing.
- Di Paragraf 4, WAJIB sertakan Call To Action penawaran sesuai informasi di Dokumen Produk (misal nomor WhatsApp, cara pemesanan, atau format COD jika ada di dokumen).`
    : `ATURAN KHUSUS KONTEN EDUKASI & BERITA (JANGKAUAN ORGANIK LUAS):
- DILARANG KERAS MENARUH LINK URL APA PUN DI DALAM NASKAH CAPTION (agar jangkauan organik Facebook maksimal tanpa penalti algoritma).
- Di Paragraf 4, ajak diskusi ramah sesama pembaca/konsumen seputar topik masalah yang dibahas, lalu beri petunjuk bahwa info solusi lengkap ada di bio/kolom komentar.`;

  const masterPrompt = `Anda adalah Senior Copywriter & Social Media Specialist profesional untuk produk: "${productName}".
Tugas Anda: Membuat 1 konten Facebook baru yang memikat, berbobot, dan orisinal berdasarkan Dokumen Produk di bawah ini (Panjang naskah: 80 - 120 kata).

DOKUMEN INFORMASI PRODUK (KNOWLEDGE BASE RESMI):
===
${rawKnowledge}
===

PILAR KONTEN INI: [${pillar.name}]
ARAHAN PILAR:
${pillar.coreInstruction}

ANTI-DUPLIKASI (MUTLAK):
Berikut ringkasan topik yang sudah pernah diposting sebelumnya:
${existingSummary}
PILIH SUDUT PANDANG / SUB-TOPIK LAIN YANG BELUM DIBAHAS DARI DOKUMEN PRODUK!

ATURAN PENULISAN:
1. DILARANG MENGGUNAKAN TANDA BINTANG MARKDOWN (** ATAU *). Facebook tidak mendukung markdown sehingga bintang terlihat kotor. Gunakan huruf kapital wajar atau emoji (📌, 💡, 👉, ✅) untuk penekanan.
2. Format scannable di HP dengan jeda 1 baris kosong antar paragraf:
   - Paragraf 1: Hook memikat langsung ke keluhan nyata / masalah utama target konsumen.
   - [Jeda 1 baris]
   - Paragraf 2: 2-3 Poin ringkas ber-bullet emoji (📌 atau 👉) yang mengedukasi atau menjelaskan fakta.
   - [Jeda 1 baris]
   - Paragraf 3: Solusi teknis atau pembuktian manfaat sesuai dokumen produk di atas.
   - [Jeda 1 baris]
   - Paragraf 4: ${isPromo ? 'Call To Action penawaran langsung sesuai kontak/cara order di dokumen produk' : 'Pertanyaan diskusi ramah + petunjuk info di komentar'}
   - [Jeda 1 baris]
   - Paragraf 5: 3-4 Hashtag relevan yang diawali #${cleanTag}

${ctaRule}

FORMAT RESPON (WAJIB IKUTI PERSIS AGAR BISA DIPARSING SISTEM):
---VISUAL_HOOK---
[Tulis 1 kalimat judul kartu gambar, MAKSIMAL 5-7 KATA, huruf kapital menarik]
---VISUAL_SUMMARY---
[Tulis 1 kalimat penjelasan ringkas untuk subjudul kartu gambar, maksimal 12 kata]
---IMAGE_TAG---
[Pilih kategori foto paling relevan atau KEBUN_TERAWAT]
---CAPTION---
[Tulis naskah Facebook lengkap Anda di sini]`;

  console.log(`   🧠 [Smart AI] Menulis konten orisinal untuk [${productName}] - Pilar: ${pillar.name}...`);
  const rawOutput = await callAgyPrompt(masterPrompt);

  // Parsing Output Terstruktur
  let visualHook = `${productName} Terpercaya`;
  let visualSummary = `Solusi perawatan dan hasil terbaik untuk ${productName}.`;
  let imageTag = 'KEBUN_TERAWAT';
  let caption = rawOutput;

  const hookMatch = rawOutput.match(/---VISUAL_HOOK---([\s\S]*?)---VISUAL_SUMMARY---/i);
  const summaryMatch = rawOutput.match(/---VISUAL_SUMMARY---([\s\S]*?)---IMAGE_TAG---/i);
  const tagMatch = rawOutput.match(/---IMAGE_TAG---([\s\S]*?)---CAPTION---/i);
  const captionMatch = rawOutput.match(/---CAPTION---([\s\S]*)$/i);

  if (hookMatch) visualHook = hookMatch[1].trim();
  if (summaryMatch) visualSummary = summaryMatch[1].trim();
  if (tagMatch) {
    const rawTag = tagMatch[1].trim().toUpperCase();
    if (TAGGED_BACKGROUNDS[rawTag] || rawTag === 'PRODUK_OFFICIAL') {
      imageTag = rawTag;
    }
  }
  if (captionMatch) {
    caption = captionMatch[1].trim();
  }

  caption = cleanCaption(caption);

  // Jika bukan promo, pastikan tidak ada link liar di caption agar reach organik aman
  if (!isPromo) {
    caption = caption.replace(/https?:\/\/[^\s]+/g, '').replace(/wa\.me\/[^\s]+/g, '').trim();
  }

  return {
    productId: product?.id || 'prod_sawit_nusantara',
    productName,
    pillar,
    visualHook,
    visualSummary,
    imageTag,
    caption,
    isSpecialAI
  };
}

// ==========================================
// 5. PENCARIAN GAMBAR CERDAS (SEMANTIC MATCHER DENGAN ANTI-REPEAT)
// ==========================================
function getSemanticImage({ pillar, imageTag, isSpecialAI = false, itemIndex = 0, usedSet = null, productId = null, productName = null }) {
  const activeUsed = usedSet || recentlyUsedBackgrounds;

  const isFertipro = (productId && productId.toLowerCase().includes('ferti')) ||
                     (productName && productName.toLowerCase().includes('ferti'));

  // 1. Jika Pilar Promo Solusi Produk: Selalu gunakan banner promo resmi atau aset produk asli
  if (pillar.key === 'SOLUSI_PRODUK' || imageTag === 'PRODUK_OFFICIAL') {
    if (isFertipro) {
      const fertiproPromoDir = path.join(PROMO_DIR, 'fertipro');
      if (fs.existsSync(fertiproPromoDir)) {
        const fertiproBanners = fs.readdirSync(fertiproPromoDir)
          .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
          .map(f => path.join(fertiproPromoDir, f));

        if (fertiproBanners.length > 0) {
          const unused = fertiproBanners.filter(b => !activeUsed.has(path.basename(b)));
          const chosen = (unused.length > 0)
            ? unused[itemIndex % unused.length]
            : fertiproBanners[itemIndex % fertiproBanners.length];

          if (chosen) {
            activeUsed.add(path.basename(chosen));
            return {
              type: 'PROMO_OFFICIAL',
              path: chosen,
              filename: path.basename(chosen)
            };
          }
        }
      }
    } else {
      // Produk Solusi Sawit Nusantara
      if (fs.existsSync(PROMO_DIR)) {
        const banners = fs.readdirSync(PROMO_DIR)
          .filter(f => f.match(/^desain_\d+\.jpg$|^postingan_\d+\.jpg$/i))
          .map(f => path.join(PROMO_DIR, f));
        
        const unusedBanners = banners.filter(b => !activeUsed.has(path.basename(b)));
        const chosen = (unusedBanners.length > 0)
          ? unusedBanners[itemIndex % unusedBanners.length]
          : banners[itemIndex % banners.length];

        if (chosen) {
          activeUsed.add(path.basename(chosen));
          return {
            type: 'PROMO_OFFICIAL',
            path: chosen,
            filename: path.basename(chosen)
          };
        }
      }
    }
  }

  // 2. Jika Mode AI Visual Khusus Berkala (Tiap 2 Hari): Ambil dari folder public/images/ai_generated
  if (isSpecialAI && fs.existsSync(AI_GEN_DIR)) {
    const aiFiles = fs.readdirSync(AI_GEN_DIR)
      .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
      .map(f => path.join(AI_GEN_DIR, f));
    
    const unusedAIFiles = aiFiles.filter(f => !activeUsed.has(path.basename(f)));
    const chosen = (unusedAIFiles.length > 0)
      ? unusedAIFiles[itemIndex % unusedAIFiles.length]
      : aiFiles[itemIndex % aiFiles.length];

    if (chosen) {
      activeUsed.add(path.basename(chosen));
      return {
        type: 'AI_GENERATED',
        path: chosen,
        filename: path.basename(chosen)
      };
    }
  }

  // 3. Pencocokan Cerdas Foto Latar Asli Berdasarkan Tag (Strict Anti-Repeat)
  const candidatePool = TAGGED_BACKGROUNDS[imageTag] || TAGGED_BACKGROUNDS.KEBUN_TERAWAT;
  const availableInDir = candidatePool
    .map(name => path.join(BACKGROUNDS_DIR, name))
    .filter(fullPath => fs.existsSync(fullPath));

  // Prioritaskan foto dalam tag yang BELUM pernah dipakai
  const freshInTag = availableInDir.filter(f => !activeUsed.has(path.basename(f)));
  if (freshInTag.length > 0) {
    const chosen = freshInTag[itemIndex % freshInTag.length];
    activeUsed.add(path.basename(chosen));
    return {
      type: 'SMART_MATCHED_BG',
      path: chosen,
      filename: path.basename(chosen)
    };
  }

  // Jika semua foto di tag ini sudah terpakai, cari foto dari kategori lain yang masih fresh
  const allBgs = fs.readdirSync(BACKGROUNDS_DIR)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .map(f => path.join(BACKGROUNDS_DIR, f));

  const freshGlobal = allBgs.filter(f => !activeUsed.has(path.basename(f)));
  if (freshGlobal.length > 0) {
    const chosen = freshGlobal[itemIndex % freshGlobal.length];
    activeUsed.add(path.basename(chosen));
    return {
      type: 'SMART_MATCHED_BG',
      path: chosen,
      filename: path.basename(chosen)
    };
  }

  // Jika seluruh 25 foto sudah terpakai semua, bersihkan memori riwayat (reset siklus)
  activeUsed.clear();
  const fallback = availableInDir.length > 0 ? availableInDir[itemIndex % availableInDir.length] : allBgs[0];
  if (fallback) activeUsed.add(path.basename(fallback));

  return {
    type: 'SMART_MATCHED_BG',
    path: fallback,
    filename: path.basename(fallback)
  };
}

module.exports = {
  PILLARS,
  TAGGED_BACKGROUNDS,
  getTargetPillar,
  extractHistorySummary,
  cleanCaption,
  generateSmartPost,
  getSemanticImage
};
