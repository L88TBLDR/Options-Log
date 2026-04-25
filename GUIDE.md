# Options Log — User Guide

## Table of Contents
1. [Installing the App](#1-installing-the-app)
2. [First-Time Setup](#2-first-time-setup)
3. [Logging a Trade](#3-logging-a-trade)
4. [Managing Open Positions](#4-managing-open-positions)
5. [Dashboard Explained](#5-dashboard-explained)
6. [Analytics Explained](#6-analytics-explained)
7. [History Tab](#7-history-tab)
8. [Importing Existing Records with AI](#8-importing-existing-records-with-ai)
9. [Exporting & Backing Up Your Data](#9-exporting--backing-up-your-data)

---

## 1. Installing the App

Options Log is a **Progressive Web App (PWA)** — it runs in your browser but installs like a native app with no App Store required.

### iPhone / iPad (Safari only)
1. Open **Safari** and go to `https://l88tbldr.github.io/Options-Log/`
2. Tap the **Share** button (box with arrow pointing up) at the bottom of Safari
3. Scroll down and tap **Add to Home Screen**
4. Confirm the name is **Options Log**, then tap **Add**
5. The app icon appears on your home screen — open it from there for the full-screen experience

> **Note:** If you had an older version installed, delete it first and re-add to pick up the latest icon and name.

### Android (Chrome)
1. Open Chrome and visit the URL above
2. Tap the three-dot menu → **Add to Home screen** → **Install**

---

## 2. First-Time Setup

Before logging trades, configure these settings. Tap the **Settings** tab (gear icon, bottom nav).

### Profile — Your Name
Tap the profile card at the top of Settings.
- Enter your display name. It appears in the dashboard greeting.

### Appearance
**Settings → Appearance** — switch between Dark and Light theme.

### Capital — Account Balance
**Settings → Capital**

| Field | What to enter |
|---|---|
| **Current portfolio value (USD)** | Your total account equity today — cash plus any unrealised value. This drives the Capital Utilisation widget and Capital Efficiency metric. |
| **Total deposited (USD)** | All funds you personally deposited. Used as a reference to show your overall portfolio return %. |

> Keep your portfolio value updated periodically as your account grows.

### Monthly Target
**Settings → Monthly target**

Choose your mode and target:
- **Fixed $** — e.g. target $500 net P&L each month
- **% of equity** — e.g. target 1% of your account per month

The dashboard Monthly Target tile tracks your progress toward this goal in real time.

### Fee Plan
**Settings → Fee plan** — select your broker's commission structure:

| Plan | Description |
|---|---|
| **Tiger Ultra-low** | $0.65/contract (Tiger ultra-low tier) |
| **Tiger Regular** | Min $2.99/order |
| **Moomoo Fixed** | Min $1.99/order |
| **IBKR** | $0.65/contract |
| **Commission-free** | Zero commission (pass-through fees still apply) |
| **Custom** | Enter your own rates manually |

Toggle **GST** on/off and set the GST rate (Singapore users: 9%).

The app auto-calculates open and close leg fees on every trade based on this plan.

### Log Form Fields
**Settings → Log form fields** — choose which optional fields appear when logging a trade. Recommended: enable **IV%**, **Delta**, and **Notes**.

### History Columns
**Settings → History columns** — toggle which columns appear in the History tab.

---

## 3. Logging a Trade

Tap the **Log** tab (+ icon, bottom nav).

### Step 1 — Select a Strategy
Tap the strategy chip:

| Strategy | Description |
|---|---|
| **CSP** | Cash-Secured Put |
| **CC** | Covered Call |
| **PMCC** | Poor Man's Covered Call |
| **Diagonal** | Calendar diagonal spread |
| **Bull Put** | Bull Put spread |
| **Bear Call** | Bear Call spread |
| **Stock Sale** | Sale of underlying shares (e.g. completing a wheel) |

### Step 2 — Fill in the Fields

| Field | Notes |
|---|---|
| **Ticker** | Stock symbol, auto-capitalised (e.g. NVDA) |
| **Open date** | Date you entered the position |
| **Expiry** | Option expiry date — DTE calculates automatically |
| **Strike** | Strike price in dollars |
| **Premium/sh** | Credit received per share (e.g. enter 1.32 for a $132 premium on 1 contract) |
| **Contracts** | Number of contracts (1 = 100 shares) |
| **IV%** | Implied volatility at entry (from your broker) |
| **Delta** | Delta at entry — use negative for puts (e.g. -0.25) |
| **Notes** | Optional — record your thesis or exit plan |

### Step 3 — Review the Live Calculator
The **Live calc** card updates as you type:

| Metric | Formula |
|---|---|
| **Premium** | Premium × Contracts × 100 |
| **Collateral** | Strike × Contracts × 100 (for put strategies) |
| **Yield** | Premium ÷ Collateral × 100% |
| **Annualised** | Yield × (365 ÷ DTE) |

### Step 4 — Log & Save
Tap **Log & save**. The trade appears in open positions and History immediately.

---

## 4. Managing Open Positions

### Closing a Position
From the **Dashboard** open positions list or the **History** tab:
1. Tap the **Close** button on the trade row
2. Fill in the Close modal:
   - **Close date** — when you exited
   - **Outcome** — Expired / Closed / Assigned / Sold
   - **Close cost per contract** — your buyback cost per share; enter 0 if expired worthless
3. Tap **Confirm**

The app calculates:
- **P&L** = (Premium − Close cost) × Contracts × 100
- **Net P&L** = P&L minus total broker fees

### Editing a Trade
Tap the **Edit** button on any trade row to update any field, including overriding fees manually.

### Deleting a Trade
Tap **Del** on any trade row, or on mobile swipe left on an open position in the Dashboard.

---

## 5. Dashboard Explained

### Greeting
Shows your name and a time-of-day greeting. Set your name via Settings → profile card.

### KPI Tiles (2×2)

**Gross P&L**
- Total realised gross P&L across all closed options trades
- Sub-line shows total fees paid
- Net line shows gross P&L minus all fees
- Sparkline shows cumulative P&L trajectory

**Win Rate**
- % of closed trades that were profitable
- Percentage shown inside the donut ring
- Sub-line: wins vs losses count

**Open Premium**
- Total credit collected across all open positions
- Progress bar: open premium as % of your monthly target
- Sub-line: number of open positions

**Monthly Target**
- Net P&L realised this calendar month
- Donut shows % of monthly target achieved
- Sub-line: target amount

### Capital Utilisation

| Row | Meaning |
|---|---|
| **Deployed / Equity** | Total notional of open positions vs your account equity |
| **Available** | Equity minus deployed (negative = leveraged beyond equity) |
| **Total deposited** | Your original capital contributions |
| **Return on portfolio** | (Current equity − Deposited) ÷ Deposited % |

The donut shows utilisation %. Colour shifts amber above 60% and red above 80%. Over 100% means you are using leverage/margin intentionally.

### Open Positions
All currently open trades. **# OPEN** badge on the card title shows the count. Tap **Edit** or **Close** on any row.

### Cumulative P&L Chart
Running total of realised P&L over time. Full interactive version is in the Analytics tab with range pickers.

---

## 6. Analytics Explained

### Efficiency Stats

**Premium Efficiency**
Net P&L ÷ Total premium collected. "Of every $1 I collected, how much did I keep after buybacks and fees?" Higher is better; 100% = all trades expired worthless.

**Capital Efficiency**
Total net P&L ÷ Current equity. Your overall account-level net return since you started.

**Avg ROC** (Return on Collateral)
Average annualised return per trade: (Net P&L ÷ Collateral) × (365 ÷ DTE). Normalises trades of different sizes and durations.

**Avg DTE**
Average days-to-expiry at open across all closed trades. Shows your typical time horizon.

### Monthly ROC Bar Chart
One bar per calendar month. Each bar = that month's net P&L ÷ equity **at the start of that month** (deposited + all net P&L closed before it). This correctly captures compounding — as your account grows, the denominator grows too.

### Monthly Net P&L
Bar chart showing net realised P&L per month (last 6 months). Useful for spotting seasonal patterns or drawdown months.

### Cumulative P&L (Range Picker)
Running total of all realised P&L. Use **1W / 1M / 3M / YTD / ALL** to zoom. Ranges are date-based, not trade-count-based — 3M always means the last 3 calendar months.

### P&L by Ticker
Net P&L grouped by stock. Use the range picker to filter by period.

### Efficiency by Ticker
Two bars per ticker: premium efficiency ($/contract) and capital efficiency (ROC %). Identifies which underlyings are most productive.

### Strategy Mix
Aggregate count and P&L by strategy type including Stock Sales.

### Outcome Breakdown
Distribution of how trades closed: Expired / Closed / Assigned / Sold. High Expired % is the ideal for premium sellers.

---

## 7. History Tab

### Filters
Three scrollable chip rows at the top:
- **Period** — All, This month, Last month, This year, Custom date range
- **Outcome** — All, Open, Expired, Closed, Assigned, Sold
- **Strategy** — All, CSP, CC, PMCC, etc.

Use the **Ticker** dropdown to further narrow to a single stock. Tap **Clear** to reset all filters.

### Summary Bar
Shows total trades, premium collected, and net P&L for the filtered view.

### Trade Rows
Each row shows the badge, ticker, dates, DTE, IV, P&L, net P&L, outcome, fees, and cap efficiency. Tap **Edit**, **Close** (open trades), or **Del** on any row.

### Fee Override
Use the **F** button to manually override open or close leg fees if your broker charged differently from the configured fee plan.

### Batch Mode
Tap **Select** to enter batch mode — select multiple trades to delete, recalc fees, or bulk-change type or outcome.

---

## 8. Importing Existing Records with AI

If you have existing trade records in a spreadsheet or broker export, use an AI assistant to convert them to CSV format for import.

### Step 1 — Clear the Sample Trades First
The app ships with sample data. Before importing your real trades:
1. Go to **Settings → Export, import & backup**
2. Tap **Clear all data** and confirm
3. This removes all sample trades and resets the app

### Step 2 — Download the CSV Template
1. Still in **Settings → Export, import & backup**
2. Under *Trades only (CSV)*, tap **Download CSV template**
3. Open the downloaded file — it shows the exact column headers and one example row

The columns are:
```
id, ticker, type, openDate, expiry, strike, premium, contracts, underlying,
iv, delta, dte, notes, totalCredit, status, closedDate, closeCost, outcome,
pnl, feesOpen, feesClose, feesTotal, pnlNet
```

### Step 3 — Use This AI Prompt

Copy the prompt below into Claude (claude.ai) or ChatGPT, followed by your raw data:

---

```
I want to import my options trading history into a tracking app.
Convert my records into CSV format with exactly these headers in this order:

id,ticker,type,openDate,expiry,strike,premium,contracts,underlying,iv,delta,dte,notes,totalCredit,status,closedDate,closeCost,outcome,pnl,feesOpen,feesClose,feesTotal,pnlNet

Rules for each column:
- id: sequential integer starting at 1
- ticker: stock symbol (e.g. NVDA)
- type: one of CSP / CC / PMCC / Diagonal / Bull Put / Bear Call / Stock Sale
- openDate: YYYY-MM-DD
- expiry: YYYY-MM-DD — leave blank for Stock Sale
- strike: number (e.g. 170)
- premium: premium per share — e.g. 1.32 means $132 total for 1 contract
- contracts: integer
- underlying: stock price at open (use 0 if unknown)
- iv: implied volatility as a % number (e.g. 85.5), use 0 if unknown
- delta: delta at open, negative for puts (e.g. -0.25), use 0 if unknown
- dte: integer days to expiry at open
- notes: short text, empty if none
- totalCredit: premium × contracts × 100 (for Stock Sale: premium × contracts)
- status: open or closed
- closedDate: YYYY-MM-DD — blank if still open
- closeCost: close cost per share (0 if expired worthless or still open)
- outcome: Expired / Closed / Assigned / Sold — blank if open
- pnl: (premium - closeCost) × contracts × 100 — blank if open
- feesOpen: open leg fee in dollars (use 0 if unknown)
- feesClose: close leg fee in dollars (0 if expired/assigned or unknown)
- feesTotal: feesOpen + feesClose
- pnlNet: pnl - feesTotal — blank if open

Return ONLY the CSV, starting with the header row. No explanation.

My records:
[PASTE YOUR DATA HERE]
```

---

### Step 4 — Review the Output
Quickly check:
- Dates are YYYY-MM-DD format
- `type` values match exactly (e.g. `CSP` not `cash secured put`)
- `premium` is per-share, not total (e.g. `1.32` not `132`)
- Open trades have blank `closedDate`, `outcome`, `pnl`, `pnlNet`

### Step 5 — Import
1. Save the AI output as a `.csv` file (or copy it into a text file with `.csv` extension)
2. Go to **Settings → Export, import & backup**
3. Under *Trades only (CSV)*, set the import mode to **Replace — overwrite trades only**
4. Tap **Import from CSV** and select your file

> **Tip:** If fees are unknown, leave them as 0. You can recalculate them later using **Settings → Fee plan** and the **Recalc fees** option in History batch mode.

---

## 9. Exporting & Backing Up Your Data

**Settings → Export, import & backup**

### Full Backup (Recommended)
| Action | What it saves |
|---|---|
| **Export full backup** | All trades + all settings (fee plan, capital, target, etc.) as a JSON file |
| **Import full backup** | Restores everything from a full backup JSON file |

Use this to move to a new device or restore after a browser data clear.

### Trades Only (CSV)
| Action | Description |
|---|---|
| **Export trades CSV** | All trades in a spreadsheet-compatible CSV |
| **Download CSV template** | Blank template showing required column format |
| **Import from CSV** | Import trades with Merge (add new) or Replace (overwrite trades) mode |

### Recommended Backup Schedule
Export a **full backup** once a month and save it to iCloud, Google Drive, or email it to yourself. The app stores data in your browser's local storage — clearing your browser cache will erase it.

### Moving to a New Device
1. On your old device: **Export full backup** and send the file to yourself
2. On the new device: install the app, go to **Settings → Import full backup**, choose the file

### Clear All Data
**Settings → Clear all data** permanently deletes all trades and resets the app. This cannot be undone.

---

## Quick Reference

| Task | Where |
|---|---|
| Log a new trade | Log tab → select strategy → fill fields → Log & save |
| Close a position | Dashboard or History → Close button |
| Edit a trade | Dashboard or History → Edit button |
| Override fees on a trade | History → F button |
| Batch delete / recalc | History → Select button |
| Set account balance | Settings → Capital |
| Change fee plan | Settings → Fee plan |
| Change monthly target | Settings → Monthly target |
| Set your name | Settings → tap profile card |
| Download CSV template | Settings → Data → Download CSV template |
| Import AI-converted trades | Settings → Data → Import from CSV |
| Full backup | Settings → Data → Export full backup |
| Restore backup | Settings → Data → Import full backup |
| Clear sample data | Settings → Data → Clear all data |
