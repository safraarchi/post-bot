/**
 * ==============================================================================
 * Solusi Sawit Nusantara - Cloudflare Worker: Auto First-Comment Engine
 * ==============================================================================
 * Skrip Serverless 100% Cloud (Gratis & Berjalan 24 Jam Nonstop)
 * Dipicu secara otomatis oleh cron-job.org pada:
 * - 08:06 WIB (01:06 UTC) -> 6 Menit setelah postingan pagi tayang
 * - 18:36 WIB (11:36 UTC) -> 6 Menit setelah postingan sore tayang
 *
 * FITUR KEAMANAN ANTI-BAN & ANTI-SPAM META:
 * 1. 5 Variasi Naskah Komentar Singkat (Rotasi Otomatis agar Tidak Dicap Bot)
 * 2. Cek Idempotensi: Tidak akan pernah dobel komentar jika Page sudah berkomentar
 * 3. Filter Konten: Hanya mengomentari konten Edukasi & Berita (Konten Promo diabaikan karena sudah ada link di caption)
 * 4. Pengaman Kunci Rahasia (?auth=TOKEN) agar tidak bisa dipicu sembarang orang
 * ==============================================================================
 */

// Konfigurasi Default (Bisa juga diset via Environment Variable di Dashboard Cloudflare)
const DEFAULT_PAGE_ID = '1340652705797853';
const DEFAULT_SECRET_KEY = 'sawit_nusantara_cron_2026';

