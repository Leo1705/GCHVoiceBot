"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVoicePreference } from "@/lib/settings";
import { setPatientInfo } from "@/lib/therapistSession";

export default function StartSessionPage() {
  const router = useRouter();
  const [patientName, setPatientNameInput] = useState("");
  const [patientEmail, setPatientEmailInput] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = (e) => {
    e.preventDefault();
    const name = patientName.trim();
    const email = patientEmail.trim();
    if (!name || !email) {
      setError("Please enter both your name and email.");
      return;
    }
    setError("");
    setStarting(true);
    setPatientInfo(name, email);
    const voice = getVoicePreference();
    const params = new URLSearchParams({
      mode: "calm_support",
      voice: voice || "female",
      recording: "0",
    });
    router.push(`/session?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-calm-800 hover:underline">
            ← Home
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Voice therapy session</h1>
        <p className="mt-1 text-gray-600">
          Enter your name and email. After the session we’ll save the details and notify your assigned therapist.
        </p>

        <form onSubmit={handleStart} className="mt-8 space-y-6">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
              Your name
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientNameInput(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-calm-500 focus:ring-2 focus:ring-calm-500"
              autoComplete="name"
            />
            <p className="mt-1 text-xs text-gray-500">The assistant will use this to make the conversation feel personal.</p>
          </div>
          <div>
            <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700">
              Your email
            </label>
            <input
              id="patientEmail"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-calm-500 focus:ring-2 focus:ring-calm-500"
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={starting}
              className="rounded-xl bg-calm-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-calm-700 disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start session"}
            </button>
            <Link
              href="/"
              className="rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 hover:border-calm-400 hover:text-calm-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
