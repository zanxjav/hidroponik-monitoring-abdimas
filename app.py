"""
Smart Hydroponic Monitoring Dashboard - Abdimas Project
Pure Python Web Dashboard (Streamlit & Plotly)
Memantau Suhu Udara, Kelembapan, dan Suhu Air Nutrisi dengan Dial Gauge & Grafik Tren
Nuansa Warna: Abu-Abu (Slate/Charcoal Grey) & Biru Langit (Sky Blue)
"""

import time
import random
from datetime import datetime
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# --- 1. Konfigurasi Halaman Streamlit ---
st.set_page_config(
    page_title="Smart Hydroponic Monitoring - Abdimas",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- 2. Custom CSS: Nuansa Abu-Abu & Biru Langit ---
st.markdown("""
<style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Background Utama & Container */
    .stApp {
        background: radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.05) 0%, transparent 40%),
                    radial-gradient(circle at 85% 85%, rgba(2, 132, 199, 0.05) 0%, transparent 40%),
                    #0b0f17;
        color: #f8fafc;
    }

    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #111722;
        border-right: 1px solid #263345;
    }

    /* Header Container */
    .dashboard-header {
        background: rgba(24, 34, 50, 0.7);
        border: 1px solid #263345;
        border-radius: 16px;
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        backdrop-filter: blur(12px);
        box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.5);
    }

    .dashboard-title {
        font-size: 1.45rem;
        font-weight: 800;
        color: #f8fafc;
        margin: 0;
        letter-spacing: -0.02em;
    }

    .dashboard-title span {
        color: #38bdf8;
    }

    .dashboard-sub {
        font-size: 0.82rem;
        color: #94a3b8;
        margin-top: 2px;
    }

    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: #141c28;
        border: 1px solid rgba(56, 189, 248, 0.4);
        border-radius: 9999px;
        color: #bae6fd;
        font-size: 0.82rem;
        font-weight: 600;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #38bdf8;
        box-shadow: 0 0 10px #38bdf8;
    }

    /* Summary Card Styling */
    .summary-card {
        background: #182232;
        border: 1px solid #263345;
        border-radius: 12px;
        padding: 14px 18px;
        text-align: center;
        margin-bottom: 15px;
    }
    .summary-label {
        font-size: 0.76rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .summary-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f8fafc;
        font-family: 'JetBrains Mono', monospace;
    }
    .summary-value.highlight {
        color: #38bdf8;
    }

    /* Hilangkan padding default berlebih */
    .block-container {
        padding-top: 1.5rem;
        padding-bottom: 2rem;
        max-width: 1400px;
    }
</style>
""", unsafe_allow_html=True)


# --- 3. Inisialisasi Session State Data ---
if "history" not in st.session_state:
    now = datetime.now()
    initial_data = []
    # Buat seed 15 data awal
    for i in range(15, 0, -1):
        ts = datetime.fromtimestamp(now.timestamp() - i * 3)
        initial_data.append({
            "timestamp": ts.strftime("%H:%M:%S"),
            "suhu_udara": round(26.0 + random.uniform(-0.6, 0.8), 1),
            "kelembapan": round(68.0 + random.uniform(-2.0, 2.5), 1),
            "suhu_air": round(23.5 + random.uniform(-0.4, 0.5), 1),
        })
    st.session_state.history = initial_data

if "sim_running" not in st.session_state:
    st.session_state.sim_running = True


# --- 4. Sidebar: Kontrol & Integrasi ---
with st.sidebar:
    st.markdown("### ⚙️ Pengaturan Sistem")
    st.markdown("<p style='font-size: 0.8rem; color: #94a3b8;'>Sistem Monitoring Hidroponik Abdimas</p>", unsafe_allow_html=True)

    mode = st.radio(
        "Sumber Data:",
        ["Simulasi Realtime Otomatis", "Input Manual Pengujian"],
        index=0 if st.session_state.sim_running else 1
    )

    if mode == "Simulasi Realtime Otomatis":
        st.session_state.sim_running = True
        interval = st.slider("Interval Pembaruan (detik):", min_value=1, max_value=5, value=2)
    else:
        st.session_state.sim_running = False
        st.markdown("#### 🎛️ Atur Nilai Sensor Manual:")
        manual_air = st.slider("Suhu Udara (°C):", 10.0, 45.0, 26.5, 0.1)
        manual_hum = st.slider("Kelembapan (%):", 20.0, 95.0, 68.0, 0.1)
        manual_water = st.slider("Suhu Air Nutrisi (°C):", 10.0, 40.0, 23.5, 0.1)

        if st.button("Terapkan ke Dashboard"):
            now_str = datetime.now().strftime("%H:%M:%S")
            st.session_state.history.append({
                "timestamp": now_str,
                "suhu_udara": manual_air,
                "kelembapan": manual_hum,
                "suhu_air": manual_water
            })
            if len(st.session_state.history) > 30:
                st.session_state.history.pop(0)

    st.markdown("---")
    st.markdown("### 💾 Ekspor Data Telemetri")
    df_export = pd.DataFrame(st.session_state.history)
    csv_data = df_export.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Unduh Data CSV",
        data=csv_data,
        file_name=f"log_hidroponik_{int(time.time())}.csv",
        mime="text/csv",
        use_container_width=True
    )

    if st.button("🔄 Reset Riwayat Grafik", use_container_width=True):
        st.session_state.history = st.session_state.history[-1:]
        st.rerun()

    st.markdown("---")
    st.markdown("""
    <div style='font-size: 0.75rem; color: #64748b;'>
        <b>Hydroponic Telemetry 2026</b><br>
        Framework: Streamlit &bull; Plotly<br>
        Microcontroller: ESP32 Ready
    </div>
    """, unsafe_allow_html=True)


