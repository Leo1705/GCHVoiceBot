/** Free tier: voice session time limit (wall-clock while session active), seconds */
export const FREE_VOICE_SECONDS = 600; // 10 minutes

export function isFreeTierBlocked(plan, voiceSecondsUsed) {
  return plan === "free" && voiceSecondsUsed >= FREE_VOICE_SECONDS;
}
