import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/getSessionUser";
import { FREE_VOICE_SECONDS } from "@/lib/billing";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    },
    voiceSecondsUsed: user.voiceSecondsUsed || 0,
    freeVoiceSecondsLimit: FREE_VOICE_SECONDS,
  });
}
