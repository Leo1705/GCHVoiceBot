/**
 * POST /api/ingest — Admin only. Used to teach the assistant from PDFs/text.
 * Requires header X-Admin-Secret to match ADMIN_SECRET (not exposed to users).
 * Body (multipart): file (PDF or .txt) OR JSON: { text: "raw text" }
 */

import { chunkText, addChunks } from "@/lib/knowledgeStore";

function isAdminRequest(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret");
  return header === secret;
}

async function extractTextFromPDF(buffer) {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (e) {
    console.error("PDF parse error:", e?.message || e);
    return "";
  }
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const contentType = request.headers.get("content-type") || "";
    let fullText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return Response.json({ error: "No file provided" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = (file.name || "").toLowerCase();
      if (name.endsWith(".pdf")) {
        fullText = await extractTextFromPDF(buffer);
      } else if (name.endsWith(".txt") || name.endsWith(".text")) {
        fullText = buffer.toString("utf8");
      } else {
        return Response.json({ error: "Unsupported file type. Use .pdf or .txt" }, { status: 400 });
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      fullText = typeof body.text === "string" ? body.text : "";
    } else {
      return Response.json({ error: "Send multipart (file) or JSON ({ text })" }, { status: 400 });
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      return Response.json({ error: "No text to ingest" }, { status: 400 });
    }

    const chunks = chunkText(trimmed);
    const total = addChunks(chunks);

    return Response.json({ ok: true, chunksAdded: chunks.length, totalChunks: total });
  } catch (err) {
    console.error("POST /api/ingest error:", err);
    return Response.json({ error: "Ingest failed" }, { status: 500 });
  }
}
