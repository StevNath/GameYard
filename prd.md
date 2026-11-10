# Product Requirements Document (PRD): GameYard - Unified Desktop Game Manager

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | GameYard (Unified PC Game Launcher & Library Manager) |
| **Dokumen Teknis** | [Technical Specification & Architecture (tech-spec.md)](./tech-spec.md) |
| **Platform Target** | Desktop (Windows 10/11 sebagai prioritas MVP; macOS/Linux untuk fase berikutnya) |
| **Status** | Draft v1.0 |
| **Target Rilis** | Q1 (MVP) |

---

## 1. Latar Belakang & Pernyataan Masalah (Problem Statement)

### Masalah Utama
Ekosistem *PC gaming* saat ini sangat terfragmentasi. Seorang gamer rata-rata memiliki game yang tersebar di berbagai *platform/storefront* seperti **Steam, Epic Games Store, Ubisoft Connect, EA App, GOG, dan Battle.net**. Akibatnya, pengguna mengalami beberapa masalah utama:
1. **Kelelahan Launcher (*Launcher Fatigue*):** Pengguna harus membuka-tutup banyak aplikasi untuk mencari atau memainkan game yang mereka miliki.
2. **Konsumsi Resource Sistem (RAM/CPU):** Menjalankan 4-5 launcher secara bersamaan di *background* memakan memori dan memperlambat performa PC, terutama bagi pengguna dengan spesifikasi menengah ke bawah.
3. **Lupa Kepemilikan Game (*Library Blindness*):** Banyak gamer lupa bahwa mereka sudah mengklaim game gratis di Epic Games atau membeli bundel di Steam, sehingga berujung membeli game yang sama dua kali atau tidak pernah memainkannya.
4. **Manajemen Penyimpanan yang Rumit:** Pengguna kesulitan melihat daftar seluruh game yang terinstal beserta ukuran filenya dari satu layar terpadu.

### Visi Produk ("One-Stop Play")
Menyediakan **satu aplikasi desktop yang ringan, cepat, dan mudah digunakan** yang menyatukan seluruh koleksi game PC pengguna dari berbagai platform ke dalam satu tempat untuk menemukan, mengelola, dan langsung memainkan game dengan sekali klik (*1-Click Direct Play*).

### Alur Pengalaman Utama (Core User Experience)
1. **Buka 1 Aplikasi Saja:** Pengguna menyalakan PC dan cukup membuka **GameYard** tanpa perlu membuka Steam, Epic Games, atau Ubisoft satu per satu.
2. **Pilih & Klik "Play":** Semua game dari berbagai platform berjejer rapi di satu layar. Pengguna cukup menekan tombol **"Play"** pada game mana saja.
3. **Jalan Otomatis di Balik Layar (*Direct Launch*):**
   * Untuk game *DRM-free*, game langsung dijalankan detik itu juga.
   * Untuk game yang mewajibkan klien resmi (karena DRM/Cloud Save), GameYard memanggil launcher asli **secara diam-diam di belakang layar (*background/minimized*)** dan langsung menjalankan gamenya, sehingga pengguna tetap merasa hanya berinteraksi dengan satu launcher.
4. **Bersih Otomatis Setelah Selesai:** Begitu pengguna keluar dari game (*Quit Game*), GameYard otomatis menutup launcher pihak ketiga yang berjalan di *background* agar RAM/CPU kembali lega, lalu mengembalikan fokus ke GameYard.

---

## 2. Pengguna Target Utama (Target Users & Personas)

Target pengguna dibagi menjadi dua segmen utama: **Basic User (Casual Gamer)** dan **Core Gamer**.

### Persona 1: "Budi si Casual / Basic User" (Prioritas Kemudahan)
* **Profil:** Bermain game 3-5 jam seminggu (misal: *Football Manager*, *GTA V* dari Epic, *Valorant*, dan beberapa game Steam). Tidak terlalu paham teknis PC.
* **Pain Point:** Bingung game X ada di aplikasi mana; kesal saat laptopnya lemot karena semua launcher menyala otomatis saat Windows *startup*.
* **Kebutuhan Utama:** Tampilan simpel, langsung mendeteksi semua game yang ada di PC, dan klik langsung main (*1-click play*) tanpa *setting* rumit.

### Persona 2: "Raka si Multi-Platform Collector / Gamer" (Prioritas Kelengkapan)
* **Profil:** Memiliki 200+ game di Steam, 150+ game klaim gratis di Epic Games, serta akun Ubisoft dan EA.
* **Pain Point:** Katalog game berantakan, susah memfilter game berdasarkan *genre* atau status instalasi lintas platform, dan ingin melacak total waktu bermain (*playtime*).
* **Kebutuhan Utama:** Sinkronisasi otomatis seluruh katalog (termasuk yang belum diinstal), fitur pencarian & filter cepat, serta manajemen *background process* agar launcher asli tertutup otomatis setelah selesai bermain.

---

## 3. Batasan Teknis & Bisnis (Constraints)

