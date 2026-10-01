# Rencana Proyek MTC Attendance App

## 1. Ringkasan

MTC Attendance App adalah aplikasi absensi berbasis lokasi untuk dua peran:

- **Karyawan** memakai antarmuka mobile untuk login, clock in, clock out, mengirim foto dan deskripsi pekerjaan, serta melihat riwayat singkat.
- **Admin** memakai dashboard desktop untuk mengelola akun, memantau kehadiran harian, membuka lokasi di Google Maps, dan melihat rekap serta bukti pekerjaan.

Target pertama adalah **MVP operasional**, bukan sistem HR lengkap.

## 2. Sumber Kebutuhan

Rencana ini diturunkan dari seluruh artefak awal:

- `Alur Pengguna (User Flow).txt`: alur karyawan dan admin.
- `design_system_mtc_absensi.md`: identitas visual, komponen, dan layout.
- `Gemini_Generated_Image_nij0conij0conij0.jpg`: referensi antarmuka mobile.
- `mtc logo.jpg`: logo dan identitas PT Media Teknologi Celebes.

Belum ada source code, konfigurasi proyek, database, atau keputusan teknologi yang sudah mengikat.

## 3. Tujuan dan Ukuran Keberhasilan

### Tujuan MVP

1. Kehadiran tercatat dengan waktu server dan koordinat awal/akhir.
2. Setiap sesi kerja selesai memiliki minimal satu bukti foto dan deskripsi.
3. Admin dapat melihat status tenaga kerja hari itu tanpa mengolah data manual.
4. Rekap bulanan dapat ditelusuri sampai bukti pekerjaan dan lokasi.
5. Antarmuka konsisten dengan identitas MTC dan nyaman digunakan di ponsel maupun desktop.
6. Total durasi harian dihitung dari akumulasi seluruh sesi tanpa target minimum.

### Indikator penerimaan awal

- Tidak ada satu karyawan yang memiliki lebih dari satu sesi aktif.
- Jumlah sesi selesai per hari tidak dibatasi dan seluruh durasinya dijumlahkan.
- Clock out normal tidak dapat diselesaikan tanpa lokasi akhir dan bukti pekerjaan valid; clock out manual wajib melalui persetujuan admin.
- Durasi dihitung dari waktu server, bukan jam perangkat.
- Clock in dan clock out normal hanya diterima dalam radius 50 meter dari titik absensi yang ditentukan admin.
- Clock out manual tidak mengubah sesi sebelum disetujui admin.
- Daftar pemantauan admin memperbarui data tanpa refresh manual penuh.
- Seluruh aksi sensitif hanya dapat dilakukan oleh peran yang berwenang.

## 4. Scope MVP

### Karyawan

- Login dengan akun yang dibuat admin.
- Beranda: waktu lokal, tanggal, status hari ini, dan riwayat minggu berjalan.
- Clock in dengan permintaan izin lokasi.
- Penyimpanan waktu, latitude, longitude, dan akurasi lokasi saat clock in.
- Clock out dengan pengambilan lokasi akhir.
- Form wajib dokumentasi pekerjaan:
  - minimal satu foto;
  - deskripsi wajib untuk setiap foto;
  - sumber kamera atau galeri;
  - preview dan hapus sebelum submit.
- Penyelesaian sesi dan kalkulasi durasi kerja.
- Clock in kembali setelah sesi sebelumnya selesai, tanpa batas jumlah sesi harian.
- Permintaan clock out manual dengan waktu yang diajukan, alasan, dan dokumentasi pekerjaan.
- Riwayat absensi milik sendiri.
- Profil dasar dan logout.

### Admin

- Login admin.
- Dashboard KPI: total karyawan aktif, sedang bekerja, jumlah sesi, dan total jam tercatat.
- CRUD akun karyawan: nama, email/username, posisi, status aktif, dan kata sandi awal/reset.
- Pemantauan harian: nama, posisi, status, waktu masuk, waktu keluar, dan durasi.
- Tautan Google Maps dari koordinat masuk dan keluar.
- Rekap berdasarkan bulan dan karyawan.
- Detail sesi: timeline, koordinat, foto, dan deskripsi pekerjaan.
- Persetujuan atau penolakan permintaan clock out manual.
- Pengaturan zona waktu serta CRUD banyak lokasi absensi.
- Penghapusan bukti foto individual dengan konfirmasi dan audit log.

