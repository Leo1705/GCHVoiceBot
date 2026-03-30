import Link from "next/link";

export default function SessionFinishedPage() {
  return (
    <div className="min-h-screen w-full bg-[#f8faf8] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Your conversation has ended. Take a moment for yourself—we’re glad you stopped by.
        </p>
        <a
          href="https://greaterchangehealth.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-xl bg-calm-600 px-8 py-3 text-sm font-semibold text-white hover:bg-calm-700 transition"
        >
          Greater Change Health
        </a>
        <p className="mt-6">
          <Link href="/start" className="text-sm text-calm-600 hover:underline font-medium">
            Start another session
          </Link>
        </p>
      </div>
    </div>
  );
}
