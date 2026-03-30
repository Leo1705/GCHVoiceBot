import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/getSessionUser";

const DATA_DIR = path.join(process.cwd(), "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.jsonl");

function appendFeedback(line) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(FEEDBACK_FILE, `${JSON.stringify(line)}\n`, "utf8");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim().slice(0, 4000);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    let userId = null;
    let email = null;
    try {
      const u = await getSessionUser();
      if (u) {
        userId = u.id;
        email = u.email;
      }
    } catch (_) {}

    appendFeedback({
      at: new Date().toISOString(),
      userId,
      email,
      rating,
      comment: comment || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("feedback error", e);
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }
}