# --- 5. Simulasi Pembaruan Data Jika Mode Otomatis Aktif ---
if st.session_state.sim_running:
    last_item = st.session_state.history[-1]
    # Fluktuasi realistis
    next_air = round(max(18.0, min(36.0, last_item["suhu_udara"] + random.uniform(-0.35, 0.35))), 1)
    next_hum = round(max(40.0, min(90.0, last_item["kelembapan"] + random.uniform(-0.8, 0.8))), 1)
    next_water = round(max(16.0, min(30.0, last_item["suhu_air"] + random.uniform(-0.25, 0.25))), 1)

    now_str = datetime.now().strftime("%H:%M:%S")
    st.session_state.history.append({
        "timestamp": now_str,
        "suhu_udara": next_air,
        "kelembapan": next_hum,
        "suhu_air": next_water
    })
    if len(st.session_state.history) > 30:
        st.session_state.history.pop(0)

# Ambil data terkini
current_data = st.session_state.history[-1]
curr_air = current_data["suhu_udara"]
curr_hum = current_data["kelembapan"]
curr_water = current_data["suhu_air"]


# --- 6. Header Dashboard ---
st.markdown(f"""
<div class="dashboard-header">
    <div>
        <h1 class="dashboard-title">🌱 Hydroponic <span>Monitoring Dashboard</span></h1>
        <div class="dashboard-sub">Sistem Telemetri Abdimas &bull; Pemantauan Suhu, Kelembapan & Suhu Air Nutrisi</div>
    </div>
    <div class="status-pill">
        <span class="status-dot"></span>
        <span>Sistem Aktif ({current_data['timestamp']} WIB)</span>
    </div>
</div>
""", unsafe_allow_html=True)


