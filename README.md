# 🌱 Smart Hydroponic Monitoring Dashboard - Abdimas

> **Web Dashboard Telemetri Hidroponik Real-Time**: Pemantauan Suhu Udara, Kelembapan, dan Suhu Air Nutrisi dengan indikator visual **Dial Gauge** dan **Grafik Riwayat Telemetri**.

Aplikasi ini dikembangkan untuk kegiatan **Pengabdian Kepada Masyarakat (Abdimas)** guna membantu petani hidroponik dan masyarakat dalam memantau iklim mikro dan larutan nutrisi tanaman hidroponik secara mudah, presisi, dan modern.

---

## ✨ Fitur Utama

1. **3 Indikator Dial Gauge Interaktif**:
   - 🌡️ **Suhu Udara (°C)**: Rentang 0 - 50°C (Rentang ideal: 22°C - 28°C).
   - 💧 **Kelembapan Udara (%)**: Rentang 0 - 100% (Rentang ideal: 60% - 80%).
   - 🌊 **Suhu Air Nutrisi (°C)**: Rentang 0 - 45°C (Rentang ideal: 18°C - 25°C).
   - Indikator jarum halus (needle), busur nilai responsif (animated arc meter), dan badge status otomatis (*Optimal*, *Waspada*, *Perhatian*).

2. **Grafik Riwayat Sensor Real-Time (Chart.js)**:
   - Menampilkan tren suhu udara, kelembapan, dan suhu air secara berkelanjutan.
   - Dilengkapi *filter chip* untuk menyembunyikan/menampilkan parameter tertentu.
   - Skala ganda (*Dual Y-Axis*) agar suhu (°C) dan kelembapan (%) terbaca jelas tanpa tumpang-tindih.

3. **Nuansa Visual Elegan**:
   - Palet warna abu-abu modern (*slate/charcoal grey*) dipadukan dengan aksen biru langit (*sky blue glow*).
   - Desain 1 tampilan (*Single Simple View*) yang ringkas, bersih, dan langsung menyajikan seluruh informasi tanpa perlu berpindah-pindah halaman.

4. **Kontrol & Telemetri**:
   - Tombol **Jeda / Lanjutkan Simulasi** untuk pengujian langsung tanpa perangkat fisik.
   - **Setelan & Suntik Data Manual**: Menguji perubahan tampilan dial dan grafik sewaktu-waktu.
   - **Unduh Log CSV**: Menyimpan rekaman data telemetri ke dalam format `.csv` untuk analisis laporan.

5. **Dukungan Mikrokontroler IoT**:
   - Disertakan contoh firmware Arduino/ESP32 di folder `arduino_sample/` untuk integrasi sensor **DHT22** dan **DS18B20**.

---

## 🎨 Palet Warna Desain

| Elemen | Kode Warna | Keterangan |
| :--- | :--- | :--- |
| **Background Utama** | `#0b0f17` / `#111722` | Dark Slate Grey |
| **Kartu Dashboard** | `#182232` | Charcoal Card dengan Glassmorphism |
| **Aksen Biru Langit** | `#38bdf8` / `#0284c7` | Sky Blue Highlight & Glow |
| **Suhu Udara** | `#38bdf8` | Sky Blue Primary |
| **Kelembapan** | `#818cf8` | Indigo Sky Accent |
| **Suhu Air Nutrisi** | `#06b6d4` | Cyan Ocean Accent |

---

## 📁 Struktur Direktori

```text
hidroponic abdimas/
├── index.html                   # Halaman antarmuka utama (single-page)
├── css/
│   └── style.css                # Desain nuansa abu-abu & biru langit
├── js/
│   └── app.js                   # Logika dial SVG, chart realtime, & simulasi
├── arduino_sample/
│   └── esp32_hidroponik_telemetry.ino  # Contoh firmware ESP32 (DHT22 & DS18B20)
├── .gitignore                   # Konfigurasi file git
└── README.md                    # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan

### Cara 1: Langsung Buka di Browser
Cukup klik ganda berkas `index.html` atau buka menggunakan peramban modern (Chrome, Edge, Firefox).

### Cara 2: Menjalankan Local Web Server (Opsional)
Jika menggunakan ekstensi VS Code **Live Server**:
1. Buka folder ini di VS Code.
2. Klik kanan pada `index.html` -> **Open with Live Server**.

Atau via terminal Node.js / Python:
```bash
# Menggunakan Python
python -m http.server 8080

# Menggunakan npx
npx serve .
```
Akses di browser pada: `http://localhost:8080`

---

## 🔌 Format Integrasi Data IoT (ESP32 / NodeMCU)

Dashboard menyediakan fungsi global JavaScript untuk menerima data dari eksternal:
```javascript
window.updateHydroponicData(suhuUdara, kelembapan, suhuAir);
```

Format payload JSON standar:
```json
{
  "suhu_udara": 26.4,
  "kelembapan": 68.2,
  "suhu_air": 23.8
}
```

---

## 👨‍💻 Pengembang
- **Nama**: Fauzan Javier ([@zanxjav](https://github.com/zanxjav))
- **Proyek**: Sistem Monitoring Hidroponik - Pengabdian Kepada Masyarakat (Abdimas)
- **Tahun**: 2026