// 5 Variasi Naskah Komentar Singkat & Padat (Maksimal 2 Baris, Mobile-Friendly)
const COMMENT_VARIATIONS = [
  "🌿 Konsultasi dosis kocor & pemesanan Paket Kombo 2 Ha (Bisa COD):\n👉 https://wa.me/6285815768319?text=Halo%20Admin,%20saya%20mau%20konsultasi%20dosis%20kocor%20sawit",
  "🌾 Info lengkap Paket Kombo 2 Hektar (Bisa Bayar di Tempat) & tanya jawab:\n👉 https://wa.me/6285815768319?text=Halo%20Admin,%20saya%20mau%20order%20Paket%20Kombo%20Sawit",
  "🚜 Panduan pemupukan sawit hemat & pemesanan Paket Kombo (Bisa COD):\n👉 https://wa.me/6285815768319?text=Halo%20Admin,%20tanya%20Solusi%20Sawit%20Nusantara",
  "🌴 Butuh solusi sawit trek atau pelepah kaku? Chat tim agronomi kami di sini:\n👉 https://wa.me/6285815768319?text=Halo%20Admin,%20kebun%20sawit%20saya%20ada%20kendala",
  "💬 Tanya jawab perawatan kebun sawit & info pemesanan (Bisa COD):\n👉 https://wa.me/6285815768319?text=Halo%20Admin,%20mau%20tanya%20produk%20sawit"
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Ambil konfigurasi dari Environment Variables Cloudflare atau Default
    const PAGE_ID = env.FB_PAGE_ID || DEFAULT_PAGE_ID;
    const PAGE_ACCESS_TOKEN = env.FB_PAGE_ACCESS_TOKEN;
    const SECRET_KEY = env.SECRET_AUTH_KEY || DEFAULT_SECRET_KEY;

    // 1. Healthcheck / Status Endpoint
    if (pathname === '/' || pathname === '/status') {
      return new Response(JSON.stringify({
        status: 'ONLINE',
        service: 'Solusi Sawit Nusantara Auto-Comment Cloud Worker',
        pageId: PAGE_ID,
        hasToken: Boolean(PAGE_ACCESS_TOKEN),
        serverTimeUTC: new Date().toISOString(),
        instructions: 'Gunakan endpoint /trigger?auth=YOUR_SECRET_KEY untuk memicu auto-comment.'
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verifikasi Autentikasi Pengaman (Mencegah Akses Liar)
    const clientAuth = url.searchParams.get('auth') || request.headers.get('Authorization')?.replace('Bearer ', '');
    if (clientAuth !== SECRET_KEY) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Kunci otentikasi salah atau tidak disertakan (?auth=YOUR_SECRET_KEY).'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!PAGE_ACCESS_TOKEN) {
      return new Response(JSON.stringify({
        error: 'FB_PAGE_ACCESS_TOKEN belum disetel di Environment Variables Cloudflare Workers.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Mode Eksekusi: Dry-Run (Uji Coba) vs Real Trigger
    const isDryRun = (pathname === '/dry-run');

    try {
      // Ambil 5 postingan terakhir yang sudah terbit (PUBLISHED) dari Facebook Page
      const fbUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}/published_posts?fields=id,message,created_time,comments{from,message}&limit=5&access_token=${PAGE_ACCESS_TOKEN}`;
      const fbRes = await fetch(fbUrl);
      const fbData = await fbRes.json();

      if (fbData.error) {
        throw new Error(fbData.error.message);
      }

      const posts = fbData.data || [];
      const results = [];

      // Waktu acuan: HANYA postingan yang baru terbit dalam 2 jam terakhir (Fresh Post Only)
      const now = Date.now();
      const MAX_AGE_MS = 2 * 60 * 60 * 1000; // Maksimal 2 jam terakhir

      for (const post of posts) {
        const postTime = new Date(post.created_time).getTime();
        const ageHours = ((now - postTime) / (1000 * 60 * 60)).toFixed(1);

        // Abaikan postingan yang sudah lebih dari 2 jam (agar tidak menyentuh postingan lama)
        if (now - postTime > MAX_AGE_MS) {
          results.push({
            id: post.id,
            action: 'SKIPPED_TOO_OLD',
            reason: `Postingan terbit ${ageHours} jam lalu (>2 jam)`
          });
          continue;
        }

        const message = post.message || '';

        // Filter Proteksi 1: Hanya komentari postingan resmi sistem kita (ditandai tagar resmi #SolusiSawitNusantara)
        if (!message.includes('#SolusiSawitNusantara')) {
          results.push({
            id: post.id,
            action: 'SKIPPED_NOT_SYSTEM_POST',
            reason: 'Bukan postingan dari sistem (tidak ada tagar #SolusiSawitNusantara)'
          });
          continue;
        }

        // Filter Proteksi 2: Jika postingan adalah PROMO (sudah ada link wa.me di caption), jangan komentari
        if (message.includes('wa.me') || message.includes('whatsapp.com')) {
          results.push({
            id: post.id,
            action: 'SKIPPED_IS_PROMO',
            reason: 'Postingan tipe Promo (link WhatsApp sudah ada langsung di caption)'
          });
          continue;
        }

        // Filter Proteksi 2: Cek apakah Page sudah pernah berkomentar (Idempotensi / Anti-Dobel)
        const comments = post.comments?.data || [];
        const alreadyCommented = comments.some(c => {
          const fromId = c.from?.id;
          const cMsg = c.message || '';
          return fromId === PAGE_ID || cMsg.includes('6285815768319') || cMsg.includes('wa.me');
        });

        if (alreadyCommented) {
          results.push({
            id: post.id,
            action: 'SKIPPED_ALREADY_COMMENTED',
            reason: 'Komentar resmi dari Page sudah ada di postingan ini'
          });
          continue;
        }

        // Pilih 1 dari 5 variasi komentar secara dinamis (Anti-Spam Spintax)
        const commentIndex = Math.floor(Math.random() * COMMENT_VARIATIONS.length);
        const selectedComment = COMMENT_VARIATIONS[commentIndex];

        if (isDryRun) {
          results.push({
            id: post.id,
            action: 'DRY_RUN_MATCHED',
            commentVariation: commentIndex + 1,
            commentPreview: selectedComment
          });
          break;
        }

        // Eksekusi Pengiriman Komentar Pertama ke Facebook Graph API
        const commentUrl = `https://graph.facebook.com/v21.0/${post.id}/comments`;
        const commentRes = await fetch(commentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: selectedComment,
            access_token: PAGE_ACCESS_TOKEN
          })
        });

        const commentData = await commentRes.json();
        if (commentData.error) {
          results.push({
            id: post.id,
            action: 'FAILED',
            error: commentData.error.message
          });
        } else {
          results.push({
            id: post.id,
            action: 'COMMENT_PUBLISHED',
            commentId: commentData.id,
            commentVariation: commentIndex + 1,
            commentText: selectedComment
          });
          // Cukup 1 komentar per jadwal (hanya untuk postingan yang baru saja tayang)
          break;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        isDryRun,
        totalChecked: posts.length,
        results
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
