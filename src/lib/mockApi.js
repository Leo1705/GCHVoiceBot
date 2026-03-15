/**
 * Mock API for frontend-only prototype.
 * Simulates: session start, voice upload → STT → safety → LLM → TTS → audio URL.
 */

import {
  MOCK_RESPONSES,
  SAFETY_RESPONSE,
  END_SESSION_RESPONSE,
  UPSELL_OFFER,
} from "./constants";
import { pickResponseFromTranscript } from "./responseFromTranscript";

const MOCK_SESSION_ID = "mock-session-" + Date.now();

// Simulate unsafe phrases (would trigger safety layer in real backend)
const UNSAFE_PHRASES = [
  "kill myself",
  "end my life",
  "want to die",
  "hurt myself",
  "suicide",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnsafe(transcript) {
  const lower = (transcript || "").toLowerCase();
  return UNSAFE_PHRASES.some((p) => lower.includes(p));
}

/**
 * POST /session/start — returns session id and ok
 */
export async function startSession({ mode, voiceType, recordingEnabled }) {
  await delay(400);
  return {
    ok: true,
    sessionId: MOCK_SESSION_ID,
    mode,
    voiceType,
    recordingEnabled: !!recordingEnabled,
  };
}

// Rotating user phrases so the conversation feels continuous (mock)
const MOCK_USER_PHRASES = [
  "I've been feeling really stressed lately and I don't know what to do.",
  "Yeah. It's mostly work and family stuff.",
  "I guess I need to slow down but I don't know how.",
  "Sometimes I feel like I can't breathe.",
  "I tried talking to my partner but it didn't go well.",
  "I'm not sure what I need. Just someone to listen maybe.",
  "It helps to say it out loud. Thank you.",
  "I think I need to set a boundary but I'm scared.",
  "Today was a bit better. I took a short walk.",
  "I don't want to bother anyone with my problems.",
];

/**
 * POST /session/:id/voice — transcript from client (Web Speech API) or mock; return response text.
 * When options.clientTranscript is provided, uses real STT and keyword-based response.
 */
export async function sendVoice(sessionId, _audioBlob, mode, options = {}) {
  await delay(400);

  const transcript =
    typeof options.clientTranscript === "string" && options.clientTranscript.trim()
      ? options.clientTranscript.trim()
      : MOCK_USER_PHRASES[(options.turnIndex ?? 0) % MOCK_USER_PHRASES.length];
  const safe = !isUnsafe(transcript);

  if (!safe) {
    return {
      ok: true,
      transcript,
      safe: false,
      responseText: SAFETY_RESPONSE,
      escalationLevel: 3,
      offerHuman: true,
    };
  }

  if (options.triggerSafety) {
    return {
      ok: true,
      transcript,
      safe: false,
      responseText: SAFETY_RESPONSE,
      escalationLevel: 3,
      offerHuman: true,
    };
  }

  if (options.endSession) {
    return {
      ok: true,
      transcript,
      responseText: END_SESSION_RESPONSE,
      escalationLevel: 0,
      offerHuman: true,
      endSession: true,
    };
  }

  if (options.triggerUpsell) {
    return {
      ok: true,
      transcript,
      responseText: UPSELL_OFFER,
      escalationLevel: 1,
      offerHuman: true,
    };
  }

  const responseText = pickResponseFromTranscript(transcript, mode);

  return {
    ok: true,
    transcript,
    safe: true,
    responseText,
    escalationLevel: 0,
    offerHuman: false,
  };
}

/**
 * POST /session/:id/mode — change mode mid-session
 */
export async function setSessionMode(sessionId, mode) {
  await delay(200);
  return { ok: true, mode };
}

/**
 * POST /session/:id/voice-style — change voice profile
 */
export async function setVoiceStyle(sessionId, voiceType) {
  await delay(200);
  return { ok: true, voiceType };
}

/**
 * POST /session/:id/recording — toggle recording consent
 */
export async function setRecordingConsent(sessionId, enabled) {
  await delay(200);
  return { ok: true, recordingEnabled: enabled };
}

/**
 * POST /session/:id/escalate — record escalation (e.g. user accepted/declined booking)
 */
export async function escalate(sessionId, { level, reason, userAction }) {
  await delay(300);
  return { ok: true, level, reason, userAction };
}

/**
 * POST /session/:id/end — end session
 */
export async function endSession(sessionId) {
  await delay(300);
  return { ok: true };
}
