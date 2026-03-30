import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/userStore";
import { signSessionToken, SESSION_COOKIE } from "@/lib/authSession";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const created = createUser({ email, name, passwordHash, plan: "free" });
    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: 409 });
    }

    const token = await signSessionToken(created.user.id);
    const res = NextResponse.json({
      user: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
        plan: created.user.plan,
      },
      voiceSecondsUsed: created.user.voiceSecondsUsed,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
