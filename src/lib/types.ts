export type Room = {
  id: string;
  name: string;
  createdAt: string;
};

export type Scan = {
  id: string;
  roomId: string;
  ssid: string | null;
  signalPercent: number;
  rssiDbm: number | null;
  band: string | null;
  channel: number | null;
  radioType: string | null;
  receiveRateMbps: number | null;
  transmitRateMbps: number | null;
  notes: string;
  takenAt: string;
  syncedAt: string | null;
};

export type Db = {
  rooms: Room[];
  scans: Scan[];
};

export type WifiReading = {
  connected: boolean;
  ssid: string | null;
  signalPercent: number | null;
  rssiDbm: number | null;
  band: string | null;
  channel: number | null;
  radioType: string | null;
  receiveRateMbps: number | null;
  transmitRateMbps: number | null;
};
