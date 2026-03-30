"use client";

import Link from "next/link";

export default function PaywallModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="w-full max-w-md rounded-2xl border-2 border-calm-200 bg-white p-6 shadow-xl">
        <h2 id="paywall-title" className="text-xl font-bold text-calm-900">
          Your free time is up
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          You’ve used all 10 minutes included on the free plan. Upgrade to keep unlimited voice sessions with Nora.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="flex-1 rounded-xl bg-calm-600 py-3 text-center text-sm font-semibold text-white hover:bg-calm-700"
          >
            View plans
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
