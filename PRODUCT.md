# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pegawai mencatat absensi fleksibel dan menerima slip gaji miliknya. HR meninjau koreksi absensi serta slip gaji. Admin mengatur akun, lokasi, waktu, dan aturan payroll.

## Product Purpose

MTC Attendance mencatat kehadiran, dokumentasi pekerjaan, dan jam kerja PT Media Teknologi Celebes. Payroll mengubah absensi sah menjadi draft slip yang harus ditinjau sebelum diterima pegawai.

## Capabilities and Constraints

- Zona waktu perusahaan diatur Admin. Sesi belum selesai saat pergantian hari tidak dihitung sampai koreksi disetujui.
- Default payroll tanggal 25 bulan sebelumnya hingga tanggal 24 bulan pembayaran. Tanggal awal periode dan tanggal pembayaran dapat diatur Admin.
- Seluruh menit sah dalam periode dijumlahkan; default 300 menit menjadi satu hari penuh. Sisa menit tidak dibawa ke periode berikutnya. Maksimum hari dibayar berbeda per pegawai dan diatur Admin.
- Gaji pokok dan komunikasi tetap per periode. Transport adalah hari dibayar dikali tarif per orang. Komponen tambahan dan potongan mengikuti template Excel.
- Pegawai hanya melihat slip miliknya yang telah ditinjau dan diterbitkan HR/Admin. Draft tidak terlihat oleh pegawai.
- Pengembangan payroll mengikuti tampilan aplikasi yang sudah ada, langsung melalui implementasi kode sesuai pilihan pengguna.

## Evidence on Hand

`Slip_Gaji_Otomatis_Format_Asli_MTC.xlsx` adalah referensi privat struktur slip dan komponen payroll. Data identitas dan nominal di dalamnya tidak boleh dimasukkan ke source repository.

## Brand Commitments

Pertahankan nama MTC Attendance, aset logo di `public`, bahasa Indonesia, dan identitas aplikasi yang sudah digunakan.
