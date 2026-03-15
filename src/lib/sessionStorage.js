/**
 * Store completed sessions in localStorage (prototype).
 * Each session has: id, mode, date, duration, conversation, tags, quote.
 */

const STORAGE_KEY = "gch_saved_sessions";

const TAG_KEYWORDS = {
  anxiety: ["anxious", "anxiety", "panic", "overwhelm", "nervous", "worry", "stress"],
  stress: ["stress", "stressed", "work", "busy", "tired", "overwhelm"],
  relationships: ["partner", "relationship", "friend", "family", "communication", "boundary", "fight"],
  mood: ["sad", "down", "depressed", "hopeless", "low", "mood"],
  grounding: ["breathe", "calm", "safe", "grounding", "body"],
  "check-in": ["today", "week", "feeling", "better", "win"],
};

function generateTags(conversation) {
  const text = conversation.map((m) => m.text).join(" ").toLowerCase();
  const tags = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) tags.push(tag);
  }
  return tags.length ? tags : ["general"];
}

function generateQuote(conversation) {
  const assistantLines = conversation.filter((m) => m.role === "assistant").map((m) => m.text);
  if (assistantLines.length === 0) return "Take your time. I'm here when you're ready.";
  const candidates = assistantLines.filter((t) => t.length > 20 && t.length < 120);
  return candidates.length > 0 ? candidates[candidates.length - 1] : assistantLines[assistantLines.length - 1];
}

const EMOTION_KEYS = ["fear", "anger", "disgust", "surprise", "sadness", "neutral", "happiness"];
const TAG_TO_EMOTION = {
  anxiety: { fear: 0.8, sadness: 0.4 },
  stress: { anger: 0.5, fear: 0.3 },
  relationships: { anger: 0.4, sadness: 0.5, disgust: 0.3 },
  mood: { sadness: 0.8, neutral: 0.3 },
  grounding: { neutral: 0.6, happiness: 0.3 },
  "check-in": { neutral: 0.5, happiness: 0.4 },
  general: { neutral: 0.6 },
};

function generateEmotionalState(tags) {
  const state = { fear: 0.2, anger: 0.2, disgust: 0.2, surprise: 0.2, sadness: 0.2, neutral: 0.4, happiness: 0.2 };
  for (const tag of tags) {
    const map = TAG_TO_EMOTION[tag];
    if (map) for (const [k, v] of Object.entries(map)) state[k] = Math.min(1, (state[k] || 0) + v);
  }
  return EMOTION_KEYS.map((k) => state[k] ?? 0.2);
}

function generateSummary(conversation, tags) {
  const themes = tags.join(", ");
  return `This session touched on ${themes || "general wellbeing"}. ${generateQuote(conversation)}`;
}

function generateObservations(tags) {
  const obs = [];
  if (tags.includes("anxiety")) obs.push("Noticed moments of overwhelm; grounding was offered.");
  if (tags.includes("relationships")) obs.push("Conversation explored boundaries and communication.");
  if (tags.includes("mood")) obs.push("Low mood was acknowledged without judgment.");
  if (tags.includes("stress")) obs.push("Stress and workload came up; small steps were suggested.");
  if (obs.length === 0) obs.push("You shared openly; the assistant reflected and asked follow-up questions.");
  return obs;
}

function generateHomework(tags) {
  if (tags.includes("anxiety")) return "Try one 4-4-4 breath when you feel tension today.";
  if (tags.includes("relationships")) return "Consider one sentence you could say to set a boundary.";
  if (tags.includes("mood")) return "Name one small thing you can do for yourself today.";
  if (tags.includes("stress")) return "Pick one task to put down or defer until tomorrow.";
  return "Take a short walk or text one person you trust.";
}

export function saveSession({ mode, modeLabel, conversation, durationMinutes }) {
  const sessions = getSessions();
  const id = `s-${Date.now()}`;
  const tags = generateTags(conversation);
  const session = {
    id,
    mode,
    modeLabel: modeLabel || mode.replace(/_/g, " "),
    date: new Date().toISOString(),
    durationMinutes: durationMinutes ?? Math.max(1, Math.ceil(conversation.length / 4)),
    conversation,
    tags,
    quote: generateQuote(conversation),
    emotionalState: generateEmotionalState(tags),
    summary: generateSummary(conversation, tags),
    observations: generateObservations(tags),
    homework: generateHomework(tags),
  };
  sessions.unshift(session);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch (e) {
    console.warn("Could not save session", e);
  }
  return session;
}

export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSessionById(id) {
  return getSessions().find((s) => s.id === id);
}

/** Get breakdown for display (fills in if session was saved before we added these fields). */
export function getSessionBreakdown(session) {
  const tags = session.tags || [];
  return {
    emotionalState: session.emotionalState || generateEmotionalState(tags),
    summary: session.summary || generateSummary(session.conversation || [], tags),
    observations: session.observations || generateObservations(tags),
    homework: session.homework || generateHomework(tags),
  };
}
