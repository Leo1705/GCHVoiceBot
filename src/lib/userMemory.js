/**
 * User memory: store facts we learn about the person so the assistant can remember across sessions.
 * Stored in localStorage (key: gch_user_memory). Send with each /api/chat request; merge factsToRemember from response.
 */

const STORAGE_KEY = "gch_user_memory";
const MAX_ITEMS = 50;

export function getUserMemory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(-MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addToUserMemory(facts) {
  if (typeof window === "undefined" || !Array.isArray(facts) || facts.length === 0) return;
  const current = getUserMemory();
  const seen = new Set(current);
  for (const f of facts) {
    const s = (f && typeof f === "string" ? f : String(f)).trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      current.push(s);
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(-MAX_ITEMS)));
  } catch (e) {
    console.warn("Could not save user memory", e);
  }
}

export function clearUserMemory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
