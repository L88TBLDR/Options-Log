#!/usr/bin/env python3
"""
Options Tracker — build script
Assembles index.html from source parts.

Usage:
    python3 build.py           → writes dist/index.html
    python3 build.py --watch   → rebuilds on any source file change
"""

import base64, json, os, sys, subprocess, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SRC = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(SRC, "dist")
OUT  = os.path.join(DIST, "index.html")

SOURCE_FILES = ["app.js", "style.css", "body.html", "chartjs.js", "icons_b64.txt"]

SEED = '[{"id":1,"ticker":"CRWV","type":"CSP","openDate":"2026-03-11","expiry":"2026-03-13","strike":77,"premium":1.32,"contracts":1,"underlying":0,"iv":137.1,"delta":-0.252,"dte":2,"notes":"","totalCredit":132,"status":"closed","closedDate":"2026-03-13","closeCost":0,"outcome":"Expired","pnl":132,"feesOpen":0.76,"feesClose":0,"feesTotal":0.76,"pnlNet":131.24},{"id":2,"ticker":"CRWV","type":"CSP","openDate":"2026-03-12","expiry":"2026-03-20","strike":77,"premium":3.15,"contracts":1,"underlying":0,"iv":96.5,"delta":-0.366,"dte":8,"notes":"Closed early @$0.22","totalCredit":315,"status":"closed","closedDate":"2026-03-20","closeCost":0.22,"outcome":"Closed","pnl":293,"feesOpen":0.76,"feesClose":0.75,"feesTotal":1.51,"pnlNet":291.49},{"id":3,"ticker":"NVDA","type":"CSP","openDate":"2026-03-13","expiry":"2026-03-18","strike":170,"premium":0.83,"contracts":1,"underlying":0,"iv":49.9,"delta":-0.149,"dte":5,"notes":"","totalCredit":83,"status":"closed","closedDate":"2026-03-19","closeCost":0,"outcome":"Expired","pnl":83,"feesOpen":0.76,"feesClose":0,"feesTotal":0.76,"pnlNet":82.24},{"id":4,"ticker":"CRWV","type":"CSP","openDate":"2026-03-17","expiry":"2026-03-27","strike":75,"premium":1.64,"contracts":1,"underlying":0,"iv":83.5,"delta":-0.231,"dte":10,"notes":"","totalCredit":164,"status":"closed","closedDate":"2026-03-28","closeCost":1.1,"outcome":"Closed","pnl":54,"feesOpen":0.76,"feesClose":0.75,"feesTotal":1.51,"pnlNet":52.49},{"id":5,"ticker":"CRWV","type":"CSP","openDate":"2026-03-17","expiry":"2026-04-02","strike":73,"premium":2.04,"contracts":1,"underlying":0,"iv":84.7,"delta":-0.223,"dte":16,"notes":"","totalCredit":204,"status":"closed","closedDate":"2026-04-02","closeCost":0.07,"outcome":"Closed","pnl":197,"feesOpen":0.76,"feesClose":0.75,"feesTotal":1.51,"pnlNet":195.49},{"id":6,"ticker":"CRWV","type":"CSP","openDate":"2026-03-19","expiry":"2026-04-10","strike":69,"premium":2.2,"contracts":2,"underlying":0,"iv":88.7,"delta":-0.201,"dte":22,"notes":"Tariff selloff close","totalCredit":440,"status":"closed","closedDate":"2026-04-02","closeCost":1.1,"outcome":"Closed","pnl":220,"feesOpen":1.5,"feesClose":1.49,"feesTotal":2.99,"pnlNet":217.01},{"id":7,"ticker":"CRWV","type":"CSP","openDate":"2026-03-19","expiry":"2026-04-17","strike":67.5,"premium":2.69,"contracts":2,"underlying":0,"iv":91.6,"delta":-0.203,"dte":29,"notes":"","totalCredit":538,"status":"closed","closedDate":"2026-04-13","closeCost":0.06,"outcome":"Closed","pnl":526,"feesOpen":1.5,"feesClose":1.49,"feesTotal":2.99,"pnlNet":523.01},{"id":8,"ticker":"CRWV","type":"Diagonal","openDate":"2026-03-21","expiry":"2026-03-27","strike":70,"premium":0.94,"contracts":1,"underlying":0,"iv":119.3,"delta":-0.118,"dte":6,"notes":"Sold 70P @0.94","totalCredit":94,"status":"closed","closedDate":"2026-03-27","closeCost":0.04,"outcome":"Closed","pnl":90,"feesOpen":0.76,"feesClose":0.75,"feesTotal":1.51,"pnlNet":88.49},{"id":9,"ticker":"CRWV","type":"CSP","openDate":"2026-03-21","expiry":"2026-04-24","strike":67,"premium":3.0,"contracts":2,"underlying":0,"iv":95,"delta":-0.197,"dte":34,"notes":"","totalCredit":600,"status":"open","closedDate":null,"closeCost":0,"outcome":null,"pnl":null,"feesOpen":1.5,"feesClose":0,"feesTotal":1.5,"pnlNet":null},{"id":10,"ticker":"CRWV","type":"CSP","openDate":"2026-03-27","expiry":"2026-03-27","strike":77,"premium":0.35,"contracts":2,"underlying":0,"iv":0,"delta":0,"dte":0,"notes":"Assigned 200sh @$77","totalCredit":70,"status":"closed","closedDate":"2026-03-28","closeCost":0,"outcome":"Assigned","pnl":70,"feesOpen":1.5,"feesClose":0,"feesTotal":1.5,"pnlNet":68.5},{"id":11,"ticker":"CRWV","type":"CC","openDate":"2026-03-30","expiry":"2026-04-02","strike":77,"premium":0.58,"contracts":2,"underlying":0,"iv":113.7,"delta":0.162,"dte":3,"notes":"Post-assignment CC leg 1","totalCredit":116,"status":"closed","closedDate":"2026-04-02","closeCost":1.05,"outcome":"Closed","pnl":-94,"feesOpen":1.5,"feesClose":1.49,"feesTotal":2.99,"pnlNet":-96.99},{"id":12,"ticker":"CRWV","type":"CC","openDate":"2026-04-01","expiry":"2026-04-02","strike":77,"premium":2.39,"contracts":2,"underlying":0,"iv":96.1,"delta":0.654,"dte":1,"notes":"Post-assignment CC leg 2","totalCredit":478,"status":"closed","closedDate":"2026-04-02","closeCost":2.3,"outcome":"Closed","pnl":18,"feesOpen":1.5,"feesClose":1.49,"feesTotal":2.99,"pnlNet":15.01},{"id":13,"ticker":"CRWV","type":"Stock Sale","openDate":"2026-04-02","expiry":null,"strike":77,"premium":0,"contracts":200,"underlying":78.88,"iv":0,"delta":0,"dte":0,"notes":"198sh @$78.88+2sh @$78.78","totalCredit":15770.73,"status":"closed","closedDate":"2026-04-02","closeCost":0,"outcome":"Sold","pnl":370.73,"feesOpen":5.07,"feesClose":0,"feesTotal":5.07,"pnlNet":365.66},{"id":14,"ticker":"PLTR","type":"CSP","openDate":"2026-04-10","expiry":"2026-05-15","strike":95,"premium":1.63,"contracts":1,"underlying":0,"iv":82.7,"delta":-0.095,"dte":35,"notes":"","totalCredit":163,"status":"open","closedDate":null,"closeCost":0,"outcome":null,"pnl":null,"feesOpen":0.75,"feesClose":0,"feesTotal":0.75,"pnlNet":null}]'


