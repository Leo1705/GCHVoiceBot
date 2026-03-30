import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/getSessionUser";
import { addVoiceSeconds } from "@/lib/userStore";
import { FREE_VOICE_SECONDS, isFreeTierBlocked } from "@/lib/billing";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.plan === "plus") {
    return NextResponse.json({
      voiceSecondsUsed: user.voiceSecondsUsed || 0,
      freeVoiceSecondsLimit: FREE_VOICE_SECONDS,
      blocked: false,
      plan: user.plan,
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const delta = Number(body.deltaSeconds);
  const safeDelta = Number.isFinite(delta) ? Math.max(0, Math.min(Math.round(delta), 120)) : 0;

  const updated = safeDelta > 0 ? addVoiceSeconds(user.id, safeDelta) : user;
  const used = updated?.voiceSecondsUsed ?? user.voiceSecondsUsed ?? 0;
  const blocked = isFreeTierBlocked("free", used);

  return NextResponse.json({
    voiceSecondsUsed: used,
    freeVoiceSecondsLimit: FREE_VOICE_SECONDS,
    blocked,
    plan: user.plan,
  });
}
