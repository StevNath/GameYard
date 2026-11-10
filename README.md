<div align="left">
  <img src="./gameyard-logo.svg" alt="GameYard Logo" width="64" height="64" />
  <h1>GAMEYARD</h1>
  <p><strong>Unified Desktop PC Game Launcher &amp; Library Manager</strong></p>
  <p>Satu aplikasi desktop ringan untuk mendeteksi, mengelola, dan langsung menjalankan koleksi game PC dari <strong>Steam, Epic Games Store, Ubisoft Connect, serta file <code>.EXE</code> lokal</strong> tanpa menguras RAM.</p>
</div>

---

![GameYard Desktop UI Preview](./gameyard-preview.png)

---

## Ringkasan Fitur Utama (MVP)

1. **Zero-Login Local Auto-Scan:**
   Memindai manifest lokal di drive PC (`libraryfolders.vdf` & `appmanifest_*.acf` di Steam, manifest `.item` JSON di Epic Games, serta *Windows Registry* Ubisoft Connect) untuk menampilkan seluruh game yang sudah terinstal dalam waktu kurang dari 1 detik.
2. **1-Click Direct & Silent Launch:**
   Menjalankan game lintas platform dari satu tombol **Launch**. Untuk game yang membutuhkan klien DRM/Cloud Save, GameYard memicu protokol URI resmi (`steam://`, `com.epicgames.launcher://`, `uplay://`) dan menjalankan launcher asli dalam mode *silent/minimized* di belakang layar.
3. **Smart Resource Saver (Auto-Kill Client):**
   Memantau *process tree* dari file `.exe` game yang sedang dimainkan untuk mencatat durasi *playtime* secara akurat, lalu otomatis mematikan proses launcher pihak ketiga (`steam.exe`, `EpicGamesLauncher.exe`, `upc.exe`) 5 detik setelah pengguna keluar dari game agar RAM dan CPU kembali lega.
4. **Native `.EXE` Icon Extractor:**
   Mengekstrak ikon asli beresolusi tinggi langsung dari binary `.exe` di disk menggunakan Win32 API (`ExtractIconExW` / `SHGetFileInfoW`) dan menyimpannya ke cache lokal.
5. **Offline-First Local Database:**
   Seluruh indeks katalog, aturan peluncuran, status *pinning*, dan histori waktu bermain disimpan secara lokal di dalam SQLite (`gameyard.db`) sehingga tetap berfungsi 100% tanpa koneksi internet.

---

## Tech Stack & Target Performa

| Layer | Teknologi | Tujuan Utama |
| :--- | :--- | :--- |
| **Desktop Shell** | **Tauri v2** (WebView2) | Menghindari beban memori Electron/Chromium (Target Idle RAM: **40 - 50 MB**, Cold Start **< 2 detik**). |
| **System Backend** | **Rust** (Edition 2021) | Pemindaian manifest disk, akses Windows Registry (`winreg`), pemantauan PID (`sysinfo`), dan Win32 API (`windows-rs`). |
| **Frontend UI** | **React 19 + TypeScript + Vite** | Antarmuka cepat dengan *Asymmetric Pinned Quick-Switch* dan *Virtualized Library Index Table* (`@tanstack/react-virtual`). |
| **Styling System** | **Tailwind CSS** | Implementasi sistem desain *Candy-on-Black* (`#000000` bg, `#0D0D0D` surface, `#FFFFFF` ink, `#93F1F7` cyan accent) + Light Mode. |
| **Local Storage** | **SQLite** (`rusqlite`) + **DPAPI** (`keyring`) | Penyimpanan katalog *offline-first* dan brankas terenkripsi Windows Credential Manager untuk token sesi OAuth. |

---

## Struktur Dokumen & Aset Repositori

| File | Deskripsi |
| :--- | :--- |
| [`prd.md`](./prd.md) | **Product Requirements Document (PRD):** Latar belakang masalah, target persona (*Casual User* vs *Multi-Platform Collector*), *user stories*, prioritas fitur MVP vs V2, KPI, dan penanganan *edge cases*. |
| [`tech-spec.md`](./tech-spec.md) | **Technical Specification & Architecture:** Diagram arsitektur sistem, cara kerja *Auto-Scanner* tiap platform, *sequence diagram* peluncuran & *auto-kill*, skema tabel SQLite, dan kontrak Tauri IPC. |
| [`gameyard.figcraft`](./gameyard.figcraft) | **Master UI Design (FigCraft):** File desain native FigCraft berisi layar utama *Dark Mode (Candy-on-Black)*, simulasi *Light Mode*, dan catatan *R-31 Design Decision Log*. |
| [`gameyard-preview.png`](./gameyard-preview.png) | **UI Render Preview:** Ekspor gambar resolusi penuh (`2060x900`) dari kanvas desain FigCraft. |
| [`gameyard-logo.svg`](./gameyard-logo.svg) | **Brand Logomark (SVG):** Vektor logo resmi **GameYard (B01-V3 Roundhouse 'G+Y' Switchyard)**. |

---

## Filosofi Desain (Anti-Slop UI & Identity)

* **Identitas Logo (`B01-V3 Roundhouse 'G+Y' Switchyard`):** Terinspirasi dari *Roundhouse Turntable* (meja putar lokomotif di *railroad yard*). Cincin kolam luar beserta 3 slot garasi radial membentuk huruf **G**, sedangkan jembatan putar 3-arah di poros tengah membentuk huruf **Y** berwarna *cyan* (`#93F1F7`).
* **Komposisi Asimetris & Fungsional:** Menggantikan *card grid* seragam yang monoton dengan **440px Active Launch Stage** di sisi kiri (menampilkan *path* `.exe`, aturan protokol URI, dan status *Auto-Kill*), **2-Slot Asymmetric Pinned Quick-Switch** di kanan atas, dan **High-Density Execution Table** di kanan bawah untuk membandingkan ukuran disk serta status game secara instan.

---

## Roadmap Pengembangan

- [x] Perumusan PRD & Penanganan Edge Cases ([`prd.md`](./prd.md))
- [x] Perancangan Arsitektur Sistem & Skema Database ([`tech-spec.md`](./tech-spec.md))
- [x] Desain UI/UX Sistem & Identitas Logo Vektor ([`gameyard.figcraft`](./gameyard.figcraft) & [`gameyard-logo.svg`](./gameyard-logo.svg))
- [ ] Inisialisasi Kerangka Project (`Tauri v2 + React + TypeScript + SQLite`)
- [ ] Implementasi Modul Rust Local Scanner (Steam VDF/ACF, Epic JSON, Ubisoft Registry)
- [ ] Implementasi Eksekutor URI, Process Tree Watcher & Smart Auto-Kill Client
- [ ] Integrasi OAuth Account Sync (Uninstalled Cloud Library) & Metadata Cover Fetcher