### Di luar MVP

- Penggajian, lembur, cuti/izin, jadwal shift, dan approval bertingkat.
- Face recognition atau verifikasi biometrik.
- Pelacakan lokasi kontinu atau geofence per karyawan/proyek.
- Aplikasi native Android/iOS.
- Mode offline-first dan sinkronisasi konflik.
- Push notification, ekspor payroll, dan integrasi HR eksternal.

Fitur tersebut ditambahkan hanya setelah kebutuhan nyata dan aturan bisnisnya tersedia.

## 5. Keputusan Produk yang Disarankan

### Bentuk aplikasi

Gunakan **satu aplikasi web responsif/PWA** dengan rute dan hak akses berbeda untuk karyawan dan admin. Kamera, galeri, geolocation, dan pemasangan ke home screen tersedia melalui browser modern. Codebase native terpisah baru diperlukan jika nanti ada kebutuhan offline berat, pelacakan latar belakang, atau distribusi melalui app store.

### Arsitektur minimum

- Satu aplikasi TypeScript full-stack modular.
- UI mobile-first untuk karyawan dan desktop-first untuk admin.
- API server-side dalam aplikasi yang sama.
- PostgreSQL sebagai sumber data utama.
- Object storage privat untuk foto pekerjaan.
- Kompresi foto di browser sebelum upload, kemudian validasi ulang di server.
- Session cookie aman untuk autentikasi web.
- Tautan Google Maps berbasis latitude/longitude; tidak perlu Maps SDK pada MVP.
- Zona waktu bisnis default `Asia/Singapore` (UTC+8) dan dapat diubah admin; timestamp tetap disimpan dalam UTC.
- Banyak lokasi absensi yang dikelola admin; radius tiap lokasi maksimal 50 meter.

Ini tetap satu deployable monolith. Tidak diperlukan microservice, message broker, atau cache terdistribusi pada tahap awal.

## 6. Peran dan Hak Akses

| Aksi | Karyawan | Admin |
|---|---:|---:|
| Melihat data diri | Ya | Ya |
| Melihat riwayat diri | Ya | Ya |
| Clock in/out | Ya | Tidak |
| Mengajukan clock out manual | Ya, milik sendiri | Menyetujui/menolak |
| Mengunggah bukti kerja | Ya, milik sendiri | Tidak |
| Melihat semua sesi | Tidak | Ya |
| Membuat/mengubah akun | Tidak | Ya |
| Menonaktifkan akun | Tidak | Ya |
| Melihat seluruh bukti/lokasi | Tidak | Ya |
| Menghapus bukti foto | Tidak | Ya |
| Mengubah aturan operasional | Tidak | Ya |

Penghapusan karyawan sebaiknya berupa **nonaktif**, bukan menghapus data historis.

## 7. Alur dan Aturan Bisnis

### Status harian

Status layar mengikuti sesi aktif, bukan jumlah sesi harian:

- `BELUM_ADA_SESI`: belum ada sesi pada tanggal bisnis.
- `SEDANG_BEKERJA`: ada satu sesi `OPEN`.
- `TIDAK_ADA_SESI_AKTIF`: sudah ada sesi selesai dan karyawan boleh clock in lagi.

- Status dihitung dari sesi pada tanggal bisnis aktif.
- Satu karyawan hanya boleh memiliki satu sesi `OPEN`.
- Jumlah sesi `CLOSED` pada satu tanggal bisnis tidak dibatasi.
- Clock in membuat sesi `OPEN` secara atomik.
- Clock out hanya menutup sesi setelah lokasi akhir dan dokumentasi lolos validasi.
- Total jam harian hanya bersifat catatan dari akumulasi seluruh sesi `CLOSED`, tanpa status lulus/gagal.

### Clock in