def build():
    os.makedirs(DIST, exist_ok=True)

    with open(os.path.join(SRC, "icons_b64.txt"), encoding='utf-8') as f:
        parts = f.read().split("\n---\n")
    icon192, icon512 = parts[0].strip(), parts[1].strip()

    with open(os.path.join(SRC, "chartjs.js"), encoding='utf-8') as f:  chartjs = f.read()
    with open(os.path.join(SRC, "style.css"), encoding='utf-8') as f:   css     = f.read()
    with open(os.path.join(SRC, "body.html"), encoding='utf-8') as f:   body    = f.read()
    with open(os.path.join(SRC, "app.js"), encoding='utf-8') as f:      appjs   = f.read()

    manifest = {
        "name": "Options Tracker", "short_name": "OT Tracker",
        "start_url": "./", "display": "standalone",
        "background_color": "#0f0f1a", "theme_color": "#0f0f1a",
        "orientation": "portrait",
        "icons": [
            {"src": f"data:image/png;base64,{icon192}", "sizes": "192x192", "type": "image/png"},
            {"src": f"data:image/png;base64,{icon512}", "sizes": "512x512", "type": "image/png"},
        ]
    }
    manifest_b64 = base64.b64encode(json.dumps(manifest).encode()).decode()

    build_ts = int(time.time())
    SW = (f"const CACHE='ot-v7-{build_ts}';"
          "self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./',])).then(()=>self.skipWaiting()));});"
          "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim()));});"
          # Network-first for HTML navigation (gets latest on reload, falls back to cache offline)
          # Cache-first for everything else (icons, assets)
          "self.addEventListener('fetch',e=>{"
          "if(e.request.mode==='navigate'){"
          "e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return r}).catch(()=>caches.match(e.request)));"
          "return;}"
          "e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cl=r.clone();caches.open(CACHE).then(cc=>cc.put(e.request,cl));return r})));"
          "});")
    sw_b64 = base64.b64encode(SW.encode()).decode()

    appjs_final = appjs.replace("__SEED__", SEED).replace("__SW_B64__", sw_b64)
    icon192_src = f"data:image/png;base64,{icon192}"

    # Syntax check (requires node; skipped gracefully if not installed)
    import tempfile, shutil
    if shutil.which("node"):
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as tmp:
            tmp.write(appjs_final)
            tmpname = tmp.name
        r = subprocess.run(["node", "--check", tmpname],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print(f"✗ JS syntax error:\n{r.stderr}")
            return False
    else:
        print("  (node not found — skipping JS syntax check)")

    html = "\n".join([
        "<!DOCTYPE html>", '<html lang="en" data-theme="dark">', "<head>",
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,viewport-fit=cover">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
        '<meta name="apple-mobile-web-app-title" content="OT Tracker">',
        '<meta name="theme-color" content="#0f0f1a" id="theme-meta">',
        "<title>Options Tracker</title>",
        f'<link rel="apple-touch-icon" href="{icon192_src}">',
        f'<link rel="manifest" href="data:application/manifest+json;base64,{manifest_b64}">',
        f"<style>\n{css}\n</style>",
        "</head>", "<body>", body,
        f"<script>\n{chartjs}\n</script>",
        f"<script>\n{appjs_final}\n</script>",
        "</body>", "</html>",
    ])

    with open(OUT, "w", encoding='utf-8') as f:
        f.write(html)
    size = os.path.getsize(OUT)
    print(f"✓ Built {OUT}  ({size:,} bytes = {size/1024:.0f} KB)")
    return True


def watch():
    print("Watching for changes… (Ctrl+C to stop)")
    mtimes = {}
    while True:
        changed = False
        for fname in SOURCE_FILES:
            path = os.path.join(SRC, fname)
            if not os.path.exists(path):
                continue
            mt = os.path.getmtime(path)
            if fname in mtimes and mtimes[fname] != mt:
                print(f"  Changed: {fname}")
                changed = True
            mtimes[fname] = mt
        if changed:
            build()
        time.sleep(1)


if __name__ == "__main__":
    if "--watch" in sys.argv:
        build()
        watch()
    else:
        build()
