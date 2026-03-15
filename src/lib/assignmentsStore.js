/**
 * Server-side: map patient email to assigned therapist.
 * data/assignments.json: { "patient@email.com": { "therapistName": "...", "therapistEmail": "..." } }
 * You maintain this file or replace with a real DB lookup.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "assignments.json");

function readAssignments() {
  if (!fs.existsSync(ASSIGNMENTS_FILE)) return {};
  try {
    const raw = fs.readFileSync(ASSIGNMENTS_FILE, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Look up therapist for a patient by email (case-insensitive).
 * @returns { { therapistName: string, therapistEmail: string } | null }
 */
export function getTherapistForPatient(patientEmail) {
  if (!patientEmail || !String(patientEmail).trim()) return null;
  const key = String(patientEmail).trim().toLowerCase();
  const assignments = readAssignments();
  const entry = assignments[key];
  if (!entry || !entry.therapistEmail) return null;
  return {
    therapistName: String(entry.therapistName || "").trim(),
    therapistEmail: String(entry.therapistEmail || "").trim(),
  };
}
