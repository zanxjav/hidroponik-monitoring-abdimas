"""
Flask Web Server & IoT Telemetry API - Hydroponic Monitoring
Menjalankan server web lokal dengan Python Flask, mendukung penerimaan data dari ESP32
serta menyajikan dashboard web telemetri.
"""

from flask import Flask, jsonify, request, send_from_directory, render_template_string
import threading
import time
import random
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')

# In-memory telemetri state
state = {
    "air_temp": 26.4,
    "humidity": 68.2,
    "water_temp": 23.8,
    "pump_status": False,
    "pump_threshold": 25.0,
    "is_simulating": True,
    "history": []
}

# Seed data awal
now = time.time()
for i in range(15, 0, -1):
    past_time = datetime.fromtimestamp(now - i * 3)
    w_t = round(23.2 + random.uniform(-0.3, 0.4), 1)
    state["history"].append({
        "timestamp": past_time.strftime("%H:%M:%S"),
        "air_temp": round(25.8 + random.uniform(-0.5, 0.7), 1),
        "humidity": round(67.5 + random.uniform(-1.5, 2.0), 1),
        "water_temp": w_t,
        "pump_status": w_t > 25.0
    })

# Background thread untuk simulasi realtime
def simulation_worker():
    while True:
        if state["is_simulating"]:
            delta_air = (random.random() - 0.48) * 0.4
            delta_hum = (random.random() - 0.49) * 0.8

            state["air_temp"] = round(max(18.0, min(36.0, state["air_temp"] + delta_air)), 1)
            state["humidity"] = round(max(40.0, min(90.0, state["humidity"] + delta_hum)), 1)

            # Fisika Pendinginan Sirkulasi Pompa Air:
            if state["water_temp"] > state["pump_threshold"]:
                state["pump_status"] = True
            elif state["water_temp"] <= (state["pump_threshold"] - 0.5):
                state["pump_status"] = False

            if state["pump_status"]:
                # Pompa aktif memutar air: suhu air mendingin
                cooling = 0.2 + random.random() * 0.1
                state["water_temp"] = round(max(22.0, state["water_temp"] - cooling), 1)
            else:
                delta_water = (random.random() - 0.35) * 0.25
                state["water_temp"] = round(max(16.0, min(30.0, state["water_temp"] + delta_water)), 1)

            entry = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "air_temp": state["air_temp"],
                "humidity": state["humidity"],
                "water_temp": state["water_temp"],
                "pump_status": state["pump_status"]
            }
            state["history"].append(entry)
            if len(state["history"]) > 30:
                state["history"].pop(0)

        time.sleep(2.5)

# Start background worker
worker = threading.Thread(target=simulation_worker, daemon=True)
worker.start()

# --- Routes ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    """Mengambil data telemetri terkini"""
    return jsonify({
        "status": "success",
        "data": {
            "suhu_udara": state["air_temp"],
            "kelembapan": state["humidity"],
            "suhu_air": state["water_temp"],
            "pompa_status": state["pump_status"],
            "pompa_keterangan": "HIDUP (Memutar Air)" if state["pump_status"] else "STANDBY (Mati)",
            "timestamp": datetime.now().strftime("%H:%M:%S WIB")
        }
    })

@app.route('/api/telemetry', methods=['POST'])
def post_telemetry():
    """Menerima kiriman data dari sensor ESP32 / Arduino"""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"status": "error", "message": "Payload JSON kosong"}), 400

    state["is_simulating"] = False # Pause auto simulation when real hardware sends data
    if "suhu_udara" in data:
        state["air_temp"] = float(data["suhu_udara"])
    if "kelembapan" in data:
        state["humidity"] = float(data["kelembapan"])
    if "suhu_air" in data:
        state["water_temp"] = float(data["suhu_air"])
    if "pompa_status" in data:
        state["pump_status"] = bool(data["pompa_status"])
    elif "pompa" in data:
        state["pump_status"] = data["pompa"].upper() in ["HIDUP", "ON", "TRUE", "1"]
    else:
        state["pump_status"] = state["water_temp"] > state["pump_threshold"]

    entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "air_temp": state["air_temp"],
        "humidity": state["humidity"],
        "water_temp": state["water_temp"],
        "pump_status": state["pump_status"]
    }
    state["history"].append(entry)
    if len(state["history"]) > 30:
        state["history"].pop(0)

    return jsonify({"status": "success", "message": "Data berhasil diperbarui", "pompa_status": state["pump_status"]}), 200

@app.route('/api/history', methods=['GET'])
def get_history():
    """Mengambil riwayat data sensor untuk grafik"""
    return jsonify({
        "status": "success",
        "history": state["history"]
    })

if __name__ == '__main__':
    print("================================================================")
    print("🌱 Hydroponic Monitoring Flask Server Berjalan!")
    print("👉 Akses Dashboard di: http://127.0.0.1:5000")
    print("👉 Endpoint IoT ESP32: POST http://127.0.0.1:5000/api/telemetry")
    print("================================================================")
    app.run(host='0.0.0.0', port=5000, debug=False)
