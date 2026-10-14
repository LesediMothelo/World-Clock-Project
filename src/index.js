let citySelect = document.querySelector("#cities");
let currentDateElement = document.querySelector("#current-date");
let currentWeatherElement = document.querySelector("#current-weather");
let currentWeatherIconElement = document.querySelector("#current-weather-icon");
let allCitiesWeatherSection = document.querySelector("#all-cities-weather");
let allCitiesWeatherList = document.querySelector("#all-cities-weather-list");
let allCitiesWeatherToggle = document.querySelector("#toggle-all-cities-weather");
let weatherRequestId = 0;
let locationRequestId = 0;
let allCitiesWeatherRequestId = 0;
let currentLocation = null;

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

function getWeatherIcon(weatherCode, isDay) {
  if (weatherCode === 0) {
    return isDay ? "☀️" : "🌙";
  }
  if (weatherCode === 1) {
    return isDay ? "🌤️" : "☁️";
  }
  if (weatherCode === 2) {
    return isDay ? "⛅" : "☁️";
  }
  if (weatherCode === 3) {
    return "☁️";
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return "🌫️";
  }
  if (weatherCode >= 51 && weatherCode <= 67) {
    return "🌧️";
  }
  if (weatherCode >= 71 && weatherCode <= 86) {
    return "🌨️";
  }
  if (weatherCode >= 95 && weatherCode <= 99) {
    return "⛈️";
  }
  return "🌡️";
}

function createAllCitiesWeatherCards() {
  for (let [key, city] of Object.entries(cities)) {
    let card = document.createElement("article");
    card.className = "city-weather-card";

    let heading = document.createElement("h3");
    heading.textContent = city.name;

    let reading = document.createElement("div");
    reading.className = "city-weather-reading";

    let icon = document.createElement("span");
    icon.className = "city-weather-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.dataset.weatherIcon = key;

    let text = document.createElement("p");
    text.dataset.weatherText = key;
    text.textContent = "Weather not loaded yet.";

    reading.append(icon, text);
    card.append(heading, reading);
    allCitiesWeatherList.append(card);
  }
}

