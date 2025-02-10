const CONFIG = {
  WEATHER_API: "https://api.weatherapi.com/v1/forecast.json?key=09fa1e25dacc4c67a04214622250802&q=",
  EXCHANGE_API: "https://openexchangerates.org/api/latest.json?app_id=71493d20cca442aa88f5fc9924ece6be"
};

var map, marker;

const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

const navSearchInput = document.getElementById("navSearchInput");
const navSearchBtn = document.getElementById("navSearchBtn");
navSearchBtn.addEventListener("click", function() {
  updateLocation(navSearchInput.value);
});
navSearchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    updateLocation(this.value);
  }
});

function updateLocation(query) {
  if (!query || query.trim() === "") {
    query = "Bangalore, India";
  }
  const url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(query);
  fetch(url)
    .then(response => response.json())
    .then(results => {
      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        map.setView([lat, lon], 10);
        if (marker) {
          marker.setLatLng([lat, lon]);
        } else {
          marker = L.marker([lat, lon]).addTo(map);
        }
        loadWeather(lat + "," + lon, document.getElementById("location-weather"));
      } else {
        document.getElementById("location-weather").innerHTML = "<div class=\"text-red-500\">Location not found</div>";
      }
    })
    .catch(error => {
      console.error("Error during geocoding:", error);
      document.getElementById("location-weather").innerHTML = "<div class=\"text-red-500\">Location not found</div>";
    });
}

async function loadWeather(query, element) {
  try {
    const response = await fetch(CONFIG.WEATHER_API + query + "&days=7");
    const data = await response.json();
    let html = "<div class=\"weather-card\"><h2 class=\"text-white text-xl mb-4\">7-Day Forecast for " + data.location.name + "</h2>";
    data.forecast.forecastday.forEach(day => {
      const iconUrl = day.day.condition.icon.startsWith("//") ? "https:" + day.day.condition.icon : day.day.condition.icon;
      html += "<div class=\"mb-3 flex items-center\"><img src=\"" + iconUrl + "\" alt=\"" + day.day.condition.text + "\" class=\"w-8 h-8 mr-2\"><div><div class=\"text-white font-bold\">" + day.date + "</div><div class=\"text-sm text-gray-300\">" + day.day.condition.text + " - High: " + day.day.maxtemp_c + "°C, Low: " + day.day.mintemp_c + "°C</div></div></div>";
    });
    html += "</div>";
    element.innerHTML = html;
  } catch (error) {
    console.error("Error loading weather:", error);
    element.innerHTML = "<div class=\"text-gray-400 text-sm\">Weather unavailable</div>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const weatherElem = document.getElementById("location-weather");
  if (!weatherElem.innerHTML.trim()) {
    loadWeather("12.9716,77.5946", weatherElem);
  }
});

function initMap() {
  map = L.map("map").setView([12.9716, 77.5946], 10);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  updateLocation("Bangalore, India");
}

async function fetchRates() {
  try {
    const response = await fetch(CONFIG.EXCHANGE_API);
    const data = await response.json();
    const rates = data.rates;
    const currencyCodes = Object.keys(rates).sort();
    const fromSelect = document.getElementById("fromCurrency");
    const toSelect = document.getElementById("toCurrency");
    currencyCodes.forEach(code => {
      const optionFrom = document.createElement("option");
      optionFrom.value = code;
      optionFrom.textContent = code;
      fromSelect.appendChild(optionFrom);
      const optionTo = document.createElement("option");
      optionTo.value = code;
      optionTo.textContent = code;
      toSelect.appendChild(optionTo);
    });
    fromSelect.value = "USD";
    toSelect.value = "EUR";
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    document.getElementById("conversionResult").textContent = "Failed to load currency data.";
  }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await fetch(CONFIG.EXCHANGE_API);
    const data = await response.json();
    const rates = data.rates;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error("Currency not supported");
    }
    return amount * (rates[toCurrency] / rates[fromCurrency]);
  } catch (error) {
    console.error("Error converting currency:", error);
    return null;
  }
}

document.getElementById("converterForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value);
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;
  const conversionResult = document.getElementById("conversionResult");
  conversionResult.textContent = "Converting...";
  const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
  if (convertedAmount !== null) {
    conversionResult.textContent = "Converting from " + fromCurrency + " TO " + toCurrency + ": " + amount + " " + fromCurrency + " = " + convertedAmount.toFixed(2) + " " + toCurrency;
  } else {
    conversionResult.textContent = "Conversion failed. Please try again.";
  }
});

window.addEventListener("load", initMap);
window.addEventListener("DOMContentLoaded", fetchRates);

gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray(".destination-card").forEach(card => {
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: "top bottom-=100" },
    y: 100,
    opacity: 0,
    duration: 0.8
  });
});
