# RFD: WiFi Heat Map App (Mobile-First)

## Problem Statement

Need to visualize WiFi signal strength across rooms in a home to identify dead zones, optimize router placement, and troubleshoot coverage issues. Currently no easy way to collect per-room RSSI data and map it spatially.

## Objective

Build a mobile app that allows users to walk around their home, tap a room name, and capture WiFi RSSI readings. Data is stored in Google Sheets for easy sharing/analysis. Optional: render a visual heat map showing signal strength by room.

## Why Mobile-First (React Native + Expo)

| Factor | Rationale |
| --- | --- |
| **WiFi API Access** | iOS/Android expose native WiFi APIs; phones can read RSSI directly without special permissions |
| **Deployment** | Expo Go = instant testing on device, no app store review, no build step |
| **Data Storage** | Google Sheets integration = no backend needed, easy to share/view data |
| **User Experience** | Natural to walk around with phone in hand, tap rooms as you go |
| **No Desktop Setup** | Skip Electron complexity; this is actually simpler to build & ship |

---

## Technical Approach

### Architecture

```
React Native App (Expo)
  - Room List Screen
  - Tap to scan RSSI
  - Show live signal % icon
  - Store locally (SQLite)
        |
        | (batch sync)
        v
Google Sheets API
  - Sheet: Room Data
  - Columns: Room, RSSI, Timestamp, Notes
  - Manual or auto-sync
```

### Tech Stack

**Runtime:** React Native (Expo)
- `expo-router` for navigation (file-based routing)
- `@react-native-async-storage/async-storage` for local persistence
- `expo-network` for WiFi API access (iOS: `NEHotspotHelper`, Android: `WifiManager`)

**State Management:** Zustand (lightweight, Expo-friendly)

**UI:** React Native Paper (Material Design, pre-built components)

**Data Sync:** Google Sheets API v4 via OAuth 2.0
- Authenticate once, then append rows to sheet

**Styling:** NativeWind (Tailwind for React Native) or inline styles

### Key Screens

1. **Home Screen**
   - List of rooms (e.g., "Living Room", "Bedroom", "Kitchen")
   - Add new room button
   - Last scan timestamp

2. **Scan Screen**
   - Show selected room name
   - Button: "Scan WiFi"
   - Display real-time RSSI (dBm) and signal percentage (0-100%)
   - Optional: Show connected SSID
   - Button: "Save & Next Room" or "Save & Retry"

3. **History Screen**
   - List of all scans (room, RSSI, time)
   - Delete scan
   - Export/sync to Google Sheets button

4. **Settings Screen**
   - Add/edit room names
   - Google Sheets API key setup
   - Clear all data

---

## Implementation Details

### WiFi RSSI Retrieval

**Android:**
```javascript
// Using expo-network + react-native-get-wifi-ssid + custom native module
// Alternatively: use WifiManager native APIs via Expo Modules
const getRSSI = async () => {
    const ssid = await getSSID();
    const rssi = await getNativeWiFiRSSI(); // RSSI in dBm (-30 to -90)
    const signalPercent = Math.max(0, Math.min(100, 2 * (rssi + 100)));
    return { ssid, rssi, signalPercent };
};
```

**iOS:**
```javascript
// NEHotspotHelper requires entitlements; use Expo Modules or EAS Build
// May require `expo-network` + custom native wrapper
```

### Google Sheets Sync

```javascript
// Initialize once
const auth = await GoogleAuth.initialize({
    clientId: process.env.GOOGLE_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Append a scan
const appendScan = async (roomName, rssi, signalPercent) => {
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Room Data!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[roomName, rssi, signalPercent, new Date().toISOString()]],
        },
    });
};
```

### Sheet Structure

| Room | RSSI (dBm) | Signal % | Timestamp | Notes |
| --- | --- | --- | --- | --- |
| Living Room | -45 | 78% | 2024-07-25T10:15:00Z | Near router |
| Bedroom | -72 | 32% | 2024-07-25T10:18:00Z | Far corner |
| Kitchen | -58 | 54% | 2024-07-25T10:20:00Z | Microwave interference? |

---

## Development Plan

### Phase 1: MVP (Week 1)
- [ ] Set up Expo project with `expo-router`
- [ ] Build Home + Scan screens
- [ ] Integrate WiFi API (Android first, iOS fallback)
- [ ] Local SQLite storage of scans
- [ ] Basic UI (room list, scan button, result display)

