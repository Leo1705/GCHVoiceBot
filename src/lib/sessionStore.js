/**
 * Server-side session store. Persists completed sessions (with therapist info) to data/sessions.json.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readSessions() {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
}

/**
 * @param {Object} session - { patientName?, patientEmail?, therapistName?, therapistEmail?, mode, summary?, conversation?, completedAt }
 */
export function addSession(session) {
  const sessions = readSessions();
  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record = {
    id,
    patientName: session.patientName || "",
    patientEmail: session.patientEmail || "",
    therapistName: session.therapistName || "",
    therapistEmail: session.therapistEmail || "",
    mode: session.mode || "calm_support",
    summary: session.summary || "",
    conversation: session.conversation || [],
    completedAt: session.completedAt || new Date().toISOString(),
  };
  sessions.unshift(record);
  writeSessions(sessions.slice(0, 500));
  return record;
}

export function getSessions() {
  return readSessions();
}
