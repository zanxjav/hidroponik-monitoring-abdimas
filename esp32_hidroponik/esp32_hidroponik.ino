#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <FirebaseClient.h>
#include <time.h>

// =========================================================
// 1. KONEKSI WIFI
// =========================================================
const char* ssid     = "GALAXY A33 5G";
const char* password = "cicing77";

// =========================================================
// 2. FIREBASE REALTIME DATABASE CONFIG
// =========================================================
#define API_KEY       "AIzaSyAxPO-OEL2cnlQstspnjkyIq-3VOzYK8KM"
#define USER_EMAIL    "esp32@greenhouse.local"
#define USER_PASSWORD "itera123"
#define DATABASE_URL  "https://greenhouse-firebase-56abd-default-rtdb.asia-southeast1.firebasedatabase.app"

// =========================================================
// 3. OBJEK FIREBASE
// =========================================================
WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);

UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD);
FirebaseApp firebaseApp;
RealtimeDatabase Database;

// =========================================================
// 4. PIN SENSOR & AKTUATOR ESP32
// =========================================================
#define DHT_PIN       4       // Sensor DHT22 (Suhu & Kelembapan Udara)
#define DHT_TYPE      DHT22
#define WATER_PIN     34      // Sensor Level Air Analog (ADC Input)
#define DS18B20_PIN   18      // Sensor Suhu Air DS18B20 (OneWire)
#define RELAY_PIN     26      // Relay Pompa Air Hidroponik

// =========================================================
// 5. KALIBRASI & LOGIKA SISTEM
// =========================================================
#define LCD_ADDRESS   0x27
#define LCD_COLS      16
#define LCD_ROWS      2

#define WATER_DRY     1200
#define WATER_WET     3000

const bool RELAY_ACTIVE_LOW = true; // Sebagian besar modul relay aktif LOW

// Batas otomatis pompa pengisian
const int WATER_PUMP_ON  = 25;  // Level air <= 25% -> Pompa ON
const int WATER_PUMP_OFF = 80;  // Level air >= 80% -> Pompa OFF

// =========================================================
// 6. OBJEK SENSOR & VARIABEL
// =========================================================
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);
DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);
DallasTemperature waterTempSensor(&oneWire);

float airTemp   = 0.0;
float humidity  = 0.0;
float waterTemp = 0.0;

int waterRaw   = 0;
int waterLevel = 0;

bool pumpOn = false;
bool page   = false;

// =========================================================
// 7. TIMER INTERVAL (NON-BLOCKING)
// =========================================================
unsigned long lastSensor   = 0;
unsigned long lastFirebase = 0;
unsigned long lastDisplay  = 0;

const unsigned long SENSOR_INTERVAL   = 2000;  // Baca sensor tiap 2 detik
const unsigned long FIREBASE_INTERVAL = 2500;  // Kirim ke cloud tiap 2.5 detik
const unsigned long PAGE_INTERVAL     = 3000;  // Ganti halaman LCD tiap 3 detik

// =========================================================
// 8. REQUEST WATCHDOG (ANTI-MACET)
// =========================================================
bool firebaseBusy = false;
unsigned long firebaseReqStart = 0;
const unsigned long REQUEST_TIMEOUT = 2500; // Reset instan jika 2.5 detik tanpa respon

void checkTimeouts() {
    if (firebaseBusy && (millis() - firebaseReqStart > REQUEST_TIMEOUT)) {
        firebaseBusy = false;
    }
}

// =========================================================
// 9. WIFI STATE MANAGEMENT (ROBUST & AUTO-RECONNECT)
// =========================================================
enum WifiState {
    WIFI_IDLE,
    WIFI_CONNECTING,
    WIFI_CONNECTED
};

WifiState wifiState = WIFI_IDLE;
unsigned long wifiStart = 0;
unsigned long wifiRetry = 0;
unsigned long dotTimer  = 0;
int wifiAttempt = 0;

String wifiStatus(wl_status_t s) {
    switch (s) {
        case WL_CONNECTED:        return "CONNECTED";
        case WL_NO_SSID_AVAIL:    return "NO SSID";
        case WL_CONNECT_FAILED:   return "FAILED";
        case WL_DISCONNECTED:     return "DISCONNECTED";
        default:                  return String((int)s);
    }
}

void startWifi() {
    wifiAttempt++;
    Serial.println("\n[WIFI] Menghubungkan ke: " + String(ssid));

    WiFi.disconnect(true);
    delay(100);

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);

    // TX power diatur 11dBm agar suplai daya stabil (anti brownout/reset diam-diam)
    WiFi.setTxPower(WIFI_POWER_11dBm);

    WiFi.begin(ssid, password);

    wifiStart = millis();
    dotTimer  = millis();
    wifiState = WIFI_CONNECTING;
}

