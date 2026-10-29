# Weather — today + next 5 days

A tiny static weather app that looks like a page from someone's notebook:
cream paper with a heavy grain, ruled lines, handwritten type, ink underlines
and photos taped into little frames. It speaks English and Greek.

Weather data comes from [Open-Meteo](https://open-meteo.com/) — no API key, no
build step, no dependencies. Fonts are bundled in `fonts/`, so nothing is
fetched from a CDN.

## Run it

Open `index.html` in a browser, or serve the folder (most reliable, and needed
for the "near me" button):

```sh
python3 -m http.server 8000
# then open http://127.0.0.1:8000
```

It starts on Athens. Type a city and hit `look it up`, or press `near me` to use
your current position.

## English / Greek

The `english · ελληνικά` switch next to the place name flips the whole page:
labels, condition names, weekday and date formatting, and the language sent to
the Open-Meteo geocoder, so city names come back as `Αθήνα, Ελλάδα` instead of
`Athens, Greece` and vice versa. The choice is kept in `localStorage`; on a
first visit the page follows the browser's language.

All of the text lives in the `STRINGS` object at the top of `app.js` — two
objects, `en` and `el`. To add a third language, copy one of them and add a
matching entry to `LOCALES` and to the language switch in `index.html`.

Two fonts are used, chosen by the `data-lang` attribute on `<html>`:

| Language | Font | Notes |
| -------- | ---- | ----- |
| English  | **Beth Ellen** | Latin only, single weight |
| Greek    | **Mynerve**    | Greek + Latin, single weight |

Both are SIL Open Font Licensed and self-hosted as woff2 in `fonts/`
(`BethEllen-OFL.txt`, `Mynerve-OFL.txt`). Because both faces are in the font
stack and each `@font-face` declares its `unicode-range`, a Greek name on the
English page still gets Greek letterforms instead of a system font.

## How the icon is chosen

The icon comes from the daily **chance of rain** (`precipitation_probability_max`):

| Chance of rain | Icon group |
| -------------- | ---------- |
| below 20 %     | clear      |
| 20 – 49 %      | cloudy     |
| 50 – 79 %      | drizzle    |
| 80 % and up    | heavy rain |

Edit `RAIN_STEPS` at the top of `app.js` to move those thresholds.

Each group has a day and a night version:

| Group   | Day                  | Night                  |
| ------- | -------------------- | ---------------------- |
| clear   | `icons/clear-day.jpg`   | `icons/clear-night.jpg`   |
| cloudy  | `icons/cloudy-day.jpg`  | `icons/cloudy-night.jpg`  |
| drizzle | `icons/drizzle-day.jpg` | `icons/drizzle-night.jpg` |
| rain    | `icons/rain-day.jpg`    | `icons/rain-night.jpg`    |

* Today's big icon uses the night version when Open-Meteo reports `is_day = 0`,
  and the paper dims a shade (like a lamp-lit desk) — it stays cream, never
  turns black.
* The five forecast cards always use the day icon, since each card stands for a
  whole day.

## Replacing the icons

The eight files in `icons/` are 320 × 320 JPGs with a plain white background.
Drop your own JPGs in with the same names and they will just work.

Because JPGs can't be transparent, each one sits inside a small "taped photo"
frame (`background: var(--mat)` in `styles.css`). The frame's mat is near-white
(`#fffdf8`), so a white icon background melts into it instead of showing a hard
rectangle. If your artwork has a different background colour, set `--mat` to
match it.

If a file is missing, the app falls back to an emoji inside the frame, so it
never breaks.

## Tweaking the look

Everything lives at the top of `styles.css`:

| Variable | What it does |
| -------- | ------------ |
| `--paper` | page colour (day) |
| `--ink`, `--ink-soft` | text colours |
| `--pen` | blue ink used by links and buttons |
| `--pencil` | border colour of cards and frames |
| `--mat` | colour behind the icon photos |
| `--vignette` | how much the page edges darken |
| `--font-hand`, `--font-display` | the handwriting (swapped per language) |

The paper grain is four stacked `background-image` layers on `html` — three
brown-tinted SVG noise layers (fine tooth, fibres, broad fibres) plus faint
ruled lines. Lower the alpha inside those `feColorMatrix` values for a smoother
paper.

## Files

| File | Purpose |
| ---- | ------- |
| `index.html` | Markup |
| `styles.css` | Paper, ink, frames, layout |
| `app.js`     | API calls, icon choice, rendering |
| `icons/`     | The eight weather photos (JPG) |
| `fonts/`     | Beth Ellen + Mynerve (woff2, self-hosted) and their OFL licences |

## License

GNU GPL v3 — see [LICENSE](LICENSE).
