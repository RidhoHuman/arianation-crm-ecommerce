# Project Finishing Checklist

**Last Updated:** May 23, 2026

Dokumen ini dipakai sebagai checklist penutup project dan rencana kerja harian. Pakai tanda berikut untuk status:

- [ ] belum dikerjakan
- [x] selesai
- [-] sedang dikerjakan

Aturan pakai:
- Setiap task harus ditulis cukup jelas supaya bisa dicek ulang tanpa interpretasi ganda.
- Saat task selesai, ubah menjadi `[x]` agar terlihat sebagai checklist hijau di editor yang mendukung markdown task list.
- Kalau ada task yang sedang aktif, ubah menjadi `[-]` sampai benar-benar selesai.

## Peta Eksekusi Singkat

Tujuan utama sekarang bukan menambah fitur baru, tetapi membuat project ini stabil dijalankan di laptop yang terbatas resource-nya.

Untuk rencana perubahan arsitektur yang lebih besar, lihat [MIGRATION_PLAN.md](MIGRATION_PLAN.md). Dokumen itu menjelaskan target stack baru: Vite untuk frontend, backend runtime yang lebih ringan, MySQL + Laragon, dan Knex + mysql2.

### Urutan yang Disarankan
1. Jalankan backend saja dulu dan pastikan health check normal.
2. Jalankan frontend saja dulu dan pastikan halaman utama terbuka normal.
3. Gabungkan backend + frontend hanya untuk smoke test singkat, bukan untuk sesi coding panjang.
4. Kalau memory naik ekstrem, matikan salah satu server dan jangan paksa dua-duanya aktif terus.
5. Setelah stabil, baru lanjut ke backend hardening, testing, lalu deployment readiness.

### Aturan Operasional Agar Tidak Freeze
- Jangan jalankan backend dan frontend bersamaan jika laptop mulai panas, swap, atau memory mendekati penuh.
- Kurangi browser tab, VS Code tab, dan proses latar belakang sebelum menjalankan dev server.
- Prioritaskan satu tugas per sesi: backend, frontend, atau test; jangan semuanya sekaligus.
- Jika perlu integrasi penuh, gunakan mode singkat: nyalakan, test, matikan, lanjutkan.

### Definisi Sukses untuk Fase Ini
- Backend bisa start dan health check jalan.
- Frontend bisa start dan route utama terbuka.
- Upload, auth, dan flow utama lolos smoke test.
- Sistem tetap responsif selama kerja harian.

## Tahap 1: Frontend Finishing

### Checklist Detail
- [ ] Pastikan semua halaman utama sudah tersedia dan tersambung ke route yang benar.
- [ ] Pastikan seluruh form penting punya validasi, pesan error, dan state submit yang jelas.
- [ ] Pastikan loading, empty, success, dan error state konsisten di seluruh halaman.
- [ ] Pastikan navigation, header, sidebar, footer, dan layout utama konsisten.
- [ ] Pastikan responsive di mobile, tablet, dan desktop.
- [ ] Pastikan tidak ada layout pecah, overflow, atau layout shift saat data lambat.
- [ ] Pastikan semua aksi user memiliki feedback visual yang jelas.
- [ ] Pastikan auth flow frontend berjalan normal: login, logout, session, dan redirect.
- [ ] Pastikan flow upload frontend cocok dengan backend yang sudah final.
- [ ] Pastikan tidak ada broken link, placeholder UI, atau route yang belum terhubung.

### Checklist Detail
- [x] Pastikan semua halaman utama sudah tersedia dan tersambung ke route yang benar. (admin area: dashboard, products, orders, design-requests, users, payments, analytics, audit-logs)  
- [ ] Pastikan seluruh form penting punya validasi, pesan error, dan state submit yang jelas.  
- [ ] Pastikan loading, empty, success, dan error state konsisten di seluruh halaman.  
- [x] Pastikan navigation, header, sidebar, footer, dan layout utama konsisten.  
- [x] Pastikan responsive di mobile, tablet, dan desktop.  
- [ ] Pastikan tidak ada layout pecah, overflow, atau layout shift saat data lambat.  
- [ ] Pastikan semua aksi user memiliki feedback visual yang jelas.  
- [x] Pastikan auth flow frontend berjalan normal: login, logout, session, dan redirect.  
- [ ] Pastikan flow upload frontend cocok dengan backend yang sudah final. (upload UI/file inputs not found in codebase — needs implementation or mapping)  
- [ ] Pastikan tidak ada broken link, placeholder UI, atau route yang belum terhubung.  

### Selesai Jika
- [ ] Semua halaman utama bisa dibuka tanpa error.
- [ ] Tidak ada placeholder di area utama.
- [ ] Semua form inti sudah usable dan tervalidasi.

## Tahap 2: Backend Finishing

### Checklist Detail
- [ ] Pastikan semua endpoint bisnis utama sudah ada dan sesuai scope.
- [ ] Pastikan response format konsisten: success, message, data, dan error.
- [ ] Pastikan validasi input diterapkan di semua endpoint penting.
- [ ] Pastikan role-based access control konsisten di seluruh route sensitif.
- [ ] Pastikan logika order, cart, auth, user, dan admin berjalan stabil.
- [ ] Pastikan integrasi Prisma dan database tidak punya mismatch schema.
- [x] Pastikan file upload, Supabase Storage, dan signed URL berjalan aman.
- [x] Pastikan cleanup, error handling, dan edge case upload sudah aman.
- [x] Pastikan path, bucket, dan environment variable upload sudah final.
- [ ] Pastikan tidak ada query atau service yang masih bergantung pada asumsi lama.
- [ ] Pastikan semua endpoint utama lolos smoke test.

