"use client";

export default function RecordingConsent({ checked, onChange, disabled }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <input
        id="recording-consent"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-calm-600 focus:ring-calm-500"
      />
      <label htmlFor="recording-consent" className="text-sm text-gray-700">
        <span className="font-medium">Optional session recording</span>
        <span className="block mt-0.5 text-gray-600">
          Disabled by default. If you enable this, your session may be stored encrypted for your or your therapist&apos;s use. You can change this later.
        </span>
      </label>
    </div>
  );
}
