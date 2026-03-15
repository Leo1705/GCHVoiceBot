const VOICE_KEY = "gch_voice_preference";
const DEFAULT_VOICE = "female";

export function getVoicePreference() {
  if (typeof window === "undefined") return DEFAULT_VOICE;
  try {
    return localStorage.getItem(VOICE_KEY) || DEFAULT_VOICE;
  } catch {
    return DEFAULT_VOICE;
  }
}

export function setVoicePreference(voiceId) {
  try {
    localStorage.setItem(VOICE_KEY, voiceId);
  } catch (e) {
    console.warn("Could not save voice preference", e);
  }
}