void updateWifi() {
    switch (wifiState) {
        case WIFI_IDLE:
            if (millis() - wifiRetry > 2000) {
                startWifi();
            }
            break;

        case WIFI_CONNECTING: {
            wl_status_t status = WiFi.status();
            if (status == WL_CONNECTED) {
                Serial.println("\n[WIFI] TERHUBUNG!");
                Serial.print("[WIFI] IP ESP32: ");
                Serial.println(WiFi.localIP());

                wifiState = WIFI_CONNECTED;
                wifiAttempt = 0;
            } else {
                if (millis() - dotTimer > 500) {
                    Serial.print(".");
                    dotTimer = millis();
                }

                if (millis() - wifiStart > 10000) {
                    Serial.println("\n[WIFI] Timeout: " + wifiStatus(status));
                    WiFi.disconnect(true);
                    wifiState = WIFI_IDLE;
                    wifiRetry = millis();
                }
            }
            break;
        }

        case WIFI_CONNECTED:
            if (WiFi.status() != WL_CONNECTED) {
                Serial.println("\n[WIFI] Terputus! Reconnecting...");
                wifiState = WIFI_IDLE;
                wifiRetry = millis();
                firebaseBusy = false;
            }
            break;
    }
}

// =========================================================
// 10. FIREBASE STATE & CALLBACK
// =========================================================
bool firebaseStarted  = false;
bool firebaseWasReady = false;

void firebaseCallback(AsyncResult &aResult) {
    if (aResult.isError()) {
        Serial.printf("[FIREBASE ERROR] Code: %d | %s\n", aResult.error().code(), aResult.error().message().c_str());
    }
}

void startFirebase() {
    if (firebaseStarted) return;
    Serial.println("[FIREBASE] Inisialisasi...");
    ssl_client.setInsecure();

    firebaseApp.setCallback(firebaseCallback);
    initializeApp(aClient, firebaseApp, getAuth(user_auth));
    firebaseApp.getApp<RealtimeDatabase>(Database);
    Database.url(DATABASE_URL);

    firebaseStarted = true;
    Serial.println("[FIREBASE] Siap!");
}

bool firebaseReady() {
    if (!firebaseStarted) return false;
    if (!firebaseApp.ready()) {
        if (firebaseWasReady) firebaseWasReady = false;
        return false;
    }
    if (!firebaseWasReady) {
        Serial.println("[FIREBASE] Ready & Connected!");
        firebaseWasReady = true;
    }
    return true;
}

// =========================================================
// 11. KONTROL RELAY POMPA
// =========================================================
void setPump(bool state) {
    pumpOn = state;
    if (RELAY_ACTIVE_LOW) {
        digitalWrite(RELAY_PIN, state ? LOW : HIGH);
    } else {
        digitalWrite(RELAY_PIN, state ? HIGH : LOW);
    }
}

// =========================================================
// 12. BACA SEMUA SENSOR & LOGIKA OTOMATIS
// =========================================================
void readSensors() {
    // 1. DHT22
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) airTemp = t;
    if (!isnan(h)) humidity = h;

    // 2. Level Air Analog
    waterRaw = analogRead(WATER_PIN);
    waterLevel = map(waterRaw, WATER_DRY, WATER_WET, 0, 100);
    waterLevel = constrain(waterLevel, 0, 100);

    // 3. Suhu Air DS18B20
    waterTempSensor.requestTemperatures();
    float wt = waterTempSensor.getTempCByIndex(0);
    if (wt != DEVICE_DISCONNECTED_C && wt >= -55.0 && wt <= 125.0) {
        waterTemp = wt;
    }

    // 4. Logika Pompa Air Otomatis
    if (waterLevel <= WATER_PUMP_ON) {
        setPump(true);
    } else if (waterLevel >= WATER_PUMP_OFF) {
        setPump(false);
    }

    // 5. Cetak ke Serial Monitor
    Serial.println("\n-----------------------------------------");
    Serial.println("🌱 [MONITORING HIDROPONIK ESP32]");
    Serial.printf("   Suhu Udara  : %.1f °C\n", airTemp);
    Serial.printf("   Kelembapan  : %.1f %%\n", humidity);
    Serial.printf("   Level Air   : %d %% (ADC: %d)\n", waterLevel, waterRaw);
    Serial.printf("   Suhu Air    : %.1f °C\n", waterTemp);
    Serial.printf("   Status Pompa: %s\n", pumpOn ? "ON (HIDUP)" : "OFF (MATI)");
    Serial.println("-----------------------------------------");
}