# --- 7. Fungsi Pembantu Pembuat Dial Gauge Plotly ---
def create_gauge(title, value, unit, min_val, max_val, ideal_min, ideal_max, bar_color):
    """Membuat Dial Gauge speedometer modern dengan nuansa abu-abu dan aksen warna."""
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': f"<b>{title}</b>", 'font': {'size': 16, 'color': '#f8fafc', 'family': 'Plus Jakarta Sans'}},
        number={
            'suffix': f" {unit}",
            'font': {'size': 32, 'color': '#ffffff', 'family': 'JetBrains Mono', 'weight': 'bold'}
        },
        gauge={
            'axis': {
                'range': [min_val, max_val],
                'tickwidth': 1.5,
                'tickcolor': '#64748b',
                'tickfont': {'color': '#94a3b8', 'size': 11, 'family': 'JetBrains Mono'}
            },
            'bar': {'color': bar_color, 'thickness': 0.25},
            'bgcolor': '#182232',
            'borderwidth': 1.5,
            'bordercolor': '#263345',
            'steps': [
                {'range': [min_val, ideal_min], 'color': '#141c28'},
                {'range': [ideal_min, ideal_max], 'color': 'rgba(56, 189, 248, 0.18)'},
                {'range': [ideal_max, max_val], 'color': '#141c28'}
            ],
            'threshold': {
                'line': {'color': bar_color, 'width': 4},
                'thickness': 0.78,
                'value': value
            }
        }
    ))

    # Status teks
    if ideal_min <= value <= ideal_max:
        status_text = "OPTIMAL"
        status_color = "#38bdf8"
    elif (ideal_min - 2 <= value < ideal_min) or (ideal_max < value <= ideal_max + 3):
        status_text = "WASPADA"
        status_color = "#fbbf24"
    else:
        status_text = "PERHATIAN"
        status_color = "#f87171"

    fig.add_annotation(
        text=f"<span style='color:{status_color}; font-weight:700;'>● {status_text}</span> &bull; Ideal: {ideal_min}-{ideal_max} {unit}",
        x=0.5, y=-0.12,
        showarrow=False,
        font=dict(size=11, color="#94a3b8")
    )

    fig.update_layout(
        paper_bgcolor="#182232",
        plot_bgcolor="#182232",
        margin=dict(l=25, r=25, t=40, b=30),
        height=240,
    )
    return fig


# --- 8. Tampilan 3 Dial Gauges (Satu Baris Sejajar) ---
col1, col2, col3 = st.columns(3)

with col1:
    fig_air = create_gauge(
        title="Suhu Udara",
        value=curr_air,
        unit="°C",
        min_val=0,
        max_val=50,
        ideal_min=22,
        ideal_max=28,
        bar_color="#38bdf8"  # Biru langit
    )
    st.plotly_chart(fig_air, use_container_width=True)

with col2:
    fig_hum = create_gauge(
        title="Kelembapan Udara",
        value=curr_hum,
        unit="%",
        min_val=0,
        max_val=100,
        ideal_min=60,
        ideal_max=80,
        bar_color="#818cf8"  # Indigo sky
    )
    st.plotly_chart(fig_hum, use_container_width=True)

with col3:
    fig_water = create_gauge(
        title="Suhu Air Nutrisi",
        value=curr_water,
        unit="°C",
        min_val=0,
        max_val=45,
        ideal_min=18,
        ideal_max=25,
        bar_color="#06b6d4"  # Cyan water
    )
    st.plotly_chart(fig_water, use_container_width=True)


# --- 9. Summary Statistics Bar ---
df_hist = pd.DataFrame(st.session_state.history)
avg_air = df_hist["suhu_udara"].mean()
avg_hum = df_hist["kelembapan"].mean()
avg_water = df_hist["suhu_air"].mean()

# Kondisi ekosistem
optimal_count = 0
if 22 <= curr_air <= 28: optimal_count += 1
if 60 <= curr_hum <= 80: optimal_count += 1
if 18 <= curr_water <= 25: optimal_count += 1

if optimal_count == 3:
    eco_status = "Optimal & Prima"
    eco_class = "highlight"
elif optimal_count >= 2:
    eco_status = "Cukup Baik"
    eco_class = "highlight"