1. Karyawan menekan Clock In.
2. Browser meminta izin lokasi.
3. Aplikasi menolak proses bila koordinat tidak tersedia atau berjarak lebih dari 50 meter dari titik absensi aktif.
4. Server menghitung ulang jarak dan memvalidasi tidak ada sesi aktif.
5. Server menyimpan timestamp, latitude, longitude, akurasi, dan jarak dari titik absensi.
6. UI berubah menjadi Sedang Bekerja.

### Clock out

1. Karyawan menekan Clock Out.
2. Aplikasi mengambil lokasi akhir dan memvalidasi radius 50 meter.
3. Karyawan menambahkan minimal satu foto dan deskripsi tiap foto.
4. Browser mengecilkan dimensi foto maksimal 1600 px, mengompres ke WebP kualitas awal 75%, lalu server memvalidasi hasilnya sebelum menyimpan ke storage privat.
5. Server menutup sesi dalam satu transaksi dan menghitung durasi.
6. UI menampilkan ringkasan sesi selesai.

Jika upload gagal, sesi tetap `OPEN`; pengguna dapat mencoba kembali tanpa membuat duplikasi.

### Clock out manual

1. Karyawan memilih sesi `OPEN`, mengajukan waktu pulang, alasan, serta dokumentasi pekerjaan.
2. Permintaan berstatus `PENDING`; sesi tetap `OPEN` dan waktu asli tidak diubah.
3. Admin menyetujui atau menolak dengan catatan.
4. Jika disetujui, server menutup sesi memakai waktu yang disetujui, menandainya sebagai `MANUAL`, dan mencatat admin pemroses.
5. Jika ditolak, sesi tetap `OPEN` agar karyawan dapat memperbaiki permintaan atau melakukan clock out normal.

Lokasi historis tidak boleh direkayasa. Permintaan manual menyimpan lokasi saat pengajuan bila tersedia, tetapi menandainya sebagai lokasi pengajuan, bukan lokasi aktual pada waktu pulang.

### Perhitungan durasi

- `duration_minutes = clock_out_at - clock_in_at`.
- `daily_total_minutes = SUM(duration_minutes)` seluruh sesi `CLOSED` pada tanggal bisnis.
- Timestamp server menjadi sumber kebenaran.
- Durasi disimpan atau dihitung ulang secara konsisten; jangan menerima nilai durasi dari klien.

## 8. Model Data Awal

### `users`

- `id`
- `name`
- `username_or_email` (unik)
- `password_hash`
- `role` (`ADMIN`, `EMPLOYEE`)
- `position`
- `is_active`
- `created_at`, `updated_at`

### `attendance_sessions`

- `id`
- `employee_id`
- `business_date`
- `status` (`OPEN`, `CLOSED`)
- `clock_in_at`, `clock_out_at`
- `clock_in_latitude`, `clock_in_longitude`, `clock_in_accuracy_m`
- `clock_out_latitude`, `clock_out_longitude`, `clock_out_accuracy_m`
- `clock_in_distance_m`, `clock_out_distance_m`
- `clock_out_source` (`NORMAL`, `MANUAL`)
- `duration_minutes`
- `created_at`, `updated_at`

Constraint penting:

- maksimal satu sesi `OPEN` per karyawan;
- jumlah sesi per `business_date` tidak dibatasi;
- `clock_out_at` tidak boleh sebelum `clock_in_at`;
- sesi `CLOSED` normal wajib memiliki lokasi akhir dan bukti pekerjaan;
- sesi `CLOSED` manual wajib memiliki permintaan yang disetujui dan bukti pekerjaan, sedangkan lokasi historis boleh kosong.

### `work_evidences`

- `id`
- `attendance_session_id`
- `object_key`
- `original_filename`
- `mime_type`
- `size_bytes`
- `description`
- `deleted_at`, `deleted_by` (nullable; metadata audit tetap ada setelah object dihapus)
- `created_at`

### `attendance_correction_requests`

- `id`
- `attendance_session_id`
- `requested_clock_out_at`
- `request_location_latitude`, `request_location_longitude`
- `reason`
- `status` (`PENDING`, `APPROVED`, `REJECTED`)
- `reviewed_by`, `reviewed_at`, `review_note`
- `created_at`, `updated_at`

Hanya satu permintaan `PENDING` diperbolehkan untuk satu sesi.

