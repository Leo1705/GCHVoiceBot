"use client";

import { MOOD_OPTIONS } from "@/lib/constants";

export default function MoodSelector({ value, onChange, disabled }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">How are you right now?</h2>
      <p className="text-gray-600">Pick what fits — we’ll suggest a mode from this.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onChange(mood.id)}
            disabled={disabled}
            className={`rounded-2xl border-2 p-4 text-left transition-all flex flex-col items-center justify-center min-h-[100px] ${
              value === mood.id
                ? "border-calm-500 bg-calm-50 shadow-lg shadow-calm-200/50 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-calm-300 hover:shadow-md"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <span className="text-3xl mb-2">{mood.icon}</span>
            <span className="font-semibold text-gray-900 text-sm text-center">{mood.label}</span>
            <span className="text-xs text-gray-500 mt-0.5">{mood.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
