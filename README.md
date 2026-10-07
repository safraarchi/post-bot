# Panduan Lengkap: Sistem Auto-Posting Facebook Page & AI Content Generator dengan n8n

Solusi otomasi lengkap untuk mengelola, membuat draf dengan AI, menjadwalkan, dan memposting konten (teks, gambar, tautan) secara otomatis ke **Facebook Page** menggunakan **n8n** dan **Google Sheets**.

---

## 📋 Daftar Isi
1. [Arsitektur & Alur Kerja](#-arsitektur--alur-kerja)
2. [Struktur Folder](#-struktur-folder)
3. [Langkah 1: Menjalankan n8n di Komputer Lokal](#-langkah-1-menjalankan-n8n-di-komputer-lokal)
4. [Langkah 2: Menyiapkan Google Sheets (Kalender Konten)](#-langkah-2-menyiapkan-google-sheets-kalender-konten)
5. [Langkah 3: Mendapatkan Kredensial Facebook Meta Graph API](#-langkah-3-mendapatkan-kredensial-facebook-meta-graph-api)
6. [Langkah 4: Mendapatkan API Key Google Gemini (AI Copywriting)](#-langkah-4-mendapatkan-api-key-google-gemini-ai-copywriting)
7. [Langkah 5: Import & Jalankan Workflow di n8n](#-langkah-5-import--jalankan-workflow-di-n8n)
8. [Panduan Diagnostik & Pengujian Token](#-panduan-diagnostik--pengujian-token)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🚀 Arsitektur & Alur Kerja

```
[Google Sheets] ──(Status: GENERATE_AI)──> [Workflow 2: AI Generator]
                                                    │ (Gemini AI membuat caption & hashtag)
                                                    ▼
[Google Sheets] <──────(Status: READY)──────────────┘
      │
      ▼ (Setiap 15 Menit)
[Workflow 1: Facebook Publisher]
      │
      ├─> Post Image / Link / Text ke Meta Graph API (v21.0)
      │
      ▼
[Facebook Page] (Konten Terbit Otomatis)
      │
      └─> Update Status di Google Sheets: PUBLISHED + Catat Link Postingan
```

---

## 📁 Struktur Folder

```
n8n/
├── package.json                         # Konfigurasi project & npm run scripts
├── .env.example                         # Contoh variabel lingkungan
├── README.md                            # Panduan lengkap ini
├── templates/
│   └── content_calendar_template.csv    # Template kalender konten untuk Google Sheets
├── workflows/
│   ├── 01_facebook_publisher.json       # Workflow n8n: Auto-post terjadwal ke Facebook
│   ├── 02_ai_content_generator.json     # Workflow n8n: Pembuatan caption via Gemini API Cloud
│   └── 03_content_receiver_webhook.json # Workflow n8n: Penerima batch konten lokal ke Google Sheets
└── scripts/
    ├── sawit_scheduler.js               # Facebook Cloud Scheduler (Langsung ke Meta API + Riset Berita)
    ├── generate_sawit_content.js        # Generator konten cerdas lokal via n8n Webhook & Sheets
    ├── test_fb_token.js                 # Skrip diagnostik kredensial & token Meta
    └── get_permanent_token.js           # Penukar token Meta menjadi token permanen
```

---

## ⚡ Solusi Utama: Facebook Cloud Scheduler (Desktop Shortcut)

Jika Anda **tidak ingin n8n menyala terus di laptop** atau laptop sering dimatikan, gunakan fitur **Direct Facebook Cloud Scheduler**:
- Cukup **double-click ikon di Desktop**: `Jadwalkan_Konten_Sawit.bat`
- Sistem otomatis:
  1. Melakukan riset internet berita & isu hangat sawit terkini.
  2. Menerapkan 6 pilar resmi produk *Solusi Sawit Nusantara*.
  3. Memeriksa jadwal agar tidak ada postingan bentrok (Anti-Dobel).
  4. Mendaftarkan naskah + foto langsung ke **Server Cloud Facebook** (`scheduled_posts`).
  5. **Setelah selesai, laptop bebas langsung dimatikan!** Facebook yang akan menerbitkan postingan sesuai jadwal.

### Perintah Terminal Alternatif:
```bash
# 1. Buka menu interaktif (Buat jadwal, lihat antrean, hapus jadwal):
npm run scheduler

# 2. Otomatis buat jadwal hari ini/besok (sekali klik):
npm run schedule:auto

# 3. Lihat daftar postingan yang sedang mengantre di Facebook:
npm run schedule:list
```

---

## 🌴 Generator Konten Lokal via n8n & Google Sheets

Jika Anda tetap ingin menggunakan n8n dan Google Sheets sebagai database antrean:
```bash
npm run generate-content -- --days 7
```

---

## 💻 Langkah 1: Menjalankan n8n di Komputer Lokal

Komputer Anda sudah terpasang **Node.js** dan **npm**. Anda dapat langsung menyalakan n8n dengan salah satu perintah berikut:

Buka terminal di folder project ini (`C:\Users\Lenovo\Desktop\yusuf\n8n`) lalu jalankan:

```bash
npx n8n
```
*atau:*
```bash
npm start
```

Setelah berjalan, buka browser dan akses antarmuka n8n di:
👉 **`http://localhost:5678`**

*(Saat pertama kali dibuka, Anda akan diminta membuat akun admin lokal gratis. Akun ini hanya tersimpan di komputer Anda).*

---

## 📊 Langkah 2: Menyiapkan Google Sheets (Kalender Konten)

1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Buat Spreadsheet baru dan beri nama, misalnya: **`Facebook Content Hub`**.
3. Ubah nama Sheet pertama (tab di bagian bawah) menjadi **`ContentQueue`**.
4. Klik menu **File** > **Import** > **Upload** > Pilih file template:
   `templates/content_calendar_template.csv`
5. Ambil **Google Spreadsheet ID** dari URL browser:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`
   *(Kode acak di antara `/d/` dan `/edit` adalah Spreadsheet ID Anda)*.

### Status Alur Konten:
- **`DRAFT`**: Konten masih dalam tahap ide kasar pengguna.
- **`GENERATE_AI`**: Beritahu n8n untuk membuatkan hook, caption, dan hashtag otomatis menggunakan Google Gemini.
- **`READY`**: Konten sudah siap diposting sesuai `scheduled_time`.
- **`PUBLISHED`**: Konten telah sukses tayang di Facebook (diisi otomatis oleh n8n).
- **`FAILED`**: Gagal tayang (keterangan error dicatat di kolom `error_log`).

---

## 🔑 Langkah 3: Mendapatkan Kredensial Facebook Meta Graph API

Untuk memposting ke Halaman Facebook tanpa masalah token kedaluwarsa, ikuti 4 tahap mudah berikut:

### 3.1 Buat Aplikasi di Meta Developer
1. Buka portal [Meta for Developers](https://developers.facebook.com/) dan login dengan akun Facebook Anda.
2. Klik **My Apps** > **Create App**.
3. Pilih use case **Other** > lalu pilih tipe **Business**.
4. Beri nama aplikasi (contoh: `n8n Auto Poster`) dan masukkan email Anda.

### 3.2 Buka Graph API Explorer
1. Di bilah menu atas, buka **Tools** > [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Di panel sebelah kanan:
   - **Meta App**: Pilih aplikasi yang baru dibuat (`n8n Auto Poster`).
   - **User or Page**: Pilih *User Token*.
   - **Add a Permission**: Tambahkan 3 izin wajib berikut:
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_posts`
3. Klik tombol **Generate Access Token** dan setujui konfirmasi di popup Facebook.

### 3.3 Dapatkan Permanent Page Access Token (Never-Expiring)
1. Di kolom endpoint Graph API Explorer, ganti isinya menjadi:
   ```http
   GET /v21.0/me/accounts?fields=id,name,access_token
   ```
2. Klik tombol **Submit**.
3. Anda akan melihat daftar Facebook Page yang Anda kelola:
   ```json
   {
     "data": [
       {
         "id": "102938475612345",
         "name": "Nama Halaman Anda",
         "access_token": "EAAX..."
       }
     ]
   }
   ```
4. Catat 2 nilai penting ini:
   - **`id`** -> Ini adalah **Facebook Page ID** Anda.
   - **`access_token`** -> Ini adalah **Permanent Page Access Token** Anda! Token yang didapat dari endpoint `/me/accounts` atas nama Page **tidak akan pernah kedaluwarsa** (*Never Expires*).

---

## 🤖 Langkah 4: Mendapatkan API Key Google Gemini (AI Copywriting)

Fitur AI digunakan untuk mengubah topik singkat menjadi caption yang kaya manfaat, lengkap dengan hook menarik dan hashtag:

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Login dengan akun Google Anda.
3. Klik menu **Get API key** > **Create API key**.
4. Salin kode API key Anda. *(Layanan Gemini 1.5 Flash tersedia gratis)*.

---

## 📥 Langkah 5: Import & Jalankan Workflow di n8n

### 5.1 Import Workflow 01: Facebook Publisher
1. Di antarmuka n8n (`http://localhost:5678`), klik menu **Workflows** > klik tombol **Add workflow** (atau tanda `+`).
2. Klik icon titik tiga (`...`) di pojok kanan atas kanvas > pilih **Import from File...**.
3. Pilih file:
   `workflows/01_facebook_publisher.json`
4. Dobel klik node **`Set Config & Credentials`**:
   - Ganti `PASTE_YOUR_FB_PAGE_ID_HERE` dengan ID Halaman Facebook Anda.
   - Ganti `PASTE_YOUR_PERMANENT_PAGE_TOKEN_HERE` dengan Page Access Token Anda.
   - Ganti `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` dengan ID Spreadsheet Anda.
5. Hubungkan koneksi Google Sheets pada node **`Ambil Data Google Sheets`** dan **`Update Status di Google Sheets`** menggunakan akun Google Anda (OAuth2 n8n).
6. Simpan workflow dan aktifkan toggle **Active** (di pojok kanan atas) agar cron berjalan otomatis setiap 15 menit.

### 5.2 Import Workflow 02: AI Content Generator
1. Buat workflow baru di n8n > klik titik tiga (`...`) > pilih **Import from File...**.
2. Pilih file:
   `workflows/02_ai_content_generator.json`
3. Dobel klik node **`Set Config AI & Sheets`**:
   - Masukkan `gemini_api_key` Anda.
   - Masukkan `google_sheet_id` Anda.
4. Hubungkan credential Google Sheets.
5. Saat Anda memasukkan baris baru di Google Sheets dengan status `GENERATE_AI`, cukup klik tombol **Test step** atau **Execute Workflow** untuk membiarkan AI menyusun caption secara otomatis!

---

## 🔍 Panduan Diagnostik & Pengujian Token

Sebelum mengaktifkan workflow, Anda dapat menguji kredensial Facebook Anda dengan skrip diagnostik otomatis yang sudah disediakan:

```bash
node scripts/test_fb_token.js <FB_PAGE_ID> <FB_PAGE_ACCESS_TOKEN>
```

**Hasil yang diharapkan jika token valid:**
```
===================================================
🔍 MEMERIKSA KONEKSI & KREDENSIAL FACEBOOK PAGE API
===================================================

⏳ Mengirim request verifikasi ke Meta Graph API v21.0...

✅ KONEKSI KE FACEBOOK PAGE BERHASIL!
   🏷️  Nama Halaman  : Bisnis Digital ID
   🆔  ID Halaman    : 102938475612345
   📢  Status Publik : Aktif (Published)
   🛠️  Izin Akses    : CREATE_CONTENT, MANAGE, MODERATE
   ✨ Verifikasi Izin: Token memiliki hak akses untuk posting (CREATE_CONTENT/MANAGE). Siap digunakan!

📋 DETAIL TOKEN & MASA BERLAKU:
   Tipe Token : PAGE
   Valid?     : Ya (Aktif)
   ⏳ Kedaluwarsa: NEVER EXPIRES (Token Permanen ✅ Sangat Ideal untuk n8n)
```

---

## ❓ Troubleshooting & FAQ

### 1. Bagaimana jika postingan gagal?
Cek kolom **`error_log`** di Google Sheets. Sistem n8n secara otomatis mencatat alasan kegagalan dari Facebook API.

### 2. Error: `(#200) Subject does not have permission to post`
Penyebab: Token yang digunakan adalah User Access Token biasa, bukan Page Access Token, atau akun Anda bukan Admin di Halaman Facebook tersebut.
**Solusi**: Pastikan mengambil token dari endpoint `/me/accounts` seperti pada [Langkah 3.3](#33-dapatkan-permanent-page-access-token-never-expiring).

### 3. Gambar tidak muncul saat diposting (`post_type` = IMAGE)?
Penyebab: `media_url` tidak dapat diakses secara publik oleh server Facebook (misalnya link Google Drive yang disetel privat atau link lokal).
**Solusi**: Gunakan URL gambar publik langsung (misalnya format `.jpg` / `.png` dari Unsplash, Cloudinary, AWS S3, atau Google Drive dengan status *Anyone with link can view*).

### 4. Bisakah n8n dijalankan 24 jam nonstop?
Bisa! Untuk pemakaian jangka panjang tanpa harus menyalakan komputer terus-menerus, Anda dapat meng-export workflow n8n ini dan meng-importnya ke VPS (misal: DigitalOcean, Hetzner) atau layanan n8n Cloud. Logika dan format file-nya 100% kompatibel.
