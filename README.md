# 🌱 Smart Hydroponic Monitoring Dashboard - Abdimas (Full Python)

> **Web Dashboard Telemetri Hidroponik Real-Time Berbasis Full Python**: Pemantauan Suhu Udara, Kelembapan, dan Suhu Air Nutrisi dengan indikator visual **Dial Gauge (Plotly)** dan **Grafik Riwayat Sensor**.

Aplikasi ini dikembangkan untuk kegiatan **Pengabdian Kepada Masyarakat (Abdimas)** guna membantu petani hidroponik dan masyarakat dalam memantau iklim mikro serta larutan nutrisi tanaman hidroponik secara mudah, presisi, dan modern.

---

## ✨ Fitur Utama (Full Python)

1. **3 Indikator Dial Gauge Interaktif (Plotly Indicator)**:
   - 🌡️ **Suhu Udara (°C)**: Rentang 0 – 50°C (Rentang ideal: 22°C – 28°C).
   - 💧 **Kelembapan Udara (%)**: Rentang 0 – 100% (Rentang ideal: 60% – 80%).
   - 🌊 **Suhu Air Nutrisi (°C)**: Rentang 0 – 45°C (Rentang ideal: 18°C – 25°C).
   - Indikator meteran setengah lingkaran (*speedometer gauge*), threshold bar, status (*Optimal*, *Waspada*, *Perhatian*), dan label satuan yang jelas.

2. **Grafik Riwayat Telemetri Real-Time (Plotly Dual-Axis)**:
   - Skala ganda (*Dual Y-Axis*) agar suhu (°C) dan kelembapan (%) tampil proporsional tanpa saling menumpuk.
   - Kurva halus (*spline*) dengan titik penanda data (*markers*).
   - *Hover tooltip* informatif per titik waktu.

3. **Nuansa Visual Elegan**:
   - Palet warna abu-abu modern (*slate/charcoal grey*: `#0b0f17`, `#182232`) dipadukan dengan aksen biru langit (*sky blue*: `#38bdf8`, `#0284c7`).
   - Desain 1 tampilan (*Single Clean View*) yang ringkas dan responsif.

4. **Kontrol Interaktif & Ekspor Data**:
   - **Mode Simulasi Otomatis**: Data berfluktuasi secara halus dan realtime untuk pengujian/demo.
   - **Mode Input Manual**: Penggeser (*slider*) untuk menyimulasikan nilai sensor ekstrem.
   - **Unduh Log CSV**: Tombol untuk mengekspor rekaman data telemetri ke dalam format `.csv` dengan sekali klik.

5. **Dua Pilihan Menjalankan Web**:
   - 🐍 **Streamlit (`app.py`)**: 100% Full Python Web Dashboard.
   - 🚀 **Flask (`server_flask.py`)**: Web server Python mandiri dengan REST API untuk mikrokontroler ESP32/Arduino.
   - 🌐 **Static HTML (`index.html`)**: Versi instan yang aktif di GitHub Pages.

---

## 🎨 Palet Warna Desain

| Elemen | Kode Warna | Keterangan |
| :--- | :--- | :--- |
| **Background Utama** | `#0b0f17` | Dark Slate Grey |
| **Kartu Dashboard** | `#182232` | Charcoal Card dengan Border Halus |
| **Aksen Biru Langit** | `#38bdf8` / `#0284c7` | Sky Blue Accent & Glow |
| **Suhu Udara** | `#38bdf8` | Sky Blue Primary |
| **Kelembapan** | `#818cf8` | Indigo Sky Accent |
| **Suhu Air Nutrisi** | `#06b6d4` | Cyan Ocean Accent |

---

## 📁 Struktur Direktori

```text
hidroponic abdimas/
├── app.py                       # Web Dashboard Full Python (Streamlit + Plotly)
├── server_flask.py              # Server Web Python Flask + REST API IoT
├── requirements.txt             # Dependensi Python
├── index.html                   # Dashboard web alternatif (HTML/CSS/JS)
├── css/style.css                # Style dashboard web
├── js/app.js                    # Script dashboard web
├── arduino_sample/
│   └── esp32_hidroponik_telemetry.ino  # Firmware ESP32 (DHT22 & DS18B20)
├── .gitignore                   # Konfigurasi file git
└── README.md                    # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan

### 1. Pasang Dependensi Python
Buka terminal di folder proyek ini lalu jalankan:
```bash
pip install -r requirements.txt
```

### 2. Jalankan Web Dashboard Full Python (Streamlit)
```bash
streamlit run app.py
```
Peramban akan terbuka otomatis di alamat: **`http://localhost:8501`**

### 3. (Opsional) Jalankan via Python Flask
Jika ingin menggunakan server Flask yang mendukung endpoint REST API untuk ESP32:
```bash
python server_flask.py
```
Akses di: **`http://localhost:5000`**

---

## 🔌 Format Integrasi Data IoT (ESP32)

Untuk mengirimkan data dari ESP32 ke server Flask:
- **Metode**: `POST`
- **URL**: `http://<IP_KOMPUTER_ANDA>:5000/api/telemetry`
- **Format JSON**:
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
