# Storyboard Studio — Unity Skripsi

Pengelola 19 slide storyboard (file 2.png–20.png) dan satu referensi karakter. Dibangun dengan Next.js App Router, TypeScript, dan Tailwind CSS.

## Menjalankan

```sh
npm ci
npm run dev
```

Buka http://localhost:3000. Untuk produksi lokal: `npm run build` lalu `npm start`.

## Pemeriksaan

```sh
npm run lint
npm run typecheck
npm run build
```

## Pengujian E2E lokal (Chromium)

```sh
npm ci
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright otomatis menjalankan dan menghentikan server hasil build di
`http://127.0.0.1:3100`. Port tersebut harus kosong; server yang sudah berjalan
tidak digunakan ulang. Jalankan build lagi setelah mengubah aplikasi.
Pengujian tidak memakai website production atau data pribadi.

Setiap test mendapat browser context dan localStorage baru. Cakupan pengujian:
halaman utama, 19 slide dan referensi karakter, preview dan gambar, navigasi
tombol/keyboard, pengeditan dan persistensi catatan, pemisahan catatan antar-slide,
serta overflow pada viewport 320, 390, dan 768 px.

Laporan HTML tersedia di `playwright-report/index.html` dan dapat dibuka dengan
`npx playwright show-report`. Screenshot dan trace disimpan di `test-results/`
hanya saat gagal. Semua direktori hasil pengujian diabaikan oleh Git.

## Penggunaan

- Klik gambar untuk membuka pratinjau layar penuh.
- Gunakan tombol sebelumnya/berikutnya atau panah keyboard; Escape menutup pratinjau.
- Pilih status implementasi di kartu atau pratinjau. Progres hanya menghitung 19 slide; referensi karakter tidak dihitung.
- Gunakan pencarian dan filter status untuk menemukan slide.

## Aset dan penyimpanan

Seluruh gambar asli di `public/storyboards/` dipertahankan. Manifest `lib/storyboards.ts` menetapkan urutan numerik 2–20 lalu referensi karakter. URL gambar dimulai dengan `/storyboards/`, tanpa `/public`; spasi nama file di-encode. `next/image` mengoptimalkan penyajian gambar tanpa mengubah sumber asli.

Status disimpan dalam localStorage pada key `unity-storyboard-status:v1`, menggunakan ID stabil (`slide-2` sampai `slide-20`). Data hanya berlaku pada browser dan origin yang sama, tidak disinkronkan antarperangkat. Menghapus data browser menghapus progres. Jika penyimpanan gagal, perubahan tetap berlaku dalam sesi dan aplikasi menampilkan pemberitahuan. Tab pada origin yang sama menerima pembaruan melalui storage event.

Tidak ada backend, akun pengguna, atau database. Struktur siap untuk GitHub/Vercel di tahap mendatang; tidak ada push atau deployment yang dilakukan saat implementasi.
