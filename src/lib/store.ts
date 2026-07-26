import fs from "node:fs";
import path from "node:path";
import type { Db, Room, Scan } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDb(): Db {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const empty: Db = { rooms: [], scans: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw) as Db;
  } catch {
    return { rooms: [], scans: [] };
  }
}

function writeDb(db: Db): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function newId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

export function listRooms(): Room[] {
  return ensureDb().rooms;
}

export function addRoom(name: string): Room {
  const db = ensureDb();
  const room: Room = { id: newId(), name, createdAt: new Date().toISOString() };
  db.rooms.push(room);
  writeDb(db);
  return room;
}

export function deleteRoom(id: string): void {
  const db = ensureDb();
  db.rooms = db.rooms.filter((r) => r.id !== id);
  db.scans = db.scans.filter((s) => s.roomId !== id);
  writeDb(db);
}

export function listScans(): Scan[] {
  return ensureDb().scans;
}

export function addScan(scan: Omit<Scan, "id">): Scan {
  const db = ensureDb();
  const full: Scan = { ...scan, id: newId() };
  db.scans.push(full);
  writeDb(db);
  return full;
}

export function deleteScan(id: string): void {
  const db = ensureDb();
  db.scans = db.scans.filter((s) => s.id !== id);
  writeDb(db);
}

export function markScansSynced(ids: string[], syncedAt: string): void {
  const db = ensureDb();
  const idSet = new Set(ids);
  db.scans = db.scans.map((s) => (idSet.has(s.id) ? { ...s, syncedAt } : s));
  writeDb(db);
}

export function clearAllData(): void {
  writeDb({ rooms: [], scans: [] });
}
