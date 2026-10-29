/* ------------------------------------------------------------------
   Simple weather app — data from open-meteo.com

   Today's weather on top, the next five days underneath.
   The icon is chosen from the daily chance of rain:

        < 20%  clear        20–49%  cloudy
      50–79%  drizzle      >= 80%  heavy rain

   Each of those four has a day and a night version. Replace the files
   in ./icons with your own artwork (same file names, or edit ICONS
   below). The pictures sit inside a small paper frame, so a plain
   white background in the JPG blends into the page.

   If a file is missing, an emoji is shown instead.
------------------------------------------------------------------ */

const ICONS = {
  clear:   { day: 'icons/clear-day.jpg',   night: 'icons/clear-night.jpg' },
  cloudy:  { day: 'icons/cloudy-day.jpg',  night: 'icons/cloudy-night.jpg' },
  drizzle: { day: 'icons/drizzle-day.jpg', night: 'icons/drizzle-night.jpg' },
  rain:    { day: 'icons/rain-day.jpg',    night: 'icons/rain-night.jpg' },
};

const FALLBACK_ICONS = {
  clear:   { day: '☀️', night: '🌙' },
  cloudy:  { day: '⛅', night: '☁️' },
  drizzle: { day: '🌦️', night: '🌧️' },
  rain:    { day: '🌧️', night: '🌧️' },
};

const LABELS = {
  clear: 'Clear sky',
  cloudy: 'Cloudy',
  drizzle: 'Light drizzle',
  rain: 'Heavy rain',
};

/* Chance of rain (%) needed to step up to the next icon. */
const RAIN_STEPS = { cloudy: 20, drizzle: 50, rain: 80 };

const DEFAULT_PLACE = { name: 'Athens, Greece', latitude: 37.9838, longitude: 23.7275 };

const $ = (id) => document.getElementById(id);

const el = {
  place: $('place'),
  status: $('status'),
  searchForm: $('search-form'),
  searchInput: $('search-input'),
  locateButton: $('locate-button'),
  todayIcon: $('today-icon'),
  todayTemp: $('today-temp'),
  todayCondition: $('today-condition'),
  todayFeels: $('today-feels'),
  todayRain: $('today-rain'),
  todayRange: $('today-range'),
  todayWind: $('today-wind'),
  forecastList: $('forecast-list'),
};

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------ */

const round = (value) => Math.round(Number(value));
const degrees = (value) => `${round(value)}°`;

function iconKind(chance) {
  if (chance >= RAIN_STEPS.rain) return 'rain';
  if (chance >= RAIN_STEPS.drizzle) return 'drizzle';
  if (chance >= RAIN_STEPS.cloudy) return 'cloudy';
  return 'clear';
}

/* Builds a framed picture, falling back to an emoji if the file is missing. */
function createIcon(kind, isDay) {
  const variant = isDay ? 'day' : 'night';

  const frame = document.createElement('div');
  frame.className = 'frame';

  const img = document.createElement('img');
  img.className = 'icon';
  img.alt = LABELS[kind];
  img.width = 320;
  img.height = 320;
  img.decoding = 'async';

  const showFallback = () => {
    if (!img.isConnected) return;
    const span = document.createElement('span');
    span.className = 'icon icon--fallback';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', LABELS[kind]);
    span.textContent = FALLBACK_ICONS[kind][variant];
    frame.replaceChildren(span);
  };

  img.addEventListener('error', showFallback);
  img.src = ICONS[kind][variant];

  // Covers a cached/failed load that finished before the listener ran.
  if (img.complete && img.naturalWidth === 0) showFallback();

  frame.append(img);
  return frame;
}

function setStatus(message, isError = false) {
  el.status.textContent = message;
  el.status.classList.toggle('status--error', isError);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

/* ------------------------------------------------------------------
   Data
------------------------------------------------------------------ */

async function fetchWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: 'temperature_2m,apparent_temperature,is_day,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '6',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  });

  return fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
}

