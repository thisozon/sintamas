# Sintamas - Sistem Informasi Inventaris Masjid Fatkhurrohmah

Aplikasi web inventaris benda Sabililah untuk **Masjid Fatkhurrohmah Jambon** (`Jambon, RT.21 RW.23 Desa Sabranglor, Kec. Trucuk Kab. Klaten, 57467` | Nomor ID Masjid: `01.6.14.10.06.000168`) dengan arsitektur **Google Apps Script (GAS) + Google Sheets**, **GitHub**, dan **Vercel**.

Web URL Google Apps Script sudah tertanam langsung pada aplikasi sehingga petugas tidak perlu menempelkan URL secara manual setiap kali membuka aplikasi:

```text
https://script.google.com/macros/s/AKfycbwyhC048EbQXS9l5Pa-1c1mA8RkM3LimQMHWgbn3j0XwWEqXMn-TCJ7MceqfpgagqyB/exec
```

---

## Struktur Folder Proyek (`sintamas-app`)

Satukan seluruh file berikut ke dalam satu folder bernama `sintamas-app`:

```text
sintamas-app/
├── index.html               # Antarmuka aplikasi, PWA manifest & ikon dinamis, serta logika frontend
├── Code.gs                  # Backend Google Apps Script (otomatis membuat & mengisi tab Google Sheets)
├── vercel.json              # Konfigurasi routing & header izin kamera untuk Vercel
├── README.md                # Panduan pemasangan, GAS, GitHub, Vercel, dan pembuatan ZIP
├── build_sintamas_zip.ps1   # Skrip PowerShell pembuat arsip .zip di Windows
└── build_sintamas_rar.ps1   # Skrip PowerShell pembuat arsip .rar (dengan fallback .zip) di Windows
```

---

## Cara Membuat 1 Folder Siap Unduh & Menjadi File `.zip`

### Opsi 1: Menggunakan PowerShell di Windows (Paling Cepat)
1. Buat folder bernama `sintamas-app` di komputer Anda (misalnya di `C:\Proyek\sintamas-app`).
2. Simpan `index.html`, `Code.gs`, `vercel.json`, dan `README.md` ke dalam folder `sintamas-app`.
3. Letakkan `build_sintamas_zip.ps1` di folder induknya (misalnya `C:\Proyek\build_sintamas_zip.ps1`).
4. Buka **PowerShell** di folder induk tersebut (`cd C:\Proyek`), lalu jalankan:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\build_sintamas_zip.ps1
   ```
5. File arsip siap pakai **`Sintamas-Masjid-Fatkhurrohmah.zip`** akan otomatis terbuat di folder tersebut.

### Opsi 2: Manual lewat File Explorer
1. Masukkan seluruh file proyek ke dalam satu folder `sintamas-app`.
2. Klik kanan folder `sintamas-app` -> **Send to** -> **Compressed (zipped) folder** (atau **Compress to ZIP file** di Windows 11).

---

## Cara Deploy Google Apps Script (`Code.gs`)

1. Buka Google Spreadsheet tujuan inventaris masjid.
2. Klik menu **Extensions** -> **Apps Script**.
3. Salin isi `Code.gs` ke editor Apps Script lalu simpan (`Ctrl + S`).
4. Jalankan fungsi `initializeDatabase` sekali untuk membuat tab `items`, `loans`, `maintenance`, `users`, dan `settings` secara otomatis.
5. Klik **Deploy** -> **New deployment** -> pilih tipe **Web app**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
6. Salin URL `/exec` hasil deploy dan pastikan URL tersebut sesuai dengan konfigurasi frontend.

---

## Cara Deploy ke GitHub & Vercel

1. Unggah isi folder `sintamas-app` ke repositori **GitHub** Anda.
2. Masuk ke **Vercel** -> **Add New...** -> **Project** -> impor repositori GitHub tersebut.
3. Biarkan pengaturan build standar (aplikasi statis HTML/JS tanpa build step tambahan) lalu klik **Deploy**.
4. Setelah terbit di domain `https://...vercel.app`, buka di HP Android/iOS lalu pilih **Tambahkan ke Layar Utama** agar ikon **Sintamas** muncul di layar utama HP.