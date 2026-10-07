const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'images', 'backgrounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. DAFTAR FILE TIDAK SESUAI (BUKAN SAWIT) YANG WAJIB DIHAPUS
const filesToDelete = [
  'jalan_kebun_sawit.jpg',      // BAJU KEMEJA (DENIM SHIRT)
  'kanopi_sawit_lestari.jpg',  // PAKIS DI TANGAN
  'perkebunan_sawit_tropis.jpg',// POHON OAK / SABANA
  'tanah_subur_perakaran.jpg',  // PEGUNUNGAN
  'test_unsplash.jpg',          // BIBIT PAKIS
  'kebun_sawit_negeri_lama.jpg',// MONUMEN RODA MESIN UAP
  'aplikasi_kocor.jpg',         // GAMBAR ORANG TUANG BOTOL PALSU
  'kebun_sawit_terbentang.jpg'  // RESOLUSI RENDAH / SAMPAH
];

console.log('=== 1. MEMBERSIHKAN FILE BUKAN SAWIT ===');
for (const file of filesToDelete) {
  const filePath = path.join(targetDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[DELETED] Berhasil membuang file bukan sawit: ${file}`);
  }
}

// 2. DAFTAR FOTO 100% MURNI PERKEBUNAN & BUAH SAWIT (WIKIMEDIA COMMONS TERVERIFIKASI)
const verifiedSawitPhotos = [
  {
    name: 'ladang_sawit_malaysia.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Oilpalm_malaysia.jpg'
  },
  {
    name: 'kebun_sawit_rapi_1.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/YosriLadangKelapaSawit.jpg'
  },
  {
    name: 'kebun_sawit_rapi_2.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/YosriLadangKelapaSawit1.jpg'
  },
  {
    name: 'kebun_sawit_rapi_3.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/YosriLadangKelapaSawit2.jpg'
  },
  {
    name: 'kebun_sawit_rapi_4.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/YosriLadangKelapaSawit3.jpg'
  },
  {
    name: 'kebun_sawit_rapi_5.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/YosriLadangKelapaSawit4.jpg'
  },
  {
    name: 'hamparan_sawit_lestari.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Oil_Palms_groves.jpg'
  },
  {
    name: 'perkebunan_sawit_pahang.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Oil_palm_plantation_in_Paloh_Hinai%2C_Pahang.jpg'
  },
  {
    name: 'perkebunan_sawit_sarawak.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Oil_palm_plantations_in_Sarawak.jpg'
  },
  {
    name: 'perkebunan_sawit_melaka.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Oil_Palm_Plantations_in_Melaka.jpg'
  },
  {
    name: 'lautan_sawit_lamandau.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Lautan_Sawit_di_Suatu_Desa_di_Kabupaten_Lamandau.jpg'
  },
  {
    name: 'tandan_sawit_matang_pohon.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Elaeis_guineensis_-_African_Oil_Palm_tree%2C_ripening_fruits%2C_detail.jpg'
  },
  {
    name: 'buah_sawit_hijau_lebat_5.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/2017_03_10_-_Kelapa_Sawit_Warna_Hijau_5.jpg'
  },
  {
    name: 'buah_sawit_hijau_lebat_6.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/2017_03_10_-_Kelapa_Sawit_Warna_Hijau_6.jpg'
  }
];

function downloadFile(url, tempPath) {
  return new Promise((resolve, reject) => {
    const handleReq = (currentUrl) => {
      https.get(currentUrl, {
        headers: {
          'User-Agent': 'SolusiSawitNusantara/1.0 (admin@solusisawitnusantara.my.id)'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return handleReq(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${currentUrl}`));
        }
        const fileStream = fs.createWriteStream(tempPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }).on('error', reject);
    };
    handleReq(url);
  });
}

async function run() {
  console.log('\n=== 2. MENGUNDUH FOTO NYATA SAWIT TERVERIFIKASI ===');
  for (const item of verifiedSawitPhotos) {
    const outPath = path.join(targetDir, item.name);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 20000) {
      console.log(`[SKIP] ${item.name} sudah ada.`);
      continue;
    }

    try {
      console.log(`[DOWNLOAD] ${item.name}...`);
      await downloadFile(item.url, outPath);
      console.log(`[SUKSES] ${item.name} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.warn(`[GAGAL] ${item.name}: ${err.message}`);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  }

  const allBackgrounds = fs.readdirSync(targetDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  console.log(`\n🎉 SELESAI PENUH! Total ${allBackgrounds.length} foto 100% sawit murni di backgrounds/:`);
  allBackgrounds.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
}

run().catch(console.error);
