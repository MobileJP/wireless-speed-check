import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { WifiReading } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Parses `netsh wlan show interfaces` output. Windows-only, and the label
 * text is only confirmed against an English-language Windows install --
 * a non-English OS locale would use different labels and fail to parse.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseInterfaceOutput(stdout: string): WifiReading {
  const fields = new Map<string, string>();
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^\s*(.+?)\s*:\s*(.*?)\s*$/);
    if (!match) continue;
    fields.set(normalizeKey(match[1]), match[2]);
  }

  const state = fields.get("state") ?? "";
  const connected = state.toLowerCase() === "connected";
  if (!connected) {
    return {
      connected: false,
      ssid: null,
      signalPercent: null,
      rssiDbm: null,
      band: null,
      channel: null,
      radioType: null,
      receiveRateMbps: null,
      transmitRateMbps: null,
    };
  }

  const signalRaw = fields.get("signal");
  const signalPercent = signalRaw ? parseInt(signalRaw.replace("%", ""), 10) : null;
  const rssiRaw = fields.get("rssi");
  const rssiDbm = rssiRaw ? parseInt(rssiRaw, 10) : null;
  const channelRaw = fields.get("channel");
  const channel = channelRaw ? parseInt(channelRaw, 10) : null;
  const receiveRaw = fields.get("receiveratembps");
  const receiveRateMbps = receiveRaw ? parseInt(receiveRaw, 10) : null;
  const transmitRaw = fields.get("transmitratembps");
  const transmitRateMbps = transmitRaw ? parseInt(transmitRaw, 10) : null;

  return {
    connected: true,
    ssid: fields.get("ssid") ?? null,
    signalPercent: Number.isFinite(signalPercent) ? signalPercent : null,
    rssiDbm: Number.isFinite(rssiDbm) ? rssiDbm : null,
    band: fields.get("band") ?? null,
    channel: Number.isFinite(channel) ? channel : null,
    radioType: fields.get("radiotype") ?? null,
    receiveRateMbps: Number.isFinite(receiveRateMbps) ? receiveRateMbps : null,
    transmitRateMbps: Number.isFinite(transmitRateMbps) ? transmitRateMbps : null,
  };
}

async function readInterfaceOnce(): Promise<WifiReading> {
  const { stdout } = await execFileAsync("netsh", ["wlan", "show", "interfaces"]);
  return parseInterfaceOutput(stdout);
}

function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((sum, v) => sum + v, 0) / present.length);
}

/**
 * Takes 3 readings a short delay apart and averages the volatile fields
 * (signal/RSSI), per the RFD's own mitigation for "RSSI fluctuates wildly."
 * Static fields (SSID, band, channel, radio type) are taken from the last
 * successful reading.
 */
export async function scanWifi(): Promise<WifiReading> {
  const readings: WifiReading[] = [];
  for (let i = 0; i < 3; i++) {
    readings.push(await readInterfaceOnce());
    if (i < 2) await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const last = readings[readings.length - 1];
  if (!last.connected) return last;

  return {
    ...last,
    signalPercent: average(readings.map((r) => r.signalPercent)),
    rssiDbm: average(readings.map((r) => r.rssiDbm)),
  };
}
