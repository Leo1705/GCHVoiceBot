import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#f8faf8] overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm w-full">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Greater Change <span className="text-calm-600">Therapy</span>
          </Link>
          <Link
            href="/start"
            className="rounded-lg bg-calm-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-calm-700 transition shadow-sm"
          >
            Start voice session
          </Link>
        </div>
      </nav>

      <main className="w-full">
        <section className="relative w-full px-6 pt-16 pb-24 overflow-hidden bg-[#f8faf8]">
          <div className="absolute inset-0 bg-gradient-to-br from-calm-50/60 via-transparent to-support-sage/10 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-wider text-calm-600">
                On-Demand Voice Wellbeing
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1]">
                Mental health support, anytime & anywhere
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                Talk through what’s on your mind with a calm, supportive voice — no sign-up, no appointments. 
                Hold the button and speak when you’re ready.
              </p>
              <Link
                href="/start"
                className="mt-10 inline-block rounded-xl bg-calm-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-calm-600/25 hover:bg-calm-700 hover:shadow-calm-600/30 transition"
              >
                Start voice session
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="w-full max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              How it works
            </h2>
            <div className="mt-10 grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <span className="text-3xl font-bold text-calm-200">1</span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Choose your focus</h3>
                <p className="mt-1 text-gray-600 text-sm">Pick a mode — calm support, anxiety relief, daily check-in, and more.</p>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-calm-200">2</span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Hold to talk</h3>
                <p className="mt-1 text-gray-600 text-sm">Push the button, say what’s on your mind. The voice therapist listens and responds.</p>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-calm-200">3</span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Get support</h3>
                <p className="mt-1 text-gray-600 text-sm">Warm, reflective responses — designed to feel like talking to a real therapist.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Start when you’re ready
          </h2>
          <p className="mt-3 text-gray-600">
            No account needed. Just tap below and talk.
          </p>
          <Link
            href="/start"
            className="mt-8 inline-block rounded-xl bg-calm-600 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:bg-calm-700 transition"
          >
            Start voice session
          </Link>
        </section>

        <footer className="w-full border-t border-gray-200 bg-white py-8">
          <div className="w-full max-w-6xl mx-auto px-6 text-center">
            <p className="text-sm text-gray-500">
              Part of{" "}
              <a href="https://greaterchangehealth.com/" target="_blank" rel="noopener noreferrer" className="text-calm-600 hover:underline font-medium">
                Greater Change Health
              </a>
              — mental health for everyone.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