async function fetchCurrentWeather(city) {
  let query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });

  let response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}.`);
  }

  let data = await response.json();
  let current = data.current;
  if (
    !current
    || typeof current.temperature_2m !== "number"
    || typeof current.relative_humidity_2m !== "number"
    || typeof current.apparent_temperature !== "number"
    || typeof current.weather_code !== "number"
    || typeof current.wind_speed_10m !== "number"
    || (current.is_day !== 0 && current.is_day !== 1)
  ) {
    throw new Error("Weather service returned incomplete current conditions.");
  }

  return {
    description: weatherDescriptions[current.weather_code] ?? "Conditions unavailable",
    icon: getWeatherIcon(current.weather_code, current.is_day === 1),
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
  };
}

function formatWeather(city, weather) {
  return `${city.name}: ${weather.description}, ${weather.temperature}°C `
    + `(feels like ${weather.apparentTemperature}°C). `
    + `Humidity ${weather.humidity}%; wind ${weather.windSpeed} km/h.`;
}

function updateSelectedCityTime() {
  let city = cities[citySelect.value];
  let location = citySelect.value === "location" ? currentLocation : null;

  if (!city && !location) {
    currentDateElement.textContent = citySelect.value === "location"
      ? "Finding your location..."
      : "Select a city to see its local time.";
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
    timeZone: city ? city.timeZone : location.timeZone,
    timeZoneName: "short",
  }).format(new Date());

  if (city) {
    currentDateElement.textContent = `It is ${localTime} in ${city.name}.`;
  } else {
    currentDateElement.textContent =
      `It is ${localTime} at your location (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}).`;
  }
}

async function updateSelectedCityWeather(city) {
  let requestId = ++weatherRequestId;
  currentWeatherElement.textContent = "Loading current weather...";
  currentWeatherIconElement.textContent = "";

  try {
    let weather = await fetchCurrentWeather(city);
    if (requestId !== weatherRequestId) {
      return;
    }

    currentWeatherIconElement.textContent = weather.icon;
    currentWeatherElement.textContent = formatWeather(city, weather);
  } catch (error) {
    if (requestId !== weatherRequestId) {
      return;
    }

    currentWeatherElement.textContent = `Weather is unavailable for ${city.name}. Please try again later.`;
    currentWeatherIconElement.textContent = "";
    console.error("Could not load current weather:", error);
  }
}

async function updateAllCitiesWeather() {
  let requestId = ++allCitiesWeatherRequestId;
  let cityEntries = Object.entries(cities);

  for (let [key] of cityEntries) {
    allCitiesWeatherList.querySelector(`[data-weather-icon="${key}"]`).textContent = "";
    allCitiesWeatherList.querySelector(`[data-weather-text="${key}"]`).textContent = "Loading current weather...";
  }

  let results = await Promise.all(cityEntries.map(async ([key, city]) => {
    try {
      return { key, city, weather: await fetchCurrentWeather(city) };
    } catch (error) {
      console.error(`Could not load current weather for ${city.name}:`, error);
      return { key, city, error };
    }
  }));

  if (requestId !== allCitiesWeatherRequestId || allCitiesWeatherSection.hidden) {
    return;
  }

  for (let result of results) {
    let icon = allCitiesWeatherList.querySelector(`[data-weather-icon="${result.key}"]`);
    let text = allCitiesWeatherList.querySelector(`[data-weather-text="${result.key}"]`);
    if (result.weather) {
      icon.textContent = result.weather.icon;
      text.textContent = formatWeather(result.city, result.weather);
    } else {
      icon.textContent = "";
      text.textContent = `Weather is unavailable for ${result.city.name}. Please try again later.`;
    }
  }
}

function getLocationErrorMessage(error) {
  if (error.code === 1) {
    return "Location access was denied. Allow location access in your browser to see local time and weather.";
  }
  if (error.code === 2) {
    return "Your location is currently unavailable. Please try again later.";
  }
  if (error.code === 3) {
    return "Finding your location timed out. Please try again.";
  }
  return "Could not determine your location. Please try again.";
}

function requestCurrentLocation() {
  let requestId = ++locationRequestId;
  weatherRequestId += 1;
  currentDateElement.textContent = "Finding your location...";
  currentWeatherElement.textContent = "Finding your location to load current weather...";
  currentWeatherIconElement.textContent = "";

  if (!navigator.geolocation) {
    currentDateElement.textContent = "Location is not supported by this browser.";
    currentWeatherElement.textContent = "Location is not supported by this browser, so local weather is unavailable.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (requestId !== locationRequestId || citySelect.value !== "location") {
        return;
      }

      currentLocation = {
        name: "Your location",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      updateSelectedCityTime();
      updateSelectedCityWeather(currentLocation);
    },
    (error) => {
      if (requestId !== locationRequestId || citySelect.value !== "location") {
        return;
      }

      let message = getLocationErrorMessage(error);
      currentDateElement.textContent = message;
      currentWeatherElement.textContent = message;
      currentWeatherIconElement.textContent = "";
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

function updateSelectedCity() {
  if (citySelect.value === "location") {
    if (currentLocation) {
      locationRequestId += 1;
      updateSelectedCityTime();
      updateSelectedCityWeather(currentLocation);
    } else {
      requestCurrentLocation();
    }
    return;
  }

  locationRequestId += 1;
  updateSelectedCityTime();

  let city = cities[citySelect.value];
  if (city) {
    updateSelectedCityWeather(city);
  } else {
    weatherRequestId += 1;
    currentWeatherElement.textContent = "Select a city to see its weather.";
    currentWeatherIconElement.textContent = "";
  }
}

citySelect.addEventListener("change", updateSelectedCity);
createAllCitiesWeatherCards();
allCitiesWeatherToggle.addEventListener("click", () => {
  let isExpanded = allCitiesWeatherToggle.getAttribute("aria-expanded") === "true";
  allCitiesWeatherToggle.setAttribute("aria-expanded", String(!isExpanded));
  allCitiesWeatherToggle.textContent = isExpanded
    ? "Show weather for all cities"
    : "Hide weather for all cities";
  allCitiesWeatherSection.hidden = isExpanded;

  if (isExpanded) {
    allCitiesWeatherRequestId += 1;
  } else {
    updateAllCitiesWeather();
  }
});
updateSelectedCity();
window.setInterval(updateSelectedCityTime, 1000);
window.setInterval(() => {
  let city = cities[citySelect.value];
  if (city) {
    updateSelectedCityWeather(city);
  } else if (citySelect.value === "location" && currentLocation) {
    updateSelectedCityWeather(currentLocation);
  }
  if (!allCitiesWeatherSection.hidden) {
    updateAllCitiesWeather();
  }
}, 10 * 60 * 1000);
