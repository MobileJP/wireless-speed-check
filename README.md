# WiFi Heat Map

A local tool for walking around your home and scanning WiFi signal strength room by room. Originally scoped as a React Native/Expo mobile app (see `docs/WIFI_HEATMAP_RFD.md`), re-scoped to a **Windows-only local Next.js app** after review — see the "Pivot note" at the end of that doc for why.

**This only works on Windows**, and only when run locally (`npm run dev` on your own machine) — it reads signal strength by shelling out to `netsh wlan show interfaces`, a Windows-only command. It is not meant to be deployed to a hosting platform.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in `DATABASE_URL` — your Neon connection string. Use the **pooled** host (contains `-pooler`, e.g. `...-pooler.c-2.eu-west-2.aws.neon.tech`), not the direct one, for normal app traffic.

   Rooms and scans are stored in Postgres (Neon). The `rooms`/`scans` tables are created automatically on first request — no migration step needed.

3. Run it:
   ```
   npm run dev
   ```
   Open http://localhost:3000.

## Using it

1. **Rooms** (home page) — add a room for each place you want to test, e.g. "Living Room", "Bedroom".
2. Tap **Scan** on a room, stand where you want to test, and press **Scan WiFi**. It takes 3 readings a quarter-second apart and averages them (signal fluctuates, per the original RFD's own risk note).
3. Add an optional note, then **Save & back to rooms** or **Save & scan again** to do the same room once more, or move to the next room.
4. **History** shows every scan; **Export CSV** downloads everything (room, signal %, RSSI, SSID, band, channel, radio type, notes, timestamp) as a spreadsheet-ready file.
5. **Settings** — clear all data.

## Data & privacy

- Rooms and scans are stored in your Neon Postgres database. Nothing is sent anywhere else except when you click Export CSV, which downloads a file to your own machine.
- `.env.local` holds your Neon connection string — gitignored, never commit this.

## Known limitations

- **Windows only.** `netsh` doesn't exist on macOS/Linux.
- **English-language Windows only.** The parser matches the exact English labels netsh prints (`Signal`, `SSID`, `Rssi`, etc.) — a non-English Windows install uses different label text and won't parse.
- Signal reading only works while connected to a WiFi network; if the "Scan WiFi" button reports "not connected," reconnect and try again.