1. **Ketergantungan DRM (Digital Rights Management):** Mayoritas game di Steam, Epic, dan Ubisoft memiliki proteksi DRM. GameYard tidak mem-bypass DRM secara ilegal, melainkan mengorkestrasi pemanggilan launcher asli melalui protokol URI/CLI resmi dalam mode *silent/minimized*.
2. **Keterbatasan API Publik:** Steam memiliki Web API resmi, namun Epic Games dan Ubisoft tidak menyediakan API publik terbuka. Integrasi menggunakan kombinasi *local file/registry scanning* (membaca *manifest* game yang terinstal di PC) dan *OAuth session/token* lokal.
3. **Keamanan & Privasi Kredensial:** Aplikasi tidak menyimpan *password* akun game pengguna di *server* eksternal. Semua token sesi disimpan secara lokal dan terenkripsi di perangkat pengguna.

---

## 4. User Stories

| ID | Sebagai... | Saya ingin... | Sehingga... | Prioritas |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Basic User | Aplikasi otomatis mendeteksi semua game yang sudah terinstal di PC saya (Steam, Epic, Ubisoft, dll) tanpa perlu login satu-satu | Saya bisa langsung melihat dan memainkan game saya dalam waktu kurang dari 1 menit sejak instalasi. | **P0 (MVP)** |
| **US-02** | Gamer | Menghubungkan akun Steam, Epic, dan Ubisoft saya | Saya bisa melihat seluruh koleksi game yang saya miliki (baik yang sudah terinstal maupun yang belum terinstal). | **P0 (MVP)** |
| **US-03** | Basic User | Menekan tombol "Play" di satu tempat untuk menjalankan game dari platform mana pun | Saya tidak perlu mencari dan membuka launcher aslinya secara manual. | **P0 (MVP)** |
| **US-04** | Gamer | Mencari, memfilter (berdasarkan platform/status instalasi), dan mengurutkan game saya | Saya bisa menemukan game yang ingin dimainkan dengan cepat di antara ratusan koleksi. | **P0 (MVP)** |
| **US-05** | Basic User | Launcher asli (misal Epic/Ubisoft) otomatis tertutup setelah saya keluar dari game | RAM dan baterai laptop saya tetap hemat. | **P1 (MVP)** |
| **US-06** | Gamer | Melihat total waktu bermain (*playtime*) dan kapan terakhir kali saya memainkan sebuah game | Saya bisa melacak histori *gaming* saya lintas platform. | **P1 (MVP)** |
| **US-07** | Gamer | Menambahkan game *non-launcher* (file `.exe` lokal / game indie / emulator) secara manual | Seluruh 100% game di PC saya berada di satu tempat. | **P1 (MVP)** |

---

## 5. Fitur Inti: MVP vs Fase Selanjutnya (Future Releases)

### Fase 1: Minimum Viable Product (MVP) - *"Satu Tempat untuk Lihat & Main"*
Fokus MVP adalah **kecepatan, kemudahan *onboarding*, dan keandalan menjalankan game**.

1. **Auto-Scan Local Games (Zero-Login Onboarding):**
   * Memindai *registry* dan folder default/custom Windows (`libraryfolders.vdf` di Steam, folder `.egstore` / manifest JSON di Epic, dan *registry* Ubisoft Connect) untuk langsung mendeteksi game yang terinstal tanpa wajib login akun di awal.
2. **Account Sync (3 Platform Utama):**
   * Konektor autentikasi aman untuk menarik daftar *uninstalled library* dari **Steam, Epic Games, dan Ubisoft Connect**.
3. **Unified Library Dashboard:**
   * Tampilan Grid (Poster otomatis) dan List.
   * Pencarian instan (*search bar*), filter berdasarkan *Platform* (Steam/Epic/Ubisoft/Lokal) dan *Status* (Installed / Not Installed).
   * Pengambilan metadata otomatis (Gambar cover, deskripsi singkat, genre) dari database publik (misal: IGDB / SteamGridDB).
4. **One-Click Launch & Remote Install Trigger:**
   * Klik **Play** pada game terinstal -> memicu URI/CLI protokol launcher terkait (`steam://rungameid/<id>`, `com.epicgames.launcher://apps/<id>?action=launch`, `uplay://launch/<id>/0`) dan langsung masuk ke game.
   * Klik **Install** pada game yang belum terinstal -> membuka dialog instalasi dari launcher terkait.
5. **Smart Resource Saver (Auto-Close Client):**
   * Memantau proses `.exe` game yang sedang berjalan, menghitung durasi sesi bermain (*playtime tracking*), dan otomatis menutup launcher pihak ketiga setelah game ditutup.
6. **Manual Game Import:**
   * Fitur *Drag-and-drop* shortcut atau pilih file `.exe` untuk menambahkan game lokal di luar launcher utama.