// =========================================================
// 13. KIRIM DATA KE FIREBASE (/hidroponik/current)
// =========================================================
void currentCallback(AsyncResult &aResult) {
    firebaseBusy = false;
    if (aResult.isError()) {
        Serial.printf("[FIREBASE ERROR] %s\n", aResult.error().message().c_str());
    } else {
        Serial.println("☁️ [FIREBASE SYNC] Sukses update ke Web GitHub Pages!");
    }
}

void sendDataToFirebase() {
    if (!firebaseReady() || firebaseBusy) return;

    // Format JSON yang langsung diterima oleh index.html GitHub Pages
    String json = "{";
    json += "\"suhu_udara\":"   + String(airTemp, 1)    + ",";
    json += "\"kelembapan\":"    + String(humidity, 1)   + ",";
    json += "\"suhu_air\":"     + String(waterTemp, 1)  + ",";
    json += "\"level_air\":"    + String(waterLevel)    + ",";
    json += "\"water_raw\":"    + String(waterRaw)      + ",";
    json += "\"pompa_status\":" + String(pumpOn ? "true" : "false") + ",";
    json += "\"pompa\":\""      + String(pumpOn ? "ON" : "OFF")    + "\"";
    json += "}";

    firebaseBusy = true;
    firebaseReqStart = millis();

    Serial.println("🚀 [KIRIM CLOUD] " + json);
    Database.set<object_t>(aClient, "/hidroponik/current", object_t(json), currentCallback);
}

// =========================================================
// 14. TAMPILAN LCD I2C 16x2
// =========================================================
void displayLCD() {
    lcd.clear();

    if (!page) {
        // Halaman 1: Udara & Pompa
        lcd.setCursor(0, 0);
        lcd.print("Udara:");
        lcd.print(airTemp, 1);
        lcd.print((char)223);
        lcd.print("C");

        lcd.setCursor(0, 1);
        lcd.print("RH:");
        lcd.print(humidity, 1);
        lcd.print("%");

        lcd.print(" Pmp:");
        lcd.print(pumpOn ? "ON" : "OFF");
    } else {
        // Halaman 2: Level Air, Suhu Air, dan Status Cloud
        lcd.setCursor(0, 0);
        lcd.print("Lvl:");
        lcd.print(waterLevel);
        lcd.print("% ADC:");
        lcd.print(waterRaw);

        lcd.setCursor(0, 1);
        lcd.print("Air:");
        lcd.print(waterTemp, 1);
        lcd.print((char)223);
        lcd.print("C ");

        if (firebaseReady()) {
            lcd.print("[IoT]");
        } else if (wifiState == WIFI_CONNECTED) {
            lcd.print("[NET]");
        } else {
            lcd.print("[OFF]");
        }
    }
}

// =========================================================
// 15. SETUP
// =========================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n==========================================");
    Serial.println("  ESP32 HIDROPONIK - GITHUB PAGES CLOUD   ");
    Serial.println("==========================================");

    // Relay Pompa
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
    pinMode(RELAY_PIN, OUTPUT);

    // ADC ESP32 12-bit
    analogReadResolution(12);

    // LCD I2C
    Wire.begin(21, 22);
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Hidroponik ESP32");
    lcd.setCursor(0, 1);
    lcd.print("Inisialisasi...");

    // Sensor
    dht.begin();
    waterTempSensor.begin();
    delay(1000);

    // WiFi
    wifiRetry = millis() - 2000;
    wifiState = WIFI_IDLE;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Koneksi WiFi...");
    lcd.setCursor(0, 1);
    lcd.print(ssid);

    // Inisialisasi Firebase Cloud
    startFirebase();
}

// =========================================================
// 16. MAIN LOOP
// =========================================================
void loop() {
    // 1. Kelola WiFi
    updateWifi();

    if (wifiState == WIFI_CONNECTED) {
        firebaseApp.loop();
        checkTimeouts();

        unsigned long currentMillis = millis();

        // 2. Baca Sensor & Kontrol Pompa (Tiap 2 Detik)
        if (currentMillis - lastSensor >= SENSOR_INTERVAL) {
            lastSensor = currentMillis;
            readSensors();
        }

        // 3. Kirim Data Real-Time ke Firebase (Tiap 2.5 Detik)
        if (currentMillis - lastFirebase >= FIREBASE_INTERVAL) {
            lastFirebase = currentMillis;
            sendDataToFirebase();
        }
    }

    // 4. Update LCD (Tiap 3 Detik)
    if (millis() - lastDisplay >= PAGE_INTERVAL) {
        lastDisplay = millis();
        page = !page;
        displayLCD();
    }

    yield();
    delay(1);
}
