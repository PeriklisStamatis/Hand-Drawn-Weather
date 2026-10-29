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

   The page runs in English or Greek; see STRINGS below for every bit
   of text. The language also picks the font stack in styles.css
   (Beth Ellen for Latin, Mynerve for Greek).
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

const STRINGS = {
  en: {
    title: 'Weather — Today & Next 5 Days',
    today: 'today',
    feelsLike: 'feels like',
    rainChance: 'rain chance',
    highLow: 'high / low',
    wind: 'wind',
    next5: 'next 5 days',
    searchPlaceholder: 'search a city…',
    searchLabel: 'Search for a city',
    lookItUp: 'look it up',
    nearMe: 'near me',
    nearMeTitle: 'Use my location',
    yourLocation: 'Your location',
    defaultPlace: 'Athens, Greece',
    rainSuffix: 'rain',
    conditions: {
      clear: 'Clear sky',
      cloudy: 'Cloudy',
      drizzle: 'Light drizzle',
      rain: 'Heavy rain',
    },
    loading: 'loading…',
    updated: 'updated {time}',
    loadError: 'couldn’t load the weather — check your connection and try again.',
    looking: 'looking for “{query}”…',
    notFound: 'couldn’t find “{query}”',
    searchFailed: 'search failed — try again',
    finding: 'finding you…',
    noLocation: 'no location — showing athens instead',
  },
  el: {
    title: 'Καιρός — σήμερα & οι επόμενες 5 ημέρες',
    today: 'σήμερα',
    feelsLike: 'αίσθηση',
    rainChance: 'πιθανότητα βροχής',
    highLow: 'μέγιστη / ελάχιστη',
    wind: 'άνεμος',
    next5: 'επόμενες 5 ημέρες',
    searchPlaceholder: 'αναζήτηση πόλης…',
    searchLabel: 'Αναζήτηση πόλης',
    lookItUp: 'ψάξε',
    nearMe: 'κοντά μου',
    nearMeTitle: 'Χρήση της θέσης μου',
    yourLocation: 'η θέση σου',
    defaultPlace: 'Αθήνα, Ελλάδα',
    rainSuffix: 'βροχή',
    conditions: {
      clear: 'καθαρός ουρανός',
      cloudy: 'συννεφιά',
      drizzle: 'ψιλόβροχο',
      rain: 'δυνατή βροχή',
    },
    loading: 'φόρτωση…',
    updated: 'ενημέρωση {time}',
    loadError: 'δεν φόρτωσε ο καιρός — έλεγξε τη σύνδεση και δοκίμασε ξανά',
    looking: 'ψάχνω «{query}»…',
    notFound: 'δεν βρήκα «{query}»',
    searchFailed: 'η αναζήτηση απέτυχε — δοκίμασε ξανά',
    finding: 'εντοπισμός θέσης…',
    noLocation: 'χωρίς τοποθεσία — δείχνω Αθήνα',
  },
};

const LOCALES = { en: 'en-GB', el: 'el-GR' };

/* Chance of rain (%) needed to step up to the next icon. */
const RAIN_STEPS = { cloudy: 20, drizzle: 50, rain: 80 };

const DEFAULT_PLACE = { latitude: 37.9838, longitude: 23.7275 };

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

let lang = document.documentElement.dataset.lang === 'el' ? 'el' : 'en';
let currentPlace = { kind: 'default', ...DEFAULT_PLACE };
let lastData = null;
let lastUpdated = '';

/* ------------------------------------------------------------------
   Text
------------------------------------------------------------------ */

function t(key) {
  return STRINGS[lang][key] ?? STRINGS.en[key];
}

function tpl(key, vars) {
  return t(key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

function applyStaticText() {
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  document.title = t('title');

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  }
  for (const node of document.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }
  for (const node of document.querySelectorAll('[data-i18n-title]')) {
    node.title = t(node.dataset.i18nTitle);
  }
  for (const button of document.querySelectorAll('[data-lang-btn]')) {
    button.setAttribute('aria-pressed', String(button.dataset.langBtn === lang));
  }
}

function placeLabel() {
  if (currentPlace.kind === 'search') return currentPlace.name;
  if (currentPlace.kind === 'geo') return t('yourLocation');
  return t('defaultPlace');
}

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
  const label = t('conditions')[kind];

  const frame = document.createElement('div');
  frame.className = 'frame';

  const img = document.createElement('img');
  img.className = 'icon';
  img.alt = label;
  img.width = 320;
  img.height = 320;
  img.decoding = 'async';

  const showFallback = () => {
    if (!img.isConnected) return;
    const span = document.createElement('span');
    span.className = 'icon icon--fallback';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
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
    language: lang,
    format: 'json',
  });

  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  return data.results?.[0] ?? null;
}

