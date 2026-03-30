import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f6faf8] text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-calm-200/60 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-calm-900">
            Nora<span className="text-calm-600">.</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#why-nora" className="hover:text-calm-700">
              Why Nora
            </a>
            <a href="#features" className="hover:text-calm-700">
              Features
            </a>
            <a href="#how" className="hover:text-calm-700">
              How it works
            </a>
            <a href="#pricing" className="hover:text-calm-700">
              Pricing
            </a>
            <Link href="/login" className="hover:text-calm-700">
              Log in
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/register"
              className="rounded-xl bg-calm-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-calm-600/20 transition hover:bg-calm-700"
            >
              Get started
            </Link>
          </div>
        </div>
        <div className="flex gap-5 overflow-x-auto border-t border-calm-100/80 px-5 py-2.5 text-xs font-medium text-gray-600 md:hidden">
          <a href="#why-nora" className="whitespace-nowrap hover:text-calm-700">
            Why Nora
          </a>
          <a href="#features" className="whitespace-nowrap hover:text-calm-700">
            Features
          </a>
          <a href="#how" className="whitespace-nowrap hover:text-calm-700">
            How it works
          </a>
          <a href="#pricing" className="whitespace-nowrap hover:text-calm-700">
            Pricing
          </a>
          <Link href="/login" className="whitespace-nowrap hover:text-calm-700">
            Log in
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(54,157,110,0.18),transparent)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-calm-600">
              AI voice therapist · Always on
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] text-gray-900 sm:text-5xl lg:text-6xl">
              Meet Nora—your calm, voice-first companion for reflection and support
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-gray-600 sm:text-xl">
              Nora is here for you <strong className="font-semibold text-gray-800">24 hours a day</strong>. No
              waiting rooms, no typing—just speak naturally and get thoughtful, therapist-style conversation
              whenever you need it.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-calm-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-calm-600/25 transition hover:bg-calm-700 sm:w-auto"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-calm-200 bg-white px-8 py-4 text-base font-semibold text-calm-800 transition hover:border-calm-300 hover:bg-calm-50 sm:w-auto"
              >
                Log in
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Part of{" "}
              <a
                href="https://greaterchangehealth.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-calm-600 hover:underline"
              >
                Greater Change Health
              </a>
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-calm-100 bg-white/80 px-5 py-10">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
            {[
              { label: "Available", value: "24 / 7", sub: "Whenever you need to talk" },
              { label: "Voice-first", value: "Natural", sub: "Speak; no forms to fight through first" },
              { label: "Built for care", value: "Grounded", sub: "Reflective, validating, practical" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold text-calm-700 sm:text-3xl">{item.value}</div>
                <div className="mt-1 font-semibold text-gray-900">{item.label}</div>
                <p className="mt-1 text-sm text-gray-600">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Nora */}
        <section id="why-nora" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Nora—not another chatbot</h2>
              <p className="mt-4 text-lg text-gray-600">
                Nora is designed to feel closer to a real therapeutic conversation: she listens, reflects what she
                hears, asks deeper questions, and helps you leave with something actionable—not a wall of generic
                advice.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "She serves you around the clock",
                  body: "Late-night anxiety, lunch-break check-ins, or Sunday spirals—Nora is there when human schedules don’t line up with yours.",
                  icon: "🌙",
                },
                {
                  title: "Voice that feels human",
                  body: "Talk out loud the way you would with someone across the room. Nora responds with warmth, pacing, and space—not robotic bullet points.",
                  icon: "🎙️",
                },
                {
                  title: "Therapist-aligned workflow",
                  body: "Connect Nora to your care context so your human therapist can stay in the loop when your program includes that handoff.",
                  icon: "🤝",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-calm-100 bg-white p-8 shadow-sm transition hover:border-calm-200 hover:shadow-md"
                >
                  <span className="text-3xl" aria-hidden>
                    {card.icon}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need in one voice session</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              Built for real conversations—not demos. Nora keeps the thread, respects interruptions, and stays focused
              on you.
            </p>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Live captions so you never lose the thread",
                "Interrupt anytime—Nora adapts to what you just said",
                "Modes for calm support, anxiety relief, check-ins, and more",
                "Gentle prompts when you go quiet—never pushy",
                "Path to book your human therapist when you’re ready",
                "Designed for mobile and desktop browsers",
              ].map((text) => (
                <div
                  key={text}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-[#f6faf8] px-5 py-4 text-left"
                >
                  <span className="mt-0.5 text-calm-600" aria-hidden>
                    ✓
                  </span>
                  <span className="font-medium text-gray-800">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Sign in & begin",
                  body: "Create an account (or log in). Nora already knows your name—then tap to start and speak naturally.",
                },
                {
                  step: "2",
                  title: "Speak freely",
                  body: "Share what’s on your mind. Nora reflects, asks follow-ups, and offers grounded suggestions when they help.",
                },
                {
                  step: "3",
                  title: "End when you’re ready",
                  body: "Finish on your terms. Your session can wrap with clarity on next steps—or a bridge to your human therapist.",
                },
              ].map((item) => (
                <div key={item.step} className="relative rounded-2xl border border-calm-100 bg-white p-8 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-calm-100 text-lg font-bold text-calm-800">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof / testimonial style */}
        <section className="border-y border-calm-100 bg-gradient-to-br from-calm-50/80 to-white px-5 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg font-medium italic text-gray-700 sm:text-xl">
              “I didn’t want another app to manage. Being able to just talk—and feel like someone was actually
              listening—made the difference.”
            </p>
            <p className="mt-4 text-sm font-semibold text-calm-700">Voice-first care, on your schedule</p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Simple pricing</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              Start free. Upgrade when Nora becomes part of your routine—or when your organization rolls it out to
              clients.
            </p>
            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "$0",
                  period: "forever",
                  desc: "Try Nora and see if voice support fits your day.",
                  features: ["Limited monthly voice minutes", "Core conversation modes", "Standard voice quality"],
                  cta: "Start free",
                  href: "/register",
                  highlight: false,
                },
                {
                  name: "Plus",
                  price: "$19",
                  period: "/ month",
                  desc: "For people who want Nora available whenever life spikes.",
                  features: [
                    "Unlimited voice time",
                    "Priority voice quality",
                    "Session summaries where enabled",
                    "Email support",
                  ],
                  cta: "Get Plus",
                  href: "/#pricing",
                  highlight: true,
                },
                {
                  name: "Organization",
                  price: "Custom",
                  period: "",
                  desc: "For clinics and programs pairing Nora with licensed care.",
                  features: [
                    "Team onboarding & SSO options",
                    "Usage and compliance tooling",
                    "Dedicated success contact",
                    "Custom integrations",
                  ],
                  cta: "Contact us",
                  href: "https://greaterchangehealth.com/",
                  external: true,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-2xl border-2 p-8 shadow-sm ${
                    tier.highlight
                      ? "border-calm-500 bg-white shadow-lg shadow-calm-600/10 ring-2 ring-calm-500/20"
                      : "border-calm-100 bg-white"
                  }`}
                >
                  {tier.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-calm-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tier.period ? <span className="text-gray-600">{tier.period}</span> : null}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{tier.desc}</p>
                  <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-700">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-calm-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {tier.external ? (
                    <a
                      href={tier.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                        tier.highlight
                          ? "bg-calm-600 text-white hover:bg-calm-700"
                          : "border-2 border-calm-200 bg-white text-calm-800 hover:bg-calm-50"
                      }`}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <Link
                      href={tier.href}
                      className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                        tier.highlight
                          ? "bg-calm-600 text-white hover:bg-calm-700"
                          : "border-2 border-calm-200 bg-white text-calm-800 hover:bg-calm-50"
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-xs text-gray-500">
              Pricing shown is illustrative for marketing; actual billing and entitlements are set by your
              organization or launch partner. Nora does not replace emergency services or a licensed clinician in a
              crisis.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Questions</h2>
            <dl className="mt-10 space-y-4">
              {[
                {
                  q: "Is Nora a replacement for a human therapist?",
                  a: "No. Nora is an AI companion for reflection and support. For clinical care, diagnosis, or crisis, you should work with a licensed professional and appropriate emergency resources.",
                },
                {
                  q: "Why voice instead of chat?",
                  a: "Many people process feelings better when they speak. Voice reduces friction and can feel more like a real conversation—especially late at night or on the go.",
                },
                {
                  q: "Can I use Nora with my existing therapist?",
                  a: "Programs that include Greater Change Health can align Nora with your care team. Ask your therapist or administrator what’s available in your plan.",
                },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border border-gray-100 bg-[#f6faf8] px-5 py-4">
                  <dt className="font-semibold text-gray-900">{item.q}</dt>
                  <dd className="mt-2 text-sm text-gray-600 leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 pb-24 pt-4">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-calm-600 to-calm-800 px-8 py-14 text-center text-white shadow-xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to talk to Nora?</h2>
            <p className="mx-auto mt-4 max-w-xl text-calm-100">
              One tap. A real voice. Support that doesn’t clock out at 5pm.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-semibold text-calm-800 shadow-md transition hover:bg-calm-50"
            >
              Begin your session
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-calm-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-5 text-center text-sm text-gray-500">
          <p>
            <span className="font-semibold text-gray-700">Nora</span> · AI voice support from{" "}
            <a href="https://greaterchangehealth.com/" target="_blank" rel="noopener noreferrer" className="text-calm-600 hover:underline">
              Greater Change Health
            </a>
          </p>
          <p className="mt-2">If you’re in immediate danger, contact local emergency services.</p>
        </div>
      </footer>
    </div>
  );
}
