# Design System & UI Guidelines: MTC Attendance App

Dokumen ini berisi panduan desain antarmuka untuk aplikasi absensi (Mobile untuk Karyawan, Desktop untuk Admin) berdasarkan identitas merek PT Media Teknologi Celebes.

## 1. Identitas Merek (Brand Identity)
*   **Logo:** Menggunakan logo geometris "MTC" berwarna putih dengan latar belakang biru cerah.
*   **Karakter Visual:** Profesional, modern, *clean*, dan tegas (khas perusahaan rintisan industri kreatif dan otomatisasi).

## 2. Palet Warna (Color Palette)

Palet warna diekstrak dari logo MTC dan referensi *dashboard*.

### Primary Colors (Brand)
*   **Primary Blue:** `#1A82FF` (Warna biru cerah dominan dari latar belakang logo. Digunakan untuk tombol utama, ikon aktif, dan tautan).
*   **Primary Dark/Slate:** `#2B3C5A` (Warna biru gelap dari referensi header mobile & aksen desktop. Digunakan untuk header aplikasi mobile, sidebar admin, dan teks judul tebal).

### Neutral & Background Colors
*   **Background White:** `#FFFFFF` (Latar belakang utama aplikasi dan kartu/card).
*   **Background Off-White/Gray:** `#F4F7F9` (Latar belakang *canvas* di desktop atau halaman *dashboard* agar *card* putih lebih menonjol).
*   **Border/Divider:** `#E2E8F0` (Abu-abu sangat terang untuk garis pembatas dan *outline* kartu).

### Text Colors
*   **Text Primary:** `#1E293B` (Abu-abu kehitaman untuk teks utama/paragraf agar lebih nyaman dibaca daripada hitam pekat).
*   **Text Secondary:** `#64748B` (Abu-abu sedang untuk label, deskripsi kecil, dan *placeholder*).
*   **Text Inverted:** `#FFFFFF` (Teks di atas latar belakang Primary Blue atau Primary Dark).

### Status/Semantic Colors (Penting untuk Absensi)
*   **Success (Clock In):** `#10B981` (Hijau)
*   **Danger (Clock Out / Error):** `#EF4444` (Merah)
*   **Warning (Pending/Late):** `#F59E0B` (Kuning/Oranye)

## 3. Tipografi (Typography)

Mengacu pada font tebal tanpa kait (sans-serif) pada logo perusahaan.

*   **Font Family Utama (Heading & Brand):** `Montserrat` atau `Poppins`. Font geometris ini senada dengan bentuk logo MTC yang tegas dan sudutnya tajam.
*   **Font Family Sekunder (Body Text & UI):** `Inter` atau `Roboto`. Sangat mudah dibaca untuk data berukuran kecil di tabel admin atau *mobile*.

**Skala Ukuran (Typography Scale):**
*   **H1 (Header Admin):** 24px, Bold
*   **H2 (Judul Card/Mobile Header):** 20px, Semi-Bold
*   **H3 (Sub-judul):** 16px, Medium
*   **Body (Teks Utama):** 14px, Regular
*   **Caption (Label/Waktu):** 12px, Regular/Medium

## 4. Komponen UI (UI Components)

*   **Cards (Kartu):** Latar putih (`#FFFFFF`), sudut membulat (*border-radius*: `12px` untuk mobile, `8px` untuk desktop), bayangan sangat halus (*box-shadow*: `0 4px 6px -1px rgba(0, 0, 0, 0.05)`).
*   **Buttons (Tombol):**
    *   *Primary Button (Clock In):* Latar `Primary Blue`, Teks Putih, melengkung penuh/rounded-full untuk aksi utama, atau `border-radius: 8px` untuk aksi standar.
    *   *Secondary Button:* Garis luar (*outline*) `Primary Blue`, teks `Primary Blue`, latar transparan.
*   **Inputs:** Bidang isian (seperti deskripsi foto) memiliki latar belakang abu-abu terang (`#F8FAFC`) dengan border tipis saat tidak aktif, dan border `Primary Blue` saat fokus.

## 5. Tata Letak Antarmuka (Layout Guidelines)

### 5.1. Aplikasi Mobile (Karyawan - Sisi Kanan Referensi)
*   **Top Header:** Latar belakang warna `Primary Dark` dengan teks putih. Berisi sapaan pengguna ("Halo, [Nama]"), tanggal hari ini, dan foto profil kecil. Ujung bawah header bisa dibuat sedikit melengkung.
*   **Main Container:** Menggunakan gaya *Card Layout* yang tumpang tindih (*overlap*) sedikit ke bagian atas header gelap.
*   **Informasi Status:** Bagian teratas di dalam *card* menampilkan waktu *real-time* (jam digital besar) dan status (Misal: "Belum Absen").
*   **Action Area:** Tombol "Clock In" besar di tengah. Jika ditekan, berubah alur menjadi halaman unggah foto dan "Clock Out".
*   **Menu Grid:** Berdasarkan referensi, terdapat grid 2x3 atau 3x3 berisi ikon berlatar biru pucat dengan ikon biru cerah di tengahnya (untuk fitur tambahan seperti Riwayat, Izin, Profil).
*   **Bottom Navigation:** Bar navigasi sederhana di bawah dengan ikon (Home, History, Profile).

### 5.2. Dashboard Desktop (Admin - Sisi Kiri Referensi)
*   **Struktur:** Layout 12-kolom standar (*Grid System*).
*   **Sidebar/Top Navbar:** Sisi kiri bisa berupa sidebar berwarna `Primary Dark` (berisi menu: Dashboard, Karyawan, Laporan, Pengaturan). Jika menggunakan Top Navbar, gunakan latar putih dengan logo MTC di kiri atas.
*   **Konten Area (Latar Off-White):**
    *   **Stepper/Timeline Widget:** Terlihat di referensi gambar, ini bisa digunakan untuk menampilkan alur kehadiran (misal: log harian karyawan terpilih).
    *   **Data Cards (KPI):** Deretan kartu memanjang horizontal di atas untuk metrik (Total Karyawan, Hadir Hari Ini, Terlambat, Absen).
    *   **Tabel Kehadiran:** Kartu besar berisi tabel (Nama, Waktu Masuk, Waktu Keluar, Durasi, Foto Pekerjaan, Lokasi Peta). Kolom foto pekerjaan dapat ditekan untuk melihat *preview* gambar penuh beserta deskripsinya.