### `attendance_locations`

- `id`
- `name`
- `latitude`, `longitude`
- `radius_m` (maksimal `50`)
- `is_active`
- `created_at`, `updated_at`

### `app_settings`

- `timezone` (IANA timezone; default `Asia/Singapore`)
- `updated_by`, `updated_at`

### `audit_logs`

Minimum untuk MVP: login gagal, pembuatan/perubahan akun, reset kata sandi, penonaktifan akun, clock in/out, keputusan clock out manual, perubahan pengaturan, dan penghapusan foto.

## 9. Kontrak API Awal

### Autentikasi

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Karyawan

- `GET /api/employee/today`
- `POST /api/employee/clock-in`
- `POST /api/employee/clock-out`
- `POST /api/employee/clock-out-requests`
- `GET /api/employee/history?month=YYYY-MM`
- `GET /api/employee/sessions/:id`

### Admin

- `GET /api/admin/dashboard?date=YYYY-MM-DD`
- `GET /api/admin/employees`
- `POST /api/admin/employees`
- `PATCH /api/admin/employees/:id`
- `POST /api/admin/employees/:id/reset-password`
- `GET /api/admin/attendance?date=&employeeId=&month=`
- `GET /api/admin/attendance/:id`
- `GET /api/admin/clock-out-requests?status=PENDING`
- `POST /api/admin/clock-out-requests/:id/approve`
- `POST /api/admin/clock-out-requests/:id/reject`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`
- `GET /api/admin/locations`
- `POST /api/admin/locations`
- `PATCH /api/admin/locations/:id`
- `DELETE /api/admin/locations/:id`
- `DELETE /api/admin/evidences/:id`

Endpoint clock in/out wajib idempotent terhadap pengiriman ulang dari tombol ganda atau koneksi lambat.

## 10. Struktur Halaman

### Karyawan

1. Login.
2. Beranda/status hari ini.
3. Form clock out dan dokumentasi pekerjaan.
4. Form permintaan clock out manual.
5. Riwayat absensi.
6. Detail riwayat.
7. Profil.

### Admin

1. Login.
2. Dashboard ringkasan.
3. Pemantauan harian.
4. Daftar karyawan.
5. Form tambah/edit karyawan.
6. Rekap bulanan.
7. Detail sesi dan galeri bukti.
8. Antrean persetujuan clock out manual.
9. Pengaturan zona waktu dan lokasi absensi.

## 11. Sistem Desain

### Token utama

- Brand blue: `#1A82FF`
- Dark/slate: `#2B3C5A`
- Canvas: `#F4F7F9`
- Surface: `#FFFFFF`
- Border: `#E2E8F0`
- Text primary: `#1E293B`
- Text secondary: `#64748B`
- Success: `#10B981`
- Danger: `#EF4444`
- Warning: `#F59E0B`

Gunakan satu font geometris untuk heading/brand dan satu font UI untuk body. Pilih salah satu dari tiap pasangan yang sudah ditentukan; jangan memuat keempat font.

### Prinsip UI

- Tombol clock in/out harus menjadi aksi visual utama.
- Status tidak boleh disampaikan dengan warna saja; selalu sertakan teks/ikon.
- Target sentuh minimum 44×44 px.
- Form menampilkan error dekat field dan mempertahankan input saat gagal.
- Tabel admin berubah menjadi kartu/daftar pada viewport sempit.
- Logo digunakan tanpa mengubah rasio, warna, atau bentuknya.

## 12. Keamanan dan Privasi

- Hash kata sandi dengan algoritma password modern; jangan menyimpan kata sandi awal sebagai teks.
- Cookie sesi `HttpOnly`, `Secure`, dan `SameSite` sesuai deployment.
- Validasi peran dilakukan di server pada setiap endpoint, bukan hanya menyembunyikan menu.
- Rate limit login dan catat percobaan gagal.
- Validasi MIME, ukuran, dan ekstensi foto; nama object dibuat server.
- Kompres foto di browser sebelum upload dan jangan pernah memperbesar gambar kecil.
- Foto disimpan privat dan diakses lewat URL bertanda tangan berumur pendek.
- Penghapusan foto oleh admin harus meminta konfirmasi, menghapus object storage, dan meninggalkan metadata audit.
- Batasi metadata yang ditampilkan kepada karyawan lain.
- Dokumentasikan persetujuan penggunaan lokasi. Foto disimpan tanpa batas waktu sampai admin menghapusnya.
- Backup database dan uji proses restore sebelum produksi.
- Jangan menambahkan face recognition; foto pada referensi hanya diperlakukan sebagai identitas/bukti visual.

