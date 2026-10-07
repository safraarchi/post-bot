const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'images', 'backgrounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Koleksi Foto Nyata Berkualitas Tinggi
const onlinePhotos = [
  {
    name: 'panen_buah_klaster.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Elaeis_guineensis_-_noix_de_palme_oil_palm_-_harvesting_fruits_from_the_cluster.jpg'
  },
  {
    name: 'tandan_buah_matang.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Elaeis_guineensis_-_African_Oil_Palm_tree_with_fruit.jpg'
  },
  {
    name: 'kebun_sawit_terbentang.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Kebun_sawit.jpg'
  },
  {
    name: 'buah_sawit_detail.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Elaeis_guineensis_-_noix_de_palme_-_oil_palm_fruit_detail.jpg'
  },
  {
    name: 'transport_panen_tph.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Field_collection_mech.jpg'
  },
  {
    name: 'buah_sawit_pohon.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Elaeis_guineensis_-_African_Oil_Palm_tree_with_ripening_fruits.jpg'
  },
  {
    name: 'buah_sawit_hijau_segar.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/2017_03_10_-_Kelapa_Sawit_Warna_Hijau_2.jpg'
  },
  {
    name: 'tajuk_pelepah_lebat.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Elaeis_guineensis_MS_3467.jpg'
  },
  {
    name: 'hutan_sawit_produktif.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/2017_03_10_-_Kelapa_Sawit_Warna_Hijau_3.jpg'
  },
  {
    name: 'tandan_sawit_pohon_emas.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/2017_03_10_-_Kelapa_Sawit_Warna_Hijau_8.jpg'
  },
  {
    name: 'ladang_sawit_malaysia.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Palm_tree_plantation.jpg'
  },
  {
    name: 'tandan_sawit_matang_pohon.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Elaeis_guineensis_%28African_oil_palm%29_male_and_female_inflorescences_and_infructescence.jpg'
  }
];

function downloadFile(url, tempPath) {
  return new Promise((resolve, reject) => {
    const handleReq = (currentUrl) => {
      https.get(currentUrl, {
        headers: {
          'User-Agent': 'SolusiSawitBot/1.0 (admin@solusisawitnusantara.my.id)'
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

async function processAll() {
  console.log('=== MEMULAI PENYIAPAN 20+ LATAR FOTO NYATA SAWIT ===');
  
  for (const item of onlinePhotos) {
    const outPath = path.join(targetDir, item.name);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 30000) {
      console.log(`[SKIP] ${item.name} sudah ada.`);
      continue;
    }

    try {
      console.log(`[DOWNLOAD] ${item.name}...`);
      await downloadFile(item.url, outPath);
      console.log(`[SUKSES] ${item.name} berhasil diunduh (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)!`);
    } catch (err) {
      console.warn(`[GAGAL] ${item.name}: ${err.message}`);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  }

  // Tampilkan total gambar yang ada di targetDir
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`\n🎉 SELESAI! Total ${files.length} foto nyata perkebunan sawit siap digunakan di:`);
  console.log(targetDir);
}

processAll().catch(console.error);
