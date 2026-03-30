"use client";

import { useEffect, useState } from "react";
import { THERAPIST_SELECT_OPTIONS } from "@/lib/constants";

/**
 * After Nora’s spoken welcome: short onboarding (name + assigned therapist).
 */
export default function NoraIntroModal({ open, defaultName = "", defaultTherapistId = "", onContinue }) {
  const [name, setName] = useState(defaultName);
  const [therapistId, setTherapistId] = useState(defaultTherapistId || THERAPIST_SELECT_OPTIONS[0]?.id || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setTherapistId(defaultTherapistId || THERAPIST_SELECT_OPTIONS[0]?.id || "");
      setError("");
    }
  }, [open, defaultName, defaultTherapistId]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError("Please enter your name.");
      return;
    }
    const therapist = THERAPIST_SELECT_OPTIONS.find((t) => t.id === therapistId);
    if (!therapist) {
      setError("Please select a therapist.");
      return;
    }
    setError("");
    onContinue?.({
      patientName: n,
      therapistName: therapist.name,
      therapistEmail: therapist.email,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="nora-intro-title">
      <div className="w-full max-w-md rounded-2xl border-2 border-calm-200 bg-white p-6 shadow-xl">
        <h2 id="nora-intro-title" className="text-lg font-semibold text-calm-900">
          Before we chat
        </h2>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          So we can keep things personal—and let your therapist know you stopped by—add your name and choose who you’re seeing.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="nora-name" className="block text-sm font-medium text-gray-700">
              Your name
            </label>
            <input
              id="nora-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-calm-500 focus:ring-2 focus:ring-calm-400"
              autoComplete="name"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="nora-therapist" className="block text-sm font-medium text-gray-700">
              Your therapist
            </label>
            <select
              id="nora-therapist"
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-calm-500 focus:ring-2 focus:ring-calm-400"
            >
              {THERAPIST_SELECT_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-calm-600 py-3 text-sm font-semibold text-white hover:bg-calm-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
