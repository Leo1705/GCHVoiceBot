"use client";

import { useState } from "react";
import Link from "next/link";

export default function SessionFinishedPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submitFeedback(e) {
    e.preventDefault();
    if (rating < 1) {
      setError("Tap a star rating first.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err?.message || "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f6faf8] px-5 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-3 text-center text-gray-600 leading-relaxed">
          Your conversation has ended. Take a moment for yourself—we’re glad you stopped by.
        </p>

        {/* Subscribe */}
        <section className="mt-10 rounded-2xl border border-calm-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-calm-900">Keep Nora with you</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Free time is limited. Subscribe for unlimited voice sessions, priority quality, and ongoing support whenever you need it.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/#pricing"
              className="flex-1 rounded-xl bg-calm-600 py-3 text-center text-sm font-semibold text-white hover:bg-calm-700"
            >
              View plans & subscribe
            </Link>
            <Link
              href="/register"
              className="flex-1 rounded-xl border-2 border-calm-200 py-3 text-center text-sm font-semibold text-calm-800 hover:bg-calm-50"
            >
              New here? Create account
            </Link>
          </div>
        </section>

        {/* Feedback */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">How was your free session?</h2>
          <p className="mt-1 text-sm text-gray-600">Your feedback helps us improve Nora for everyone.</p>

          {status === "sent" ? (
            <p className="mt-6 text-center text-sm font-medium text-calm-700">Thanks—we’ve received your feedback.</p>
          ) : (
            <form onSubmit={submitFeedback} className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Rating</p>
                <div className="mt-2 flex gap-1" role="group" aria-label="Rating 1 to 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`h-11 w-11 rounded-lg text-lg transition ${
                        rating >= n ? "bg-calm-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      aria-pressed={rating === n}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="fb-comment" className="block text-sm font-medium text-gray-700">
                  Anything else? (optional)
                </label>
                <textarea
                  id="fb-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-calm-500 focus:ring-2 focus:ring-calm-400"
                  placeholder="What worked? What could be better?"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send feedback"}
              </button>
            </form>
          )}
        </section>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <Link href="/start" className="text-sm font-semibold text-calm-600 hover:underline">
            Start another session
          </Link>
          <a
            href="https://greaterchangehealth.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl border border-calm-200 bg-white px-6 py-2.5 text-sm font-semibold text-calm-800 hover:bg-calm-50"
          >
            Greater Change Health
          </a>
          <Link href="/" className="text-sm text-gray-500 hover:text-calm-700">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  );
}
