import { ensureSchema, pool } from "./db";
import type { Room, Scan } from "./types";

function newId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function roomFromRow(row: {
  id: string;
  name: string;
  created_at: Date;
}): Room {
  return { id: row.id, name: row.name, createdAt: row.created_at.toISOString() };
}

function scanFromRow(row: {
  id: string;
  room_id: string;
  ssid: string | null;
  signal_percent: number;
  rssi_dbm: number | null;
  band: string | null;
  channel: number | null;
  radio_type: string | null;
  receive_rate_mbps: number | null;
  transmit_rate_mbps: number | null;
  notes: string;
  taken_at: Date;
}): Scan {
  return {
    id: row.id,
    roomId: row.room_id,
    ssid: row.ssid,
    signalPercent: row.signal_percent,
    rssiDbm: row.rssi_dbm,
    band: row.band,
    channel: row.channel,
    radioType: row.radio_type,
    receiveRateMbps: row.receive_rate_mbps,
    transmitRateMbps: row.transmit_rate_mbps,
    notes: row.notes,
    takenAt: row.taken_at.toISOString(),
  };
}

export async function listRooms(): Promise<Room[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    "SELECT id, name, created_at FROM rooms ORDER BY created_at ASC"
  );
  return rows.map(roomFromRow);
}

export async function addRoom(name: string): Promise<Room> {
  await ensureSchema();
  const room: Room = { id: newId(), name, createdAt: new Date().toISOString() };
  await pool.query("INSERT INTO rooms (id, name, created_at) VALUES ($1, $2, $3)", [
    room.id,
    room.name,
    room.createdAt,
  ]);
  return room;
}

export async function deleteRoom(id: string): Promise<void> {
  await ensureSchema();
  // scans.room_id has ON DELETE CASCADE, so this also removes that room's scans.
  await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
}

export async function listScans(): Promise<Scan[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    "SELECT id, room_id, ssid, signal_percent, rssi_dbm, band, channel, radio_type, receive_rate_mbps, transmit_rate_mbps, notes, taken_at FROM scans ORDER BY taken_at ASC"
  );
  return rows.map(scanFromRow);
}

export async function addScan(scan: Omit<Scan, "id">): Promise<Scan> {
  await ensureSchema();
  const full: Scan = { ...scan, id: newId() };
  await pool.query(
    `INSERT INTO scans
      (id, room_id, ssid, signal_percent, rssi_dbm, band, channel, radio_type, receive_rate_mbps, transmit_rate_mbps, notes, taken_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      full.id,
      full.roomId,
      full.ssid,
      full.signalPercent,
      full.rssiDbm,
      full.band,
      full.channel,
      full.radioType,
      full.receiveRateMbps,
      full.transmitRateMbps,
      full.notes,
      full.takenAt,
    ]
  );
  return full;
}

export async function deleteScan(id: string): Promise<void> {
  await ensureSchema();
  await pool.query("DELETE FROM scans WHERE id = $1", [id]);
}

export async function clearAllData(): Promise<void> {
  await ensureSchema();
  await pool.query("DELETE FROM rooms");
}