### Phase 2: Data Sync (Week 2)
- [ ] Google Sheets OAuth setup
- [ ] Append scans to sheet on "Sync" button
- [ ] History screen with delete/view
- [ ] Settings screen (room management)

### Phase 3: Polish (Week 3)
- [ ] Heat map visualization (optional; canvas with color gradient)
- [ ] Better icons/styling (React Native Paper)
- [ ] Error handling & retry logic
- [ ] iOS native module for WiFi (if not available via Expo)

---

## Success Criteria

- Can scan WiFi RSSI in any room on the device
- Data persists locally (SQLite)
- Manual sync to Google Sheets works
- Deployed to Expo Go for testing
- Can view/delete scan history in app
- Google Sheets has clean data for analysis

**Stretch Goals:**
- Auto-sync (background task)
- Heat map overlay on room layout image
- Export to CSV/JSON
- iOS full support

---

## Dependencies & Setup

### Environment Variables
```
GOOGLE_CLIENT_ID=<OAuth 2.0 Client ID from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<OAuth 2.0 Client Secret>
SHEET_ID=<Google Sheets ID where data goes>
```

### Required Permissions
- **Android:** `ACCESS_FINE_LOCATION`, `ACCESS_WIFI_STATE` (in `app.json` via `expo-permissions`)
- **iOS:** `NSLocalNetworkUsageDescription`, `NSBonjourServiceTypes` (in `app.json`)

### External Services
- Google Cloud Console (OAuth setup, Sheets API key)
- Google Sheets (data storage)
- Expo Go (testing) or EAS Build (production APK/IPA)

---

## Potential Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| iOS WiFi API access restricted | Use Expo Modules or EAS Build with custom entitlements; may require TestFlight |
| Google Sheets API quota limits | Batch writes; only sync on manual button press (not real-time) |
| RSSI fluctuates wildly | Take 3 readings, average them before saving |
| User confusion on setup | In-app onboarding for Google Sheets auth |
| WiFi disconnects mid-scan | Graceful error message, retry button |

---

## Open Questions

1. **Heat Map Priority?** Should we render a visual heat map overlay, or is the Google Sheets data enough?
2. **Offline Mode?** If no internet, should we buffer scans locally and sync later?
3. **Multi-Network Support?** Allow scanning different WiFi networks (e.g., 2.4GHz vs 5GHz)?
4. **Sharing Data?** Share Google Sheets link directly, or export as PDF/image?

---

## Handoff to Claude Code

**Deliverables:**
1. Repo initialized with Expo + TypeScript
2. App skeleton (router setup, screens stubbed)
3. WiFi API wrapper (platform-agnostic)
4. Google Sheets integration (OAuth + append logic)
5. CLAUDE.md with architecture & next steps

**Deploy to:** Expo Go (dev) -> EAS Build (production APK/IPA if needed)

**Timeline:** 2-3 weeks to MVP, 1 week to polish

---

**Owner:** Aamir Jiwa
**Date:** 2026-07-25
**Status:** Ready for Claude Code build

---

## Pivot note (post-review)

After review, this was re-scoped from React Native/Expo to a **Windows-only local Next.js web app**:

- iOS has no public API for WiFi signal strength (`NEHotspotHelper` requires an Apple entitlement not obtainable for this use case) — a hard platform wall, not a complexity issue.
- Android RSSI access needs a custom native module (Expo Go can't run it; would need an EAS dev build) plus `ACCESS_FINE_LOCATION` and is throttled to ~4 scans/2min on Android 10+.
- Windows exposes WiFi signal (`netsh wlan show interfaces`) with no special permissions and no throttling, and this machine is a Windows laptop — so the app runs locally via `npm run dev` and reads signal strength by shelling out to `netsh`.
- Storage moved from local SQLite (per the original RFD) to a Neon Postgres database.
- Google Sheets sync (originally OAuth 2.0 via Node's `googleapis`) was dropped entirely in favor of a **CSV export** button on the History page — simpler, no Google Cloud/OAuth setup required, and the data already lives in a real database rather than needing a spreadsheet as the sync target.

See `README.md` for the current architecture and setup steps.