## 13. Validasi dan Penanganan Kegagalan

- Lokasi ditolak: jelaskan cara mengaktifkan izin dan jangan merekam clock in/out parsial.
- Lokasi di luar radius 50 meter: tampilkan jarak terukur, titik yang dipakai, dan tombol coba ulang.
- Akurasi GPS lebih buruk dari radius: jangan memberi hasil menyesatkan; minta pengguna mencoba ulang sampai lokasi cukup akurat.
- Koneksi putus saat upload: pertahankan form lokal selama halaman masih terbuka dan izinkan retry.
- Tombol ditekan ganda: nonaktifkan saat request berlangsung dan lindungi juga di server.
- Sesi lintas tengah malam: tetap terkait `business_date` saat clock in.
- Perubahan zona waktu berlaku untuk perhitungan tanggal berikutnya; timestamp historis tetap UTC dan tidak ditulis ulang.
- Akun dinonaktifkan saat sesi aktif: admin harus menyelesaikan kasus tersebut melalui prosedur koreksi yang disepakati.
- Foto terlalu besar: kompres maksimal 1600 px/WebP kualitas 75%; jika masih melewati batas upload server, tampilkan error dan jangan menutup sesi.

## 14. Strategi Pengujian

### Unit

- Transisi status sesi.
- Kalkulasi total durasi banyak sesi, target minimum harian, zona waktu, dan sesi lintas tengah malam.
- Perhitungan jarak radius 50 meter, termasuk tepat pada batas.
- Transisi approval clock out manual.
- Validasi bukti kerja.
- Otorisasi peran.

### Integrasi

- Constraint satu sesi aktif.
- Banyak sesi selesai pada tanggal bisnis yang sama.
- Clock out atomik bersama bukti kerja.
- Approval manual menutup sesi tepat satu kali dan penolakan tidak mengubah sesi.
- Upload dan akses privat foto.
- Kompresi foto serta penghapusan object dengan audit metadata.
- Filter rekap tanggal/karyawan.

### End-to-end kritis

1. Admin membuat akun → karyawan login.
2. Karyawan clock in dengan lokasi → admin melihat status aktif.
3. Karyawan clock out dengan foto/deskripsi → sesi menjadi selesai.
4. Karyawan memulai sesi kedua pada hari yang sama → total durasi harian terakumulasi.
5. Karyawan mengajukan clock out manual → admin menyetujui → sesi ditutup dan diaudit.
6. Admin membuka detail, peta, dan bukti pekerjaan lalu menghapus satu foto dengan konfirmasi.
7. Pengguna tanpa hak akses mencoba membuka rute admin dan ditolak.

### Nonfungsional

- Uji mobile 360 px dan desktop umum.
- Aksesibilitas keyboard, label form, focus state, dan kontras.
- Uji koneksi lambat dan upload gagal.
- Uji utama di Chrome; smoke test alur kritis di browser modern lain.

## 15. Tahapan Pengerjaan

Asumsi estimasi: satu pengembang full-stack, dukungan desain/QA paruh waktu, kebutuhan bisnis cepat dijawab.

### Fase 0 — Klarifikasi dan fondasi (2–3 hari)

- Kunci keputusan tersisa pada bagian 18.
- Siapkan default zona waktu `Asia/Singapore` dan lokasi absensi.
- Buat wireframe final untuk alur kritis.
- Siapkan repository, CI, environment, database, dan storage.

### Fase 1 — Autentikasi dan akun (4–5 hari)

- Login/logout, session, RBAC.
- CRUD dan nonaktifkan karyawan.
- Seed satu admin awal.
- Audit log minimum.

### Fase 2 — Absensi karyawan (5–7 hari)

