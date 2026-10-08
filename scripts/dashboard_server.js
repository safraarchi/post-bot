/**
 * Multi-Product Visual Content Factory & Local Facebook Planner
 * Mengelola katalog multi-produk (1-Textarea Knowledge Base) & antrean postingan lokal
 * Dilengkapi 1-Click Copy, Download Foto, Toggle Selesai, dan Ekspor CSV untuk Excel
 */

const http = require('http');
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

// Prioritaskan IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

process.on('uncaughtException', (err) => {
  console.error('[FATAL ERROR uncaughtException]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL ERROR unhandledRejection]:', reason);
});

const PORT = 3300;
const HTML_FILE_PATH = path.join(__dirname, '..', 'public', 'index.html');
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const QUEUE_FILE = path.join(__dirname, '..', 'data', 'content_queue.json');
const INSTANT_POSTS_FILE = path.join(__dirname, '..', 'data', 'instant_posts.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ==========================================
// 1. HELPER DATABASE LOKAL
// ==========================================
function getProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading products.json:', e.message);
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function getQueue() {
  if (!fs.existsSync(QUEUE_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading content_queue.json:', e.message);
    return [];
  }
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

function getInstantPosts() {
  if (!fs.existsSync(INSTANT_POSTS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INSTANT_POSTS_FILE, 'utf8');
    const posts = JSON.parse(raw || '[]');
    return posts.map(p => ({
      ...p,
      status: p.status || (p.posted ? 'POSTED' : 'DRAFT'),
      posted: p.posted !== undefined ? p.posted : (p.status === 'POSTED'),
      postedAt: p.postedAt || null
    }));
  } catch (e) {
    console.error('Error reading instant_posts.json:', e.message);
    return [];
  }
}

function saveInstantPosts(posts) {
  fs.writeFileSync(INSTANT_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

// Menghitung slot jadwal harian (08:00 Pagi & 18:30 Sore WIB)
function getAvailableLocalSlots(existingQueue, countNeeded = 6) {
  const existingTimestamps = new Set(existingQueue.map(p => p.unixTime));
  const slots = [];
  const now = new Date();
  const dailySlots = [
    { hour: 8, minute: 0, label: 'Pagi' },
    { hour: 18, minute: 30, label: 'Sore' }
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

      // Hanya jadwalkan jika waktu target minimal 15 menit ke depan
      if (diffMinutes >= 15) {
        const isBooked = Array.from(existingTimestamps).some(ts => Math.abs(ts - unixTime) < 1800);
        if (!isBooked) {
          const year = slotTime.getFullYear();
          const month = String(slotTime.getMonth() + 1).padStart(2, '0');
          const day = String(slotTime.getDate()).padStart(2, '0');
          const hour = String(slot.hour).padStart(2, '0');
          const minute = String(slot.minute).padStart(2, '0');
          const formatted = `${year}-${month}-${day} ${hour}:${minute}:00`;

          slots.push({
            date: slotTime,
            unix: unixTime,
            formatted,
            label: `${slot.label} (${slotTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} ${hour}:${minute} WIB)`
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

// Generate Gambar Visual Otentik
async function createLocalImage(postData, itemIndex, usedSet = null) {
  const { pillar, visualHook, visualSummary, imageTag, isSpecialAI, productName, productId } = postData;

  const isFertipro = (productId && productId.toLowerCase().includes('ferti')) ||
                     (productName && productName.toLowerCase().includes('ferti'));

  // 1. Promo Resmi
  if (pillar.key === 'SOLUSI_PRODUK' || imageTag === 'PRODUK_OFFICIAL') {
    if (isFertipro) {
      // Untuk Fertipro: Bergantian antara Banner Resmi Fertipro & Kartu Promo Terukur
      const fertiproDir = path.join(__dirname, '..', 'public', 'images', 'promo', 'fertipro');
      if (fs.existsSync(fertiproDir) && (itemIndex % 2 === 0)) {
        const banners = fs.readdirSync(fertiproDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
        if (banners.length > 0) {
          const chosen = banners[itemIndex % banners.length];
          return {
            fullPath: path.join(fertiproDir, chosen),
            relUrl: `/images/promo/fertipro/${chosen}`
          };
        }
      }

      // Render Kartu Promo Dinamis dengan Foto Paket Fertipro Asli
      const filename = `promo_fertipro_${Date.now()}_${itemIndex}.jpg`;
      const outPromo = path.join(__dirname, '..', 'public', 'images', filename);
      const fertiproProductImg = path.join(__dirname, '..', 'public', 'images', 'promo', 'paket_fertipro_transparan.png');
      try {
        await renderPromoCard({
          headlineHtml: visualHook || 'Solusi Pelepah Lentur & Buah Jumbo',
          summaryText: visualSummary || 'Paket kombo hemat 1 Ha atasi sawit trek & lebatkan TBS.',
          outputPath: outPromo,
          productImgPath: fertiproProductImg,
          badgePromo: '🌿 PAKET KOMBO 1 HEKTAR',
          badgeCod: '🚚 100% BISA COD',
          strikePrice: 'Rp 550.000',
          mainPrice: 'Rp 395.000,-',
          priceSub: 'Cukup untuk 1 Hektar (±133 Pokok)',
          pill1: '🛒 1 Kg Humat Pasta + 5L POC',
          pill2: '📦 Bayar di Tempat (COD)'
        });
        return { fullPath: outPromo, relUrl: `/images/${filename}` };
      } catch (e) {
        console.error('Error rendering Fertipro promo card:', e.message);
        return {
          fullPath: path.join(fertiproDir, '1.jpg'),
          relUrl: '/images/promo/fertipro/1.jpg'
        };
      }
    }

    // Untuk Solusi Sawit Nusantara (atau produk lain)
    const promoAsset = getSemanticImage({ pillar, imageTag, itemIndex, usedSet, productId, productName });
    if (promoAsset && promoAsset.path && fs.existsSync(promoAsset.path) && (itemIndex % 2 === 0)) {
      return {
        fullPath: promoAsset.path,
        relUrl: `/images/promo/${path.basename(promoAsset.path)}`
      };
    }

    const filename = `promo_card_${Date.now()}_${itemIndex}.jpg`;
    const outPromo = path.join(__dirname, '..', 'public', 'images', filename);
    const sawitProductImg = path.join(__dirname, '..', 'public', 'images', 'promo', 'produk_transparan.webp');
    try {
      await renderPromoCard({
        headlineHtml: visualHook || `Penawaran ${productName || 'Spesial'}`,
        summaryText: visualSummary || 'Solusi terbaik untuk hasil maksimal.',
        outputPath: outPromo,
        productImgPath: sawitProductImg,
        badgePromo: '🌴 PAKET KOMBO 2 HEKTAR',
        badgeCod: '🚚 100% BISA COD',
        strikePrice: 'Rp 550.000',
        mainPrice: 'Rp 395.000,-',
        priceSub: 'Cukup untuk 2 Hektar Kebun Sawit',
        pill1: '🛒 1 Botol Pelarut + 1 Botol Biang',
        pill2: '📦 Bayar di Tempat (COD)'
      });
      return { fullPath: outPromo, relUrl: `/images/${filename}` };
    } catch (e) {
      if (promoAsset && promoAsset.path) {
        return {
          fullPath: promoAsset.path,
          relUrl: `/images/promo/${path.basename(promoAsset.path)}`
        };
      }
    }
  }

  // 2. Edukasi / Berita
  const matched = getSemanticImage({ pillar, imageTag, isSpecialAI, itemIndex, usedSet, productId, productName });
  const bgImg = matched.path;
  const filename = `card_news_${Date.now()}_${itemIndex}.jpg`;
  const outNews = path.join(__dirname, '..', 'public', 'images', filename);

  try {
    const visualBadge = isSpecialAI ? 'KORAN AI' : (pillar.badgeLabel || 'INFORMASI');
    await renderNewsCard({
      bgImagePath: bgImg,
      categoryLabel: visualBadge,
      categoryColor: isSpecialAI ? 'orange' : (pillar.badgeColor || 'blue'),
      headlineHtml: visualHook,
      summaryText: visualSummary,
      outputPath: outNews,
      brandName: productName || 'Informasi Resmi'
    });
    return { fullPath: outNews, relUrl: `/images/${filename}` };
  } catch (err) {
    return {
      fullPath: bgImg,
      relUrl: `/images/backgrounds/${path.basename(bgImg)}`
    };
  }
}

// Progress state untuk live update di browser
let currentProgress = {
  active: false,
  step: 'Siap',
  percent: 0,
  current: 0,
  total: 0
};

// ==========================================
// 2. SERVER HTTP LOKAL
// ==========================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Dashboard HTML
  if (req.method === 'GET' && url.pathname === '/') {
    try {
      const html = fs.readFileSync(HTML_FILE_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Gagal memuat template dashboard: ' + err.message);
    }
    return;
  }

  // 2. Static Images Serving (/images/...)
  if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname.startsWith('/images/')) {
    const safePath = path.normalize(url.pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(PUBLIC_DIR, safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Content-Length': stat.size
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image not found');
      return;
    }
  }

  // 3. API: Status Progress
  if (req.method === 'GET' && url.pathname === '/api/progress') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentProgress));
    return;
  }

  // 4. API: Ambil Daftar Produk
  if (req.method === 'GET' && url.pathname === '/api/products') {
    try {
      const products = getProducts();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(products));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 5. API: Simpan / Edit Produk
  if (req.method === 'POST' && url.pathname === '/api/products') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.name || !payload.rawKnowledge) {
          throw new Error('Nama produk dan Dokumen Knowledge Base wajib diisi!');
        }

        const products = getProducts();
        let targetId = payload.id;
        if (!targetId) {
          targetId = 'prod_' + Date.now();
          products.unshift({
            id: targetId,
            name: payload.name.trim(),
            category: (payload.category || 'Umum').trim(),
            rawKnowledge: payload.rawKnowledge.trim(),
            createdAt: new Date().toISOString()
          });
        } else {
          const idx = products.findIndex(p => p.id === targetId);
          if (idx !== -1) {
            products[idx].name = payload.name.trim();
            products[idx].category = (payload.category || 'Umum').trim();
            products[idx].rawKnowledge = payload.rawKnowledge.trim();
            products[idx].updatedAt = new Date().toISOString();
          } else {
            products.unshift({
              id: targetId,
              name: payload.name.trim(),
              category: (payload.category || 'Umum').trim(),
              rawKnowledge: payload.rawKnowledge.trim(),
              createdAt: new Date().toISOString()
            });
          }
        }

        saveProducts(products);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id: targetId, products }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 6. API: Hapus Produk
  if (req.method === 'POST' && url.pathname === '/api/products/delete') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) throw new Error('ID produk diperlukan');

        let products = getProducts();
        products = products.filter(p => p.id !== id);
        saveProducts(products);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, products }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 7. API: Ambil Antrean Konten Lokal (dengan Filter Produk opsional)
  if (req.method === 'GET' && url.pathname === '/api/queue') {
    try {
      const productId = url.searchParams.get('productId');
      let queue = getQueue();
      if (productId && productId !== 'all') {
        queue = queue.filter(q => q.productId === productId);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(queue));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 8. API: Generate Konten Cerdas Multi-Produk
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const count = payload.count || 6;
        const productId = payload.productId;

        const products = getProducts();
        let selectedProduct = products.find(p => p.id === productId);
        if (!selectedProduct && products.length > 0) {
          selectedProduct = products[0];
        }
        if (!selectedProduct) {
          throw new Error('Belum ada produk yang terdaftar. Tambahkan produk terlebih dahulu di menu Kelola Produk!');
        }

        currentProgress = {
          active: true,
          step: `🔍 Memeriksa jadwal & antrean untuk ${selectedProduct.name}...`,
          percent: 5,
          current: 0,
          total: count
        };

        const existingQueue = getQueue();
        const slots = getAvailableLocalSlots(existingQueue, count);
        const historySummary = extractHistorySummary(existingQueue);

        const items = [];
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          const itemIndex = existingQueue.length + i;
          const pillar = getTargetPillar(existingQueue.length, i);
          const isImage = (count === 1) ? true : (i % 3 === 2);
          const isSpecialAI = isImage && (itemIndex % 6 === 2);
          items.push({ slot, pillar, isImage, isSpecialAI, index: i, itemIndex });
        }

        console.log(`\n======================================================`);
        console.log(`🚀 GENERATE ${items.length} KONTEN CERDAS UNTUK [${selectedProduct.name}]`);
        console.log(`======================================================`);

        const newPosts = [];
        const batchUsedImageSet = new Set();
        const BATCH_SIZE = 3;

        for (let b = 0; b < items.length; b += BATCH_SIZE) {
          const batch = items.slice(b, b + BATCH_SIZE);
          const batchStart = b + 1;
          const batchEnd = Math.min(b + BATCH_SIZE, items.length);

          currentProgress.step = `✍️ AI sedang menyusun naskah [${selectedProduct.name}] (${batchStart}-${batchEnd} dari ${items.length})...`;
          currentProgress.percent = Math.round((b / items.length) * 60) + 10;

          const generatedBatch = await Promise.all(
            batch.map(item => generateSmartPost({
              product: selectedProduct,
              pillar: item.pillar,
              existingSummary: historySummary,
              isImage: item.isImage,
              isSpecialAI: item.isSpecialAI
            }))
          );

          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const postData = generatedBatch[j];
            const currentNum = b + j + 1;

            currentProgress.current = currentNum;
            currentProgress.percent = Math.round((currentNum / items.length) * 90);

            let imageRelUrl = null;
            if (item.isImage) {
              currentProgress.step = `🎨 [${currentNum}/${items.length}] Menyiapkan kartu visual...`;
              try {
                const imgRes = await createLocalImage(postData, item.itemIndex, batchUsedImageSet);
                if (imgRes && imgRes.relUrl) {
                  imageRelUrl = imgRes.relUrl;
                }
              } catch (e) {
                console.warn(`Gagal render gambar (${e.message}), beralih ke teks murni.`);
              }
            }

            const postRecord = {
              id: `POST-${Date.now()}-${currentNum}`,
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              topic: postData.visualHook,
              visualSummary: postData.visualSummary,
              pillar: postData.pillar.name,
              pillarKey: postData.pillar.key,
              pillarBadge: postData.pillar.badgeLabel,
              pillarColor: postData.pillar.badgeColor,
              scheduledTime: item.slot.formatted,
              slotLabel: item.slot.label,
              unixTime: item.slot.unix,
              caption: postData.caption,
              imagePath: imageRelUrl,
              isImage: !!imageRelUrl,
              status: 'PENDING', // PENDING = Siap dijadwalkan, SCHEDULED = Sudah di Meta Planner
              createdAt: new Date().toISOString()
            };

            newPosts.push(postRecord);
          }
        }

        // Simpan ke antrean lokal (gabungkan dengan yang sudah ada)
        const updatedQueue = [...existingQueue, ...newPosts];
        saveQueue(updatedQueue);

        currentProgress = {
          active: false,
          step: `🎉 Selesai! ${newPosts.length} konten berhasil dibuat dan disimpan ke antrean lokal!`,
          percent: 100,
          current: items.length,
          total: items.length
        };

        console.log(`✅ BERHASIL: ${newPosts.length} konten tersimpan ke content_queue.json!`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: newPosts.length, posts: newPosts }));
      } catch (err) {
        currentProgress.active = false;
        currentProgress.step = `❌ Error: ${err.message}`;
        console.error('Error generate content:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 9. API: Toggle Status (PENDING <-> SCHEDULED)
  if (req.method === 'POST' && url.pathname === '/api/queue/toggle-scheduled') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) throw new Error('ID postingan diperlukan');

        const queue = getQueue();
        const item = queue.find(q => q.id === id);
        if (!item) throw new Error('Postingan tidak ditemukan');

        item.status = (item.status === 'SCHEDULED') ? 'PENDING' : 'SCHEDULED';
        saveQueue(queue);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, status: item.status }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 10. API: Edit Caption Postingan
  if (req.method === 'POST' && url.pathname === '/api/queue/update-caption') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, caption } = JSON.parse(body || '{}');
        if (!id || typeof caption !== 'string') throw new Error('ID dan caption diperlukan');

        const queue = getQueue();
        const item = queue.find(q => q.id === id);
        if (!item) throw new Error('Postingan tidak ditemukan');

        item.caption = caption.trim();
        saveQueue(queue);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, caption: item.caption }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 11. API: Hapus Satu Postingan dari Antrean
  if (req.method === 'POST' && url.pathname === '/api/queue/delete') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) throw new Error('ID postingan diperlukan');

        let queue = getQueue();
        queue = queue.filter(q => q.id !== id);
        saveQueue(queue);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 12. API: Hapus Beberapa Postingan Sekaligus
  if (req.method === 'POST' && url.pathname === '/api/queue/delete-batch') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ids } = JSON.parse(body || '{}');
        if (!Array.isArray(ids) || ids.length === 0) throw new Error('Daftar ID kosong');

        const idSet = new Set(ids);
        let queue = getQueue();
        queue = queue.filter(q => !idSet.has(q.id));
        saveQueue(queue);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: ids.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 13. API: Ekspor CSV Antrean Konten (UTF-8 BOM untuk Excel / Sheets)
  if (req.method === 'GET' && url.pathname === '/api/export-csv') {
    try {
      const productId = url.searchParams.get('productId');
      let queue = getQueue();
      if (productId && productId !== 'all') {
        queue = queue.filter(q => q.productId === productId);
      }

      // Escape helper untuk CSV
      const esc = (text) => {
        if (!text) return '""';
        return `"${String(text).replace(/"/g, '""')}"`;
      };

      const headers = ['ID', 'Produk', 'Topik Hook', 'Pilar Konten', 'Jadwal Tayang', 'Status', 'Tipe Media', 'Link Gambar Lokal', 'Teks Caption'];
      const rows = [headers.join(',')];

      for (const item of queue) {
        const statusLabel = (item.status === 'SCHEDULED') ? 'SUDAH DIJADWALKAN' : 'MENUNGGU DIJADWALKAN';
        const mediaType = item.isImage ? 'GAMBAR' : 'TEKS MURNI';
        rows.push([
          esc(item.id),
          esc(item.productName),
          esc(item.topic),
          esc(item.pillar),
          esc(item.scheduledTime),
          esc(statusLabel),
          esc(mediaType),
          esc(item.imagePath || ''),
          esc(item.caption)
        ].join(','));
      }

      // Tambahkan UTF-8 Byte Order Mark (BOM) agar simbol emoji dan karakter terbaca sempurna di Microsoft Excel
      const csvContent = '\uFEFF' + rows.join('\r\n');
      const filename = `antrean_konten_facebook_${Date.now()}.csv`;

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      res.end(csvContent);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Gagal menghasilkan file CSV: ' + e.message);
    }
    return;
  }

  // 14. API: Ambil Riwayat Postingan Instan
  if (req.method === 'GET' && url.pathname === '/api/instant-posts') {
    try {
      const productId = url.searchParams.get('productId');
      let posts = getInstantPosts();
      if (productId && productId !== 'all') {
        posts = posts.filter(p => p.productId === productId);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(posts));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 15. API: Generate Konten Instan (Langsung Posting Tanpa Masuk Jadwal)
  if (req.method === 'POST' && url.pathname === '/api/generate-instant') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { productId, pillarKey = 'AUTO', mediaType = 'image_promo', customTopic = '' } = payload;

        const products = getProducts();
        let selectedProduct = products.find(p => p.id === productId);
        if (!selectedProduct && products.length > 0) {
          selectedProduct = products[0];
        }
        if (!selectedProduct) {
          throw new Error('Belum ada produk yang terdaftar. Tambahkan produk terlebih dahulu di menu Kelola Produk!');
        }

        // Tentukan pilar konten
        let targetPillar = null;
        if (pillarKey && PILLARS[pillarKey]) {
          targetPillar = PILLARS[pillarKey];
        } else if (mediaType === 'image_promo') {
          targetPillar = PILLARS.SOLUSI_PRODUK;
        } else {
          const options = [PILLARS.EDUKASI_MURNI, PILLARS.BERITA_AKTUAL, PILLARS.SOLUSI_PRODUK];
          targetPillar = options[Math.floor(Math.random() * options.length)];
        }

        const isImage = (mediaType !== 'text');

        console.log(`\n======================================================`);
        console.log(`⚡ GENERATE KONTEN INSTAN: [${selectedProduct.name}]`);
        console.log(`   Pilar: ${targetPillar.name} | Media: ${mediaType}`);
        if (customTopic) console.log(`   Topik Khusus: "${customTopic}"`);
        console.log(`======================================================`);

        // Generate Naskah Cerdas
        const postData = await generateSmartPost({
          product: selectedProduct,
          pillar: targetPillar,
          existingSummary: '',
          isImage,
          isSpecialAI: false,
          customTopic
        });

        // Generate Gambar jika diminta
        let imageRelUrl = null;
        if (isImage) {
          try {
            if (mediaType === 'image_promo') {
              postData.pillar = PILLARS.SOLUSI_PRODUK;
              postData.imageTag = 'PRODUK_OFFICIAL';
            }
            const itemIndex = Math.floor(Math.random() * 50) + 1;
            const imgRes = await createLocalImage(postData, itemIndex, new Set());
            if (imgRes && imgRes.relUrl) {
              imageRelUrl = imgRes.relUrl;
            }
          } catch (imgErr) {
            console.warn('Gagal merender gambar instan:', imgErr.message);
          }
        }

        const newPost = {
          id: `INSTANT-${Date.now()}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          topic: postData.visualHook,
          visualSummary: postData.visualSummary,
          pillar: targetPillar.name,
          pillarKey: targetPillar.key,
          pillarBadge: targetPillar.badgeLabel,
          pillarColor: targetPillar.badgeColor,
          caption: postData.caption,
          imagePath: imageRelUrl,
          isImage: !!imageRelUrl,
          mediaType: mediaType,
          customTopic: customTopic || null,
          status: 'DRAFT',
          posted: false,
          postedAt: null,
          createdAt: new Date().toISOString()
        };

        // Simpan ke riwayat lokal instant_posts.json (TIDAK masuk ke kalender content_queue.json)
        const instantPosts = getInstantPosts();
        instantPosts.unshift(newPost);
        if (instantPosts.length > 100) instantPosts.pop();
        saveInstantPosts(instantPosts);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, post: newPost }));
      } catch (err) {
        console.error('Error generate instant post:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 16. API: Toggle Status Mark Postingan Instan (POSTED <-> DRAFT)
  if (req.method === 'POST' && url.pathname === '/api/instant-posts/toggle-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, status } = JSON.parse(body || '{}');
        if (!id) throw new Error('ID postingan diperlukan');

        const posts = getInstantPosts();
        const item = posts.find(p => p.id === id);
        if (!item) throw new Error('Postingan instan tidak ditemukan');

        if (status) {
          item.status = status;
          item.posted = (status === 'POSTED');
          item.postedAt = item.posted ? new Date().toISOString() : null;
        } else {
          const isCurrentlyPosted = (item.status === 'POSTED' || item.posted === true);
          if (isCurrentlyPosted) {
            item.status = 'DRAFT';
            item.posted = false;
            item.postedAt = null;
          } else {
            item.status = 'POSTED';
            item.posted = true;
            item.postedAt = new Date().toISOString();
          }
        }

        saveInstantPosts(posts);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          id: item.id,
          status: item.status,
          posted: item.posted,
          postedAt: item.postedAt
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 17. API: Hapus Postingan Instan dari Riwayat
  if (req.method === 'POST' && url.pathname === '/api/instant-posts/delete') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) throw new Error('ID postingan diperlukan');
        let posts = getInstantPosts();
        posts = posts.filter(p => p.id !== id);
        saveInstantPosts(posts);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 17. API: Bersihkan Semua Riwayat Postingan Instan
  if (req.method === 'POST' && url.pathname === '/api/instant-posts/clear') {
    try {
      saveInstantPosts([]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 18. API: Matikan Server Lokal
  if (req.method === 'POST' && url.pathname === '/api/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Server dihentikan' }));
    console.log('\n🛑 Permintaan shutdown diterima. Menghentikan server lokal...');
    setTimeout(() => {
      process.exit(0);
    }, 500);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🌐 PABRIK KONTEN MULTI-PRODUK & PLANNER LOKAL AKTIF!`);
  console.log(`======================================================`);
  console.log(`👉 Akses Dashboard di: http://localhost:${PORT}`);
  console.log(`📦 Database Produk: data/products.json`);
  console.log(`📋 Antrean Konten: data/content_queue.json\n`);
});
