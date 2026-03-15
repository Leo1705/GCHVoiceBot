"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Admin-only: teach the assistant (ingest PDF/text).
 * Not linked in the app. Use when you have new content for the AI to learn from.
 * Set ADMIN_SECRET in .env.local and pass it below.
 */
export default function AdminKnowledgePage() {
  const [secret, setSecret] = useState("");
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  const headers = () => ({
    "X-Admin-Secret": secret,
    ...(paste.trim() ? { "Content-Type": "application/json" } : {}),
  });

  async function ingestText() {
    if (!paste.trim() || !secret.trim()) return;
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify({ text: paste.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setStatus({ type: "success", message: `Added ${data.chunksAdded} chunks (${data.totalChunks} total).` });
      setPaste("");
    } catch (e) {
      setStatus({ type: "error", message: e.message || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  async function onFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file || !secret.trim()) return;
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "X-Admin-Secret": secret },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus({ type: "success", message: `Uploaded "${file.name}": ${data.chunksAdded} chunks (${data.totalChunks} total).` });
      e.target.value = "";
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Knowledge base (admin)</h1>
        <p className="mt-1 text-sm text-gray-600">Add PDFs or text so the assistant can use this content. Not visible to end users.</p>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="From ADMIN_SECRET in .env.local"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Paste text</label>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Paste resources, FAQs, guidelines…"
            rows={5}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={loading || !paste.trim() || !secret.trim()}
            onClick={ingestText}
            className="mt-2 rounded-lg bg-calm-600 px-4 py-2 text-sm font-medium text-white hover:bg-calm-700 disabled:opacity-50"
          >
            {loading ? "Adding…" : "Add to knowledge base"}
          </button>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Or upload PDF / .txt</label>
          <input
            type="file"
            accept=".pdf,.txt,.text"
            onChange={onFileSelect}
            disabled={loading || !secret.trim()}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-calm-50 file:px-4 file:py-2 file:font-medium file:text-calm-700"
          />
        </div>

        {status.message && (
          <p className={`mt-4 text-sm ${status.type === "error" ? "text-red-600" : "text-calm-700"}`}>{status.message}</p>
        )}
      </div>
    </div>
  );
}
