import fs from "node:fs";
import path from "node:path";
import { google, Auth } from "googleapis";

const TOKEN_PATH = path.join(process.cwd(), ".data", "google-token.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_TAB = "Sheet1";
const HEADER_ROW = ["Room", "RSSI (dBm)", "Signal %", "Timestamp", "Notes"];

function redirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/callback";
}

export function createOAuthClient(): Auth.OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. See README.md for setup."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri());
}

function loadStoredTokens(): Auth.Credentials | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function saveTokens(tokens: Auth.Credentials): void {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  saveTokens(tokens);
}

export function isGoogleConnected(): boolean {
  const tokens = loadStoredTokens();
  return !!tokens?.refresh_token;
}

export function disconnectGoogle(): void {
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
}

async function getAuthorizedClient(): Promise<Auth.OAuth2Client> {
  const tokens = loadStoredTokens();
  if (!tokens) throw new Error("Google Sheets isn't connected yet.");
  const client = createOAuthClient();
  client.setCredentials(tokens);
  client.on("tokens", (fresh) => {
    saveTokens({ ...tokens, ...fresh });
  });
  return client;
}

async function ensureHeaderRow(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:E1`,
  });
  const firstRow = existing.data.values?.[0];
  if (firstRow && firstRow.length > 0) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:E1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADER_ROW] },
  });
}

export type SheetRow = {
  roomName: string;
  rssiDbm: number | null;
  signalPercent: number;
  takenAt: string;
  notes: string;
};

export async function appendRowsToSheet(rows: SheetRow[]): Promise<void> {
  const spreadsheetId = process.env.SHEET_ID;
  if (!spreadsheetId) throw new Error("SHEET_ID is not set. See README.md for setup.");
  const auth = await getAuthorizedClient();
  const sheets = google.sheets({ version: "v4", auth });

  await ensureHeaderRow(sheets, spreadsheetId);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TAB}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows.map((r) => [
        r.roomName,
        r.rssiDbm ?? "",
        r.signalPercent,
        r.takenAt,
        r.notes,
      ]),
    },
  });
}
