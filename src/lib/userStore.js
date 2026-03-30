/**
 * Simple file-backed users (local/demo). For production, swap for Postgres + Prisma or similar.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

/**
 * @returns {{ id: string, email: string, name: string, passwordHash: string, plan: 'free'|'plus', voiceSecondsUsed: number, createdAt: string } | null}
 */
export function getUserById(id) {
  if (!id) return null;
  const users = readUsers();
  return users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return null;
  return readUsers().find((u) => String(u.email).toLowerCase() === key) || null;
}

export function createUser({ email, name, passwordHash, plan = "free" }) {
  const users = readUsers();
  const em = String(email).trim().toLowerCase();
  if (users.some((u) => String(u.email).toLowerCase() === em)) {
    return { ok: false, error: "Email already registered" };
  }
  const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const user = {
    id,
    email: em,
    name: String(name || "").trim() || "Friend",
    passwordHash,
    plan,
    voiceSecondsUsed: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { ok: true, user };
}

export function updateUser(id, patch) {
  const users = readUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) return null;
  users[i] = { ...users[i], ...patch };
  writeUsers(users);
  return users[i];
}

/**
 * @param {number} delta capped server-side
 */
export function addVoiceSeconds(userId, delta) {
  const users = readUsers();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return null;
  const add = Math.max(0, Math.min(Math.round(delta), 120));
  users[i].voiceSecondsUsed = (users[i].voiceSecondsUsed || 0) + add;
  writeUsers(users);
  return users[i];
}

/** For admin / manual upgrades: set `plan` to `"plus"` for unlimited voice (no usage enforcement). */
export function setUserPlan(userId, plan) {
  return updateUser(userId, { plan });
}
