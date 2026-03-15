"use client";

import { VOICE_MODES } from "@/lib/constants";

export default function ModeSelector({ value, onChange, disabled }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Session mode</h3>
      <p className="text-sm text-gray-600">Choose how you’d like to focus this session.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {VOICE_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            disabled={disabled}
            className={`rounded-2xl border-2 px-5 py-4 text-left transition-all flex gap-4 items-start ${
              value === mode.id
                ? "border-calm-500 bg-calm-50 text-calm-800 shadow-md shadow-calm-200/40"
                : "border-gray-200 bg-white hover:border-calm-300 hover:bg-gray-50"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <span className="text-2xl rounded-xl bg-white/80 p-2 shadow-sm">{mode.icon}</span>
            <div>
              <span className="font-semibold text-gray-900">{mode.label}</span>
              <p className="mt-0.5 text-sm text-gray-600">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
