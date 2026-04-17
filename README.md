# Options Tracker — Source

PWA options trading tracker for iPhone. Deployed at https://l88tbldr.github.io/Options-Tracker/

## Project structure

```
options-tracker-src/
├── app.js          ← All application logic (~68 KB)
├── style.css       ← All styles (~12 KB)
├── body.html       ← HTML body, modals, nav (~8 KB)
├── chartjs.js      ← Chart.js v4 inlined (~200 KB, don't edit)
├── icons_b64.txt   ← PWA icons as base64 (don't edit)
├── build.py        ← Build script → dist/index.html
└── dist/
    └── index.html  ← Final self-contained output (upload this to GitHub)
```

## Build

```bash
# One-time build
python3 build.py

# Watch mode — rebuilds on any source change
python3 build.py --watch
```

Output is `dist/index.html` — a single fully self-contained HTML file.
Upload it directly to the GitHub repo root to deploy.

## Storage

- localStorage key: `ot_v7`
- Settings key: `ot_settings_v7`
- Migrates from `ot_v4`, `ot_v5`, `ot_v6`

## Architecture notes

- **No framework, no bundler** — vanilla JS with Chart.js
- **Single file output** — PWA manifest, service worker, icons all inlined as base64
- `app.js` uses `__SEED__` and `__SW_B64__` placeholders that `build.py` injects
- `body.html` contains the full HTML body including all modals
- The service worker is registered from a blob URL to work on GitHub Pages

## Key functions in app.js

| Function | Purpose |
|---|---|
| `renderDashboard()` | Dashboard tab — cards, capital widget, charts, open positions |
| `renderCapitalWidget()` | v4-style 3-card + utilbar (Equity / Collateral / Free) |
| `renderAnalytics()` | Analytics tab — metrics, per-ticker, charts |
| `renderHistory()` | History tab — filtered trade list |
| `renderSettingsSub(id, el)` | Settings sub-screens: appearance, target, account, fees, logfields, histcols, data |
| `renderFeeSubScreen(el)` | Fee preset pills + scope recalculate buttons |
| `showEdit(id)` | Pre-fill and open edit modal |
| `confirmEdit()` | Save edits, recalc fees/pnlNet |
| `showClose(id)` / `confirmClose()` | Close position modal |
| `calcFees(trade, outcome)` | Tiger Ultra-low fee model with GST |
| `recomputeFees(scope)` | Recalculate fees: `'open'` or `'all'` |
| `updateCapBalance(val)` | Safe USD balance setter |
| `setHistPeriod(v)` | Period filter: all / thismonth / lastmonth / thisyear / custom |
| `logTrade()` | Log new trade from form |
| `exportCSV()` / `handleImport()` | CSV export/import |

## Fee model (Tiger Ultra-low)

- Commission: $0.65/contract
- Platform fee: $0 (ultra-low tier)
- ORF: $0.0002395/contract
- OCC: $0.02/contract
- GST: 9% on commission + platform
- Stock sales: fixed $5.07 flat fee

## Monthly target modes

- `amount` — fixed USD per month (e.g. $500)
- `pct` — percentage of account equity (e.g. 1.5%)
- Stored in `state.settings.monthlyTarget` + `state.settings.monthlyTargetMode`