async function fetchPlaceById(id) {
  const params = new URLSearchParams({ id, language: lang });
  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/get?${params}`);
  return data?.id ? data : null;
}

const placeName = (hit) => [hit.name, hit.country].filter(Boolean).join(', ');

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
  el.todayCondition.textContent = t('conditions')[kind];
  el.todayFeels.textContent = degrees(current.apparent_temperature);
  el.todayRain.textContent = `${round(chance)}%`;
  el.todayRange.textContent = `${degrees(daily.temperature_2m_max[0])} / ${degrees(daily.temperature_2m_min[0])}`;
  el.todayWind.textContent = `${round(current.wind_speed_10m)} km/h`;
}

function renderForecast(daily) {
  const locale = LOCALES[lang];
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });

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
    rain.textContent = `${round(chance)}% ${t('rainSuffix')}`;

    card.append(day, dateLabel, icon, temp, rain);
    return card;
  });

  el.forecastList.replaceChildren(...cards);
}

function render(data) {
  renderToday(data.current, data.daily);
  renderForecast(data.daily);
}

/* ------------------------------------------------------------------
   Flow
------------------------------------------------------------------ */

async function loadPlace() {
  el.place.textContent = placeLabel();
  setStatus(t('loading'));

  try {
    const data = await fetchWeather(currentPlace);
    lastData = data;
    lastUpdated = new Date().toLocaleTimeString(LOCALES[lang], {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    render(data);
    setStatus(tpl('updated', { time: lastUpdated }));
  } catch (error) {
    console.error(error);
    setStatus(t('loadError'), true);
  }
}

async function setLanguage(next) {
  if (next === lang) return;

  lang = next;
  try {
    localStorage.setItem('weather-lang', lang);
  } catch (error) {
    /* private mode — the choice just won't be remembered */
  }

  applyStaticText();
  el.place.textContent = placeLabel();

  // A searched city should come back in the new language too. Looking it up
  // by id keeps the exact same place (a Greek name can't be searched in
  // English, for example).
  if (currentPlace.kind === 'search') {
    try {
      const hit = currentPlace.id
        ? await fetchPlaceById(currentPlace.id)
        : await searchPlace(currentPlace.query);
      if (hit) {
        currentPlace.name = placeName(hit);
        el.place.textContent = placeLabel();
      }
    } catch (error) {
      /* keep the name we already have */
    }
  }

  if (lastData) {
    render(lastData);
    if (lastUpdated) setStatus(tpl('updated', { time: lastUpdated }));
  } else {
    await loadPlace();
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

  setStatus(tpl('looking', { query }));

  try {
    const hit = await searchPlace(query);
    if (!hit) {
      setStatus(tpl('notFound', { query }), true);
      return;
    }

    el.searchInput.value = '';
    currentPlace = {
      kind: 'search',
      id: hit.id,
      query,
      name: placeName(hit),
      latitude: hit.latitude,
      longitude: hit.longitude,
    };
    await loadPlace();
  } catch (error) {
    console.error(error);
    setStatus(t('searchFailed'), true);
  }
});

el.locateButton.addEventListener('click', async () => {
  setStatus(t('finding'));

  try {
    const position = await getBrowserPlace();
    currentPlace = { kind: 'geo', ...position };
    await loadPlace();
  } catch {
    currentPlace = { kind: 'default', ...DEFAULT_PLACE };
    await loadPlace();
    setStatus(t('noLocation'), true);
  }
});

for (const button of document.querySelectorAll('[data-lang-btn]')) {
  button.addEventListener('click', () => setLanguage(button.dataset.langBtn));
}

/* Start with the default city; the "near me" button switches to geolocation. */
applyStaticText();
loadPlace();
