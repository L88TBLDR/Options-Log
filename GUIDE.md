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
2. Tap the **Share** button (box with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **Add to Home Screen**
4. Change the name to **Options Log** if it isn't already, then tap **Add**
5. The app icon appears on your home screen — open it from there for the full-screen experience

> **Note:** If you previously had an older version installed, delete it first and re-add to pick up the latest icon and name.

### Android (Chrome)
1. Open Chrome and visit the URL above
2. Tap the three-dot menu → **Add to Home screen** → **Install**

### Desktop
Visit the URL in any browser. Chrome/Edge will show an install button in the address bar.

---

## 2. First-Time Setup

Before logging trades, configure these settings once. Tap **Settings** (gear icon, bottom nav).

### Profile — Your Name
Tap the profile card at the top of Settings.
- Enter your first name. It appears in the dashboard greeting ("Good morning, Leon.").

### Capital — Account Balance
**Settings → Capital**
This is critical — many calculations depend on it.

| Field | What to enter |
|---|---|
| **USD Account** | Your current total account value in USD (cash + unrealised value) |
| **SGD Account** | Enable if you hold a separate SGD-denominated account |
| **Total deposited** | Your original capital contribution (used to calculate portfolio return %) |
| **Margin %** | Your broker's margin requirement (default 20%) |

> Keep your account balance updated periodically — the Capital Utilisation and Capital Efficiency metrics are based on this number.

### Monthly Target
**Settings → Monthly target**

Choose between:
- **Fixed $** — e.g. $500/month net P&L goal
- **% of equity** — e.g. 1% of your account balance per month

The dashboard shows your progress toward this target in the Monthly target KPI tile.

### Fee Plan
**Settings → Fee plan**

Select your broker's commission structure. Pre-configured plans:

| Plan | Best for |
|---|---|
| **Tiger Ultra-low** | Tiger Brokers ultra-low tier ($0.65/contract) |
| **Tiger Regular** | Tiger Brokers regular tier (min $2.99/order) |
| **Moomoo Fixed** | Moomoo fixed rate (min $1.99) |
| **IBKR** | Interactive Brokers ($0.65/contract) |
| **Commission-free** | Zero commission (pass-through fees still apply) |
| **Custom** | Enter your own rates manually |

Toggle **GST** on/off and set the GST rate if applicable (Singapore users: 9%).

The app automatically calculates open and close leg fees for every trade based on this plan.

### Log Form Fields
**Settings → Log form fields**

Toggle which optional fields appear when logging a trade. Recommended to enable:
- **IV%** — implied volatility at entry (useful for analytics)
- **Delta** — your directional exposure
- **Notes** — for recording your thesis or exit reason

---

## 3. Logging a Trade

Tap **Log** (+ icon, bottom nav).

### Step 1 — Select a Strategy
Tap the strategy chip that matches your trade:

| Strategy | What it means |
|---|---|
| **CSP** | Cash-Secured Put — sell a put, secure with cash |
| **CC** | Covered Call — sell a call against stock you own |
| **PMCC** | Poor Man's Covered Call — long LEAP + short call |
| **Diagonal** | Calendar diagonal spread |
| **Bull Put** | Bull Put spread (sell higher put, buy lower put) |
| **Bear Call** | Bear Call spread (sell lower call, buy higher call) |
| **Stock Sale** | Sale of underlying shares (for completing a wheel) |

### Step 2 — Fill in the Fields

| Field | Notes |
|---|---|
| **Ticker** | Stock symbol, auto-capitalised (e.g. NVDA) |
| **Open date** | Date you entered the position |
| **Expiry** | Option expiry date — DTE auto-calculates |
| **Strike** | Strike price in dollars |
| **Premium/sh** | Credit received per share (e.g. $1.32 for a $132 premium on 1 contract) |
| **Contracts** | Number of contracts (1 contract = 100 shares) |
| **IV%** | Implied volatility at entry (find this on your broker app) |
| **Delta** | Delta at entry — use negative for puts (e.g. -0.25) |
| **Notes** | Optional — record your reasoning or target exit |

### Step 3 — Review the Live Calculator
The **Live calc** card below the form updates as you type:

| Metric | Formula |
|---|---|
| **Premium** | Premium × Contracts × 100 |
| **Collateral** | Strike × Contracts × 100 (for puts) |
| **Yield** | Premium / Collateral × 100% |
| **Annualised** | Yield × (365 / DTE) |

### Step 4 — Log & Save
Tap **Log & save**. The trade appears in your open positions and History.

---

## 4. Managing Open Positions

### Closing a Position
From the **Dashboard** open positions list or **History** tab:
1. Tap the **C** button on the right of any open trade
2. Fill in the Close modal:
   - **Close date** — date you exited
   - **Outcome** — Expired / Closed / Assigned / Sold
   - **Close cost per contract** — the buyback cost per share (0 if expired worthless)
3. Tap **Confirm**

The app calculates:
- **P&L** = (Premium - Close cost) × Contracts × 100
- **Net P&L** = P&L minus total fees (open + close leg)

### Editing a Trade
Tap the **E** button to open the Edit modal. You can update any field including:
- Strike, premium, contracts, expiry
- IV, delta, notes
- **Fee overrides** — manually set the open or close leg fee if needed

### Deleting a Trade (Mobile)
On the Dashboard open positions list, **swipe left** on any row to reveal the Delete button.

---

## 5. Dashboard Explained

### Greeting Header
Shows your name and time-of-day greeting. Set your name in Settings → Profile.

### KPI Tiles (2×2 grid)

**Gross P&L**
- Top number: total realised gross P&L across all closed options trades
- Sub-line: total fees paid
- Net line: gross P&L minus all fees
- Sparkline: cumulative P&L trajectory over time

**Win Rate**
- Percentage of closed options trades that were profitable (P&L > 0)
- Donut shows fill proportion; percentage shown inside
- Sub-line: wins vs losses count

**Open Premium**
- Total credit collected across all currently open positions
- Progress bar: open premium as a % of your monthly target
- Sub-line: number of open positions

**Monthly Target**
- Net P&L realised this calendar month
- Donut shows % of your monthly target achieved
- Sub-line: target amount

### Capital Utilisation Widget
Shows how much of your equity is deployed in open options positions.

| Row | Meaning |
|---|---|
| **Deployed / Equity** | Notional value of open positions / your total account equity |
| **Available** | Equity minus deployed (negative = leveraged beyond account size) |
| **Total deposited** | Your original capital contribution |
| **Return on portfolio** | (Current equity − Deposited) / Deposited % |

The donut arc shows utilisation %. Over 100% means you are using margin/leverage (intentional for some strategies). The colour shifts amber at 60% and red at 80%.

### Open Positions List
All currently open trades with strike, expiry, DTE, and credit collected. Tap **E** to edit, **C** to close.

### Cumulative P&L Chart
(Analytics tab) Shows the total realised P&L growth curve over time.

---

## 6. Analytics Explained

### Efficiency Card

**Premium Efficiency**
- Net P&L ÷ Total premium collected × 100%
- Answers: "Of every $1 I collected in premium, how much did I keep?"
- Higher is better. 100% = all trades expired worthless with no buyback cost.

**Capital Efficiency**
- Total net P&L ÷ Current equity × 100%
- Answers: "What return am I generating on my account balance?"
- This is your overall account-level return, net of all fees.

**Avg ROC** (Return on Collateral)
- Average of (Net P&L / Collateral × 365 / DTE) across all closed trades
- Annualised return per trade, normalised for time and capital deployed.

**Avg DTE**
- Average days-to-expiry at the time you opened positions.
- Useful for understanding your typical time horizon.

### Monthly ROC Bar Chart
Each bar = one calendar month's net P&L ÷ equity at the **start** of that month.
- Because equity grows as you profit, each month's ROC uses the equity base at the beginning of that specific month — not today's equity.
- This gives an accurate picture of compounding returns over time.
- Last 6 months shown. Bar height is relative to your best month.

### Monthly Net P&L Chart
Gross bar chart showing net realised P&L per calendar month (last 6 months). Useful for spotting seasonal patterns or drawdown months.

### Cumulative P&L (with Range Picker)
The running total of all realised P&L since you started.
- Use the range buttons to zoom: **1W**, **1M**, **3M**, **YTD**, **ALL**
- The range is date-based (3M = last 3 calendar months, not last 3 months worth of trades)

### P&L by Ticker
Net P&L grouped by underlying stock. Shows which tickers are generating returns vs losses. Use the range picker to filter by time period.

### Efficiency by Ticker
Two-column bar for each ticker:
- **$/c** — net P&L per dollar of premium collected (higher = more efficient)
- **ROC** — net P&L as % of collateral committed (annualised ROC)

### Strategy Mix
Count and aggregate P&L per strategy type (CSP, CC, PMCC, etc.) including Stock Sales. Useful for understanding where your returns are coming from.

### Outcome Breakdown
Distribution of how your trades closed: Expired, Closed early, Assigned, or Sold. Ideal outcome for premium sellers = high Expired %.

---

## 7. History Tab

### Filtering
Use the three chip rows at the top:
- **Period** — All, This month, Last month, This year
- **Outcome** — All, Expired, Closed, Assigned, Sold
- **Strategy** — All, CSP, CC, PMCC, etc.

### Trade Rows
Each closed trade shows all columns configured in **Settings → History columns**. Key columns:

| Column | Meaning |
|---|---|
| **P&L** | Gross profit/loss on the trade |
| **Net P&L** | P&L after all fees |
| **P&L%** | Net P&L as % of premium collected |
| **P&L/Collat** | Net P&L as % of capital at risk (capEff) |
| **AROC** | Annualised return on collateral |
| **Fees** | Total fees paid (open + close leg) |

### P&L Summary Bar
The coloured bar at the top of History shows the month-by-month net P&L split — green for profit months, red for loss months.

### Fee Editing
Tap the **F** button on any closed trade to override the open or close leg fee if your broker charged differently from the pre-configured plan.

---

## 8. Importing Existing Records with AI

If you have existing trade records in a spreadsheet, broker export, or notes app, you can use an AI assistant (Claude, ChatGPT, Gemini) to convert them into the app's format.

### Step 1 — Gather Your Records
Export or copy your existing trades. They can be in any format:
- CSV from Excel or Google Sheets
- Copy-paste from your broker's trade history
- Manual notes

### Step 2 — Use This AI Prompt

Copy the prompt below and paste it into Claude (claude.ai) or ChatGPT, followed by your raw data:

---

```
I want to import my options trading records into a web app called Options Log.
Convert my records below into a valid JSON array matching exactly this schema.
Return ONLY the JSON array with no explanation.

Field rules:
- id: sequential integer starting at 1
- ticker: stock symbol string (e.g. "NVDA")
- type: one of "CSP", "CC", "PMCC", "Diagonal", "Bull Put", "Bear Call", "Stock Sale"
- openDate: "YYYY-MM-DD"
- expiry: "YYYY-MM-DD" or null for Stock Sale
- strike: number (e.g. 170)
- premium: number — premium per share (e.g. 1.32 means $132 for 1 contract)
- contracts: integer number of contracts
- underlying: stock price at open (0 if unknown)
- iv: implied volatility as a percentage (e.g. 85.5), use 0 if unknown
- delta: delta at open (negative for puts, e.g. -0.25), use 0 if unknown
- dte: integer days to expiry at open
- notes: string (empty string if none)
- totalCredit: premium × contracts × 100 (or for Stock Sale: premium × contracts)
- status: "open" or "closed"
- closedDate: "YYYY-MM-DD" or null if open
- closeCost: cost to close per share (0 if expired worthless or still open)
- outcome: "Expired", "Closed", "Assigned", or "Sold" — null if open
- pnl: (premium - closeCost) × contracts × 100, null if open
- feesOpen: estimated open leg brokerage fee in dollars (use 0 if unknown)
- feesClose: estimated close leg fee (0 if expired/assigned or unknown)
- feesTotal: feesOpen + feesClose
- pnlNet: pnl - feesTotal, null if open

My records:
[PASTE YOUR DATA HERE]
```

---

### Step 3 — Review the Output
The AI will return a JSON array. Review it briefly to check:
- Dates are in YYYY-MM-DD format
- Types match the allowed values
- Premium is per-share (not total — $1.32, not $132)
- Open trades have `"status": "open"` and `null` values for close fields

### Step 4 — Import into Options Log
1. Go to **Settings → Export, import & backup**
2. Tap **Import JSON**
3. Paste the JSON array from the AI
4. Tap **Import** — trades are merged with any existing records

> **Tip:** If you're unsure about fees, set `feesOpen` and `feesClose` to 0. You can edit individual trades later using the **F** button in History or the **E** edit button.

---

## 9. Exporting & Backing Up Your Data

**Settings → Export, import & backup**

| Option | What it does |
|---|---|
| **Export JSON** | Downloads your complete trade database as a JSON file — use for backup or migrating to a new device |
| **Export CSV** | Downloads a spreadsheet-compatible CSV of all trades |
| **Import JSON** | Restores or merges a previously exported JSON file |
| **Clear all data** | Permanently deletes all trades and resets the app — cannot be undone |

### Moving to a New Device
1. On your old device: **Settings → Export JSON** and save/send the file
2. On your new device: install the app, go to **Settings → Import JSON**, paste the file contents

### Recommended Backup Schedule
Export JSON once a month and save to iCloud, Google Drive, or email to yourself. The app stores data in your browser's local storage — clearing your browser data or cache can erase it.

---

## Quick Reference

| Action | Where |
|---|---|
| Log a new trade | Log tab → fill form → Log & save |
| Close a position | Dashboard or History → C button |
| Edit a trade | Dashboard or History → E button |
| Override fees | History → F button |
| Set account balance | Settings → Capital |
| Change fee plan | Settings → Fee plan |
| Change monthly target | Settings → Monthly target |
| Set your name | Settings → tap profile card |
| Export data | Settings → Export, import & backup |
| Import AI-converted data | Settings → Export, import & backup → Import JSON |
