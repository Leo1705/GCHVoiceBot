/**
 * GET /api/elevenlabs/signed-url — Returns a signed WebSocket URL for the ElevenLabs Conversational AI agent.
 * Used so the client can connect without exposing the API key.
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in env.
 */

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey?.trim() || !agentId?.trim()) {
    return Response.json({ error: "ElevenLabs agent not configured" }, { status: 503 });
  }
  try {
    const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
    url.searchParams.set("agent_id", agentId);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs get-signed-url error:", res.status, err);
      return Response.json({ error: "Failed to get signed URL", details: err?.slice(0, 200) }, { status: 502 });
    }
    const data = await res.json();
    const signedUrl = data.signed_url ?? data.signedUrl;
    if (!signedUrl || typeof signedUrl !== "string") {
      return Response.json({ error: "Invalid signed URL response" }, { status: 502 });
    }
    return Response.json({ signedUrl });
  } catch (err) {
    console.error("GET /api/elevenlabs/signed-url error:", err);
    return Response.json({ error: "Failed to get signed URL" }, { status: 500 });
  }
}
