# DESIGN.md: Arah Desain Rekap

Aplikasi catatan keuangan pribadi. Halaman: Dasbor, Transaksi, Anggaran.

Design Read: aplikasi data pribadi untuk pengguna individual, visual language "ledger" yang tenang (hairline + serif + angka tabular), dials ENERGY 2 / RHYTHM 2 / MOTION 1.

## Identitas: motif "ledger"

Motif identitas: wordmark dan heading serif, label kecil dengan hairline di atas tiap section, semua angka tabular-nums. Motif ini diulang di ketiga view sehingga desain jelas milik produk ini (uji R-20: ganti logo, karakter ledger tetap).

## Dials

- ENERGY 2: halaman langsung menyajikan data (focal point saldo), tanpa hero, tanpa dekorasi pembuka.
- RHYTHM 2: ritme panel konsisten di semua view; jeda satu kali lewat panel saldo yang memakai skala type jauh lebih besar.
- MOTION 1: perubahan visual hanya lewat state hover dan focus; tidak ada animasi atau transisi.

## Palet (2 core + 1 accent + warna data fungsional)

| Warna | Hex | Peran |
| --- | --- | --- |
| paper | #F5F4F0 | latar seluruh aplikasi |
| ink | #1B1D1F | teks utama |
| muted | #5F6368 | label, subteks (kontras ~5,5:1 di atas paper, lolos WCAG AA) |
| accent | #0E6B4F | tombol utama, angka pemasukan, fill progress |
| danger | #B23B2E | HANYA angka pengeluaran, status anggaran lewat, validasi |

- Keputusan: satu aksen hijau tua karena brief meminta "clean dan tenang, fokus ke data"; hijau = uang yang sehat tanpa teriak (R-01).
- Keputusan: merah hanya untuk data pengeluaran dan anggaran lewat karena itu satu-satunya makna yang benar-benar negatif di app ini; tidak dipakai untuk dekorasi apa pun (peran fungsional, bukan default).
- Keputusan: panel memakai #FCFBF7 dengan hairline 1px, bukan shadow, supaya hierarki tetap terbaca tanpa elemen melayang (R-12).
- Keputusan: tanpa gradient, glow, glassmorphism, shadow: brief eksplisit, hierarki ditangani hairline + skala type (R-01, R-10, R-12, R-13).

## Tipografi

- Keputusan: wordmark, heading, dan label section memakai Georgia system stack karena karakter serif ledger (buku kas) dan brief melarang webfont, jadi harus stack sistem (R-06).
- Keputusan: teks berjalan pakai system sans (Segoe UI/Roboto) karena terbaca cepat untuk data dan offline (R-06).
- Keputusan: semua angka `font-variant-numeric: tabular-nums` + weight 600 ke atas supaya angka rata untuk dibandingkan; ini inti motif ledger.
- Keputusan: label section memakai small-caps serif + letter-spacing 0,04em, bukan uppercase ber-tracking ekstrem, agar tetap tenang dan tidak jatuh ke pola "AI heading" (R-06).

## Radius (skala 4 nilai, variasi disengaja per R-11)

- Keputusan: container 8px, tombol 6px, chip 4px, progress bar pill; radius beda = beda kategori elemen, bukan asal bulat semua.

## Tema

- Keputusan: light saja tanpa toggle; brief user meminta suasana tenang dan data-first, angka padat lebih terbaca di permukaan terang, dan app dipakai perorangan bukan tim dengan preferensi berbeda (R-21, alasan valid per brief).

## Layout

- Keputusan: grid 2 kolom (sidebar 250px + konten max 940px) karena 3 view adalah app data, bukan marketing page; sidebar nav stabil dan konten tidak melebar tidak terkendali (R-05, C-3).
- Keputusan: <720px sidebar jadi topbar horizontal, form menumpuk, tap target minimal 44px, tanpa horizontal overflow (R-03).
- Keputusan: daftar transaksi dikelompokkan per hari dengan garis hairline antar baris, bukan kartu; ini pola ledger dan lebih rapat untuk data banyak (R-14, alasan hierarki: baris = data, bukan unit marketing).

## Komponen

- Keputusan: bar kategori dan anggaran memakai div polos dengan track + fill, bukan library chart, karena brief melarang dependency dan div cukup untuk 5 bar (R-22, C-1).
- Keputusan: empty state berupa teks serif pendek, tanpa ikon, karena ikon generik justru menambah noise (R-04: lebih baik tanpa ikon).
- Keputusan: modal hapus memakai dialog native style (backdrop + fokus terperangkap + Escape) karena itu satu-satunya tempat UI butuh layer di atas konten.
- Keputusan: banner error memakai aksen garis kiri merah 3px sebagai penanda "perlu tindakan", bukan dekorasi.
- Keputusan: tombol "Hapus" di modal memakai hijau accent, bukan merah, karena brief membatasi merah hanya untuk data; risiko kehilangan data ditanggung teks konfirmasi, bukan warna.

## Copy

- Keputusan: copy Bahasa Indonesia, tanpa em dash, tanpa buzzword; kalimat menyebut angka apa adanya dari data user (R-02, R-16, R-17, R-36).

## Keputusan deviasi dari brief

- Brief hanya memfiksasi 7 kategori pengeluaran; kategori pemasukan tidak didefinisikan, jadi ditambah 5: Pekerjaan, Sampingan, Penjualan, Investasi, Lainnya. Keputusan ini tercatat di sini dan di README.
- Filter bulan default: bulan berjalan jika ada data, kalau tidak bulan data terakhir; supaya pengguna lama tidak melihat daftar kosong padahal ada data lama.
