# Project Agent Guidelines & Instructions (`agent.md`)

Dokumen ini adalah panduan instruksi utama (*Single Source of Truth*) bagi setiap AI Coding Agent (Antigravity, Claude Code, Cursor, Codex, dll.) maupun *developer* yang menulis kode, memodifikasi UI, atau menambah fitur pada repositori **GameYard**.

---

## 1. Konteks Proyek & Dokumen Acuan

**GameYard** adalah aplikasi desktop *Unified PC Game Launcher & Library Manager* yang ringan untuk Windows (mengintegrasikan Steam, Epic Games Store, Ubisoft Connect, dan file `.exe` lokal dengan fitur *1-Click Silent Launch* serta *Smart Auto-Kill Client*).

Sebelum menulis kode, **wajib mengacu pada 4 dokumen dan aset utama berikut**:
1. **[`prd.md`](./prd.md):** Spesifikasi kebutuhan produk, persona pengguna, *user stories*, prioritas fitur MVP vs V2, dan *edge cases*.
2. **[`tech-spec.md`](./tech-spec.md):** Spesifikasi arsitektur **Tauri v2 (Rust + React 19 + TypeScript + Tailwind CSS + SQLite)**, skema tabel database, kontrak Tauri IPC, dan lokasi manifest/registry tiap platform.
3. **[`design.md`](./design.md):** Spesifikasi sistem desain *Candy-on-Black*, token warna, tipografi, ukuran koordinat komponen, dan aturan *Anti-Slop UI*.
4. **[`gameyard.figcraft`](./gameyard.figcraft) & [`gameyard-logo.svg`](./gameyard-logo.svg):** File master desain UI native FigCraft dan aset vektor logo resmi **B01-V3 (Roundhouse 'G+Y' Switchyard)**.

---

## 2. Aturan Ketat Desain & Frontend (Mandatory UI Guardrails)

Saat mengimplementasikan atau mengubah komponen React/Tailwind di folder `src/`, agen **wajib mematuhi aturan berikut tanpa kompromi**:

1. **Larangan Keras Karakter Em-Dash (`R-02`):**
   * **JANGAN PERNAH** menggunakan karakter *em-dash* (`—`) atau *en-dash* (`–`) di dalam teks UI, *placeholder*, pesan *toast/error*, komentar kode, maupun dokumentasi. Gunakan tanda hubung biasa (`-`), titik dua (`:`), atau pemisah pipa (`|`).
2. **Disiplin Palet Warna (*Candy-on-Black* & *Single Accent* `R-01`, `R-29`):**
   * Gunakan token CSS yang sudah ditetapkan di [`design.md`](./design.md):
     * Dark Mode: Background `#000000`, Surface `#0D0D0D`, Elevated `#141414`, Border `#262626`, Ink `#FFFFFF`, Muted `#A3A3A3`, Warning `#F59E0B`.
     * Light Mode: Background `#F4F4F0`, Surface `#FFFFFF`, Elevated `#EAEAE4`, Border `#D4D4CE`, Ink `#111111`, Muted `#4A4A46`.
   * Warna aksen `#93F1F7` (*Candy Cyan*) **hanya boleh dipakai pada**:
     1. Tombol CTA utama (`Launch <Game>`) di panel kiri (*Active Launch Stage*).
     2. Elemen rotor **Y** pada logo `B01-V3`.
     3. Teks status proses aktif (`Starting Process...`, `DIRECT .EXE`, dan aturan `CLEANUP` aktif).
   * **Dilarang keras** menambahkan gradien warna (terutama biru/ungu), efek *glassmorphism* (`backdrop-blur`), *box-shadow* neon, atau emoji dekoratif di dalam UI.
3. **Pertahankan Struktur Layout 3-Zona (`R-14`):**
   * Jangan pernah mengubah tampilan daftar katalog menjadi *card grid* seragam (3x3 atau 4x4).
   * Wajib mempertahankan tata letak 3-zona:
     * **Top Command Header (`64px`):** Logo `B01-V3` (`28x28px`) + Wordmark `GAMEYARD` + Badge Drive + Filter Input `[Ctrl+K]` + Tab Filter Storefront + Toggle Tema.
     * **Left Column - Active Launch Stage (`440px` lebar tetap di desktop):** Slot Cover Art & Path `.exe`, Ikon `40x40px` + Judul Game, Tombol CTA Utama (`48px` tinggi), Kotak *Launch Protocol & Resource Rules*, serta 2 tombol utilitas bawah.
     * **Right Column - Library Workspace:** Rak atas *Asymmetric Pinned Quick-Switch* (2 kartu dengan proporsi 7 kolom : 5 kolom) dan tabel bawah *Installed & Cloud Library Index* (baris setinggi `72px` dengan ikon `40x40px` di sebelah kiri nama game).
