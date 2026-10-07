/**
 * Script Penguji Kredensial Meta Graph API (Facebook Page)
 * 
 * Penggunaan:
 *   node scripts/test_fb_token.js <PAGE_ID> <PAGE_ACCESS_TOKEN>
 * atau buat file .env dengan variabel FB_PAGE_ID dan FB_PAGE_ACCESS_TOKEN lalu jalankan:
 *   npm run test:token
 */

const fs = require('fs');
const path = require('path');

// Coba baca dari file .env jika ada
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

const pageId = process.argv[2] || process.env.FB_PAGE_ID;
const pageToken = process.argv[3] || process.env.FB_PAGE_ACCESS_TOKEN;

async function checkToken() {
  console.log('\n===================================================');
  console.log('🔍 MEMERIKSA KONEKSI & KREDENSIAL FACEBOOK PAGE API');
  console.log('===================================================\n');

  if (!pageId || !pageToken || pageId.includes('your_') || pageToken.includes('your_')) {
    console.error('❌ ERROR: FB_PAGE_ID atau FB_PAGE_ACCESS_TOKEN belum diatur!');
    console.log('\nCara menjalankan:');
    console.log('  node scripts/test_fb_token.js <PAGE_ID> <PAGE_ACCESS_TOKEN>');
    console.log('atau isi variabel FB_PAGE_ID dan FB_PAGE_ACCESS_TOKEN di file .env\n');
    process.exitCode = 1;
    return;
  }

  console.log(`📌 Page ID Target : ${pageId}`);
  console.log(`🔑 Page Token     : ${pageToken.substring(0, 15)}...${pageToken.substring(pageToken.length - 8)}\n`);

  try {
    // 1. Fetch info Halaman Facebook
    const pageUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=id,name,link,is_published,category&access_token=${encodeURIComponent(pageToken)}`;
    console.log('⏳ Mengirim request verifikasi ke Meta Graph API v21.0...');
    
    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    if (pageData.error) {
      console.error('\n❌ KONEKSI GAGAL DARI META GRAPH API:');
      console.error(`   Pesan   : ${pageData.error.message}`);
      console.error(`   Tipe    : ${pageData.error.type}`);
      console.error(`   Kode    : ${pageData.error.code} (Subcode: ${pageData.error.error_subcode || '-'})`);
      console.log('\n💡 TIPS PERBAIKAN:');
      console.log('1. Pastikan Anda menggunakan PAGE ACCESS TOKEN, BUKAN User Access Token biasa.');
      console.log('2. Pastikan akun Facebook Anda adalah Administrator dari Page tersebut.');
      console.log('3. Pastikan izin "pages_manage_posts" dan "pages_read_engagement" sudah dicentang saat generate token.');
      process.exitCode = 1;
      return;
    }

    console.log('\n✅ KONEKSI KE FACEBOOK PAGE BERHASIL!');
    console.log(`   🏷️  Nama Halaman  : ${pageData.name}`);
    console.log(`   🆔  ID Halaman    : ${pageData.id}`);
    console.log(`   📂  Kategori      : ${pageData.category || '-'}`);
    console.log(`   🌐  Link Halaman  : ${pageData.link || `https://facebook.com/${pageData.id}`}`);
    console.log(`   📢  Status Publik : ${pageData.is_published ? 'Aktif (Published)' : 'Tidak Publik'}`);

    console.log('   ✨ Verifikasi Izin: Token berhasil terhubung ke Halaman ini dan siap digunakan!');

    // 2. Debug Token untuk mengecek masa berlaku
    try {
      const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(pageToken)}&access_token=${encodeURIComponent(pageToken)}`;
      const debugRes = await fetch(debugUrl);
      const debugData = await debugRes.json();

      if (debugData.data) {
        const d = debugData.data;
        console.log('\n📋 DETAIL TOKEN & MASA BERLAKU:');
        console.log(`   Tipe Token : ${d.type || 'PAGE'}`);
        console.log(`   App ID     : ${d.app_id}`);
        console.log(`   Valid?     : ${d.is_valid ? 'Ya (Aktif)' : 'Tidak'}`);
        if (d.expires_at === 0) {
          console.log('   ⏳ Kedaluwarsa: NEVER EXPIRES (Token Permanen ✅ Sangat Ideal untuk n8n)');
        } else {
          const expDate = new Date(d.expires_at * 1000).toLocaleString('id-ID');
          console.log(`   ⏳ Kedaluwarsa: ${expDate} (Perhatian: Token ini memiliki batas waktu!)`);
        }
        if (d.scopes && d.scopes.length > 0) {
          console.log(`   🛡️  Scopes     : ${d.scopes.join(', ')}`);
        }
      }
    } catch {
      // debug_token optional jika token app terpisah
    }

    console.log('\n🎉 SEMUA PENGECEKAN KREDENSIAL SELESAI DENGAN BAIK!');
    console.log('Langkah selanjutnya: Masukkan kredensial ini ke dalam n8n workflow.');
    console.log('===================================================\n');

  } catch (err) {
    console.error('\n❌ Terjadi kesalahan jaringan saat menghubungi Meta API:', err.message);
    process.exitCode = 1;
    return;
  }
}

checkToken();