### Selesai Jika
- [x] Semua endpoint upload utama berjalan normal.
- [x] Tidak ada error 500 yang berulang di flow upload normal.
- [x] Tidak ada mismatch antara controller, route, dan dokumentasi upload.

## Tahap 3: Testing & CI

### Checklist Detail
- [ ] Pastikan unit test untuk helper kritikal sudah ada dan hijau.
- [x] Pastikan test upload helper, signed URL, dan Sentry tetap hijau.
- [ ] Pastikan test auth, validation, dan service penting tidak regress.
- [x] Pastikan integration test untuk upload, storage, dan database-heavy flow lolos.
- [ ] Pastikan test end-to-end untuk alur utama user berjalan.
- [x] Pastikan flow admin, customer, dan edge case gagal sudah diverifikasi untuk upload flow.
- [x] Pastikan workflow GitHub Actions berjalan tanpa failure.
- [x] Pastikan job `test`, `db-heavy-tests`, dan `e2e-supabase` stabil.
- [x] Pastikan skipped job memang karena kondisi yang benar.

### Selesai Jika
- [x] Test upload/CI hijau.
- [x] Tidak ada known failing test upload yang dibiarkan.

## Tahap 4: Deployment Readiness

### Checklist Detail
- [ ] Pastikan semua environment variable produksi sudah lengkap.
- [ ] Pastikan database production punya connection string yang benar.
- [ ] Pastikan Supabase secrets untuk storage sudah aman dan valid.
- [ ] Pastikan Sentry DSN dan monitoring secret sudah siap jika dipakai.
- [ ] Pastikan `npm run build` atau alur build produksi berjalan.
- [ ] Pastikan start command produksi berjalan tanpa error.
- [ ] Pastikan Prisma client dan migration deploy aman di environment target.
- [ ] Pastikan frontend dan backend bisa diakses setelah deploy.
- [ ] Pastikan smoke test setelah deploy sudah dijalankan.
- [ ] Pastikan storage persistence, signed URL, dan API health lolos verifikasi produksi.

### Selesai Jika
- [ ] Aplikasi bisa dibuka setelah deploy.
- [ ] API health normal.
- [ ] Fitur utama terverifikasi di production/staging.

## Tahap 5: Documentation & Handoff

### Checklist Detail
- [x] Pastikan RUNBOOK fokus pada operasional dan deployment.
- [x] Pastikan CI_SETUP fokus pada setup workflow GitHub Actions.
- [x] Pastikan PROJECT_STATUS tetap singkat dan tidak duplikatif.
- [x] Pastikan PROJECT_FINISHING_CHECKLIST dipakai sebagai roadmap kerja harian.
- [ ] Pastikan README atau dokumentasi utama menjelaskan cara menjalankan project.
- [x] Pastikan troubleshooting penting upload/CI sudah tercatat.
- [x] Pastikan langkah recovery dan backup terdokumentasi.
- [x] Pastikan secret, environment, dan setup CI upload bisa dipahami tim lain.

### Selesai Jika
- [x] Tidak ada dokumentasi upload/CI yang saling tumpang tindih secara berlebihan.
- [x] Satu sumber kebenaran jelas untuk topik upload/CI.
- [x] Tim baru bisa lanjut tanpa perlu tanya-tanya terlalu banyak untuk area upload/CI.

## Rencana Kerja Step by Step per Hari

### Hari 1: Frontend Audit
- [ ] Cek semua halaman utama dan route.
- [ ] Tandai UI yang masih placeholder atau belum konsisten.
- [ ] Rapikan form, state, dan layout yang paling terlihat.

### Hari 2: Frontend Polish
- [ ] Selesaikan responsive dan visual polish.
- [ ] Perbaiki loading, empty, dan error state.
- [ ] Finalisasi auth flow dan upload flow di frontend.

### Hari 3: Backend Audit
- [ ] Audit endpoint utama dan role check.
- [ ] Verifikasi response format dan validasi input.
- [ ] Cek Supabase Storage, signed URL, dan cleanup path.

### Hari 4: Backend Hardening
- [ ] Perbaiki edge case dan potensi error 500.
- [ ] Pastikan Prisma, schema, dan migration aman.
- [ ] Jalankan smoke test backend.

### Hari 5: Testing Day
- [ ] Jalankan unit test.
- [ ] Jalankan integration test.
- [ ] Jalankan E2E atau manual verification untuk alur utama.

### Hari 6: CI & Deployment Readiness
- [ ] Pastikan GitHub Actions hijau.
- [ ] Cek secret, job gating, dan job skip behavior.
- [ ] Verifikasi environment production dan build command.

### Hari 7: Documentation & Handoff
- [ ] Rapikan RUNBOOK, CI_SETUP, dan PROJECT_STATUS.
- [ ] Pastikan tidak ada overlap yang membingungkan.
- [ ] Final review dan tandai semua yang sudah selesai.

## Urutan Pengerjaan yang Disarankan

1. Selesaikan frontend yang masih belum final.
2. Kunci backend dengan validasi, edge case, dan smoke test.
3. Jalankan semua testing dan perbaiki failure yang muncul.
4. Finalisasi deployment readiness dan post-deploy verification.
5. Rapikan dokumentasi terakhir dan tutup gap yang masih dobel.

## Definition of Done

Project dianggap selesai kalau:
- [ ] Frontend dan backend sudah final untuk scope yang disepakati.
- [ ] Semua test penting hijau.
- [ ] CI/CD berjalan stabil.
- [ ] Deployment ready dan sudah lolos verifikasi.
- [ ] Dokumentasi sudah cukup untuk operasional dan handoff.
