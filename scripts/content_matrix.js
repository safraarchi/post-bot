/**
 * Solusi Sawit Nusantara - Matriks Konten Luas (24 Topik Komprehensif)
 * Mencakup Edukasi Agronomi Mendalam, Riset Berita Sawit Aktual, & Solusi Produk Otentik
 */

const path = require('path');
const fs = require('fs');

const BACKGROUNDS_DIR = path.join(__dirname, '..', 'public', 'images', 'backgrounds');
const PROMO_DIR = path.join(__dirname, '..', 'public', 'images', 'promo');

// Ambil semua daftar foto latar nyata yang tersedia
function getBackgroundPhotos() {
  if (!fs.existsSync(BACKGROUNDS_DIR)) return [];
  return fs.readdirSync(BACKGROUNDS_DIR)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .map(f => path.join(BACKGROUNDS_DIR, f));
}

// Ambil semua daftar banner promo resmi yang tersedia
function getPromoBanners() {
  if (!fs.existsSync(PROMO_DIR)) return [];
  return fs.readdirSync(PROMO_DIR)
    .filter(f => f.match(/^desain_\d+\.jpg$|^postingan_\d+\.jpg$/i))
    .map(f => path.join(PROMO_DIR, f));
}

const CONTENT_TOPICS = [
  // 1. EDUKASI: Daun Menguning (Magnesium vs Boron)
  {
    id: 1,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'WASPADA HARA',
    categoryColor: 'red',
    headlineHtml: 'Daun Sawit Menguning? <span class="headline-highlight">Jangan Asal Tebak Jamur, Cek 2 Hara Ini!</span>',
    summaryText: 'Beda gejala defisiensi Magnesium (pelepah tua) vs Boron (ujung daun).',
    topic: 'Ciri Daun Sawit Kurang Magnesium vs Kurang Boron & Cara Perbaikannya',
    instructions: `Tulis teks singkat dan padat (maksimal 80-110 kata):
- Hook: Daun sawit menguning atau pelepah memendek? Jangan buru-buru vonis penyakit jamur!
- 3 Poin singkat:
  1. Kurang Magnesium: Muncul bintik oranye (orange spotting) pada pelepah tua akibat tanah masam.
  2. Kurang Boron: Ujung daun keriting kaku dan bakal buah rontok sebelum mekar.
  3. Solusi lapangan: Gemburkan tanah piringan dan jaga keseimbangan hara mikro perakaran.
- CTA: Ada yang kebunnya mengalami gejala ini? Tulis di komentar!
PENTING: Murni edukasi, tanpa jualan produk.`
  },

  // 2. EDUKASI: Rawat Piringan
  {
    id: 2,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'TIPS LAPANGAN',
    categoryColor: 'orange',
    headlineHtml: 'Akar Sawit Rusak? <span class="headline-highlight">Hindari Tebas Piringan Sembarangan!</span>',
    summaryText: 'Piringan adalah dapur utama sawit: jaga bulu akar serabut tetap aktif.',
    topic: 'SOP Rawat Piringan Sawit: Hindari Tebas Bikin Akar Serabut Rusak',
    instructions: `Tulis naskah ringkas (maksimal 80-110 kata):
- Hook: Piringan pohon sawit itu 'dapur' utama tanaman, jangan sampai salah rawat!
- 3 Poin praktis:
  1. Akar serabut aktif berkumpul di radius 1-1,5 meter dari pangkal pohon.
  2. Jangan semprot herbisida dosis tinggi terlalu dekat batang karena membakar akar muda.
  3. Cukup bersihkan gulma berbahaya dan biarkan tanah tetap gembur serta lembap.
- CTA: Bagaimana cara bersihkan piringan di kebun Bapak/Ibu? Yuk diskusi!`
  },

  // 3. BERITA: Dinamika Harga TBS & Pupuk
  {
    id: 3,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'INFO TBS & PUPUK',
    categoryColor: 'blue',
    headlineHtml: 'Harga TBS Fluktuatif? <span class="headline-highlight">Jangan Boros Pupuk Kimia Mahal!</span>',
    summaryText: 'Kunci stabilitas: maksimalkan efisiensi serapan nutrisi ke perakaran.',
    topic: 'Update Dinamika Harga TBS & Tantangan Pupuk Mahal bagi Petani Sawit',
    instructions: `Tulis ulasan ringkas dan faktual (maksimal 80-110 kata):
- Hook: Harga TBS di PKS lagi fluktuatif, tapi harga pupuk kimia tetap bikin pusing kepala?
- 3 Poin inti:
  1. Pasar CPO dan target program biodiesel B40/B50 menuntut tonase panen tetap stabil.
  2. Kuncinya bukan terus boros pupuk mahal, melainkan efisiensi serapan nutrisi agar tidak menguap sia-sia.
  3. Petani cerdas fokus memaksimalkan rendemen dan bobot janjang per pokok.
- CTA: Berapa harga TBS bersih di daerah panjenengan minggu ini? Tulis di komentar!`
  },

  // 4. BERITA: Pupuk Menguap & Mengendap
  {
    id: 4,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'RISET SAWIT',
    categoryColor: 'blue',
    headlineHtml: '50% Pupuk Kimia Tabur <span class="headline-highlight">Sering Terbuang Percuma!</span>',
    summaryText: 'Fakta riset lapangan: pupuk menguap saat terik dan membatu di tanah masam.',
    topic: 'Fakta Lapangan: Mengapa 50% Pupuk Kimia Tabur Sering Terbuang Percuma?',
    instructions: `Tulis edukasi ringkas (maksimal 80-110 kata):
- Hook: Yakin pupuk tabur karungan Bapak/Ibu 100% dimakan akar sawit? Ternyata fakta lapangan mengejutkan!
- 3 Poin ringkas:
  1. Menguap saat terik matahari dan tercuci saat hujan lebat sebelum diserap akar.
  2. Mengendap jadi residu keras di tanah piringan yang bikin tanah masam.
  3. Solusi masa kini: Aplikasi kocor cair langsung ke zona perakaran agar terserap tuntas.
- CTA: Pernah cek kondisi tanah piringan kebun Anda belakangan ini?`
  },

  // 5. SOLUSI: SOP 3 Langkah Kocor
  {
    id: 5,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'SOP KOCOR SAWIT',
    categoryColor: 'green',
    headlineHtml: 'SOP Kocor Sawit Praktis: <span class="headline-highlight">Hemat Biaya Pupuk Hingga 50%!</span>',
    summaryText: 'Aplikasi mudah: Drum 200L + Botol 1,5L ke piringan pokok. Paket Kombo Lengkap untuk 2 Ha.',
    topic: 'SOP 3 Langkah Kocor Sawit Praktis (Drum 200L + Botol 1.5L) Hemat Biaya 50%',
    instructions: `Tulis penawaran solutif yang ringkas dan padat (maksimal 90-120 kata):
- Hook: Mau rawat sawit hasil melimpah tapi biaya pupuk pangkas sampai 50%? Pakai SOP Kocor Praktis ini!
- 3 Langkah Cepat:
  1. Campur 1L Biang Kocor + 1Kg Pelarut Kimia ke dalam drum 200L air.
  2. Ciduk pakai botol 1,5 Liter (Dosis: 1 botol per pokok sawit).
  3. Siram melingkar ke tanah piringan tempat biasa menabur pupuk.
- Penawaran: Paket Kombo Lengkap untuk 2 Hektar. Promo Spesial Terbatas!
- COD: Bisa Bayar di Tempat ke seluruh Indonesia!
- CTA: Hubungi kami via WhatsApp atau tulis 'MAU COD' sekarang juga!`
  },

  // 6. SOLUSI: Atasi Musim Trek
  {
    id: 6,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'SOLUSI KOMBO',
    categoryColor: 'green',
    headlineHtml: 'Musim Trek Sawit? <span class="headline-highlight">Pacu Bunga Betina TBS Jumbo!</span>',
    summaryText: 'Paket Kombo Lengkap untuk 2 Hektar. Bayar Aman di Tempat (COD).',
    topic: 'Musim Trek Sawit Bikin Pusing? Pacu Bunga Betina TBS Jumbo dengan Biang Kocor',
    instructions: `Tulis solusi singkat yang memikat (maksimal 90-120 kata):
- Hook: Pelepah hijau tapi buah sawit gak mau mutar? Keluar dompet isinya bunga jantan melulu?
- 3 Manfaat Nyata Biang Kocor:
  1. Booster hormon pembuahan: memacu serempak keluarnya bunga betina produktif.
  2. Mencegah bunga dompet rontok dan mempertebal daging buah TBS.
  3. Didukung Pelarut Kimia agar tanah gembur dan bobot timbangan di PKS naik tajam.
- Paket Kombo Lengkap untuk 2 Hektar.
- Garansi COD (Barang Sampai Baru Bayar).
- CTA: Mau atasi trek sekarang? Hubungi WhatsApp kami atau tulis 'PESAN' di komentar!`
  },

  // 7. EDUKASI: Songgo Pelepah (Songgo 2)
  {
    id: 7,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'MANAJEMEN TAJUK',
    categoryColor: 'orange',
    headlineHtml: 'Pelepah Habis Ditebas? <span class="headline-highlight">Awas Pohon Menguncup & Buah Kerdil!</span>',
    summaryText: 'Standar baku Songgo 2: pertahankan minimal 48–56 pelepah aktif per pokok.',
    topic: 'Aturan Baku Songgo Pelepah (Songgo 2): Bahaya Over-Pruning pada Bobot TBS',
    instructions: `Tulis edukasi praktis tajam (maksimal 80-110 kata):
- Hook: Kebun sawit kelihatan bersih gundul belum tentu bagus! Awas bahaya potong pelepah berlebihan!
- 3 Fakta Lapangan:
  1. Pelepah adalah pabrik makanan fotosintesis. Kurang pelepah = buah mengecil dan batang meruncing.
  2. Standar produksi: Terapkan Songgo 2 (minimal 2 pelepah menopang buah paling bawah).
  3. Jangan babat pelepah produktif hanya demi memudahkan jalan panen.
- CTA: Di kebun Anda sekarang terapkan Songgo berapa? Tulis di komentar!`
  },

  // 8. EDUKASI: Kastrasi Sawit TBM
  {
    id: 8,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'SAWIT MUDA',
    categoryColor: 'red',
    headlineHtml: 'Sawit Muda Keluar Bunga Pasir? <span class="headline-highlight">Jangan Dibiarkan, Buang Sekarang!</span>',
    summaryText: 'Kastrasi umur 14–24 bulan mengalihkan energi nutrisi untuk membesarkan bonggol batang.',
    topic: 'SOP Kastrasi Bunga Pasir Sawit TBM: Kunci Batang Kokoh Sebelum Panen Raya',
    instructions: `Tulis panduan ringkas kebun muda (maksimal 80-110 kata):
- Hook: Senang lihat sawit umur 1,5 tahun sudah belajar berbuah? Jangan bangga dulu, segera buang bunga pasirnya!
- 3 Alasan Wajib Kastrasi:
  1. Bunga dompet awal biasanya tidak bernilai jual dan hanya menguras energi pohon muda.
  2. Membuang bunga pasir membuat nutrisi fokus mempertebal diameter batang dan jaringan akar.
  3. Saat masuk panen umur 30 bulan, TBS yang keluar langsung berukuran jumbo dan serempak.
- CTA: Siapa yang sedang rawat kebun sawit muda? Bagikan pengalaman Anda!`
  },

  // 9. BERITA: Efisiensi Pupuk Tunggal vs Majemuk
  {
    id: 9,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'ANALISIS BIAYA',
    categoryColor: 'blue',
    headlineHtml: 'Pupuk Majemuk Mahal? <span class="headline-highlight">Strategi Pupuk Tunggal Hemat Biaya!</span>',
    summaryText: 'Kombinasi Urea/KCL + Bio-Katalisator pangkas modal hingga 40% per hektar.',
    topic: 'Strategi Efisiensi: Memadukan Pupuk Tunggal dengan Pelarut Aktif Perakaran',
    instructions: `Tulis ulasan kalkulasi praktis (maksimal 80-110 kata):
- Hook: Mau beli NPK karungan mahal, tapi kalau pakai pupuk tunggal takut kurang nendang?
- 3 Kiat Petani Cerdas:
  1. Pupuk tunggal (Urea, SP, KCL) jauh lebih hemat biaya per kilogram kandungan hara murninya.
  2. Kuncinya ada di daya serap akar: gunakan bio-katalisator pelarut agar pupuk tidak terikat tanah masam.
  3. Nutrisi cair cepat diserap bulu akar, tanah tidak cepat bantat.
- CTA: Berapa biaya pupuk per hektar di tempat Anda saat ini? Yuk sharing!`
  },

  // 10. EDUKASI: Kriteria TBS Matang Fraksi 2
  {
    id: 10,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'PANEN OPTIMAL',
    categoryColor: 'orange',
    headlineHtml: 'Jangan Panen Buah Mengkal! <span class="headline-highlight">Ini Ciri Rendemen CPO Tertinggi</span>',
    summaryText: 'Fraksi 2 sempurna: 3-5 brondolan jatuh ke piringan sebelum janjang dipotong.',
    topic: 'Kriteria Standar Kematangan TBS Fraksi 2: Maksimalkan Berat & Bebas Potongan PKS',
    instructions: `Tulis panduan panen mutu tinggi (maksimal 80-110 kata):
- Hook: Janjang dipotong terlalu cepat bikin timbangan anjlok dan kena denda sortasi pabrik!
- 3 Patokan Panen Cerdas:
  1. Tunggu minimal 3 hingga 5 butir brondolan lepas alami di piringan pohon.
  2. Buah fraksi 2 memiliki kadar minyak (rendemen CPO) tertinggi dan bobot maksimal.
  3. Hindari memanen buah mentah warna hitam pekat karena kadar asam lemak bebas (ALB) belum stabil.
- CTA: Berapa persen potongan sortasi di RAM/PKS tempat Anda jual minggu ini?`
  },

  // 11. EDUKASI: Tanah Gambut vs Mineral
  {
    id: 11,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'AGRONOMI TANAH',
    categoryColor: 'red',
    headlineHtml: 'Kebun di Lahan Gambut? <span class="headline-highlight">Waspada Tanah Ambles & Defisiensi Hara!</span>',
    summaryText: 'Kunci gambut: jaga tinggi muka air parit 40-60 cm dan lengkapi hara mikro Copper/Boron.',
    topic: 'Manajemen Sawit di Lahan Gambut: Pengaturan Tata Air & Pemupukan Mikro',
    instructions: `Tulis tips lapangan khusus gambut (maksimal 80-110 kata):
- Hook: Rawat sawit di lahan gambut punya tantangan tersendiri! Jangan disamakan dengan tanah mineral.
- 3 SOP Penting Lahan Gambut:
  1. Pertahankan tinggi muka air drainase 40–60 cm dari permukaan agar tanah tidak kering terbakar.
  2. Tanah gambut sangat miskin hara mikro Cu (tembaga) dan Zn (seng), lengkapi nutrisi pendukung.
  3. Pemupukan kocor cair terbukti lebih cepat diserap sebelum hanyut terbawa pori gambut yang porous.
- CTA: Siapa yang kebunnya di lahan gambut? Tulis lokasinya di komentar!`
  },

  // 12. SOLUSI: Rahasia Bobot TBS Naik di PKS
  {
    id: 12,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'DONGKRAK TONASE',
    categoryColor: 'green',
    headlineHtml: 'Timbangan di RAM Sering Ringan? <span class="headline-highlight">Bikin Brondolan Padat Bernas!</span>',
    summaryText: 'Nutrisi kocor aktif mengalirkan karbohidrat ke tandan. Paket Kombo Lengkap untuk 2 Ha.',
    topic: 'Dongkrak Bobot Janjang TBS: Peran Sinergi Biang Kocor dan Pelarut Kimia',
    instructions: `Tulis promosi solutif berbobot (maksimal 90-120 kata):
- Hook: Janjang kelihatan besar tapi pas ditimbang di RAM bobotnya malah enteng? Itu tanda brondolan kopong!
- 3 Keunggulan Paket Kombo:
  1. Biang Kocor memacu pembesaran sel daging buah dan kepadatan minyak CPO.
  2. Pelarut Pupuk Kimia melarutkan deposit pupuk lama di tanah agar tersedot tuntas ke buah.
  3. Hasil timbangan naik nyata mulai bulan ke-3 aplikasi teratur.
- Penawaran: Paket Kombo Lengkap untuk 2 Hektar. Promo Terbatas!
- Bayar COD di tempat saat paket tiba di kebun Anda!
- CTA: Mau timbangan panen berikutnya melonjak? Hubungi WhatsApp kami sekarang!`
  },

  // 13. EDUKASI: Kumbang Tanduk & Ulat Api
  {
    id: 13,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'HAMA PENYAKIT',
    categoryColor: 'red',
    headlineHtml: 'Pucuk Daun Sawit Tergunting V? <span class="headline-highlight">Waspada Kumbang Tanduk Oryctes!</span>',
    summaryText: 'Kumbang tanduk melubangi pupus muda dan mengundang busuk titik tumbuh.',
    topic: 'Gejala Serangan Kumbang Tanduk (Oryctes) dan Pencegahan Kerusakan Pupus Sawit',
    instructions: `Tulis tips proteksi kebun (maksimal 80-110 kata):
- Hook: Daun pupus muda yang baru membuka kelihatan seperti terpotong huruf V rapi? Itu ulah kumbang tanduk!
- 3 Langkah Pengendalian:
  1. Bersihkan tumpukan batang lapuk di sekitar kebun yang jadi sarang perkembangbiakan larva.
  2. Berikan insektisida butiran atau perangkap feromon di gawangan kebun.
  3. Perkuat daya tahan tanaman dengan nutrisi perakaran yang cukup agar cepat recovery.
- CTA: Ada serangan kumbang di kebun Anda? Bagaimana cara mengatasinya?`
  },

  // 14. EDUKASI: Peran Dolomit di Tanah Masam
  {
    id: 14,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'KESEHATAN TANAH',
    categoryColor: 'orange',
    headlineHtml: 'Tanah Masam pH Dibawah 4? <span class="headline-highlight">Pupuk Semahal Apapun Sia-Sia!</span>',
    summaryText: 'Tingkatkan pH ke 5,0–6,5 agar akar serabut mampu menyerap hara kocor maksimal.',
    topic: 'Pentingnya Menjaga pH Tanah Sawit: Peran Dolomit Sebelum Nutrisi Masuk',
    instructions: `Tulis edukasi kimia tanah praktis (maksimal 80-110 kata):
- Hook: Sudah tabur pupuk berton-ton tapi pohon sawit tetap lesu? Cek pH tanah piringan Anda!
- 3 Fakta Penting:
  1. Pada pH tanah di bawah 4,5, unsur hara Fosfor dan Kalium terikat erat oleh aluminium dan besi.
  2. Berikan dolomit secara berkala untuk menetralkan keasaman dan memasok kalsium-magnesium.
  3. Di tanah gembur ber-pH sehat, aplikasi kocor cair bekerja 3x lebih cepat diserap bulu akar.
- CTA: Pernah tes pH tanah kebun Anda? Berapa nilainya?`
  },

  // 15. BERITA: Kebijakan Biodiesel B40 & Dampak CPO
  {
    id: 15,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'KABAR INDUSTRI',
    categoryColor: 'blue',
    headlineHtml: 'Program Biodiesel B40 Berjalan! <span class="headline-highlight">Kebutuhan Pasokan TBS Nasional Naik</span>',
    summaryText: 'Peluang besar bagi petani sawit mandiri untuk menjaga tonase tetap konsisten.',
    topic: 'Peluang Petani Sawit di Era B40: Menjaga Tonase Stabil Sepanjang Tahun',
    instructions: `Tulis berita optimisme petani (maksimal 80-110 kata):
- Hook: Kebutuhan minyak sawit domestik makin melambung dengan percepatan program B40!
- 3 Implikasi untuk Petani:
  1. Pabrik PKS membutuhkan pasokan TBS bermutu tinggi secara kontinu tanpa jeda musim trek panjang.
  2. Petani yang mampu menjaga kebun tetap berbuah saat yang lain trek akan panen rezeki melimpah.
  3. Efisiensi biaya kebun dan perawatan rutin perakaran adalah modal utama bersaing.
- CTA: Yakin kebun Anda siap menyuplai panen maksimal tahun ini?`
  },

  // 16. EDUKASI: Sanitasi Gawangan & Pasar Pikul
  {
    id: 16,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'SOP PERKEBUNAN',
    categoryColor: 'orange',
    headlineHtml: 'Jalan Panen Rimbun Semak? <span class="headline-highlight">Panen Lambat, Brondolan Banyak Hilang!</span>',
    summaryText: 'Sanitasi teratur pasar pikul dan TPH menghemat waktu langsir hingga 30%.',
    topic: 'Pentingnya Sanitasi Gawangan & Pasar Pikul untuk Kelancaran Evakuasi Panen',
    instructions: `Tulis tips operasional kebun (maksimal 80-110 kata):
- Hook: Evakuasi buah lelet dan banyak brondolan tertinggal membusuk di semak? Periksa pasar pikul Anda!
- 3 Manfaat Pasar Pikul Bersih:
  1. Tenaga panen lebih cepat memindahkan janjang TBS ke Tempat Pengumpulan Hasil (TPH).
  2. Brondolan jatuh mudah terlihat dan terkutip bersih tanpa susut bobot.
  3. Memudahkan jalur angkut drum kocor saat perawatan nutrisi perakaran.
- CTA: Berapa bulan sekali Anda babat gawangan dan pasar pikul di kebun?`
  },

  // 17. EDUKASI: Cara Mengatasi Musim Trek
  {
    id: 17,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'SOLUSI MUSIM TREK',
    categoryColor: 'red',
    headlineHtml: 'Pohon Sawit Mogok Berbuah? <span class="headline-highlight">Pahami Siklus Biologis Musim Trek</span>',
    summaryText: 'Musim trek terjadi saat cadangan karbohidrat pohon habis; segera pulihkan fotosintesis.',
    topic: 'Memahami Penyebab Biologis Musim Trek Sawit dan Langkah Pemulihannya',
    instructions: `Tulis ulasan ilmiah populer (maksimal 80-110 kata):
- Hook: Habis panen puncak kok tiba-tiba buah menghilang berbulan-bulan? Jangan panik, ini siklus trek!
- 3 Tahapan Pemulihan Cepat:
  1. Pohon mengalami kelelahan nutrisi setelah mengeluarkan banyak tandan buah serempak.
  2. Jangan pangkas pelepah hijau karena pohon butuh fotosintesis ekstra memulihkan tenaga.
  3. Guyur nutrisi cair langsung ke akar untuk memicu inisiasi bakal bunga betina baru.
- CTA: Berapa lama biasanya kebun Anda mengalami trek? Yuk sharing solusinya!`
  },

  // 18. SOLUSI: Perhitungan Hemat Rp 1.450 / Pokok
  {
    id: 18,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'HITUNGAN HEMAT',
    categoryColor: 'green',
    headlineHtml: 'Rawat Sawit Hemat & Efisien! <span class="headline-highlight">Paket Kombo Lengkap 2 Hektar</span>',
    summaryText: 'Pangkas biaya pupuk kimia hingga separuh. Dosis resmi: Drum 200L + Botol 1.5L.',
    topic: 'Simulasi Penghematan Biaya Kebun Sawit: Paket Kombo untuk 2 Hektar',
    instructions: `Tulis penawaran ekonomis yang meyakinkan (maksimal 90-120 kata):
- Hook: Biaya pupuk makin mencekik leher? Kini ada cara cerdas rawat sawit jauh lebih hemat dan efisien!
- Rincian Paket Kombo:
  1. Cukup ambil Paket Kombo, sudah mencukupi untuk 2 Hektar (± 260-280 pokok sawit).
  2. Berisi 1 Kg Pelarut Kimia + 1 Liter Biang Kocor (Duo Nutrisi Lengkap).
  3. Aplikasi sangat gampang: 1 Drum 200L air + takar botol 1,5L per pohon ke piringan.
- Garansi 100% COD: Barang sampai di kebun baru bayar ke kurir!
- CTA: Hubungi kami via WhatsApp untuk ambil promo paket hemat sekarang juga!`
  },

  // 19. EDUKASI: Jeda 7-10 Hari Pasca Herbisida
  {
    id: 19,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'SAFETY SOP',
    categoryColor: 'red',
    headlineHtml: 'Habis Semprot Racun Rumput? <span class="headline-highlight">Jangan Langsung Kocor Pupuk!</span>',
    summaryText: 'Beri jeda minimal 7-10 hari agar residu herbisida tidak meracuni nutrisi perakaran.',
    topic: 'Aturan Keselamatan Aplikasi: Jeda Wajib Antara Semprot Herbisida dan Kocor Pupuk',
    instructions: `Tulis peringatan agronomis penting (maksimal 80-110 kata):
- Hook: Baru selesai semprot gulma langsung mau siram pupuk kocor? Tahan dulu! Ini pantangan besar!
- 3 Alasan Wajib Jeda:
  1. Herbisida mengandung bahan aktif kimia yang bisa menetralkan hormon dan enzim nutrisi bermanfaat.
  2. Residu racun rumput di tanah butuh waktu terurai agar tidak merusak bulu akar serabut muda.
  3. Berikan jeda 7 hingga 10 hari setelah semprot rumput, baru aplikasikan kocor nutrisi piringan.
- CTA: Apakah di kebun Anda sudah menerapkan jeda aman ini?`
  },

  // 20. BERITA: Standar Sortasi Pabrik Kelapa Sawit
  {
    id: 20,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'INFO PKS',
    categoryColor: 'blue',
    headlineHtml: 'Potongan PKS Tembus 5%? <span class="headline-highlight">Ketahui Standar Kualitas Buah Diterima</span>',
    summaryText: 'TBS bertangkai panjang dan buah mentah memicu potongan berat drastis di loading ramp.',
    topic: 'Menghindari Potongan Sortasi Pabrik: Standar Tangkai Cincin & Kematangan TBS',
    instructions: `Tulis tips niaga sawit (maksimal 80-110 kata):
- Hook: Uang panen terpotong banyak di timbangan PKS gara-gara kena penalti sortasi? Ini rahasia lolosnya!
- 3 Poin Penting Sortasi:
  1. Potong gagang buah mepet berbentuk huruf V (tangkai cincin) agar tidak kena potongan bobot sampah.
  2. Pastikan buah tidak menginap lebih dari 24 jam untuk menjaga kadar asam lemak bebas (ALB) rendah.
  3. Brondolan yang padat dan berminyak tinggi selalu dihargai kelas premium oleh pabrik.
- CTA: Berapa persen potongan sortasi terberat yang pernah Anda alami?`
  },

  // 21. SOLUSI: Garansi Aman COD Seluruh Nusantara
  {
    id: 21,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'GARANSI COD',
    categoryColor: 'green',
    headlineHtml: 'Bisa Bayar di Tempat (COD)! <span class="headline-highlight">Aman Sampai Pelosok Kebun Se-Indonesia</span>',
    summaryText: 'Paket Kombo Lengkap untuk 2 Hektar. Kurir antar sampai rumah/kebun, baru bayar.',
    topic: 'Layanan Pengiriman COD Terpercaya Solusi Sawit Nusantara ke Seluruh Indonesia',
    instructions: `Tulis penawaran rasa aman dan garansi (maksimal 90-120 kata):
- Hook: Takut belanja online barang tidak sampai atau barang palsu? Di Solusi Sawit Nusantara, Anda 100% AMAN!
- 3 Jaminan Transaksi Kami:
  1. Sistem COD Resmi: Uang baru Anda serahkan ke kurir saat barang sudah dipegang di tangan Anda.
  2. Jangkauan luas dari Aceh, Riau, Jambi, Sumsel, Kalbar, Kalteng, Kalsel, hingga Sulawesi.
  3. Paket dikemas tebal bubble wrap anti-bocor dan bergaransi kirim ulang jika rusak di jalan.
- Paket Kombo Lengkap (Pelarut 1Kg + Biang Kocor 1L) untuk 2 Hektar kebun.
- CTA: Hubungi kami via WhatsApp atau tulis 'SAYA MAU COD' sekarang juga!`
  },

  // 22. EDUKASI: Menggemburkan Tanah Piringan Keras
  {
    id: 22,
    category: 'EDUKASI_MURNI',
    categoryLabel: 'PERAKARAN SEHAT',
    categoryColor: 'orange',
    headlineHtml: 'Tanah Piringan Keras Membatu? <span class="headline-highlight">Jangan Dicangkul, Bahaya Akar Putus!</span>',
    summaryText: 'Akar aktif sawit dangkal di topsoil; gemburkan dengan mikroorganisme pengurai cair.',
    topic: 'Trik Menggemburkan Tanah Piringan Keras Tanpa Merusak Bulu Akar Aktif',
    instructions: `Tulis edukasi praktis ramah perakaran (maksimal 80-110 kata):
- Hook: Tanah piringan mengeras bantat mirip lantai semen? Jangan sekali-kali dicangkul dalam-dalam!
- 3 Solusi Perbaikan Tanah:
  1. Lebih dari 70% akar serabut penyerap nutrisi berada di kedalaman 0–20 cm tanah. Mencangkul akan memutus urat makan utama.
  2. Manfaatkan larutan mikroba dan pelarut organik untuk mengurai kerak fosfat yang membatu.
  3. Siramkan aplikasi kocor basah melingkar agar pori-pori tanah kembali berongga dan gembur alami.
- CTA: Bagaimana kondisi fisik tanah piringan kebun Anda sekarang?`
  },

  // 23. BERITA: Tren Ketahanan Kebun Hadapi Cuaca
  {
    id: 23,
    category: 'BERITA_AKTUAL',
    categoryLabel: 'KETAHANAN IKLIM',
    categoryColor: 'blue',
    headlineHtml: 'Cuaca Ekstrem Mengancam Kebun? <span class="headline-highlight">Jaga Daya Serap Air & Hara Perakaran</span>',
    summaryText: 'Translokasi nutrisi sawit bergantung pada keseimbangan kelembapan piringan.',
    topic: 'Menjaga Ketahanan Produksi Sawit di Tengah Anomali Cuaca dan Perubahan Iklim',
    instructions: `Tulis panduan mitigasi iklim (maksimal 80-110 kata):
- Hook: Musim hujan kebanjiran, musim terik kering kerontang? Pohon sawit butuh daya adaptasi kuat!
- 3 Strategi Adaptasi:
  1. Tutupi gawangan dengan seresah pelepah untuk menahan penguapan air tanah di musim panas.
  2. Hindari pupuk tabur saat kemarau karena tidak akan larut dan hanya menguap terbakar panas.
  3. Kocor nutrisi cair tetap efektif meresap ke akar aktif meski intensitas hujan terbatas.
- CTA: Daerah kebun Anda saat ini sedang kemarau atau musim hujan? Tulis di komentar!`
  },

  // 24. SOLUSI: Testimoni & Bukti Nyata Petani
  {
    id: 24,
    category: 'SOLUSI_PRODUK',
    categoryLabel: 'BUKTI NYATA',
    categoryColor: 'green',
    headlineHtml: 'Pelepah Hijau Segar 2-4 Pekan! <span class="headline-highlight">Bukti Nyata Aplikasi Kombo Kocor</span>',
    summaryText: 'Ribuan petani telah membuktikan efisiensi biaya dan lonjakan timbangan di PKS.',
    topic: 'Testimoni & Tahapan Nyata Perubahan Kebun Sawit Bersama Solusi Sawit Nusantara',
    instructions: `Tulis narasi testimoni memikat (maksimal 90-120 kata):
- Hook: Bukan sekadar janji manis, ini tahapan nyata yang dirasakan petani setelah kocor Paket Kombo!
- 3 Tahapan Hasil Nyata:
  1. Minggu ke-2 s/d 4: Daun menguning berubah hijau segar berkilau dan pelepah membuka lentur.
  2. Bulan ke-1 s/d 2: Bakal bunga betina mulai aktif bermunculan di ketiak pelepah, menekan bunga jantan.
  3. Bulan ke-3 ke atas: Tandan TBS memadat dan bobot timbangan naik tajam di RAM/PKS.
- Paket Kombo Lengkap untuk 2 Hektar. Promo Terbatas!
- Garansi COD (Barang Tiba Baru Bayar).
- CTA: Mau kebun sawit Anda menyusul sukses ini? Hubungi kami via WhatsApp sekarang!`
  }
];

module.exports = {
  CONTENT_TOPICS,
  getBackgroundPhotos,
  getPromoBanners
};
