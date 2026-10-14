let citySelect = document.querySelector("#cities");
let currentDateElement = document.querySelector("#current-date");
let currentWeatherElement = document.querySelector("#current-weather");
let weatherRequestId = 0;

let cities = {
  johannesburg: {
    name: "Johannesburg",
    timeZone: "Africa/Johannesburg",
    latitude: -26.2041,
    longitude: 28.0473,
  },
  lagos: {
    name: "Lagos",
    timeZone: "Africa/Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
  },
  tokyo: {
    name: "Tokyo",
    timeZone: "Asia/Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
  },
  london: {
    name: "London",
    timeZone: "Europe/London",
    latitude: 51.5072,
    longitude: -0.1276,
  },
  dubai: {
    name: "Dubai",
    timeZone: "Asia/Dubai",
    latitude: 25.2048,
    longitude: 55.2708,
  },
  berlin: {
    name: "Berlin",
    timeZone: "Europe/Berlin",
    latitude: 52.52,
    longitude: 13.405,
  },
};

let weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function updateSelectedCityTime() {
  let city = cities[citySelect.value];

  if (!city) {
    currentDateElement.textContent = "Select a city to see its local time.";
    return;
  }

  let localTime = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: city.timeZone,
    timeZoneName: "short",
  }).format(new Date());

  currentDateElement.textContent = `It is ${localTime} in ${city.name}.`;
}

async function updateSelectedCityWeather(city) {
  let requestId = ++weatherRequestId;
  currentWeatherElement.textContent = "Loading current weather...";

  let query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });

  try {
    let response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
    if (!response.ok) {
      throw new Error(`Weather service returned ${response.status}.`);
    }

    let data = await response.json();
    if (requestId !== weatherRequestId) {
      return;
    }

    let current = data.current;
    if (
      !current
      || typeof current.temperature_2m !== "number"
      || typeof current.relative_humidity_2m !== "number"
      || typeof current.apparent_temperature !== "number"
      || typeof current.weather_code !== "number"
      || typeof current.wind_speed_10m !== "number"
    ) {
      throw new Error("Weather service returned incomplete current conditions.");
    }

    let description = weatherDescriptions[current.weather_code] ?? "Conditions unavailable";
    currentWeatherElement.textContent =
      `${city.name}: ${description}, ${Math.round(current.temperature_2m)}°C `
      + `(feels like ${Math.round(current.apparent_temperature)}°C). `
      + `Humidity ${current.relative_humidity_2m}%; wind ${Math.round(current.wind_speed_10m)} km/h.`;
  } catch (error) {
    if (requestId !== weatherRequestId) {
      return;
    }

    currentWeatherElement.textContent = `Weather is unavailable for ${city.name}. Please try again later.`;
    console.error("Could not load current weather:", error);
  }
}

function updateSelectedCity() {
  updateSelectedCityTime();

  let city = cities[citySelect.value];
  if (city) {
    updateSelectedCityWeather(city);
  } else {
    weatherRequestId += 1;
    currentWeatherElement.textContent = "Select a city to see its weather.";
  }
}

citySelect.addEventListener("change", updateSelectedCity);
updateSelectedCity();
window.setInterval(updateSelectedCityTime, 1000);
window.setInterval(() => {
  let city = cities[citySelect.value];
  if (city) {
    updateSelectedCityWeather(city);
  }
}, 10 * 60 * 1000);