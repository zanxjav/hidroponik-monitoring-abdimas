/*
  ESP32 Hydroponic Telemetry Firmware - Abdimas Project
  Membaca Sensor Suhu & Kelembapan Udara (DHT22) dan Suhu Air Nutrisi (DS18B20)
  Serta mengirimkan data telemetri serial & HTTP/JSON.
*/

#include <WiFi.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>

// Konfigurasi Pin Sensor & Aktuator
#define DHTPIN 4           // Pin Data DHT22 (Suhu & Kelembapan Udara)
#define DHTTYPE DHT22
#define ONE_WIRE_BUS 5     // Pin Data DS18B20 (Suhu Air Nutrisi)
#define RELAY_POMPA_PIN 18 // Pin Relay Pompa Sirkulasi Air Nutrisi

// Ambang Batas Suhu Air untuk Sirkulasi Otomatis (°C)
const float AMBANG_SUHU_POMPA = 25.0; // Jika suhu air > 25°C, pompa memutar air agar panas merata & dingin
bool statusPompa = false;

// Konfigurasi WiFi (Opsional jika kirim ke server lokal / cloud)
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI";
const char* serverEndpoint = "http://192.168.1.100:5000/api/telemetry"; // Sesuaikan endpoint

// Inisialisasi Objek Sensor
DHT dht(DHTPIN, DHTTYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature waterSensor(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("==================================================");
  Serial.println(" Sistem Monitoring Hidroponik - Proyek Abdimas");
  Serial.println(" Inisialisasi Sensor & Relay Pompa...");
  Serial.println("==================================================");

  // Inisialisasi DHT22 & DS18B20
  dht.begin();
  waterSensor.begin();

  // Inisialisasi Relay Pompa Sirkulasi
  pinMode(RELAY_POMPA_PIN, OUTPUT);
  digitalWrite(RELAY_POMPA_PIN, LOW); // Pompa mati (standby) saat awal booting

  // Koneksi WiFi (Opsional)
  /*
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung! IP: " + WiFi.localIP().toString());
  */

  Serial.println("Sensor & Relay Pompa siap beroperasi!");
}

void loop() {
  // 1. Baca DHT22
  float humidity = dht.readHumidity();
  float airTemp = dht.readTemperature();

  // 2. Baca DS18B20
  waterSensor.requestTemperatures();
  float waterTemp = waterSensor.getTempCByIndex(0);

  // Validasi pembacaan DHT
  if (isnan(humidity) || isnan(airTemp)) {
    Serial.println("Peringatan: Gagal membaca sensor DHT22!");
    airTemp = 26.0;
    humidity = 68.0;
  }

  // Validasi pembacaan DS18B20
  if (waterTemp == DEVICE_DISCONNECTED_C) {
    Serial.println("Peringatan: Sensor DS18B20 air nutrisi terputus!");
    waterTemp = 24.0;
  }

  // 3. Logika Otomatisasi Pompa Air Sirkulasi:
  // Ketika suhu air melewati ambang batas (> 25°C), pompa memutar air agar panas merata dan mendingin.
  if (waterTemp > AMBANG_SUHU_POMPA) {
    digitalWrite(RELAY_POMPA_PIN, HIGH); // Aktifkan relay pompa
    statusPompa = true;
  } else if (waterTemp <= (AMBANG_SUHU_POMPA - 0.5)) {
    // Histeresis 0.5°C agar relay tidak bolak-balik hidup-mati cepat
    digitalWrite(RELAY_POMPA_PIN, LOW);  // Matikan relay pompa
    statusPompa = false;
  }

  // 4. Format Output JSON Serial
  String jsonPayload = "{";
  jsonPayload += "\"suhu_udara\":" + String(airTemp, 1) + ",";
  jsonPayload += "\"kelembapan\":" + String(humidity, 1) + ",";
  jsonPayload += "\"suhu_air\":" + String(waterTemp, 1) + ",";
  jsonPayload += "\"pompa\":\"" + String(statusPompa ? "HIDUP" : "STANDBY") + "\",";
  jsonPayload += "\"pompa_status\":" + String(statusPompa ? "true" : "false");
  jsonPayload += "}";

  Serial.println("DATA TELEMETRI: " + jsonPayload);

  // 5. Pengiriman HTTP POST (Jika terhubung WiFi)
  /*
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
  */

  delay(3000); // Interval pembacaan 3 detik
}