- Beranda dan status harian.
- Clock in, lokasi, constraint sesi.
- Clock out, banyak sesi harian, kompresi/upload bukti, deskripsi, dan akumulasi durasi.
- Permintaan clock out manual.
- Riwayat karyawan.

### Fase 3 — Dashboard admin (5–7 hari)

- KPI dan pemantauan harian.
- Rekap/filter.
- Detail sesi, tautan Google Maps, dan preview bukti.
- Approval clock out manual, pengaturan operasional, dan penghapusan foto.

### Fase 4 — Hardening dan rilis (4–5 hari)

- E2E alur kritis, keamanan upload, aksesibilitas, dan responsive QA.
- Backup/restore, logging, error monitoring, dan smoke test produksi.
- UAT admin serta beberapa karyawan pilot.

Estimasi MVP: **4–6 minggu**, bergantung pada kecepatan keputusan, revisi UI, dan kondisi perangkat/lokasi saat UAT.

## 16. Backlog Terurut

### P0 — wajib rilis

- Autentikasi dan RBAC.
- CRUD/nonaktifkan karyawan.
- Clock in/out dengan lokasi.
- Geofence 50 meter dari titik yang diatur admin.
- Banyak sesi harian dan akumulasi total jam kerja.
- Bukti foto dan deskripsi wajib.
- Clock out manual dengan persetujuan admin.
- Status, durasi, riwayat, pemantauan, dan rekap.
- Pengaturan zona waktu/multi-lokasi, storage privat, kompresi foto, penghapusan foto, audit minimum, dan backup.

### P1 — setelah MVP stabil

- Reset kata sandi mandiri.
- Ekspor CSV/PDF rekap.
- Pagination dan pencarian lanjutan.

### P2 — hanya bila tervalidasi

- Izin/cuti, shift, multi-lokasi/geofence per karyawan, notifikasi, integrasi payroll, dan aplikasi native.

## 17. Keputusan yang Telah Dikunci

1. Sesi harian tidak dibatasi; hanya satu sesi boleh aktif pada satu waktu.
2. Zona waktu awal `Asia/Singapore` (UTC+8) dan dapat diubah admin.
3. Tidak ada target minimum, jam kerja tetap, terlambat, atau lembur; sistem hanya mencatat dan menjumlahkan durasi.
4. Clock in/out normal harus berada maksimal 50 meter dari titik absensi yang diatur admin.
5. Foto minimal satu per clock out tanpa batas jumlah maksimal, disimpan tanpa batas waktu, dikompres sebelum upload, dan dapat dihapus admin.
6. Clock out yang terlupa diajukan manual dan harus disetujui admin.
7. Deskripsi berupa textarea paragraf, wajib berisi teks setelah spasi dibuang, tanpa batas panjang bisnis.
8. Login memakai username/password buatan admin; pengguna dapat mengganti password dan admin dapat meresetnya.
9. Banyak lokasi diizinkan dan dikelola dari dashboard admin.
10. Chrome menjadi browser utama, dengan dukungan browser modern lain.

## 18. Definition of Done MVP

- Semua acceptance criteria P0 lolos di environment staging.
- Alur E2E kritis berjalan pada perangkat target.
- Banyak sesi harian, multi-lokasi, geofence, akumulasi jam, dan approval clock out manual lulus pengujian.
- Tidak ada endpoint P0 tanpa autentikasi, otorisasi, dan validasi input.
- Migrasi database dapat dijalankan dari nol dan rollback prosedurnya terdokumentasi.
- Backup berhasil dipulihkan pada uji restore.
- Admin dan perwakilan karyawan menyetujui UAT.
- Panduan singkat admin/karyawan serta prosedur dukungan tersedia.
- Monitoring error dan log produksi aktif.

## 19. Urutan Langkah Berikutnya

1. Tetapkan wireframe layar P0 dari referensi visual yang ada.
2. Buat backlog issue dari Fase 1-4.
3. Scaffold satu aplikasi PWA dan schema database minimum.
4. Implementasikan vertical slice pertama: admin membuat akun → karyawan login → clock in → admin melihat status.
5. Lanjutkan clock out dan bukti kerja, lalu hardening sebelum menambah fitur P1.
