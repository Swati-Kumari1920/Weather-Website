import React, { useState, useEffect } from "react";

const API_KEY = "41acbf4418e2440f94a105744260302";

// -------- AQI CALCULATOR ------
function calculateAQI(pm25) {
  if (pm25 <= 30) return { aqi: 50, category: "Good" };
  if (pm25 <= 60) return { aqi: 100, category: "Satisfactory" };
  if (pm25 <= 90) return { aqi: 200, category: "Moderate" };
  if (pm25 <= 120) return { aqi: 300, category: "Poor" };
  if (pm25 <= 250) return { aqi: 400, category: "Very Poor" };
  return { aqi: 500, category: "Severe" };
}

function App() {
  // --------- STATE VARIABLES -----
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [historyWeather, setHistoryWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  // 🔍 NEW: City suggestions
  const [suggestions, setSuggestions] = useState([]);

  // ---------- AUTO LOCATION (GPS) -------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByLocation(lat, lon);
      },
      () => {
        console.log("Location access denied");
      }
    );
  }, []);

  // ------- FETCH WEATHER BY CITY -------
  const getWeather = async (searchCity = city) => {
    if (!searchCity) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setHistoryWeather(null);
    setSelectedHour(null);
    setSelectedDate("");
    setSelectedDayIndex(0);

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${searchCity}&days=7&aqi=yes`
      );
      if (!response.ok) throw new Error("City not found");
      const data = await response.json();
      setWeather(data);
      setSuggestions([]); // clear suggestions after search
    } catch {
      setError("City not found. Please try again.");
    }

    setLoading(false);
  };

  // -------- FETCH WEATHER BY GPS ----------
  const fetchWeatherByLocation = async (lat, lon) => {
    setLoading(true);
    setError("");
    setWeather(null);
    setHistoryWeather(null);
    setSelectedHour(null);
    setSelectedDate("");
    setSelectedDayIndex(0);

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=yes`
      );
      if (!response.ok) throw new Error("Location not found");
      const data = await response.json();
      setWeather(data);
    } catch {
      setError("Unable to get weather for your location.");
    }

    setLoading(false);
  };

  // 🔍 FETCH CITY SUGGESTIONS
  const fetchSuggestions = async (input) => {
    setCity(input);

    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${input}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  // ---------- FETCH HISTORY (PAST DATE) ----------
  const fetchHistory = async (date) => {
    if (!weather) return;

    setLoading(true);
    setError("");
    setHistoryWeather(null);
    setSelectedHour(null);

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${weather.location.name}&dt=${date}`
      );
      if (!response.ok) throw new Error("History not available");
      const data = await response.json();
      setHistoryWeather(data);
    } catch {
      setError("Historical data not available for this date.");
    }

    setLoading(false);
  };

  // ---------- DATE  -----------
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    setSelectedHour(null);

    if (!weather) return;

    const todayDate = weather.forecast.forecastday[0].date;
    const lastForecastDate =
      weather.forecast.forecastday[
        weather.forecast.forecastday.length - 1
      ].date;

    if (dateValue >= todayDate && dateValue <= lastForecastDate) {
      const index = weather.forecast.forecastday.findIndex(
        (day) => day.date === dateValue
      );
      setSelectedDayIndex(index);
      setHistoryWeather(null);
    } else {
      fetchHistory(dateValue);
    }
  };

  // --------- THEME COLORS -------
  const background = darkMode
    ? "linear-gradient(to right, #141e30, #243b55)"
    : "linear-gradient(to right, #89f7fe, #66a6ff)";
  const textColor = darkMode ? "#fff" : "#333";
  const cardBg = darkMode ? "#1f2933" : "#fff";

  return (
    <div
      style={{
        minHeight: "100vh",
        background,
        color: textColor,
        padding: "12px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>🌤 Weather App</h1>

      {/* DARK MODE BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: "8px 16px",
            borderRadius: "18px",
            border: "none",
            backgroundColor: darkMode ? "#fff" : "#333",
            color: darkMode ? "#333" : "#fff",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* SEARCH BOX WITH SUGGESTIONS */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <div style={{ position: "relative", width: "200px" }}>
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => fetchSuggestions(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              fontSize: "13px",
            }}
          />

          {/* SUGGESTION DROPDOWN */}
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "38px",
                width: "100%",
                backgroundColor: cardBg,
                borderRadius: "8px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                zIndex: 10,
                maxHeight: "160px",
                overflowY: "auto",
              }}
            >
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCity(item.name);
                    setSuggestions([]);
                    getWeather(item.name);
                  }}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: "13px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {item.name}, {item.region}, {item.country}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => getWeather()}
          style={{
            padding: "8px 16px",
            borderRadius: "18px",
            border: "none",
            backgroundColor: darkMode ? "#fff" : "#333",
            color: darkMode ? "#333" : "#fff",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          🔍 Search
        </button>
      </div>

      {/* DATE PICKER */}
      {weather && (
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "13px",
            }}
          />
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* LOADING MESSAGE */}
      {loading && <p style={{ textAlign: "center" }}>Loading weather...</p>}

      {/* CURRENT WEATHER CARD */}
      {weather && !loading && (
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            backgroundColor: cardBg,
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
          }}
        >
          <h2>
            📍 {weather.location.name}, {weather.location.country}
          </h2>
          <h1>🌡 {weather.current.temp_c}°C</h1>
          <p>Feels like: {weather.current.feelslike_c}°C</p>
          <p>{weather.current.condition.text}</p>

          {weather.current.air_quality && (
            <p>
              🌍 AQI:{" "}
              {calculateAQI(weather.current.air_quality.pm2_5).aqi} (
              {calculateAQI(weather.current.air_quality.pm2_5).category})
            </p>
          )}

          <hr />

          <p>💧 Humidity: {weather.current.humidity}%</p>
          <p>🌬 Wind: {weather.current.wind_kph} km/h</p>
          <p>🌫 Visibility: {weather.current.vis_km} km</p>
          <p>📈 Pressure: {weather.current.pressure_mb} mb</p>
          <p>🔆 UV Index: {weather.current.uv}</p>
        </div>
      )}

      {/* HOURLY FORECAST (TODAY / FUTURE) */}
      {weather && !loading && !historyWeather && (
        <div style={{ maxWidth: "900px", margin: "18px auto 0" }}>
          <h3 style={{ textAlign: "center" }}>
            ⏰ Hourly Forecast (
            {new Date(
              weather.forecast.forecastday[selectedDayIndex].date
            ).toDateString()}
            )
          </h3>

          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {weather.forecast.forecastday[selectedDayIndex].hour.map((hour) => (
              <div
                key={hour.time}
                onClick={() => setSelectedHour(hour)}
                style={{
                  minWidth: "100px",
                  backgroundColor: cardBg,
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <p>{hour.time.split(" ")[1]}</p>
                <img
                  src={hour.condition.icon}
                  alt={hour.condition.text}
                  style={{ width: "36px" }}
                />
                <p>{hour.temp_c}°C</p>
                <p style={{ fontSize: "11px" }}>{hour.condition.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOURLY HISTORY */}
      {historyWeather && !loading && (
        <div style={{ maxWidth: "900px", margin: "18px auto 0" }}>
          <h3 style={{ textAlign: "center" }}>
            ⏰ Hourly History (
            {new Date(historyWeather.forecast.forecastday[0].date).toDateString()}
            )
          </h3>

          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {historyWeather.forecast.forecastday[0].hour.map((hour) => (
              <div
                key={hour.time}
                onClick={() => setSelectedHour(hour)}
                style={{
                  minWidth: "100px",
                  backgroundColor: cardBg,
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <p>{hour.time.split(" ")[1]}</p>
                <img
                  src={hour.condition.icon}
                  alt={hour.condition.text}
                  style={{ width: "36px" }}
                />
                <p>{hour.temp_c}°C</p>
                <p style={{ fontSize: "11px" }}>{hour.condition.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOURLY DETAILS POPUP */}
      {selectedHour && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: cardBg,
              color: textColor,
              borderRadius: "12px",
              padding: "16px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h3>🕒 {selectedHour.time.split(" ")[1]}</h3>
            <img
              src={selectedHour.condition.icon}
              alt={selectedHour.condition.text}
              style={{ width: "48px" }}
            />
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              {selectedHour.temp_c}°C
            </p>
            <p>{selectedHour.condition.text}</p>

            <hr />

            <p>💧 Humidity: {selectedHour.humidity}%</p>
            <p>🌬 Wind: {selectedHour.wind_kph} km/h</p>
            <p>🌫 Visibility: {selectedHour.vis_km} km</p>
            <p>📈 Pressure: {selectedHour.pressure_mb} mb</p>
            <p>🔆 UV Index: {selectedHour.uv}</p>
            <p>🌧 Chance of Rain: {selectedHour.chance_of_rain}%</p>

            <button
              onClick={() => setSelectedHour(null)}
              style={{
                marginTop: "10px",
                padding: "6px 14px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: darkMode ? "#fff" : "#333",
                color: darkMode ? "#333" : "#fff",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ❌ Close
            </button>
          </div>
        </div>
      )}

      {/* 7-DAY FORECAST */}
      {weather && !loading && (
        <div style={{ maxWidth: "900px", margin: "18px auto 0" }}>
          <h3 style={{ textAlign: "center" }}>
            📅 7-Day Forecast (Click any day)
          </h3>

          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {weather.forecast.forecastday.map((day, index) => (
              <div
                key={day.date}
                onClick={() => {
                  setSelectedDayIndex(index);
                  setSelectedHour(null);
                  setSelectedDate(day.date);
                  setHistoryWeather(null);
                }}
                style={{
                  minWidth: "120px",
                  backgroundColor:
                    selectedDayIndex === index ? "#ffeb3b" : cardBg,
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <p style={{ fontWeight: "bold" }}>
                  {new Date(day.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                  })}
                </p>
                <img
                  src={day.day.condition.icon}
                  alt={day.day.condition.text}
                  style={{ width: "36px" }}
                />
                <p>
                  🔼 {day.day.maxtemp_c}°C / 🔽 {day.day.mintemp_c}°C
                </p>
                <p style={{ fontSize: "11px" }}>{day.day.condition.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
