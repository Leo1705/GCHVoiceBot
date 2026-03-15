"use client";

export default function EmergencyPanel({ onTalkToHuman, onDismiss }) {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
      <h3 className="font-semibold text-amber-800">Need immediate support?</h3>
      <p className="mt-1 text-sm text-amber-800/90">
        If you&apos;re in crisis, please reach out:
      </p>
      <p className="mt-2 text-sm text-amber-900">
        <a href="tel:+17142485701" className="font-medium text-amber-800 underline hover:text-amber-900">
          GC: Crisis Support (714) 248-5701
        </a>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTalkToHuman}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Talk to a human now
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
