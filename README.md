# WiFi Heat Map

A local tool for walking around your home, scanning WiFi signal strength room by room, and logging it to a Google Sheet. Originally scoped as a React Native/Expo mobile app (see `docs/WIFI_HEATMAP_RFD.md`), re-scoped to a **Windows-only local Next.js app** after review — see the "Pivot note" at the end of that doc for why.

**This only works on Windows**, and only when run locally (`npm run dev` on your own machine) — it reads signal strength by shelling out to `netsh wlan show interfaces`, a Windows-only command. It is not meant to be deployed to a hosting platform.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in the Google OAuth values (see below). `SHEET_ID` is already filled in with the "wireless strength" sheet.

3. One-time Google Cloud setup, so the app can write to your Sheet:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (or reuse an existing one).
   - Enable the **Google Sheets API** for that project (APIs & Services -> Library).
   - Go to APIs & Services -> Credentials -> Create Credentials -> OAuth client ID.
     - Application type: **Web application**.
     - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
   - Copy the generated Client ID and Client Secret into `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
   - If prompted to configure an OAuth consent screen, "External" + "Testing" mode is fine for personal use — add your own Google account as a test user.

4. Run it:
   ```
   npm run dev
   ```
   Open http://localhost:3000.

5. Go to **Settings** and click "Connect Google Sheets" — this opens a Google consent screen in your browser. Approve it once; the app caches a refresh token locally (`.data/google-token.json`, gitignored) so you won't need to do this again.

## Using it

1. **Rooms** (home page) — add a room for each place you want to test, e.g. "Living Room", "Bedroom".
2. Tap **Scan** on a room, stand where you want to test, and press **Scan WiFi**. It takes 3 readings a quarter-second apart and averages them (signal fluctuates, per the original RFD's own risk note).
3. Add an optional note, then **Save & back to rooms** or **Save & scan again** to do the same room once more, or move to the next room.
4. **History** shows every scan; **Sync to Google Sheets** pushes any not-yet-synced scans as new rows.
5. **Settings** — check/disconnect the Google connection, or clear all local data.

## Data & privacy

- Rooms and scans are stored locally in `.data/db.json` (gitignored) — nothing leaves your machine until you press Sync.
- The Google OAuth token is stored locally in `.data/google-token.json` (gitignored) — never commit this.

## Known limitations

- **Windows only.** `netsh` doesn't exist on macOS/Linux.
- **English-language Windows only.** The parser matches the exact English labels netsh prints (`Signal`, `SSID`, `Rssi`, etc.) — a non-English Windows install uses different label text and won't parse.
- Signal reading only works while connected to a WiFi network; if the "Scan WiFi" button reports "not connected," reconnect and try again.
