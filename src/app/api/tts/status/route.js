/**
 * GET /api/tts/status — Whether ElevenLabs TTS is configured (so UI can show setup message).
 */
export async function GET() {
  const configured = !!(
    typeof process !== "undefined" &&
    process.env.ELEVENLABS_API_KEY &&
    process.env.ELEVENLABS_API_KEY.trim()
  );
  return Response.json({ configured });
}
