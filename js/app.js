/**
 * Smart Hydroponic Monitoring System - Dashboard Abdimas
 * Core Logic: SVG Dial Gauges, Chart.js Telemetry, Real-time Simulation & IoT Hooks
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & Config ---
  const ARC_TOTAL_LENGTH = 235.62; // PI * 75 (radius of SVG arc)

  // Sensor ranges for hydroponic vegetables (e.g., lettuce/pakcoy)
  const PARAM_RANGES = {
    airTemp: { min: 0, max: 50, idealMin: 22, idealMax: 28 },
    humidity: { min: 0, max: 100, idealMin: 60, idealMax: 80 },
    waterTemp: { min: 0, max: 45, idealMin: 18, idealMax: 25 },
  };

  // State Management
  const state = {
    airTemp: 26.4,
    humidity: 68.2,
    waterTemp: 23.8,
    isSimulating: true,
    history: [],
    maxHistoryPoints: 25,
  };

  // DOM Elements - Gauges
  const elements = {
    // Air Temp
    fillAirTemp: document.getElementById('fillAirTemp'),
    needleAirTemp: document.getElementById('needleAirTemp'),
    valAirTemp: document.getElementById('valAirTemp'),
    badgeAirTemp: document.getElementById('badgeAirTemp'),

    // Humidity
    fillHumidity: document.getElementById('fillHumidity'),
    needleHumidity: document.getElementById('needleHumidity'),
    valHumidity: document.getElementById('valHumidity'),
    badgeHumidity: document.getElementById('badgeHumidity'),

    // Water Temp
    fillWaterTemp: document.getElementById('fillWaterTemp'),
    needleWaterTemp: document.getElementById('needleWaterTemp'),
    valWaterTemp: document.getElementById('valWaterTemp'),
    badgeWaterTemp: document.getElementById('badgeWaterTemp'),

    // Summaries
    avgAirTemp: document.getElementById('avgAirTemp'),
    avgHumidity: document.getElementById('avgHumidity'),
    avgWaterTemp: document.getElementById('avgWaterTemp'),
    ecoStatus: document.getElementById('ecoStatus'),

    // Header & Controls
    liveClock: document.getElementById('liveClock'),
    btnSimToggle: document.getElementById('btnSimToggle'),
    simIcon: document.getElementById('simIcon'),
    simBtnText: document.getElementById('simBtnText'),
    connectionStatusText: document.getElementById('connectionStatusText'),

    // Modal
    settingsModal: document.getElementById('settingsModal'),
    btnSettings: document.getElementById('btnSettings'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCloseModalBtn: document.getElementById('btnCloseModalBtn'),
    radioSim: document.getElementById('radioSim'),
    radioManual: document.getElementById('radioManual'),
    manualInputSection: document.getElementById('manualInputSection'),
    btnApplyManual: document.getElementById('btnApplyManual'),
    inputAirTemp: document.getElementById('inputAirTemp'),
    inputHumidity: document.getElementById('inputHumidity'),
    inputWaterTemp: document.getElementById('inputWaterTemp'),

    // Chart actions
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnResetChart: document.getElementById('btnResetChart'),
    toggleAirTemp: document.getElementById('toggleAirTemp'),
    toggleHumidity: document.getElementById('toggleHumidity'),
    toggleWaterTemp: document.getElementById('toggleWaterTemp'),
  };

  // --- Clock Updater ---
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (elements.liveClock) {
      elements.liveClock.textContent = `${hours}:${minutes}:${seconds} WIB`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- Gauge Rendering & Calculations ---
  /**
   * Updates an SVG dial gauge
   * @param {number} value
   * @param {object} config {min, max, idealMin, idealMax}
   * @param {SVGElement} fillArc
   * @param {SVGElement} needleGroup
   * @param {HTMLElement} valDisplay
   * @param {HTMLElement} badge
   */
  function updateGauge(value, config, fillArc, needleGroup, valDisplay, badge) {
    const clampedVal = Math.min(Math.max(value, config.min), config.max);
    const fraction = (clampedVal - config.min) / (config.max - config.min);

    // Semi-circle arc offset: 0% = ARC_TOTAL_LENGTH, 100% = 0
    const offset = ARC_TOTAL_LENGTH * (1 - fraction);
    if (fillArc) {
      fillArc.style.strokeDashoffset = offset;
    }

    // Needle rotation: from -90deg (min) to +90deg (max)
    const angle = -90 + (fraction * 180);
    if (needleGroup) {
      needleGroup.setAttribute('transform', `rotate(${angle}, 100, 110)`);
    }

    // Value text
    if (valDisplay) {
      valDisplay.textContent = value.toFixed(1);
    }

    // Status Badge & Colors
    if (badge) {
      badge.className = 'status-badge';
      if (value >= config.idealMin && value <= config.idealMax) {
        badge.classList.add('badge-optimal');
        badge.textContent = 'Optimal';
      } else if (
        (value >= config.idealMin - 2 && value < config.idealMin) ||
        (value > config.idealMax && value <= config.idealMax + 3)
      ) {
        badge.classList.add('badge-warning');
        badge.textContent = 'Waspada';
      } else {
        badge.classList.add('badge-danger');
        badge.textContent = 'Perhatian';
      }
    }
  }

  // Refresh all three gauges
  function renderAllGauges() {
    updateGauge(
      state.airTemp,
      PARAM_RANGES.airTemp,
      elements.fillAirTemp,
      elements.needleAirTemp,
      elements.valAirTemp,
      elements.badgeAirTemp
    );

    updateGauge(
      state.humidity,
      PARAM_RANGES.humidity,
      elements.fillHumidity,
      elements.needleHumidity,
      elements.valHumidity,
      elements.badgeHumidity
    );

    updateGauge(
      state.waterTemp,
      PARAM_RANGES.waterTemp,
      elements.fillWaterTemp,
      elements.needleWaterTemp,
      elements.valWaterTemp,
      elements.badgeWaterTemp
    );

    updateSummaries();
  }

  // --- Summary Calculations ---
  function updateSummaries() {
    if (state.history.length === 0) return;

    const count = state.history.length;
    const sumAir = state.history.reduce((acc, cur) => acc + cur.airTemp, 0);
    const sumHum = state.history.reduce((acc, cur) => acc + cur.humidity, 0);
    const sumWater = state.history.reduce((acc, cur) => acc + cur.waterTemp, 0);

    const avgAir = (sumAir / count).toFixed(1);
    const avgHum = (sumHum / count).toFixed(1);
    const avgWater = (sumWater / count).toFixed(1);

    if (elements.avgAirTemp) elements.avgAirTemp.textContent = `${avgAir} °C`;
    if (elements.avgHumidity) elements.avgHumidity.textContent = `${avgHum} %`;
    if (elements.avgWaterTemp) elements.avgWaterTemp.textContent = `${avgWater} °C`;

    // Overall Eco Status
    let healthyCount = 0;
    if (state.airTemp >= PARAM_RANGES.airTemp.idealMin && state.airTemp <= PARAM_RANGES.airTemp.idealMax) healthyCount++;
    if (state.humidity >= PARAM_RANGES.humidity.idealMin && state.humidity <= PARAM_RANGES.humidity.idealMax) healthyCount++;
    if (state.waterTemp >= PARAM_RANGES.waterTemp.idealMin && state.waterTemp <= PARAM_RANGES.waterTemp.idealMax) healthyCount++;

    if (elements.ecoStatus) {
      if (healthyCount === 3) {
        elements.ecoStatus.textContent = 'Optimal & Prima';
        elements.ecoStatus.className = 'summary-val status-good';
      } else if (healthyCount >= 2) {
        elements.ecoStatus.textContent = 'Cukup Baik';
        elements.ecoStatus.className = 'summary-val';
        elements.ecoStatus.style.color = '#38bdf8';
      } else {
        elements.ecoStatus.textContent = 'Perlu Tindakan';
        elements.ecoStatus.className = 'summary-val';
        elements.ecoStatus.style.color = '#fbbf24';
      }
    }
  }

  // --- Chart.js Telemetry Initialization ---
  let telemetryChart = null;

  function initChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    // Chart.js Default styling
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    // Create subtle gradient fills
    const chartContext = ctx.getContext('2d');
    const airGrad = chartContext.createLinearGradient(0, 0, 0, 300);
    airGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    airGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    const humGrad = chartContext.createLinearGradient(0, 0, 0, 300);
    humGrad.addColorStop(0, 'rgba(129, 140, 248, 0.25)');
    humGrad.addColorStop(1, 'rgba(129, 140, 248, 0.0)');

    const waterGrad = chartContext.createLinearGradient(0, 0, 0, 300);
    waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    waterGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    telemetryChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Suhu Udara (°C)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: airGrad,
            borderWidth: 2.2,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#0b0f17',
            pointBorderWidth: 1.5,
            yAxisID: 'yTemp',
          },
          {
            label: 'Kelembapan (%)',
            data: [],
            borderColor: '#818cf8',
            backgroundColor: humGrad,
            borderWidth: 2.2,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#818cf8',
            pointBorderColor: '#0b0f17',
            pointBorderWidth: 1.5,
            yAxisID: 'yHumidity',
          },
          {
            label: 'Suhu Air (°C)',
            data: [],
            borderColor: '#06b6d4',
            backgroundColor: waterGrad,
            borderWidth: 2.2,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#0b0f17',
            pointBorderWidth: 1.5,
            yAxisID: 'yTemp',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false, // We use custom toggle chips
          },
          tooltip: {
            backgroundColor: 'rgba(24, 34, 50, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: '#38bdf8',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                return ` ${label}: ${val.toFixed(1)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#64748b',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
              maxRotation: 0,
            },
          },
          yTemp: {
            type: 'linear',
            position: 'left',
            min: 15,
            max: 40,
            title: {
              display: true,
              text: 'Suhu (°C)',
              color: '#38bdf8',
              font: { size: 11, weight: '600' },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#94a3b8',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              stepSize: 5,
            },
          },
          yHumidity: {
            type: 'linear',
            position: 'right',
            min: 40,
            max: 100,
            title: {
              display: true,
              text: 'Kelembapan (%)',
              color: '#818cf8',
              font: { size: 11, weight: '600' },
            },
            grid: {
              drawOnChartArea: false, // Prevent overlapping grid lines
            },
            ticks: {
              color: '#94a3b8',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              stepSize: 10,
            },
          },
        },
      },
    });
  }

  // Push new telemetry entry to state & chart
  function pushTelemetryData(airTemp, humidity, waterTemp) {
    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const record = {
      timestamp: timeLabel,
      isoDate: now.toISOString(),
      airTemp,
      humidity,
      waterTemp,
    };

    state.history.push(record);
    if (state.history.length > state.maxHistoryPoints) {
      state.history.shift();
    }

    if (telemetryChart) {
      telemetryChart.data.labels.push(timeLabel);
      telemetryChart.data.datasets[0].data.push(airTemp);
      telemetryChart.data.datasets[1].data.push(humidity);
      telemetryChart.data.datasets[2].data.push(waterTemp);

      if (telemetryChart.data.labels.length > state.maxHistoryPoints) {
        telemetryChart.data.labels.shift();
        telemetryChart.data.datasets[0].data.shift();
        telemetryChart.data.datasets[1].data.shift();
        telemetryChart.data.datasets[2].data.shift();
      }

      telemetryChart.update('none'); // smooth fast update
    }

    renderAllGauges();
  }

  // Pre-seed chart with initial historical points
  function seedInitialData() {
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const pastTime = new Date(now - i * 3000);
      const timeLabel = `${String(pastTime.getHours()).padStart(2, '0')}:${String(pastTime.getMinutes()).padStart(2, '0')}:${String(pastTime.getSeconds()).padStart(2, '0')}`;
      
      const seedAir = +(25.8 + (Math.sin(i / 2) * 1.2) + (Math.random() * 0.4)).toFixed(1);
      const seedHum = +(67.5 + (Math.cos(i / 2) * 2.5) + (Math.random() * 0.8)).toFixed(1);
      const seedWater = +(23.2 + (Math.sin(i / 3) * 0.8) + (Math.random() * 0.3)).toFixed(1);

      state.history.push({
        timestamp: timeLabel,
        isoDate: pastTime.toISOString(),
        airTemp: seedAir,
        humidity: seedHum,
        waterTemp: seedWater,
      });

      if (telemetryChart) {
        telemetryChart.data.labels.push(timeLabel);
        telemetryChart.data.datasets[0].data.push(seedAir);
        telemetryChart.data.datasets[1].data.push(seedHum);
        telemetryChart.data.datasets[2].data.push(seedWater);
      }
    }

    const latest = state.history[state.history.length - 1];
    state.airTemp = latest.airTemp;
    state.humidity = latest.humidity;
    state.waterTemp = latest.waterTemp;

    if (telemetryChart) telemetryChart.update();
    renderAllGauges();
  }

  // --- Real-time Simulation Engine ---
  let simInterval = null;

  function runSimulationStep() {
    if (!state.isSimulating) return;

    // Realistic gradual walk around healthy hydroponic points
    const deltaAir = (Math.random() - 0.48) * 0.35;
    const deltaHum = (Math.random() - 0.49) * 0.7;
    const deltaWater = (Math.random() - 0.49) * 0.2;

    state.airTemp = Math.min(Math.max(+(state.airTemp + deltaAir).toFixed(1), 18), 36);
    state.humidity = Math.min(Math.max(+(state.humidity + deltaHum).toFixed(1), 45), 90);
    state.waterTemp = Math.min(Math.max(+(state.waterTemp + deltaWater).toFixed(1), 16), 30);

    pushTelemetryData(state.airTemp, state.humidity, state.waterTemp);
  }

  function startSimulation() {
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(runSimulationStep, 2500);
    state.isSimulating = true;
    updateSimButtonUI();
  }

  function stopSimulation() {
    if (simInterval) clearInterval(simInterval);
    state.isSimulating = false;
    updateSimButtonUI();
  }

  function updateSimButtonUI() {
    if (state.isSimulating) {
      if (elements.simIcon) elements.simIcon.className = 'fa-solid fa-pause';
      if (elements.simBtnText) elements.simBtnText.textContent = 'Jeda';
      if (elements.connectionStatusText) elements.connectionStatusText.textContent = 'Sistem Aktif (Live)';
    } else {
      if (elements.simIcon) elements.simIcon.className = 'fa-solid fa-play';
      if (elements.simBtnText) elements.simBtnText.textContent = 'Lanjutkan';
      if (elements.connectionStatusText) elements.connectionStatusText.textContent = 'Simulasi Dijeda';
    }
  }

  // --- Filter Chips / Toggle Datasets in Chart ---
  function setupDatasetToggles() {
    const toggles = [
      { btn: elements.toggleAirTemp, index: 0 },
      { btn: elements.toggleHumidity, index: 1 },
      { btn: elements.toggleWaterTemp, index: 2 },
    ];

    toggles.forEach(({ btn, index }) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (!telemetryChart) return;
        const isVisible = telemetryChart.isDatasetVisible(index);
        telemetryChart.setDatasetVisibility(index, !isVisible);
        telemetryChart.update();

        if (isVisible) {
          btn.classList.remove('active');
          btn.style.opacity = '0.5';
        } else {
          btn.classList.add('active');
          btn.style.opacity = '1';
        }
      });
    });
  }

  // --- Reset Chart Action ---
  if (elements.btnResetChart) {
    elements.btnResetChart.addEventListener('click', () => {
      state.history = [];
      if (telemetryChart) {
        telemetryChart.data.labels = [];
        telemetryChart.data.datasets.forEach(ds => (ds.data = []));
        telemetryChart.update();
      }
      pushTelemetryData(state.airTemp, state.humidity, state.waterTemp);
    });
  }

  // --- Export CSV Action ---
  if (elements.btnExportCSV) {
    elements.btnExportCSV.addEventListener('click', () => {
      if (state.history.length === 0) {
        alert('Belum ada data untuk diunduh.');
        return;
      }

      let csv = 'Timestamp,Waktu_ISO,Suhu_Udara_C,Kelembapan_Persen,Suhu_Air_C\n';
      state.history.forEach(item => {
        csv += `${item.timestamp},"${item.isoDate}",${item.airTemp},${item.humidity},${item.waterTemp}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `log_hidroponik_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // --- Modal & Manual Data Input Handlers ---
  function setupModalHandlers() {
    if (elements.btnSettings && elements.settingsModal) {
      elements.btnSettings.addEventListener('click', () => {
        elements.settingsModal.classList.add('active');
      });
    }

    const closeModal = () => {
      if (elements.settingsModal) elements.settingsModal.classList.remove('active');
    };

    if (elements.btnCloseModal) elements.btnCloseModal.addEventListener('click', closeModal);
    if (elements.btnCloseModalBtn) elements.btnCloseModalBtn.addEventListener('click', closeModal);

    if (elements.settingsModal) {
      elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeModal();
      });
    }

    // Radio data source switch
    if (elements.radioSim && elements.radioManual) {
      elements.radioSim.addEventListener('change', () => {
        if (elements.radioSim.checked) {
          startSimulation();
        }
      });

      elements.radioManual.addEventListener('change', () => {
        if (elements.radioManual.checked) {
          stopSimulation();
        }
      });
    }

    // Apply manual data button
    if (elements.btnApplyManual) {
      elements.btnApplyManual.addEventListener('click', () => {
        const air = parseFloat(elements.inputAirTemp.value);
        const hum = parseFloat(elements.inputHumidity.value);
        const water = parseFloat(elements.inputWaterTemp.value);

        if (!isNaN(air) && !isNaN(hum) && !isNaN(water)) {
          stopSimulation();
          if (elements.radioManual) elements.radioManual.checked = true;
          state.airTemp = air;
          state.humidity = hum;
          state.waterTemp = water;
          pushTelemetryData(air, hum, water);
          closeModal();
        } else {
          alert('Mohon masukkan angka nilai sensor yang valid.');
        }
      });
    }
  }

  // --- Toggle Simulation Button in Header ---
  if (elements.btnSimToggle) {
    elements.btnSimToggle.addEventListener('click', () => {
      if (state.isSimulating) {
        stopSimulation();
      } else {
        startSimulation();
      }
    });
  }

  // Global API Hook: Allows external script or ESP32 post message to update data
  window.updateHydroponicData = (suhuUdara, kelembapan, suhuAir) => {
    stopSimulation();
    state.airTemp = parseFloat(suhuUdara);
    state.humidity = parseFloat(kelembapan);
    state.waterTemp = parseFloat(suhuAir);
    pushTelemetryData(state.airTemp, state.humidity, state.waterTemp);
  };

  // --- Execution Bootstrap ---
  initChart();
  seedInitialData();
  setupDatasetToggles();
  setupModalHandlers();
  startSimulation();
});