4. **Ergonomi, Aksesibilitas & Tipografi (`R-03`, `R-11`):**
   * Setiap tombol interaktif dan tab filter wajib memiliki tinggi minimal **`44px`** (`min-h-[44px]`) dan `cursor: pointer`.
   * Gunakan font `Poppins` untuk judul/wordmark, `Inter` untuk kontrol UI, dan `JetBrains Mono` / `Liberation Mono` dengan `tabular-nums` untuk seluruh path `.exe`, URI protokol, ukuran GB, dan durasi jam bermain.
   * Pastikan pintasan keyboard `[Ctrl+K]` (fokus ke kotak filter) dan `[Enter]` (jalankan game yang aktif di panggung kiri) berfungsi penuh.

---

## 3. Aturan Ketat Backend Rust & Arsitektur (`src-tauri/`)

Saat menulis kode sistem di `src-tauri/`, agen **wajib mengikuti prinsip rekayasa berikut**:

1. **Target Performa & Efisiensi Memori:**
   * Penggunaan RAM saat aplikasi *idle* wajib di bawah **100 MB** (target ideal **40 - 50 MB**).
   * Hindari *polling loop* yang agresif di *main thread*. Semua pemindaian disk dan pemantauan proses wajib berjalan di *background async task* (`tokio`).
2. **Pemantauan Proses Berbasis Folder (`Folder-Path Process Watching`):**
   * Jangan melacak status berjalannya game hanya dari satu PID perintah URI (karena akan gagal pada game dengan *double launcher* seperti Steam -> Ubisoft Connect -> Game).
   * Gunakan pendekatan berbasis direktori: pantau apakah ada proses `.exe` aktif yang path filenya berada di dalam `install_dir` game tersebut.
   * Saat jumlah proses `.exe` aktif dari `install_dir` turun menjadi `0`, tunggu **grace period 5 detik** (agar sinkronisasi *Cloud Save* launcher selesai), catat durasi ke tabel `play_sessions` di SQLite, lalu matikan proses launcher (`steam.exe`, `EpicGamesLauncher.exe`, `upc.exe`) jika opsi `auto_kill_client = 1`.
3. **Filter Heuristik Ekstraksi Ikon `.EXE`:**
   * Saat mencari file `.exe` utama di dalam folder instalasi game Steam untuk diekstrak ikonnya via Win32 API (`ExtractIconExW` / `SHGetFileInfoW`), selalu abaikan file `.exe` yang namanya mengandung kata kunci pembantu:
     `crash`, `handler`, `redist`, `prereq`, `setup`, `unins`, `eac`, `easyanticheat`, `battleye`, `benchmark`, `config`.
4. **Penyimpanan Lokal Offline-First & Privasi Kredensial:**
   * Seluruh data katalog wajib disimpan di SQLite lokal (`%APPDATA%\GameYard\gameyard.db`) menggunakan mode `WAL` (*Write-Ahead Logging*) agar aplikasi tetap berfungsi 100% saat *offline*.
   * Jangan pernah menyimpan token OAuth atau kredensial pengguna dalam bentuk *plain text* di SQLite atau file JSON. Gunakan crate `keyring` untuk menyimpannya di *Windows Credential Manager (DPAPI)*.

---

## 4. Urutan Prioritas Implementasi (Step-by-Step Build Order)

Jika diminta untuk mulai membangun atau melanjutkan kode aplikasi, kerjakan secara bertahap sesuai urutan ini:

1. **Tahap 1 - Scaffolding & Static UI Shell:**
   * Inisialisasi project Tauri v2 + React 19 + TypeScript + Tailwind CSS.
   * Implementasikan komponen UI sesuai [`design.md`](./design.md) lengkap dengan dukungan *Dark/Light Mode*, filter pencarian instan `[Ctrl+K]`, dan interaksi *Active Launch Stage*.
2. **Tahap 2 - SQLite Database & Local Auto-Scanner (Rust):**
   * Buat modul `db.rs` sesuai skema di [`tech-spec.md`](./tech-spec.md).
   * Buat modul `scanners/steam.rs` (`libraryfolders.vdf` & `appmanifest_*.acf`), `scanners/epic.rs` (manifest `.item`), dan `scanners/ubisoft.rs` (Registry), ditambah `icon_extractor.rs` (Win32 API).
3. **Tahap 3 - 1-Click Runner, Process Watcher & Auto-Kill Client:**
   * Buat modul `launcher/runner.rs` (eksekusi URI & `-silent` flag) dan `launcher/process_watcher.rs` (pemantau proses berbasis `install_dir`, pencatat *playtime*, dan *5s grace period auto-kill*).
4. **Tahap 4 - Manual `.EXE` Importer & Cloud Library Sync:**
   * Tambahkan fitur *drag-and-drop* / pilih file `.exe` lokal dan konektor **Steam Web API** untuk menampilkan koleksi game yang belum diinstal.
