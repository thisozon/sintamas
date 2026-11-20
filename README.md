# Sintamas - Sistem Informasi Inventaris Masjid Fatkhurrohmah

Aplikasi web inventaris benda Sabililah untuk Masjid Fatkhurrohmah Jambon (Jambon, RT.21 RW.23 Desa Sabranglor, Kec. Trucuk Kab. Klaten, 57467 | Nomor ID Masjid: 01.6.14.10.06.000168) dengan arsitektur **Google Apps Script (GAS) + Google Sheets**, **GitHub**, dan **Vercel**.

Web URL Google Apps Script sudah tertanam langsung pada aplikasi sehingga petugas tidak perlu menempelkan URL secara manual setiap kali membuka aplikasi:

```
https://script.google.com/macros/s/AKfycbx6MDS1Zi0WnweE5Aq4ZxXeqwrH1XoCbGxEACDLJ8CyIuyiX-9WSHOYiOF-DzoqZjQ5/exec
```

## Struktur Folder Proyek (siap deploy Vercel)

```
Sintamas/
├── index.html              # Antarmuka aplikasi + logika frontend
├── Code.gs                 # Backend Google Apps Script
├── vercel.json             # Konfigurasi routing & header izin kamera untuk Vercel
├── build_sintamas_zip.ps1  # Skrip pembuat arsip ZIP siap unduh
└── README.md               # Panduan pemasangan, GAS, GitHub, Vercel
```

Folder `sintamas-app/`, arsip `Sintamas-Masjid-Fatkhurrohmah.zip`, berkas `.docx`, dan gambar referensi tidak ikut ke GitHub (sudah masuk `.gitignore`).

## Cara Mengemas Folder Sintamas Menjadi File .zip Siap Unduh

Jalankan skrip berikut di PowerShell dari dalam folder ini:

```powershell
powershell -ExecutionPolicy Bypass -File .\build_sintamas_zip.ps1
```

Skrip otomatis menyalin `index.html`, `Code.gs`, `vercel.json`, dan `README.md` ke folder `sintamas-app/`, membuat arsip `Sintamas-Masjid-Fatkhurrohmah.zip`, lalu membersihkan folder staging.

## Cara Deploy Google Apps Script (Code.gs)

1. Buka Google Spreadsheet tujuan inventaris masjid.
2. Klik menu **Extensions** -> **Apps Script**.
3. Buat file bernama `Code.gs`, lalu salin seluruh isi `Code.gs` dari folder ini ke editor Apps Script dan simpan (`Ctrl + S`).
4. Jalankan fungsi `initializeDatabase` sekali untuk membuat tab `items`, `loans`, `maintenance`, `users`, dan `settings` secara otomatis.
5. Klik **Deploy** -> **Manage deployments** -> **Edit** -> **Version: New version** -> **Deploy** (pastikan tipe **Web app**, **Execute as: Me**, **Who has access: Anyone**).

## Cara Deploy ke GitHub & Vercel

1. Unggah isi folder proyek (`index.html`, `Code.gs`, `vercel.json`, `README.md`) ke repositori **GitHub** Anda.
2. Masuk ke **Vercel** -> **Add New...** -> **Project** -> impor repositori GitHub tersebut.
3. Klik **Deploy**, lalu buka URL Vercel di HP Android/iOS dan pilih **Tambahkan ke Layar Utama**.

## Akun Petugas Bawaan

| Username | Password | Role |
|---|---|---|
| `admin` | `123` | Admin Utama |
| `petugas` | `123` | Petugas / Admin |
| `inspector` | `123` | Inspector |

Ganti password bawaan melalui menu **Pengaturan** setelah aplikasi berjalan.
