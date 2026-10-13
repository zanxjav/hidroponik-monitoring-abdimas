/**
 * Smart Hydroponic Monitoring System - Mobile Dashboard Engine (V2)
 * Pure Trigonometric Symmetrical Needle & Touch-Optimized Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants ---
  const ARC_TOTAL = 213.63; // PI * 68
  const CENTER_X = 100;
  const CENTER_Y = 95;
  const NEEDLE_LEN = 50;
  const ARC_RADIUS = 68;

  // Sensor Ranges
  const RANGES = {
    airTemp: { min: 0, max: 50, idealMin: 22, idealMax: 28 },
    humidity: { min: 0, max: 100, idealMin: 60, idealMax: 80 },
    waterTemp: { min: 0, max: 45, idealMin: 18, idealMax: 25 },
  };

  // State
  const state = {
    airTemp: 25.8,
    humidity: 70.2,
    waterTemp: 23.3,
    isSimulating: true,
    history: [],
    maxPoints: 20,
    currentFilter: 'all',
  };

  // DOM Elements
  const els = {
    // Header & Badges
    liveClock: document.getElementById('liveClock'),
    liveBadge: document.getElementById('liveBadge'),
    liveBadgeText: document.getElementById('liveBadgeText'),
    btnSettings: document.getElementById('btnSettings'),

    // Eco Banner
    ecoCard: document.getElementById('ecoCard'),
    ecoIcon: document.getElementById('ecoIcon'),
    ecoTitle: document.getElementById('ecoTitle'),
    ecoDesc: document.getElementById('ecoDesc'),

    // Air Temp Dial
    arcAirTemp: document.getElementById('arcAirTemp'),
    needleAirTemp: document.getElementById('needleAirTemp'),
    beadAirTemp: document.getElementById('beadAirTemp'),
    valAirTemp: document.getElementById('valAirTemp'),
    badgeAirTemp: document.getElementById('badgeAirTemp'),

    // Humidity Dial
    arcHumidity: document.getElementById('arcHumidity'),
    needleHumidity: document.getElementById('needleHumidity'),
    beadHumidity: document.getElementById('beadHumidity'),
    valHumidity: document.getElementById('valHumidity'),
    badgeHumidity: document.getElementById('badgeHumidity'),

    // Water Temp Dial
    arcWaterTemp: document.getElementById('arcWaterTemp'),
    needleWaterTemp: document.getElementById('needleWaterTemp'),
    beadWaterTemp: document.getElementById('beadWaterTemp'),
    valWaterTemp: document.getElementById('valWaterTemp'),
    badgeWaterTemp: document.getElementById('badgeWaterTemp'),

    // Mini Summary
    avgAirTemp: document.getElementById('avgAirTemp'),
    avgHumidity: document.getElementById('avgHumidity'),
    avgWaterTemp: document.getElementById('avgWaterTemp'),

    // Tabs & Cards
    tabItems: document.querySelectorAll('.tab-item'),
    dialCards: document.querySelectorAll('.dial-card'),

    // Bottom Action Bar
    btnSimToggle: document.getElementById('btnSimToggle'),
    simIcon: document.getElementById('simIcon'),
    simBtnText: document.getElementById('simBtnText'),
    btnOpenModal: document.getElementById('btnOpenModal'),

    // Bottom Sheet Modal
    settingsSheet: document.getElementById('settingsSheet'),
    btnCloseSheet: document.getElementById('btnCloseSheet'),
    optAutoSim: document.getElementById('optAutoSim'),
    optManual: document.getElementById('optManual'),
    sliderAir: document.getElementById('sliderAir'),
    sliderHum: document.getElementById('sliderHum'),
    sliderWater: document.getElementById('sliderWater'),
    labelSliderAir: document.getElementById('labelSliderAir'),
    labelSliderHum: document.getElementById('labelSliderHum'),
    labelSliderWater: document.getElementById('labelSliderWater'),
    btnApplyManual: document.getElementById('btnApplyManual'),

    // Chart & Export
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnResetChart: document.getElementById('btnResetChart'),
    toggleAirTemp: document.getElementById('toggleAirTemp'),
    toggleHumidity: document.getElementById('toggleHumidity'),
    toggleWaterTemp: document.getElementById('toggleWaterTemp'),
  };

  // --- Clock Updater ---
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    if (els.liveClock) els.liveClock.textContent = `${h}:${m}:${s} WIB`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- Pure Trigonometric Dial Gauge Engine ---
  /**
   * Updates an SVG dial gauge with 100% mathematical symmetry
   * @param {number} value
   * @param {object} cfg
   * @param {SVGPathElement} arc
   * @param {SVGLineElement} needle
   * @param {SVGCircleElement} bead
   * @param {HTMLElement} valDisplay
   * @param {HTMLElement} badge
   */
  function updateGauge(value, cfg, arc, needle, bead, valDisplay, badge) {
    const clamped = Math.min(Math.max(value, cfg.min), cfg.max);
    const fraction = (clamped - cfg.min) / (cfg.max - cfg.min);

    // Progress Arc Offset
    if (arc) {
      const offset = ARC_TOTAL * (1 - fraction);
      arc.style.strokeDashoffset = offset;
    }

    // Mathematical Angle: from PI (180deg / left) to 0 (0deg / right)
    const angleRad = Math.PI * (1 - fraction);

    // Needle Tip Coordinates (Pivot is locked at CENTER_X, CENTER_Y)
    const needleX2 = CENTER_X + NEEDLE_LEN * Math.cos(angleRad);
    const needleY2 = CENTER_Y - NEEDLE_LEN * Math.sin(angleRad);

    if (needle) {
      needle.setAttribute('x1', CENTER_X);
      needle.setAttribute('y1', CENTER_Y);
      needle.setAttribute('x2', needleX2.toFixed(2));
      needle.setAttribute('y2', needleY2.toFixed(2));
    }

    // Glowing Bead Coordinates on the Arc Edge
    const beadX = CENTER_X + ARC_RADIUS * Math.cos(angleRad);
    const beadY = CENTER_Y - ARC_RADIUS * Math.sin(angleRad);

    if (bead) {
      bead.setAttribute('cx', beadX.toFixed(2));
      bead.setAttribute('cy', beadY.toFixed(2));
    }

    // Value Number Display
    if (valDisplay) {
      valDisplay.textContent = value.toFixed(1);
    }

    // Status Badge Logic
    if (badge) {
      badge.className = 'status-pill';
      if (value >= cfg.idealMin && value <= cfg.idealMax) {
        badge.classList.add('pill-optimal');
        badge.textContent = 'Optimal';
      } else if (
        (value >= cfg.idealMin - 2 && value < cfg.idealMin) ||
        (value > cfg.idealMax && value <= cfg.idealMax + 3)
      ) {
        badge.classList.add('pill-warning');
        badge.textContent = 'Waspada';
      } else {
        badge.classList.add('pill-danger');
        badge.textContent = 'Perhatian';
      }
    }
  }

  function renderAllGauges() {
    updateGauge(state.airTemp, RANGES.airTemp, els.arcAirTemp, els.needleAirTemp, els.beadAirTemp, els.valAirTemp, els.badgeAirTemp);
    updateGauge(state.humidity, RANGES.humidity, els.arcHumidity, els.needleHumidity, els.beadHumidity, els.valHumidity, els.badgeHumidity);
    updateGauge(state.waterTemp, RANGES.waterTemp, els.arcWaterTemp, els.needleWaterTemp, els.beadWaterTemp, els.valWaterTemp, els.badgeWaterTemp);

    updateEcoBanner();
    updateMiniSummaries();
  }

  // --- Eco Banner Logic ---
  function updateEcoBanner() {
    let optimalCount = 0;
    let alerts = [];

    if (state.airTemp >= RANGES.airTemp.idealMin && state.airTemp <= RANGES.airTemp.idealMax) {
      optimalCount++;
    } else {
      alerts.push(state.airTemp > RANGES.airTemp.idealMax ? 'Suhu udara panas' : 'Suhu udara dingin');
    }

    if (state.humidity >= RANGES.humidity.idealMin && state.humidity <= RANGES.humidity.idealMax) {
      optimalCount++;
    } else {
      alerts.push(state.humidity > RANGES.humidity.idealMax ? 'Kelembapan tinggi' : 'Kelembapan rendah');
    }

    if (state.waterTemp >= RANGES.waterTemp.idealMin && state.waterTemp <= RANGES.waterTemp.idealMax) {
      optimalCount++;
    } else {
      alerts.push(state.waterTemp > RANGES.waterTemp.idealMax ? 'Air nutrisi hangat' : 'Air nutrisi dingin');
    }

    if (optimalCount === 3) {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      els.ecoIcon.style.color = '#38bdf8';
      els.ecoTitle.textContent = 'Kondisi Hidroponik Optimal';
      els.ecoDesc.textContent = 'Semua parameter (suhu & kelembapan) berada pada rentang ideal pertumbuhan tanaman.';
    } else if (optimalCount >= 2) {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      els.ecoIcon.style.color = '#fbbf24';
      els.ecoTitle.textContent = 'Kondisi Cukup Baik';
      els.ecoDesc.textContent = `Catatan: ${alerts.join(', ')}.`;
    } else {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
      els.ecoIcon.style.color = '#f87171';
      els.ecoTitle.textContent = 'Perlu Tindakan';
      els.ecoDesc.textContent = `Perhatian penting: ${alerts.join(', ')}. Segera periksa kebun!`;
    }
  }

  // --- Mini Summaries ---
  function updateMiniSummaries() {
    if (state.history.length === 0) return;
    const count = state.history.length;
    const avgAir = (state.history.reduce((acc, c) => acc + c.airTemp, 0) / count).toFixed(1);
    const avgHum = (state.history.reduce((acc, c) => acc + c.humidity, 0) / count).toFixed(1);
    const avgWater = (state.history.reduce((acc, c) => acc + c.waterTemp, 0) / count).toFixed(1);

    if (els.avgAirTemp) els.avgAirTemp.textContent = `${avgAir} °C`;
    if (els.avgHumidity) els.avgHumidity.textContent = `${avgHum} %`;
    if (els.avgWaterTemp) els.avgWaterTemp.textContent = `${avgWater} °C`;
  }

  // --- Mobile Filter Tabs (Semua / Suhu / Kelembapan / Air) ---
  els.tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      els.tabItems.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');
      state.currentFilter = filter;

      els.dialCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // --- Chart.js Mobile Telemetry ---
  let chart = null;

  function initChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Suhu Udara (°C)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            yAxisID: 'yTemp',
          },
          {
            label: 'Kelembapan (%)',
            data: [],
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.08)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            yAxisID: 'yHum',
          },
          {
            label: 'Suhu Air (°C)',
            data: [],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            yAxisID: 'yTemp',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 28, 40, 0.95)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 8,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#64748b',
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              maxTicksLimit: 6,
            },
          },
          yTemp: {
            position: 'left',
            min: 15,
            max: 42,
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#38bdf8',
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              stepSize: 5,
            },
          },
          yHum: {
            position: 'right',
            min: 35,
            max: 100,
            grid: { display: false },
            ticks: {
              color: '#818cf8',
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              stepSize: 15,
            },
          },
        },
      },
    });
  }

  function pushDataPoint(air, hum, water) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    state.history.push({
      time: t,
      iso: now.toISOString(),
      airTemp: air,
      humidity: hum,
      waterTemp: water,
    });

    if (state.history.length > state.maxPoints) {
      state.history.shift();
    }

    if (chart) {
      chart.data.labels.push(t);
      chart.data.datasets[0].data.push(air);
      chart.data.datasets[1].data.push(hum);
      chart.data.datasets[2].data.push(water);

      if (chart.data.labels.length > state.maxPoints) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(d => d.data.shift());
      }
      chart.update('none');
    }

    renderAllGauges();
  }

  function seedInitialData() {
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const past = new Date(now - i * 3000);
      const t = `${String(past.getHours()).padStart(2, '0')}:${String(past.getMinutes()).padStart(2, '0')}:${String(past.getSeconds()).padStart(2, '0')}`;
      const a = +(25.8 + Math.sin(i / 2) * 0.7).toFixed(1);
      const h = +(70.2 + Math.cos(i / 2) * 1.8).toFixed(1);
      const w = +(23.3 + Math.sin(i / 3) * 0.4).toFixed(1);

      state.history.push({ time: t, iso: past.toISOString(), airTemp: a, humidity: h, waterTemp: w });
      if (chart) {
        chart.data.labels.push(t);
        chart.data.datasets[0].data.push(a);
        chart.data.datasets[1].data.push(h);
        chart.data.datasets[2].data.push(w);
      }
    }
    const last = state.history[state.history.length - 1];
    state.airTemp = last.airTemp;
    state.humidity = last.humidity;
    state.waterTemp = last.waterTemp;
    if (chart) chart.update();
    renderAllGauges();
  }

  // --- Real-time Simulation Engine ---
  let simTimer = null;

  function runSimStep() {
    if (!state.isSimulating) return;
    const da = (Math.random() - 0.48) * 0.35;
    const dh = (Math.random() - 0.49) * 0.7;
    const dw = (Math.random() - 0.49) * 0.2;

    state.airTemp = Math.min(Math.max(+(state.airTemp + da).toFixed(1), 18), 36);
    state.humidity = Math.min(Math.max(+(state.humidity + dh).toFixed(1), 45), 90);
    state.waterTemp = Math.min(Math.max(+(state.waterTemp + dw).toFixed(1), 16), 30);

    pushDataPoint(state.airTemp, state.humidity, state.waterTemp);
  }

  function startSimulation() {
    if (simTimer) clearInterval(simTimer);
    simTimer = setInterval(runSimStep, 2500);
    state.isSimulating = true;
    updateSimButtonUI();
  }

  function stopSimulation() {
    if (simTimer) clearInterval(simTimer);
    state.isSimulating = false;
    updateSimButtonUI();
  }

  function updateSimButtonUI() {
    if (state.isSimulating) {
      if (els.simIcon) els.simIcon.className = 'fa-solid fa-pause';
      if (els.simBtnText) els.simBtnText.textContent = 'Jeda Simulasi';
      if (els.liveBadgeText) els.liveBadgeText.textContent = 'LIVE';
      if (els.liveBadge) els.liveBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    } else {
      if (els.simIcon) els.simIcon.className = 'fa-solid fa-play';
      if (els.simBtnText) els.simBtnText.textContent = 'Lanjut Simulasi';
      if (els.liveBadgeText) els.liveBadgeText.textContent = 'JEDA';
      if (els.liveBadge) els.liveBadge.style.borderColor = '#64748b';
    }
  }

  if (els.btnSimToggle) {
    els.btnSimToggle.addEventListener('click', () => {
      if (state.isSimulating) stopSimulation();
      else startSimulation();
    });
  }

  // --- Bottom Sheet Controls ---
  const openSheet = () => {
    if (els.settingsSheet) els.settingsSheet.classList.add('active');
  };
  const closeSheet = () => {
    if (els.settingsSheet) els.settingsSheet.classList.remove('active');
  };

  if (els.btnOpenModal) els.btnOpenModal.addEventListener('click', openSheet);
  if (els.btnSettings) els.btnSettings.addEventListener('click', openSheet);
  if (els.btnCloseSheet) els.btnCloseSheet.addEventListener('click', closeSheet);

  if (els.settingsSheet) {
    els.settingsSheet.addEventListener('click', (e) => {
      if (e.target === els.settingsSheet) closeSheet();
    });
  }

  // Sliders
  if (els.sliderAir && els.labelSliderAir) {
    els.sliderAir.addEventListener('input', (e) => {
      els.labelSliderAir.textContent = `${parseFloat(e.target.value).toFixed(1)} °C`;
    });
  }
  if (els.sliderHum && els.labelSliderHum) {
    els.sliderHum.addEventListener('input', (e) => {
      els.labelSliderHum.textContent = `${e.target.value} %`;
    });
  }
  if (els.sliderWater && els.labelSliderWater) {
    els.sliderWater.addEventListener('input', (e) => {
      els.labelSliderWater.textContent = `${parseFloat(e.target.value).toFixed(1)} °C`;
    });
  }

  if (els.optAutoSim && els.optManual) {
    els.optAutoSim.addEventListener('click', () => {
      els.optAutoSim.classList.add('active');
      els.optManual.classList.remove('active');
      startSimulation();
    });
    els.optManual.addEventListener('click', () => {
      els.optManual.classList.add('active');
      els.optAutoSim.classList.remove('active');
      stopSimulation();
    });
  }

  if (els.btnApplyManual) {
    els.btnApplyManual.addEventListener('click', () => {
      stopSimulation();
      if (els.optManual) {
        els.optManual.classList.add('active');
        els.optAutoSim.classList.remove('active');
      }
      const a = parseFloat(els.sliderAir.value);
      const h = parseFloat(els.sliderHum.value);
      const w = parseFloat(els.sliderWater.value);

      state.airTemp = a;
      state.humidity = h;
      state.waterTemp = w;
      pushDataPoint(a, h, w);
      closeSheet();
    });
  }

  // --- Chart Legend Toggles ---
  [
    { btn: els.toggleAirTemp, idx: 0 },
    { btn: els.toggleHumidity, idx: 1 },
    { btn: els.toggleWaterTemp, idx: 2 },
  ].forEach(({ btn, idx }) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!chart) return;
      const vis = chart.isDatasetVisible(idx);
      chart.setDatasetVisibility(idx, !vis);
      chart.update();
      btn.classList.toggle('active', !vis);
    });
  });

  // --- Reset & CSV ---
  if (els.btnResetChart) {
    els.btnResetChart.addEventListener('click', () => {
      state.history = [];
      if (chart) {
        chart.data.labels = [];
        chart.data.datasets.forEach(d => (d.data = []));
        chart.update();
      }
      pushDataPoint(state.airTemp, state.humidity, state.waterTemp);
    });
  }

  if (els.btnExportCSV) {
    els.btnExportCSV.addEventListener('click', () => {
      if (state.history.length === 0) return;
      let csv = 'Waktu,Waktu_ISO,Suhu_Udara_C,Kelembapan_Persen,Suhu_Air_C\n';
      state.history.forEach(r => {
        csv += `${r.time},"${r.iso}",${r.airTemp},${r.humidity},${r.waterTemp}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetri_hidroponik_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Global Hook for ESP32
  window.updateHydroponicData = (a, h, w) => {
    stopSimulation();
    state.airTemp = parseFloat(a);
    state.humidity = parseFloat(h);
    state.waterTemp = parseFloat(w);
    pushDataPoint(state.airTemp, state.humidity, state.waterTemp);
  };

  // Bootstrap
  initChart();
  seedInitialData();
  startSimulation();
});
