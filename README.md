# MTC Attendance

Next.js monolith untuk pencatatan sesi kerja berbasis multi-lokasi PT Media Teknologi Celebes.

Fitur saat ini mencakup login berbasis peran, clock in/out dalam radius 50 meter, kompresi foto dokumentasi di browser, pengelolaan akun/lokasi/zona waktu, persetujuan clock out manual, riwayat karyawan, rekap dan ekspor CSV, detail sesi/peta, bukti privat, serta audit log.

## Menjalankan lokal

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

Development login:

- Admin: `admin` / `Admin123!`
- Karyawan: `fariz` / `Karyawan123!`

Ganti password seed melalui `MTC_SEED_ADMIN_PASSWORD` dan `MTC_SEED_EMPLOYEE_PASSWORD` sebelum membuat database non-lokal.

## Pemeriksaan

```bash
npm test
npm run lint
npm run build
```

Deployment Docker/PostgreSQL dijelaskan di [DEPLOYMENT.md](./DEPLOYMENT.md).
