"use client";

import { VOICE_PROFILES } from "@/lib/constants";

export default function VoiceCustomization({ value, onChange, disabled }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Voice</h3>
      <p className="text-sm text-gray-600">Tone and pace of the assistant.</p>
      <div className="flex flex-wrap gap-3">
        {VOICE_PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(profile.id)}
            disabled={disabled}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              value === profile.id
                ? "border-calm-500 bg-calm-50 text-calm-800 shadow-md"
                : "border-gray-200 bg-white hover:border-calm-300"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {profile.label}
          </button>
        ))}
      </div>
    </div>
  );
}
