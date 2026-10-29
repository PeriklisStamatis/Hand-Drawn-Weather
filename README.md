# Weather — today + next 5 days

A tiny static weather app that looks like a page from someone's notebook:
cream paper with a heavy grain, ruled lines, handwritten type, ink underlines
and photos taped into little frames.

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
| `fonts/`     | Caveat + Patrick Hand (woff2, self-hosted) |

## License

GNU GPL v3 — see [LICENSE](LICENSE).
