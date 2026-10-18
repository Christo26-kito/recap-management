# Rekap

Aplikasi catatan keuangan pribadi: pemasukan, pengeluaran, dan anggaran bulanan. HTML + CSS + JS vanilla, tanpa framework, tanpa build step, tanpa dependency, berjalan offline.

## Cara membuka

Opsi 1, langsung file:

- Buka `index.html` dengan browser (double klik atau drag ke browser).

Opsi 2, serve lokal (disarankan saat development):

```
python3 -m http.server 8066
```

lalu buka `http://localhost:8066`.

## Data

- Disimpan di `localStorage` browser dengan key `rekap.v1`.
- Format: `txns` = daftar transaksi (jenis, kategori, deskripsi, jumlah, tanggal), `budgets` = total bulanan dan limit per kategori.
- Data tetap di browser ini saja: tidak ada server, tidak ada akun, tidak ada sync antar browser atau tab.
- Jika JSON di localStorage rusak, aplikasi menampilkan banner dengan tombol "Mulai dari awal" yang menghapus semua data dan mulai bersih.
- Jika localStorage tidak tersedia (mode privat di beberapa browser), aplikasi tetap jalan dengan peringatan bahwa data hilang saat halaman ditutup.

## Ketiadaan fitur loading

App ini tidak punya loading state. Alasannya: data hanya dari localStorage yang sinkron, semua render terjadi saat halaman dibuka, tidak ada fetch jaringan.

## Export CSV

Tombol "Unduh CSV" di menu Transaksi mengunduh `rekap-transaksi.csv` berisi seluruh transaksi. File memakai BOM UTF-8 agar kolom terbaca benar di Excel berbahasa Indonesia. Jika belum ada transaksi, tombol memberi toast, tidak mengunduh file kosong.

## Kategori

- Pengeluaran (7): Makan, Transport, Belanja, Tagihan, Kesehatan, Hiburan, Lainnya.
- Pemasukan (5): Pekerjaan, Sampingan, Penjualan, Investasi, Lainnya.

## Budget

Anggaran berlaku untuk setiap bulan: satu total plus limit per kategori yang diisi. Status di menu Anggaran menghitung pengeluaran bulan berjalan; kategori yang lewat ditandai merah dengan angka selisih.

## Reset penuh

- Klik banner "Mulai dari awal", atau jalankan `localStorage.removeItem('rekap.v1')` di console developer, lalu muat ulang halaman.

## A11y

Navigasi keyboard penuh (Tab, Enter, Escape), skip link, fokus terlihat, dialog hapus dengan fokus terperangkap, pengumuman lewat `aria-live`.
