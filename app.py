"""
Smart Hydroponic Monitoring Dashboard - Abdimas Project
100% Full Python (Streamlit & Plotly) - Mobile-First & User-Friendly Edition
Dioptimalkan Khusus untuk Tampilan Layar HP / Smartphone
Nuansa: Abu-Abu (Slate Grey) & Biru Langit (Sky Blue)
"""

import time
import random
from datetime import datetime
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# --- 1. Konfigurasi Streamlit Mobile ---
st.set_page_config(
    page_title="Hidroponik Mobile Monitor",
    page_icon="🌱",
    layout="centered", # Centered agar proporsional mirip layar HP saat dibuka di desktop
    initial_sidebar_state="collapsed" # Sidebar tertutup secara default di HP agar tidak menutupi layar
)

# --- 2. CSS Mobile-First: Nuansa Abu-Abu & Biru Langit ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Background Utama */
    .stApp {
        background: #0c111a;
        color: #f8fafc;
    }

    /* Container Mobile Wrapper */
    .block-container {
        max-width: 500px !important;
        padding-top: 1rem !important;
        padding-bottom: 5rem !important;
        padding-left: 0.8rem !important;
        padding-right: 0.8rem !important;
    }

    /* Header Mobile */
    .mobile-header-box {
        background: #151d2a;
        border: 1px solid #222f42;
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    .mobile-header-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #f8fafc;
        margin: 0;
        line-height: 1.2;
    }
    .mobile-header-title span {
        color: #38bdf8;
    }
    .mobile-header-sub {
        font-size: 0.7rem;
        color: #94a3b8;
    }
    .live-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #101622;
        border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.72rem;
        font-weight: 700;
        color: #bae6fd;
    }
    .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 6px #38bdf8;
    }

    /* Banner Kondisi (Ramah Pengguna) */
    .user-friendly-banner {
        background: linear-gradient(135deg, #151d2a, rgba(2, 132, 199, 0.2));
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .banner-icon {
        font-size: 1.6rem;
    }
    .banner-text strong {
        display: block;
        font-size: 0.88rem;
        color: #f8fafc;
        font-weight: 700;
    }
    .banner-text p {
        margin: 0;
        font-size: 0.74rem;
        color: #94a3b8;
        line-height: 1.35;
    }

    /* Parameter Card Header */
    .param-mobile-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #151d2a;
        padding: 8px 12px;
        border-radius: 10px 10px 0 0;
        border-top: 1px solid #222f42;
        border-left: 1px solid #222f42;
        border-right: 1px solid #222f42;
        margin-top: 8px;
    }
    .param-mobile-title span {
        font-size: 0.82rem;
        font-weight: 700;
    }

    /* Mini Stats Grid */
    .mini-stats-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-top: 12px;
        margin-bottom: 12px;
    }
    .mini-card {
        background: #151d2a;
        border: 1px solid #222f42;
        border-radius: 12px;
        padding: 8px 6px;
        text-align: center;
    }
    .mini-card-lbl {
        font-size: 0.65rem;
        color: #94a3b8;
        display: block;
        text-transform: uppercase;
    }
    .mini-card-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.92rem;
        font-weight: 700;
        color: #f8fafc;
    }

    /* Pompa Sirkulasi Air Card */
    .pump-card {
        background: #151d2a;
        border: 1px solid #222f42;
        border-radius: 14px;
        padding: 12px 14px;
        margin-top: 10px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }
    .pump-card.active {
        border-color: rgba(56, 189, 248, 0.45);
        background: linear-gradient(135deg, #151d2a 60%, rgba(56, 189, 248, 0.12));
    }
    .pump-icon {
        font-size: 1.8rem;
    }
    .pump-badge-on {
        background: rgba(56, 189, 248, 0.2);
        color: #38bdf8;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 0.72rem;
        border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .pump-badge-off {
        background: rgba(100, 116, 139, 0.2);
        color: #94a3b8;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 0.72rem;
        border: 1px solid #334155;
    }
</style>
""", unsafe_allow_html=True)


# --- 3. Inisialisasi Data Session State ---
if "pump_thresh" not in st.session_state:
    st.session_state.pump_thresh = 25.0

if "pump_mode" not in st.session_state:
    st.session_state.pump_mode = "Otomatis"

if "pump_status" not in st.session_state:
    st.session_state.pump_status = False

if "history" not in st.session_state:
    now = datetime.now()
    seed = []
    for i in range(12, 0, -1):
        ts = datetime.fromtimestamp(now.timestamp() - i * 3)
        w_val = round(23.6 + random.uniform(-0.3, 0.4), 1)
        seed.append({
            "timestamp": ts.strftime("%H:%M:%S"),
            "suhu_udara": round(26.2 + random.uniform(-0.5, 0.6), 1),
            "kelembapan": round(68.0 + random.uniform(-1.8, 2.0), 1),
            "suhu_air": w_val,
            "pompa": "HIDUP" if w_val > 25.0 else "STANDBY"
        })
    st.session_state.history = seed

if "sim_running" not in st.session_state:
    st.session_state.sim_running = True


# --- 4. Sidebar Khusus Pengaturan & Ekspor ---
with st.sidebar:
    st.markdown("### ⚙️ Menu & Pengaturan")
    st.markdown("<small style='color:#94a3b8;'>Optimasi Smartphone Hidroponik</small>", unsafe_allow_html=True)

    mode = st.radio(
        "Mode Telemetri:",
        ["Simulasi Otomatis (Live)", "Kalibrasi / Uji Manual"],
        index=0 if st.session_state.sim_running else 1
    )

    st.markdown("#### 🌀 Pompa Sirkulasi Air Nutrisi:")
    st.session_state.pump_thresh = st.slider(
        "Ambang Suhu Pompa Hidup (°C):",
        20.0, 30.0, float(st.session_state.pump_thresh), 0.5,
        help="Ketika suhu air melampaui batas ini, pompa memutar air agar panas merata dan mendingin."
    )
    st.session_state.pump_mode = st.selectbox(
        "Mode Operasi Pompa:",
        ["Otomatis (Sesuai Suhu Air)", "Manual - Paksa Hidup (ON)", "Manual - Paksa Mati (OFF)"],
        index=0 if st.session_state.pump_mode == "Otomatis" else (1 if "ON" in st.session_state.pump_mode else 2)
    )

    if mode == "Simulasi Otomatis (Live)":
        st.session_state.sim_running = True
        interval = st.slider("Interval Detik:", 1, 5, 2)
    else:
        st.session_state.sim_running = False
        st.markdown("#### 🎛️ Suntik Nilai Sensor:")
        m_air = st.slider("Suhu Udara (°C):", 15.0, 42.0, 26.5, 0.5)
        m_hum = st.slider("Kelembapan (%):", 30.0, 95.0, 68.0, 1.0)
        m_water = st.slider("Suhu Air (°C):", 15.0, 35.0, 23.5, 0.5)

        if st.button("Terapkan ke Layar", use_container_width=True):
            p_stat = (m_water > st.session_state.pump_thresh)
            st.session_state.history.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "suhu_udara": m_air,
                "kelembapan": m_hum,
                "suhu_air": m_water,
                "pompa": "HIDUP" if p_stat else "STANDBY"
            })
            if len(st.session_state.history) > 20:
                st.session_state.history.pop(0)

    st.markdown("---")
    df_exp = pd.DataFrame(st.session_state.history)
    st.download_button(
        label="📥 Unduh Rekaman CSV",
        data=df_exp.to_csv(index=False).encode('utf-8'),
        file_name=f"log_hidroponik_{int(time.time())}.csv",
        mime="text/csv",
        use_container_width=True
    )

    if st.button("🔄 Bersihkan Grafik", use_container_width=True):
        st.session_state.history = st.session_state.history[-1:]
        st.rerun()


# --- 5. Simulasi Data Terkini & Fisika Pendinginan Pompa ---
last = st.session_state.history[-1]

# Hitung Status Pompa Berdasarkan Mode
if "Manual - Paksa Hidup" in st.session_state.pump_mode:
    st.session_state.pump_status = True
elif "Manual - Paksa Mati" in st.session_state.pump_mode:
    st.session_state.pump_status = False
else:
    # Otomatis: Histeresis
    if last["suhu_air"] > st.session_state.pump_thresh:
        st.session_state.pump_status = True
    elif last["suhu_air"] <= (st.session_state.pump_thresh - 0.4):
        st.session_state.pump_status = False

if st.session_state.sim_running:
    n_air = round(max(18.0, min(36.0, last["suhu_udara"] + random.uniform(-0.3, 0.3))), 1)
    n_hum = round(max(45.0, min(90.0, last["kelembapan"] + random.uniform(-0.6, 0.6))), 1)

    # Fisika Pompa Air: Jika hidup memutar air mendinginkan nutrisi ke titik ideal
    if st.session_state.pump_status:
        n_water = round(max(22.0, last["suhu_air"] - random.uniform(0.18, 0.35)), 1)
    else:
        n_water = round(max(16.0, min(31.0, last["suhu_air"] + random.uniform(-0.15, 0.28))), 1)

    st.session_state.history.append({
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "suhu_udara": n_air,
        "kelembapan": n_hum,
        "suhu_air": n_water,
        "pompa": "HIDUP" if st.session_state.pump_status else "STANDBY"
    })
    if len(st.session_state.history) > 20:
        st.session_state.history.pop(0)

cur = st.session_state.history[-1]
air_val = cur["suhu_udara"]
hum_val = cur["kelembapan"]
water_val = cur["suhu_air"]


# --- 6. Mobile App Bar Header ---
st.markdown(f"""
<div class="mobile-header-box">
    <div>
        <h1 class="mobile-header-title">🌱 Hidroponik <span>Monitor</span></h1>
        <span class="mobile-header-sub">Sistem Telemetri Abdimas</span>
    </div>
    <div class="live-tag">
        <span class="live-dot"></span>
        <span>{cur['timestamp']} WIB</span>
    </div>
</div>
""", unsafe_allow_html=True)


# --- 7. Banner Ramah Pengguna (Bahasa Indonesia Sederhana) ---
optimal_count = 0
if 22 <= air_val <= 28: optimal_count += 1
if 60 <= hum_val <= 80: optimal_count += 1
if 18 <= water_val <= 25: optimal_count += 1

if optimal_count == 3:
    banner_icon = "✅"
    banner_title = "Kondisi Hidroponik Prima"
    banner_desc = "Suhu udara, kelembapan, dan suhu air berada pada rentang ideal pertumbuhan tanaman."
elif optimal_count >= 2:
    banner_icon = "⚠️"
    banner_title = "Kondisi Cukup Baik"
    banner_desc = "Ada 1 parameter yang sedikit bergeser dari rentang target optimal."
else:
    banner_icon = "🔔"
    banner_title = "Perlu Perhatian Petani"
    banner_desc = "Segera lakukan penyesuaian nutrisi air atau ventilasi udara."

st.markdown(f"""
<div class="user-friendly-banner">
    <div class="banner-icon">{banner_icon}</div>
    <div class="banner-text">
        <strong>{banner_title}</strong>
        <p>{banner_desc}</p>
    </div>
</div>
""", unsafe_allow_html=True)


# --- 8. Tab Pilihan Parameter (Sangat Ramah Layar HP) ---
tab_all, tab_air, tab_hum, tab_water = st.tabs(["📱 Semua Dial", "🌡️ Suhu Udara", "💧 Kelembapan", "🌊 Suhu Air"])


def build_mobile_gauge(title, value, unit, min_val, max_val, ideal_min, ideal_max, bar_color):
    """Dial gauge yang dirancang pas dengan layar smartphone tanpa overflow."""
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': f"<b>{title}</b>", 'font': {'size': 14, 'color': '#f8fafc', 'family': 'Plus Jakarta Sans'}},
        number={'suffix': f" {unit}", 'font': {'size': 28, 'color': '#ffffff', 'family': 'JetBrains Mono', 'weight': 'bold'}},
        gauge={
            'axis': {'range': [min_val, max_val], 'tickcolor': '#64748b', 'tickfont': {'color': '#94a3b8', 'size': 9}},
            'bar': {'color': bar_color, 'thickness': 0.28},
            'bgcolor': '#151d2a',
            'borderwidth': 1.5,
            'bordercolor': '#222f42',
            'steps': [
                {'range': [min_val, ideal_min], 'color': '#101622'},
                {'range': [ideal_min, ideal_max], 'color': 'rgba(56, 189, 248, 0.22)'},
                {'range': [ideal_max, max_val], 'color': '#101622'}
            ],
            'threshold': {'line': {'color': bar_color, 'width': 4}, 'thickness': 0.8, 'value': value}
        }
    ))

    # Teks status
    if ideal_min <= value <= ideal_max:
        status_lbl = "OPTIMAL"
        status_c = "#38bdf8"
    elif (ideal_min - 2 <= value < ideal_min) or (ideal_max < value <= ideal_max + 3):
        status_lbl = "WASPADA"
        status_c = "#fbbf24"
    else:
        status_lbl = "PERHATIAN"
        status_c = "#f87171"

    fig.add_annotation(
        text=f"<span style='color:{status_c}; font-weight:700;'>● {status_lbl}</span> (Ideal: {ideal_min}-{ideal_max} {unit})",
        x=0.5, y=-0.14,
        showarrow=False,
        font=dict(size=10, color="#94a3b8")
    )

    fig.update_layout(
        paper_bgcolor="#151d2a",
        plot_bgcolor="#151d2a",
        margin=dict(l=15, r=15, t=35, b=25),
        height=190,
    )
    return fig


# Render sesuai tab yang aktif
with tab_all:
    # 3 Dial bertumpuk rapi di layar HP
    fig_a = build_mobile_gauge("Suhu Udara", air_val, "°C", 0, 50, 22, 28, "#38bdf8")
    st.plotly_chart(fig_a, use_container_width=True, config={'displayModeBar': False})

    fig_h = build_mobile_gauge("Kelembapan Udara", hum_val, "%", 0, 100, 60, 80, "#818cf8")
    st.plotly_chart(fig_h, use_container_width=True, config={'displayModeBar': False})

    fig_w = build_mobile_gauge("Suhu Air Nutrisi", water_val, "°C", 0, 45, 18, 25, "#06b6d4")
    st.plotly_chart(fig_w, use_container_width=True, config={'displayModeBar': False})

with tab_air:
    fig_a_focus = build_mobile_gauge("Suhu Udara Lingkungan", air_val, "°C", 0, 50, 22, 28, "#38bdf8")
    st.plotly_chart(fig_a_focus, use_container_width=True, config={'displayModeBar': False})
    st.info("💡 Suhu udara 22°C - 28°C memicu fotosintesis terbaik dan mencegah tanaman layu panas.")

with tab_hum:
    fig_h_focus = build_mobile_gauge("Kelembapan Udara (RH)", hum_val, "%", 0, 100, 60, 80, "#818cf8")
    st.plotly_chart(fig_h_focus, use_container_width=True, config={'displayModeBar': False})
    st.info("💡 Kelembapan 60% - 80% mengoptimalkan penguapan air stomata daun tanaman selada.")

with tab_water:
    fig_w_focus = build_mobile_gauge("Suhu Air Larutan Nutrisi", water_val, "°C", 0, 45, 18, 25, "#06b6d4")
    st.plotly_chart(fig_w_focus, use_container_width=True, config={'displayModeBar': False})
    st.info("💡 Suhu air 18°C - 25°C memastikan kadar oksigen terlarut (DO) maksimal bagi akar.")


# --- 9. Indikator Status Pompa Air Sirkulasi & Mini Stats Row ---
p_badge_cls = "pump-badge-on" if st.session_state.pump_status else "pump-badge-off"
p_badge_txt = "HIDUP (Memutar Air)" if st.session_state.pump_status else "STANDBY (Mati)"
p_hint = f"🔥 Air nutrisi hangat (> {st.session_state.pump_thresh:.1f}°C). Pompa <strong>memutar air</strong> agar panas merata & dingin." if st.session_state.pump_status else f"❄️ Air nutrisi aman (≤ {st.session_state.pump_thresh:.1f}°C). Pompa standby hemat daya."
p_card_cls = "pump-card active" if st.session_state.pump_status else "pump-card"
p_icon = "🌀" if st.session_state.pump_status else "💤"

st.markdown(f"""
<div class="{p_card_cls}">
    <div style="display:flex; align-items:center; gap:10px;">
        <span class="pump-icon">{p_icon}</span>
        <div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#94a3b8; font-size:0.78rem; font-weight:600;">Pompa Sirkulasi:</span>
                <span class="{p_badge_cls}">{p_badge_txt}</span>
            </div>
            <p style="margin:2px 0 0 0; font-size:0.68rem; color:#94a3b8; line-height:1.25;">{p_hint}</p>
        </div>
    </div>
    <span style="font-size:0.68rem; font-weight:700; color:#38bdf8; background:#101622; padding:3px 8px; border-radius:6px; border:1px solid #222f42; flex-shrink:0;">
        {st.session_state.pump_mode.split()[0]}
    </span>
</div>
""", unsafe_allow_html=True)

df_hist = pd.DataFrame(st.session_state.history)
avg_a = df_hist["suhu_udara"].mean()
avg_h = df_hist["kelembapan"].mean()
avg_w = df_hist["suhu_air"].mean()
pump_live_txt = "AKTIF (Memutar)" if st.session_state.pump_status else "STANDBY (Mati)"
pump_live_color = "#38bdf8" if st.session_state.pump_status else "#64748b"

st.markdown(f"""
<div class="mini-stats-row">
    <div class="mini-card">
        <span class="mini-card-lbl">Rata-rata Suhu Udara</span>
        <span class="mini-card-val">{avg_a:.1f} °C</span>
    </div>
    <div class="mini-card">
        <span class="mini-card-lbl">Rata-rata Kelembapan</span>
        <span class="mini-card-val">{avg_h:.1f} %</span>
    </div>
    <div class="mini-card">
        <span class="mini-card-lbl">Rata-rata Suhu Air</span>
        <span class="mini-card-val">{avg_w:.1f} °C</span>
    </div>
    <div class="mini-card">
        <span class="mini-card-lbl">Status Pompa Air</span>
        <span class="mini-card-val" style="color: {pump_live_color}; font-size: 0.8rem;">{pump_live_txt}</span>
    </div>
</div>
""", unsafe_allow_html=True)


# --- 10. Grafik Mobile Plotly ---
st.markdown("##### 📈 Grafik Riwayat Telemetri")

fig_chart = make_subplots(specs=[[{"secondary_y": True}]])

fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["suhu_udara"],
        name="Suhu Udara",
        line=dict(color="#38bdf8", width=2, shape='spline'),
        mode="lines"
    ),
    secondary_y=False
)

fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["suhu_air"],
        name="Suhu Air",
        line=dict(color="#06b6d4", width=2, shape='spline'),
        mode="lines"
    ),
    secondary_y=False
)

fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["kelembapan"],
        name="Kelembapan",
        line=dict(color="#818cf8", width=2, shape='spline', dash='dot'),
        mode="lines"
    ),
    secondary_y=True
)

fig_chart.update_layout(
    paper_bgcolor="#151d2a",
    plot_bgcolor="#0c111a",
    font=dict(family="Plus Jakarta Sans", color="#94a3b8"),
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="center",
        x=0.5,
        font=dict(size=10, color="#cbd5e1")
    ),
    margin=dict(l=10, r=10, t=25, b=15),
    height=240, # Kompak untuk HP
    hovermode="x unified"
)

fig_chart.update_xaxes(
    gridcolor="#222f42",
    linecolor="#222f42",
    tickfont=dict(family="JetBrains Mono", size=9, color="#64748b"),
    nticks=5
)

fig_chart.update_yaxes(
    range=[15, 42],
    gridcolor="#222f42",
    tickfont=dict(family="JetBrains Mono", size=9, color="#38bdf8"),
    nticks=5,
    secondary_y=False
)

fig_chart.update_yaxes(
    range=[35, 100],
    showgrid=False,
    tickfont=dict(family="JetBrains Mono", size=9, color="#818cf8"),
    nticks=5,
    secondary_y=True
)

st.plotly_chart(fig_chart, use_container_width=True, config={'displayModeBar': False})


# --- 11. Tombol Aksi Sentuh Cepat ---
c1, c2 = st.columns(2)
with c1:
    if st.button("⏸️ Jeda / Lanjut", use_container_width=True):
        st.session_state.sim_running = not st.session_state.sim_running
        st.rerun()

with c2:
    if st.button("⚙️ Buka Menu", use_container_width=True):
        st.sidebar.markdown("Pilih opsi di menu sebelah kiri.")


# --- 12. Auto-Refresh Loop ---
if st.session_state.sim_running:
    time.sleep(interval)
    st.rerun()