### Fase 2: V2 / Nanti (Post-MVP) - *"Ekosistem & Kustomisasi"*
1. **Ekspansi Integrasi Platform:** Dukungan untuk **EA App, GOG Galaxy, Battle.net, Xbox PC Game Pass, dan Riot Client**.
2. **Duplicate Game Detector:** Memberi tanda jika pengguna memiliki game yang sama di lebih dari satu platform.
3. **Unified Storage Manager:** Menampilkan grafik penggunaan disk oleh masing-masing game dan tombol *Uninstall* terpusat.
4. **Controller / Fullscreen Mode (Big Picture):** Tampilan khusus yang bisa dinavigasi penuh menggunakan *gamepad/joystick* untuk pengguna TV atau PC *handheld* (ROG Ally / Legion Go / Steam Deck Windows).
5. **Unified Friends & Achievements:** Melihat daftar teman yang sedang online dan pencapaian (*achievement*) lintas platform.

---

## 6. Metrik Keberhasilan (Success Metrics / KPIs)

1. **North Star Metric:** **% Game Launches via GameYard** - Persentase sesi bermain pengguna yang dimulai dari tombol "Play" di GameYard (Target: **> 75%** dari total sesi bermain mereka).
2. **Onboarding & Sync Success Rate:**
   * **> 95%** game yang terinstal secara lokal berhasil terdeteksi otomatis pada pemindaian pertama (*Auto-Scan*).
   * **> 90%** tingkat keberhasilan sinkronisasi akun (Steam, Epic, Ubisoft) tanpa *error*.
3. **Engagement & Retention:**
   * **D7 Retention (Retensi Hari ke-7):** Minimal **40%** pengguna yang menginstal masih membuka aplikasi di minggu berikutnya.
   * **Average Connected Platforms per User:** Rata-rata pengguna mengelola minimal **2,5 platform** di dalam aplikasi.
4. **Performance Benchmarks:**
   * Penggunaan RAM saat *idle* di *background* **< 100 MB**.
   * Waktu buka aplikasi (*Cold start time*) **< 2 detik**.

---

## 7. Edge Cases (Kasus Khusus & Penanganannya)

1. **Game Butuh Update Sebelum Dimainkan:**
   * *Masalah:* Pengguna klik "Play" di GameYard, tapi game tersebut membutuhkan *update* besar di Steam/Epic sehingga game tidak langsung terbuka.
   * *Solusi:* Jika proses game utama tidak terdeteksi berjalan dalam 15 detik setelah dipicu, tampilkan notifikasi: *"Menunggu Steam/Epic menyelesaikan pembaruan atau sinkronisasi cloud..."* dan tampilkan jendela launcher asli ke depan layar agar pengguna melihat progres *update*.
2. **Sesi Login Pihak Ketiga Kedaluwarsa (Token Expired):**
   * *Masalah:* Epic Games atau Ubisoft me-reset sesi login pengguna setelah beberapa minggu.
   * *Solusi:* Tetap tampilkan katalog game terakhir yang sudah tersimpan di *cache* lokal, dan tampilkan *badge* peringatan non-intrusif: *"Koneksi Ubisoft terputus. Klik untuk login ulang agar katalog terbaru tersinkronisasi."*
3. **Game Dihapus atau Dipindahkan Manual dari Luar Aplikasi:**
   * *Masalah:* Pengguna menghapus game langsung lewat Windows Explorer atau lewat Steam.
   * *Solusi:* Lakukan pengecekan ringan pada *manifest* folder instalasi; jika file tidak ditemukan, otomatis ubah status tombol dari **Play** menjadi **Install**.
4. **Game dengan Launcher Berlapis (Double Launcher):**
   * *Masalah:* Pengguna membeli game Ubisoft (misal *Assassin's Creed*) di Steam. Saat dijalankan dari Steam, Steam membuka Ubisoft Connect.
   * *Solusi:* Fitur *Auto-Close Client* melacak *process tree* dari file `.exe` game utamanya, bukan hanya proses launcher pertama, agar tidak mematikan game secara tidak sengaja saat transisi antar launcher.
5. **Mode Offline (Tanpa Internet):**
   * *Masalah:* Pengguna tidak terhubung ke internet.
   * *Solusi:* Semua database katalog dan gambar poster wajib di-*cache* secara lokal di PC pengguna sehingga aplikasi tetap berfungsi 100% untuk melihat dan menjalankan game secara *offline*.

---

## 8. Hal-Hal di Luar Ruang Lingkup (Out of Scope)

1. **Bukan Toko Pembelian Game (No Built-in Storefront/Checkout):** Aplikasi tidak memproses transaksi pembelian game secara langsung.
2. **Tidak Mengunduh File Game Secara Langsung (No Custom CDN/Downloader):** Proses *download* dan *patching* file game tetap dijalankan melalui klien resmi (Steam/Epic/Ubisoft) demi keamanan dan kepatuhan ToS.
3. **Tidak Membajak atau Mem-bypass DRM (No DRM Bypass/Cracking):** Aplikasi hanya mengorkestrasi game resmi dan aplikasi lokal milik pengguna.
4. **Tidak Mendukung Game Mobile (Android/iOS) atau Konsol (PS5/Switch):** Fokus murni pada ekosistem Desktop PC.
5. **Tidak Ada Fitur Chat/Voice Call di MVP:** Fitur komunikasi sosial berada di luar fokus utama manajemen dan peluncuran game pada fase MVP.
