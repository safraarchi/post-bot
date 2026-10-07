/**
 * Skrip Helper Konversi Token Meta Graph API ke Long-Lived / Permanent Page Token
 * 
 * Penggunaan:
 *   node scripts/get_permanent_token.js --appId=<APP_ID> --appSecret=<APP_SECRET> --userToken=<SHORT_OR_LONG_USER_TOKEN>
 * 
 * Skrip ini akan:
 * 1. Menukar User Token menjadi Long-Lived User Token (60 hari).
 * 2. Mengambil daftar Page yang Anda kelola beserta Page Access Token yang bersifat PERMANEN (Never Expires).
 * 3. Menampilkan Page ID dan Token yang siap disalin ke file .env dan n8n.
 */

const fs = require('fs');
const path = require('path');

function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (arg) return arg.split('=')[1];
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

const appId = getArg('appId');
const appSecret = getArg('appSecret');
const userToken = getArg('userToken');

async function main() {
  console.log('\n===============================================================');
  console.log('🔑 GENERATOR LONG-LIVED / PERMANENT FACEBOOK PAGE ACCESS TOKEN');
  console.log('===============================================================\n');

  if (!userToken) {
    console.log('Panduan Mendapatkan Token Permanen (Never Expire):');
    console.log('--------------------------------------------------');
    console.log('1. Buka Meta Graph API Explorer: https://developers.facebook.com/tools/explorer/');
    console.log('2. Pilih Facebook App Anda di dropdown "Meta App".');
    console.log('3. Pada dropdown "User or Page", pilih "User Token".');
    console.log('4. Tambahkan izin (Permissions) berikut:');
    console.log('   - pages_show_list');
    console.log('   - pages_read_engagement');
    console.log('   - pages_manage_posts');
    console.log('5. Klik tombol biru "Generate Access Token" dan setujui login Facebook.');
    console.log('6. Buka halaman App Basic Settings: https://developers.facebook.com/apps/ -> Pilih App -> Settings -> Basic.');
    console.log('   Salin "App ID" dan "App Secret".');
    console.log('\n7. Jalankan perintah ini di terminal:');
    console.log('   node scripts/get_permanent_token.js --appId=YOUR_APP_ID --appSecret=YOUR_APP_SECRET --userToken=PASTE_USER_TOKEN_HERE\n');
    return;
  }

  try {
    let activeToken = userToken;

    // Jika appId dan appSecret diberikan, tukar dulu ke Long-Lived User Token
    if (appId && appSecret) {
      console.log('⏳ Menukar User Token ke Long-Lived User Token (60 hari)...');
      const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(userToken)}`;
      
      const exRes = await fetch(exchangeUrl);
      const exData = await exRes.json();

      if (exData.error) {
        console.error('❌ Gagal menukar token:', exData.error.message);
        process.exitCode = 1;
        return;
      }

      activeToken = exData.access_token;
      console.log('✅ Berhasil mendapatkan Long-Lived User Token!\n');
    }

    // Ambil daftar Halaman Facebook yang dikelola oleh user ini
    console.log('⏳ Mengambil daftar Facebook Page dan Permanent Page Token...');
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${encodeURIComponent(activeToken)}`;
    
    const accRes = await fetch(accountsUrl);
    const accData = await accRes.json();

    if (accData.error) {
      console.error('❌ Gagal mengambil data Page:', accData.error.message);
      process.exitCode = 1;
      return;
    }

    if (!accData.data || accData.data.length === 0) {
      console.log('⚠️ Tidak ada Facebook Page yang ditemukan untuk akun ini.');
      console.log('Pastikan akun Facebook Anda terdaftar sebagai Admin pada Halaman tersebut.');
      return;
    }

    console.log(`\n🎉 Ditemukan ${accData.data.length} Halaman Facebook:\n`);

    for (const page of accData.data) {
      console.log(`---------------------------------------------------------------`);
      console.log(`📌 NAMA HALAMAN : ${page.name}`);
      console.log(`🆔 PAGE ID      : ${page.id}`);
      console.log(`🔑 PAGE TOKEN   : ${page.access_token}`);
      console.log(`---------------------------------------------------------------`);
    }

    console.log('\n💡 LANGKAH BERIKUTNYA:');
    console.log('1. Salin PAGE TOKEN untuk Halaman yang Anda inginkan (misal: "Solusi Sawit Nusantara").');
    console.log('2. Buka file .env dan perbarui variabel:');
    console.log('   FB_PAGE_ACCESS_TOKEN=<PAGE_TOKEN_DI_ATAS>');
    console.log('3. Uji kembali dengan perintah: npm run test:token');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('❌ Terjadi kesalahan jaringan:', err.message);
    process.exitCode = 1;
  }
}

main();
