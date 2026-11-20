# Rencana Pengembangan Post-MVP: GameYard v2.0 & Seterusnya

Dokumen ini merinci roadmap strategis untuk pengembangan **GameYard** setelah rilis MVP (Minimum Viable Product). Fokus utama Post-MVP adalah memperluas ekosistem storefront, optimasi manajemen penyimpanan, fitur sosial, serta mode navigasi perangkat genggam (*Handheld / Controller Mode*).

---

## 1. Fase 1: Ekspansi Integrasi Storefront & Cloud Sync Lanjutan (Q2)
* **Dukungan Storefront Tambahan:**
  * **EA App:** Integrasi pembacaan *registry* dan URI peluncuran `origin2://` / `eaapp://`.
  * **GOG Galaxy:** Parser database SQLite lokal GOG & manifest game offline installer.
  * **Battle.net & Riot Client:** Deteksi instalasi game (*Valorant, League of Legends, Overwatch 2, Diablo*) dan argumen CLI peluncuran.
  * **Xbox PC Game Pass (Microsoft Store):** Integrasi pemindaian folder terproteksi Xbox games dan Win32 app manifest.
* **OAuth Uninstalled Cloud Library untuk Epic & Ubisoft:**
  * Implementasi *WebView OAuth flow* yang aman untuk menarik katalog game cloud milik Epic Games Store dan Ubisoft Connect yang belum terinstal di PC (*Uninstalled Cloud Library*).

## 2. Fase 2: Manajemen Penyimpanan & Utilitas Lanjut (Q3)
* **Unified Storage Manager:**
  * Visualisasi grafik penggunaan disk per game dan per drive (`C:\`, `D:\`, dll).
  * Fitur *Move Installation Folder* (memindahkan file game antar drive/folder secara aman tanpa reinstall penuh).
  * Tombol *Batch Uninstall* terpusat dengan pembersihan file sisa (*cache/registry orphan*).
* **Duplicate Game Detector:**
  * Algoritma pintar yang mendeteksi jika pengguna memiliki game yang sama di lebih dari satu platform (misal: gratis di Epic dan dibeli di Steam), serta opsi untuk menyembunyikan atau memprioritaskan salah satu.

## 3. Fase 3: Mode Perangkat Genggam & TV / Controller Mode (Q4)
* **GameYard Big Picture (Gamepad / Controller Navigation):**
  * Antarmuka khusus layar penuh (*fullscreen UI*) yang dioptimalkan untuk navigasi penuh menggunakan *controller* (Xbox, PlayStation, Switch Pro Controller) atau PC *handheld* (**ROG Ally, Lenovo Legion Go, Steam Deck Windows**).
  * Pengaturan tombol pintas (*keybindings*) dan *virtual keyboard*.
* **Custom Themes & Styling (Theme Editor):**
  * Implementasi editor tema kustom sesuai permintaan awal (mendukung mode edit warna aksen, tema terang/gelap kustom, dan kustomisasi font).

## 4. Fase 4: Fitur Sosial & Achievement Lanjutan (V2.5+)
* **Unified Friends Presence:**
  * Menampilkan status teman yang sedang online di Steam, Epic, dan Discord Rich Presence yang lebih kaya.
* **Cross-Platform Achievements & Playtime Analytics:**
  * Dashboard statistik waktu bermain mingguan/bulanan, grafik genre favorit, dan ringkasan perolehan pencapaian (*achievements*).

---
*Disusun sebagai acuan pengembangan lanjutan setelah rilis stabil GameYard MVP.*
