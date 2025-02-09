const CONFIG = {
    WEATHER_API: 'https://api.weatherapi.com/v1/forecast.json?key=09fa1e25dacc4c67a04214622250802&q=',
    EXCHANGE_API: 'https://openexchangerates.org/api/latest.json?app_id=71493d20cca442aa88f5fc9924ece6be'
  };
  
  var map, geocoder, marker;
  
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  const navSearchInput = document.getElementById('navSearchInput');
  const navSearchBtn = document.getElementById('navSearchBtn');
  navSearchBtn.addEventListener('click', function() {
    updateLocation(navSearchInput.value);
  });
  navSearchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateLocation(this.value);
    }
  });
  
  function updateLocation(query) {
    if (!query || query.trim() === "") {
      query = "Bangalore, India";
    }
    if (!geocoder) {
      document.getElementById('location-weather').innerHTML = `<div class="text-red-500">Map is loading, please try again later.</div>`;
      return;
    }
    geocoder.geocode({ address: query }, function(results, status) {
      console.log('Geocoder status for query "' + query + '":', status, results);
      if (status === 'OK' && results.length > 0) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        if (marker) {
          marker.setPosition(location);
        } else {
          marker = new google.maps.Marker({
            position: location,
            map: map,
            title: query
          });
        }
        loadWeather(results[0].formatted_address, document.getElementById('location-weather'));
      } else {
        document.getElementById('location-weather').innerHTML = `<div class="text-red-500">Location not found</div>`;
      }
    });
  }
  
  async function loadWeather(city, element) {
    try {
      const response = await fetch(`${CONFIG.WEATHER_API}${city}&days=7`);
      const data = await response.json();
      let html = `<div class="weather-card">
                    <h2 class="text-white text-xl mb-4">7-Day Forecast for ${city}</h2>`;
      data.forecast.forecastday.forEach(day => {
        const iconUrl = day.day.condition.icon.startsWith('//') ? 'https:' + day.day.condition.icon : day.day.condition.icon;
        html += `<div class="mb-3 flex items-center">
                   <img src="${iconUrl}" alt="${day.day.condition.text}" class="w-8 h-8 mr-2">
                   <div>
                     <div class="text-white font-bold">${day.date}</div>
                     <div class="text-sm text-gray-300">
                       ${day.day.condition.text} - High: ${day.day.maxtemp_c}°C, Low: ${day.day.mintemp_c}°C
                     </div>
                   </div>
                 </div>`;
      });
      html += `</div>`;
      element.innerHTML = html;
    } catch (error) {
      console.error('Error loading weather:', error);
      element.innerHTML = `<div class="text-gray-400 text-sm">Weather unavailable</div>`;
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const weatherElem = document.getElementById('location-weather');
    if (!weatherElem.innerHTML.trim()) {
      loadWeather('Bangalore, India', weatherElem);
    }
  });
  
  function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 10,
      styles: []
    });
    updateLocation("Bangalore, India");
  }
  
  async function fetchRates() {
    try {
      const response = await fetch(CONFIG.EXCHANGE_API);
      const data = await response.json();
      const rates = data.rates;
      const currencyCodes = Object.keys(rates).sort();
      const fromSelect = document.getElementById('fromCurrency');
      const toSelect = document.getElementById('toCurrency');
      currencyCodes.forEach(code => {
        const optionFrom = document.createElement('option');
        optionFrom.value = code;
        optionFrom.textContent = code;
        fromSelect.appendChild(optionFrom);
        const optionTo = document.createElement('option');
        optionTo.value = code;
        optionTo.textContent = code;
        toSelect.appendChild(optionTo);
      });
      fromSelect.value = 'USD';
      toSelect.value = 'EUR';
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      document.getElementById('conversionResult').textContent = 'Failed to load currency data.';
    }
  }
  
  async function convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const response = await fetch(CONFIG.EXCHANGE_API);
      const data = await response.json();
      const rates = data.rates;
      if (!rates[fromCurrency] || !rates[toCurrency]) {
        throw new Error('Currency not supported');
      }
      return amount * (rates[toCurrency] / rates[fromCurrency]);
    } catch (error) {
      console.error('Error converting currency:', error);
      return null;
    }
  }
  
  document.getElementById('converterForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const conversionResult = document.getElementById('conversionResult');
    conversionResult.textContent = 'Converting...';
    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
    if (convertedAmount !== null) {
      conversionResult.textContent = `Converting from ${fromCurrency} TO ${toCurrency}: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`;
    } else {
      conversionResult.textContent = 'Conversion failed. Please try again.';
    }
  });
  
  window.addEventListener('DOMContentLoaded', fetchRates);
  
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.destination-card').forEach(card => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top bottom-=100'
      },
      y: 100,
      opacity: 0,
      duration: 0.8
    });
  });
  