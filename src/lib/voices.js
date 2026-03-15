/**
 * Pick the best available SpeechSynthesis voice for each profile.
 * Prefers high-quality system voices (e.g. Samantha, Daniel on Mac; Google/Microsoft on Chrome).
 */

const PREFERRED_NAMES = [
  "Samantha", "Karen", "Daniel", "Alex", "Victoria",
  "Google US English", "Microsoft Zira", "Microsoft David",
  "Moira", "Kate", "Fred", "Microsoft Aria",
];

function scoreVoice(voice, wantFemale) {
  const name = (voice.name || "").toLowerCase();
  const lang = (voice.lang || "").toLowerCase();
  if (!lang.startsWith("en")) return -1;

  let score = 0;
  if (lang.startsWith("en-us")) score += 10;
  else if (lang.startsWith("en-gb") || lang.startsWith("en-au")) score += 5;

  const vn = voice.name || "";
  const isFemale = name.includes("female") || /Samantha|Karen|Zira|Victoria|Aria|Kate|Moira|Emily|Susan|Linda|Sarah|Female/i.test(vn);
  const isMale = name.includes("male") || /Daniel|Alex|David|Fred|Tom|Mark|Paul|Ralph|Male/i.test(vn);

  if (wantFemale === true && isFemale) score += 8;
  else if (wantFemale === false && isMale) score += 8;
  else if (wantFemale === null) score += 3; // neutral

  if (PREFERRED_NAMES.some((p) => voice.name?.includes(p))) score += 6;

  return score;
}

export function getVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function loadVoices() {
  return new Promise((resolve) => {
    let list = getVoices();
    if (list.length > 0) {
      resolve(list);
      return;
    }
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => resolve(getVoices());
    } else {
      setTimeout(() => resolve(getVoices()), 100);
    }
  });
}

/**
 * @param {string} profileId - e.g. warm_female, calm_male, soft_neutral, steady_slow
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice | null}
 */
export function pickVoiceForProfile(profileId, voices) {
  if (!voices?.length) return null;

  let wantFemale = null;
  if (profileId === "female" || profileId === "warm_female" || profileId === "soft_neutral") wantFemale = true;
  if (profileId === "male" || profileId === "calm_male") wantFemale = false;

  const scored = voices
    .map((v) => ({ voice: v, score: scoreVoice(v, wantFemale) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? voices.find((v) => v.lang?.startsWith("en")) ?? voices[0];
}