else:
    eco_status = "Perlu Penyesuaian"
    eco_class = ""

s_col1, s_col2, s_col3, s_col4 = st.columns(4)

with s_col1:
    st.markdown(f"""
    <div class="summary-card">
        <div class="summary-label">Rata-rata Suhu Udara</div>
        <div class="summary-value">{avg_air:.1f} °C</div>
    </div>
    """, unsafe_allow_html=True)

with s_col2:
    st.markdown(f"""
    <div class="summary-card">
        <div class="summary-label">Rata-rata Kelembapan</div>
        <div class="summary-value">{avg_hum:.1f} %</div>
    </div>
    """, unsafe_allow_html=True)

with s_col3:
    st.markdown(f"""
    <div class="summary-card">
        <div class="summary-label">Rata-rata Suhu Air</div>
        <div class="summary-value">{avg_water:.1f} °C</div>
    </div>
    """, unsafe_allow_html=True)

with s_col4:
    st.markdown(f"""
    <div class="summary-card">
        <div class="summary-label">Status Ekosistem Hidroponik</div>
        <div class="summary-value {eco_class}">{eco_status}</div>
    </div>
    """, unsafe_allow_html=True)


# --- 10. Grafik Riwayat Sensor Real-Time (Plotly Dual-Axis) ---
st.markdown("### 📈 Grafik Riwayat & Tren Telemetri")

fig_chart = make_subplots(specs=[[{"secondary_y": True}]])

# Garis Suhu Udara
fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["suhu_udara"],
        name="Suhu Udara (°C)",
        line=dict(color="#38bdf8", width=2.5, shape='spline'),
        mode="lines+markers",
        marker=dict(size=5, color="#38bdf8")
    ),
    secondary_y=False
)

# Garis Suhu Air
fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["suhu_air"],
        name="Suhu Air (°C)",
        line=dict(color="#06b6d4", width=2.5, shape='spline'),
        mode="lines+markers",
        marker=dict(size=5, color="#06b6d4")
    ),
    secondary_y=False
)

# Garis Kelembapan (Secondary Y Axis)
fig_chart.add_trace(
    go.Scatter(
        x=df_hist["timestamp"],
        y=df_hist["kelembapan"],
        name="Kelembapan (%)",
        line=dict(color="#818cf8", width=2.5, shape='spline', dash='dot'),
        mode="lines+markers",
        marker=dict(size=5, color="#818cf8")
    ),
    secondary_y=True
)

fig_chart.update_layout(
    paper_bgcolor="#182232",
    plot_bgcolor="#111722",
    font=dict(family="Plus Jakarta Sans", color="#94a3b8"),
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="right",
        x=1,
        font=dict(size=12, color="#e2e8f0")
    ),
    margin=dict(l=20, r=20, t=30, b=20),
    height=320,
    hovermode="x unified"
)

fig_chart.update_xaxes(
    gridcolor="#263345",
    linecolor="#263345",
    tickfont=dict(family="JetBrains Mono", size=10, color="#64748b")
)

fig_chart.update_yaxes(
    title_text="Suhu (°C)",
    title_font=dict(color="#38bdf8", size=12),
    range=[15, 42],
    gridcolor="#263345",
    linecolor="#263345",
    tickfont=dict(family="JetBrains Mono", size=10, color="#38bdf8"),
    secondary_y=False
)

fig_chart.update_yaxes(
    title_text="Kelembapan (%)",
    title_font=dict(color="#818cf8", size=12),
    range=[35, 100],
    showgrid=False,
    linecolor="#263345",
    tickfont=dict(family="JetBrains Mono", size=10, color="#818cf8"),
    secondary_y=True
)

st.plotly_chart(fig_chart, use_container_width=True)


# --- 11. Auto Refresh Loop Jika Simulasi Aktif ---
if st.session_state.sim_running:
    time.sleep(interval)
    st.rerun()