async function searchPlace(query) {
  const params = new URLSearchParams({
    name: query,
    count: '1',
    language: 'en',
    format: 'json',
  });

  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  return data.results?.[0] ?? null;
}

/* ------------------------------------------------------------------
   Rendering
------------------------------------------------------------------ */

function renderToday(current, daily) {
  const chance = daily.precipitation_probability_max[0] ?? 0;
  const kind = iconKind(chance);
  const isDay = current.is_day === 1;

  document.documentElement.dataset.theme = isDay ? 'day' : 'night';

  el.todayIcon.replaceChildren(createIcon(kind, isDay));
  el.todayTemp.textContent = degrees(current.temperature_2m);
  el.todayCondition.textContent = LABELS[kind];
  el.todayFeels.textContent = degrees(current.apparent_temperature);
  el.todayRain.textContent = `${round(chance)}%`;
  el.todayRange.textContent = `${degrees(daily.temperature_2m_max[0])} / ${degrees(daily.temperature_2m_min[0])}`;
  el.todayWind.textContent = `${round(current.wind_speed_10m)} km/h`;
}

function renderForecast(daily) {
  const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

  const cards = daily.time.slice(1, 6).map((isoDate, index) => {
    const dayIndex = index + 1;
    const chance = daily.precipitation_probability_max[dayIndex] ?? 0;
    const kind = iconKind(chance);

    // Noon avoids date shifts from timezone offsets.
    const date = new Date(`${isoDate}T12:00:00`);

    const card = document.createElement('li');
    card.className = 'card';
    card.style.setProperty('--i', String(index));

    const day = document.createElement('p');
    day.className = 'card__day';
    day.textContent = dayFormat.format(date);

    const dateLabel = document.createElement('p');
    dateLabel.className = 'card__date';
    dateLabel.textContent = dateFormat.format(date);

    const icon = document.createElement('div');
    icon.className = 'card__icon';
    icon.append(createIcon(kind, true));

    const temp = document.createElement('p');
    temp.className = 'card__temp';
    temp.append(`${degrees(daily.temperature_2m_max[dayIndex])} `);
    const low = document.createElement('span');
    low.textContent = degrees(daily.temperature_2m_min[dayIndex]);
    temp.append(low);

    const rain = document.createElement('p');
    rain.className = 'card__rain';
    rain.textContent = `${round(chance)}% rain`;

    card.append(day, dateLabel, icon, temp, rain);
    return card;
  });

  el.forecastList.replaceChildren(...cards);
}

/* ------------------------------------------------------------------
   Flow
------------------------------------------------------------------ */

async function loadPlace(place) {
  el.place.textContent = place.name;
  setStatus('loading…');

  try {
    const data = await fetchWeather(place);
    renderToday(data.current, data.daily);
    renderForecast(data.daily);
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    setStatus(`updated ${time}`);
  } catch (error) {
    console.error(error);
    setStatus('couldn’t load the weather — check your connection and try again.', true);
  }
}

function getBrowserPlace() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        name: 'Your location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      reject,
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

el.searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = el.searchInput.value.trim();
  if (!query) return;

  setStatus(`looking for “${query}”…`);

  try {
    const hit = await searchPlace(query);
    if (!hit) {
      setStatus(`couldn’t find “${query}”`, true);
      return;
    }

    el.searchInput.value = '';
    await loadPlace({
      name: [hit.name, hit.country].filter(Boolean).join(', '),
      latitude: hit.latitude,
      longitude: hit.longitude,
    });
  } catch (error) {
    console.error(error);
    setStatus('search failed — try again', true);
  }
});

el.locateButton.addEventListener('click', async () => {
  setStatus('finding you…');

  try {
    await loadPlace(await getBrowserPlace());
  } catch {
    setStatus('no location — showing athens instead', true);
    await loadPlace(DEFAULT_PLACE);
  }
});

/* Start with the default city; the 📍 button switches to geolocation. */
loadPlace(DEFAULT_PLACE);
