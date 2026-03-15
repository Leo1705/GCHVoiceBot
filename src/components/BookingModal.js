"use client";

import { useState } from "react";

export default function BookingModal({ open, onClose, onConfirm, escalationLevel }) {
  const [step, setStep] = useState("choice");
  const [selectedSlot, setSelectedSlot] = useState(null);

  if (!open) return null;

  const slots = [
    "Tomorrow 10:00 AM",
    "Tomorrow 2:00 PM",
    "Tomorrow 4:00 PM",
    "Thursday 11:00 AM",
    "Thursday 3:00 PM",
  ];

  const handleConfirmChoice = () => {
    setStep("schedule");
  };

  const handleConfirmBooking = () => {
    if (selectedSlot) {
      onConfirm?.({ slot: selectedSlot });
      setStep("choice");
      setSelectedSlot(null);
      onClose();
    }
  };

  const isCrisis = escalationLevel >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {isCrisis ? "You're not alone — get support now" : "Book a session with a therapist"}
        </h2>
        {isCrisis && (
          <div className="mt-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Help lines (24/7)</p>
            <p className="mt-1 text-sm text-amber-800">
              <a href="tel:+17142485701" className="font-medium underline hover:text-amber-900">
                <strong>(714) 248-5701</strong> — GC: Crisis Support
              </a>
            </p>
            <p className="mt-2 text-sm text-amber-900">We can also book a call with your therapist.</p>
          </div>
        )}
        <p className="mt-2 text-sm text-gray-600">
          {isCrisis
            ? "Would you like to book a call with your therapist?"
            : escalationLevel >= 2
              ? "We recommend speaking with a professional. Choose a time that works for you."
              : "Would you like to schedule a session? Pick a time below."}
        </p>

        {step === "choice" && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleConfirmChoice}
              className="flex-1 rounded-lg bg-calm-600 py-2 text-sm font-medium text-white hover:bg-calm-700"
            >
              Yes, book a session
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Not now
            </button>
          </div>
        )}

        {step === "schedule" && (
          <div className="mt-4 space-y-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`block w-full rounded-lg border-2 py-2 text-left px-3 text-sm ${
                  selectedSlot === slot ? "border-calm-500 bg-calm-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {slot}
              </button>
            ))}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="rounded-lg border border-gray-300 py-2 px-4 text-sm text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={!selectedSlot}
                className="rounded-lg bg-calm-600 py-2 px-4 text-sm font-medium text-white disabled:opacity-50 hover:bg-calm-700"
              >
                Confirm booking
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Prototype: no real payment or calendar. In production: Stripe + Calendly.
        </p>
      </div>
    </div>
  );
}
