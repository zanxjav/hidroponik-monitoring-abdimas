/**
 * Smart Hydroponic Monitoring System - Mobile Dashboard Engine
 * Dioptimalkan untuk Smartphone & Interaksi Sentuh
 */

document.addEventListener('DOMContentLoaded', () => {
  const ARC_TOTAL = 235.62; // PI * 75

  // Ambang batas parameter hidroponik
  const RANGES = {
    airTemp: { min: 0, max: 50, idealMin: 22, idealMax: 28 },
    humidity: { min: 0, max: 100, idealMin: 60, idealMax: 80 },
    waterTemp: { min: 0, max: 45, idealMin: 18, idealMax: 25 },
  };

  // State
  const state = {
    airTemp: 26.4,
    humidity: 68.2,
    waterTemp: 23.8,
    isSimulating: true,
    history: [],
    maxPoints: 20,
    currentTab: 'all',
  };

  // DOM Elements
  const els = {
    // Live header
    liveClock: document.getElementById('liveClock'),
    livePill: document.getElementById('livePill'),
    liveText: document.getElementById('liveText'),

    // Eco Banner
    ecoBanner: document.getElementById('ecoBanner'),
    ecoIcon: document.getElementById('ecoIcon'),
    ecoTitle: document.getElementById('ecoTitle'),
    ecoDesc: document.getElementById('ecoDesc'),

    // Dials - Air Temp
    fillAirTemp: document.getElementById('fillAirTemp'),
    needleAirTemp: document.getElementById('needleAirTemp'),
    valAirTemp: document.getElementById('valAirTemp'),
    badgeAirTemp: document.getElementById('badgeAirTemp'),
    hintAirTemp: document.getElementById('hintAirTemp'),

    // Dials - Humidity
    fillHumidity: document.getElementById('fillHumidity'),
    needleHumidity: document.getElementById('needleHumidity'),
    valHumidity: document.getElementById('valHumidity'),
    badgeHumidity: document.getElementById('badgeHumidity'),
    hintHumidity: document.getElementById('hintHumidity'),

    // Dials - Water Temp
    fillWaterTemp: document.getElementById('fillWaterTemp'),
    needleWaterTemp: document.getElementById('needleWaterTemp'),
    valWaterTemp: document.getElementById('valWaterTemp'),
    badgeWaterTemp: document.getElementById('badgeWaterTemp'),
    hintWaterTemp: document.getElementById('hintWaterTemp'),

    // Mini Stats
    avgAirTemp: document.getElementById('avgAirTemp'),
    avgHumidity: document.getElementById('avgHumidity'),
    avgWaterTemp: document.getElementById('avgWaterTemp'),

    // Mobile Bottom Actions
    btnSimToggle: document.getElementById('btnSimToggle'),
    simIcon: document.getElementById('simIcon'),
    simBtnText: document.getElementById('simBtnText'),
    btnOpenManual: document.getElementById('btnOpenManual'),
    btnSettings: document.getElementById('btnSettings'),

    // Modal Sheet
    settingsModal: document.getElementById('settingsModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    optAutoSim: document.getElementById('optAutoSim'),
    optManual: document.getElementById('optManual'),
    sliderAir: document.getElementById('sliderAir'),
    sliderAirVal: document.getElementById('sliderAirVal'),
    sliderHum: document.getElementById('sliderHum'),
    sliderHumVal: document.getElementById('sliderHumVal'),
    sliderWater: document.getElementById('sliderWater'),
    sliderWaterVal: document.getElementById('sliderWaterVal'),
    btnApplyManual: document.getElementById('btnApplyManual'),

    // Chart & Tools
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnResetChart: document.getElementById('btnResetChart'),
    toggleAirTemp: document.getElementById('toggleAirTemp'),
    toggleHumidity: document.getElementById('toggleHumidity'),
    toggleWaterTemp: document.getElementById('toggleWaterTemp'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    cards: document.querySelectorAll('.mobile-dial-card'),
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

  // --- Gauge Engine ---
  function updateDial(val, cfg, fillArc, needle, valEl, badgeEl, hintEl) {
    const clamped = Math.min(Math.max(val, cfg.min), cfg.max);
    const fraction = (clamped - cfg.min) / (cfg.max - cfg.min);

    // Update Arc
    if (fillArc) {
      fillArc.style.strokeDashoffset = ARC_TOTAL * (1 - fraction);
    }

    // Update Needle (-90deg to +90deg around 100, 105)
    if (needle) {
      const angle = -90 + (fraction * 180);
      needle.setAttribute('transform', `rotate(${angle}, 100, 105)`);
    }

    // Update Value Text
    if (valEl) valEl.textContent = val.toFixed(1);

    // Status Badge & Hint
    if (badgeEl && hintEl) {
      badgeEl.className = 'status-chip';
      if (val >= cfg.idealMin && val <= cfg.idealMax) {
        badgeEl.classList.add('chip-optimal');
        badgeEl.textContent = 'Optimal';
        hintEl.textContent = 'Normal';
        hintEl.style.color = '#38bdf8';
      } else if (
        (val >= cfg.idealMin - 2 && val < cfg.idealMin) ||
        (val > cfg.idealMax && val <= cfg.idealMax + 3)
      ) {
        badgeEl.classList.add('chip-warning');
        badgeEl.textContent = 'Waspada';
        hintEl.textContent = val < cfg.idealMin ? 'Agak Rendah' : 'Agak Tinggi';
        hintEl.style.color = '#fbbf24';
      } else {
        badgeEl.classList.add('chip-danger');
        badgeEl.textContent = 'Perhatian';
        hintEl.textContent = val < cfg.idealMin ? 'Terlalu Rendah' : 'Terlalu Tinggi';
        hintEl.style.color = '#f87171';
      }
    }
  }

  function renderAllDials() {
    updateDial(state.airTemp, RANGES.airTemp, els.fillAirTemp, els.needleAirTemp, els.valAirTemp, els.badgeAirTemp, els.hintAirTemp);
    updateDial(state.humidity, RANGES.humidity, els.fillHumidity, els.needleHumidity, els.valHumidity, els.badgeHumidity, els.hintHumidity);
    updateDial(state.waterTemp, RANGES.waterTemp, els.fillWaterTemp, els.needleWaterTemp, els.valWaterTemp, els.badgeWaterTemp, els.hintWaterTemp);

    updateEcoBanner();
    updateMiniStats();
  }

  // --- Eco Banner Logic (Ramah Pengguna) ---
  function updateEcoBanner() {
    let optimalCount = 0;
    let issues = [];

    if (state.airTemp >= RANGES.airTemp.idealMin && state.airTemp <= RANGES.airTemp.idealMax) {
      optimalCount++;
    } else {
      issues.push(state.airTemp > RANGES.airTemp.idealMax ? 'Suhu udara panas' : 'Suhu udara dingin');
    }

    if (state.humidity >= RANGES.humidity.idealMin && state.humidity <= RANGES.humidity.idealMax) {
      optimalCount++;
    } else {
      issues.push(state.humidity > RANGES.humidity.idealMax ? 'Udara lembap' : 'Udara kering');
    }

    if (state.waterTemp >= RANGES.waterTemp.idealMin && state.waterTemp <= RANGES.waterTemp.idealMax) {
      optimalCount++;
    } else {
      issues.push(state.waterTemp > RANGES.waterTemp.idealMax ? 'Air hangat' : 'Air dingin');
    }

    if (optimalCount === 3) {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      els.ecoIcon.style.color = '#38bdf8';
      els.ecoTitle.textContent = 'Kondisi Hidroponik Prima';
      els.ecoDesc.textContent = 'Semua parameter dalam rentang ideal untuk pertumbuhan tanaman.';
    } else if (optimalCount >= 2) {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      els.ecoIcon.style.color = '#fbbf24';
      els.ecoTitle.textContent = 'Kondisi Cukup Baik';
      els.ecoDesc.textContent = `Perhatian kecil: ${issues.join(', ')}.`;
    } else {
      els.ecoIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
      els.ecoIcon.style.color = '#f87171';
      els.ecoTitle.textContent = 'Perlu Tindakan';
      els.ecoDesc.textContent = `Penyesuaian diperlukan untuk: ${issues.join(', ')}.`;
    }
  }

  // --- Mini Stats ---
  function updateMiniStats() {
    if (state.history.length === 0) return;
    const len = state.history.length;
    const avgAir = (state.history.reduce((a, b) => a + b.airTemp, 0) / len).toFixed(1);
    const avgHum = (state.history.reduce((a, b) => a + b.humidity, 0) / len).toFixed(1);
    const avgWater = (state.history.reduce((a, b) => a + b.waterTemp, 0) / len).toFixed(1);

    if (els.avgAirTemp) els.avgAirTemp.textContent = `${avgAir} °C`;
    if (els.avgHumidity) els.avgHumidity.textContent = `${avgHum} %`;
    if (els.avgWaterTemp) els.avgWaterTemp.textContent = `${avgWater} °C`;
  }

  // --- Tab Filters (Mobile Focus Single Parameter) ---
  els.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      els.tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-tab');
      state.currentTab = target;

      els.cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (target === 'all' || cat === target) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // --- Chart.js Mobile Setup ---
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
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(21, 29, 42, 0.95)',
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

  function pushData(air, hum, water) {
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

    renderAllDials();
  }

  function seedData() {
    const now = Date.now();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now - i * 3000);
      const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      const a = +(25.8 + Math.sin(i / 2) * 0.8).toFixed(1);
      const h = +(67.5 + Math.cos(i / 2) * 2.0).toFixed(1);
      const w = +(23.4 + Math.sin(i / 3) * 0.5).toFixed(1);

      state.history.push({ time: t, iso: d.toISOString(), airTemp: a, humidity: h, waterTemp: w });
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
    renderAllDials();
  }

  // --- Real-time Simulation Engine ---
  let timer = null;

  function stepSim() {
    if (!state.isSimulating) return;
    const da = (Math.random() - 0.48) * 0.35;
    const dh = (Math.random() - 0.49) * 0.7;
    const dw = (Math.random() - 0.49) * 0.2;

    state.airTemp = Math.min(Math.max(+(state.airTemp + da).toFixed(1), 18), 36);
    state.humidity = Math.min(Math.max(+(state.humidity + dh).toFixed(1), 45), 90);
    state.waterTemp = Math.min(Math.max(+(state.waterTemp + dw).toFixed(1), 16), 30);

    pushData(state.airTemp, state.humidity, state.waterTemp);
  }

  function startSim() {
    if (timer) clearInterval(timer);
    timer = setInterval(stepSim, 2500);
    state.isSimulating = true;
    updateSimUI();
  }

  function stopSim() {
    if (timer) clearInterval(timer);
    state.isSimulating = false;
    updateSimUI();
  }

  function updateSimUI() {
    if (state.isSimulating) {
      if (els.simIcon) els.simIcon.className = 'fa-solid fa-pause';
      if (els.simBtnText) els.simBtnText.textContent = 'Jeda Simulasi';
      if (els.liveText) els.liveText.textContent = 'LIVE';
      if (els.livePill) els.livePill.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    } else {
      if (els.simIcon) els.simIcon.className = 'fa-solid fa-play';
      if (els.simBtnText) els.simBtnText.textContent = 'Lanjut Simulasi';
      if (els.liveText) els.liveText.textContent = 'JEDA';
      if (els.livePill) els.livePill.style.borderColor = '#64748b';
    }
  }

  if (els.btnSimToggle) {
    els.btnSimToggle.addEventListener('click', () => {
      if (state.isSimulating) stopSim();
      else startSim();
    });
  }

  // --- Bottom Sheet & Mobile Sliders ---
  const openSheet = () => {
    if (els.settingsModal) els.settingsModal.classList.add('active');
  };
  const closeSheet = () => {
    if (els.settingsModal) els.settingsModal.classList.remove('active');
  };

  if (els.btnOpenManual) els.btnOpenManual.addEventListener('click', openSheet);
  if (els.btnSettings) els.btnSettings.addEventListener('click', openSheet);
  if (els.btnCloseModal) els.btnCloseModal.addEventListener('click', closeSheet);

  if (els.settingsModal) {
    els.settingsModal.addEventListener('click', (e) => {
      if (e.target === els.settingsModal) closeSheet();
    });
  }

  // Sliders input handling
  if (els.sliderAir && els.sliderAirVal) {
    els.sliderAir.addEventListener('input', (e) => {
      els.sliderAirVal.textContent = `${parseFloat(e.target.value).toFixed(1)} °C`;
    });
  }
  if (els.sliderHum && els.sliderHumVal) {
    els.sliderHum.addEventListener('input', (e) => {
      els.sliderHumVal.textContent = `${e.target.value} %`;
    });
  }
  if (els.sliderWater && els.sliderWaterVal) {
    els.sliderWater.addEventListener('input', (e) => {
      els.sliderWaterVal.textContent = `${parseFloat(e.target.value).toFixed(1)} °C`;
    });
  }

  if (els.optAutoSim && els.optManual) {
    els.optAutoSim.addEventListener('click', () => {
      els.optAutoSim.classList.add('active');
      els.optManual.classList.remove('active');
      startSim();
    });
    els.optManual.addEventListener('click', () => {
      els.optManual.classList.add('active');
      els.optAutoSim.classList.remove('active');
      stopSim();
    });
  }

  if (els.btnApplyManual) {
    els.btnApplyManual.addEventListener('click', () => {
      stopSim();
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
      pushData(a, h, w);
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
      pushData(state.airTemp, state.humidity, state.waterTemp);
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

  // Global Hook
  window.updateHydroponicData = (a, h, w) => {
    stopSim();
    state.airTemp = parseFloat(a);
    state.humidity = parseFloat(h);
    state.waterTemp = parseFloat(w);
    pushData(state.airTemp, state.humidity, state.waterTemp);
  };

  // Bootstrap
  initChart();
  seedData();
  startSim();
});
