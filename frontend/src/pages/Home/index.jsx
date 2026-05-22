import React from 'react';

const FEATURES = [
  {
    title: 'AI Code Completion',
    description:
      'Context-aware suggestions that understand your codebase and accelerate every keystroke.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    title: 'Natural Language to Code',
    description:
      'Describe what you need in plain English and watch Nexus AI generate production-ready solutions.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: 'Intelligent Debugging',
    description:
      'Pinpoint bugs faster with AI-driven root cause analysis and fix suggestions you can trust.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75V8.25m0 0a48.11 48.11 0 00-5.876-.54M12 8.25V3.75m0 4.5a48.11 48.11 0 015.876-.54M15.75 12a48.11 48.11 0 01-5.25 0" />
      </svg>
    ),
  },
  {
    title: 'Smart Refactoring',
    description:
      'Restructure legacy code safely with guided transformations that preserve behavior and style.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    title: 'Real-time Collaboration',
    description:
      'Pair program with your team and AI in sync—shared context, reviews, and live edits in one place.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Context-Aware Docs',
    description:
      'Auto-generate documentation and inline explanations tailored to your project architecture.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

function NexusLogo({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-cyan-500/20" />
      <path
        d="M8 22L16 8l8 14"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 18h8" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="logo-gradient" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HomePage() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-cyan-600/5 blur-[80px]" />
      </div>

      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <NexusLogo />
            <span className="text-lg font-semibold tracking-tight">
              Nexus<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"> AI</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <button type="button" onClick={scrollToFeatures} className="transition-colors hover:text-zinc-100">
              Features
            </button>
            <a href="#get-started" className="transition-colors hover:text-zinc-100">
              Pricing
            </a>
            <a href="#get-started" className="transition-colors hover:text-zinc-100">
              Docs
            </a>
          </div>
          <a
            href="#get-started"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
          >
            Get Started
          </a>
        </div>
      </nav>

      <header className="relative px-6 pb-24 pt-32 md:pt-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Next-generation AI coding platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Build faster with{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              intelligent code
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Nexus AI pairs with your workflow—completing, debugging, and refactoring code so you ship
            production software with confidence.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/40"
            >
              Get Started
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <button
              type="button"
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-100"
            >
              Explore Features
            </button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl px-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-xs text-zinc-500">nexus-ai — main.tsx</span>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
              <code>
                <span className="text-violet-400">const</span>{' '}
                <span className="text-cyan-300">app</span> ={' '}
                <span className="text-amber-300">createApp</span>
                <span className="text-zinc-500">({'{'}</span>
                {'\n'}
                {'  '}
                <span className="text-zinc-400">{'// Nexus AI suggests optimal structure'}</span>
                {'\n'}
                {'  '}
                <span className="text-cyan-300">plugins</span>
                <span className="text-zinc-500">: [</span>
                <span className="text-emerald-400">aiAssist</span>
                <span className="text-zinc-500">()],</span>
                {'\n'}
                <span className="text-zinc-500">{'}'});</span>
                {'\n'}
                <span className="text-violet-400">await</span> <span className="text-cyan-300">app</span>
                <span className="text-zinc-500">.</span>
                <span className="text-amber-300">launch</span>
                <span className="text-zinc-500">();</span>
              </code>
            </pre>
          </div>
        </div>
      </header>

      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                code smarter
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
              Six powerful capabilities designed for modern developers—from solo builders to enterprise teams.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-cyan-500/30 hover:bg-zinc-900/70 hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 p-3 text-cyan-400 transition-colors group-hover:text-cyan-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="get-started" className="relative px-6 pb-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-600/5" aria-hidden="true" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to transform how you code?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-zinc-400">
            Join thousands of developers using Nexus AI to write better software, faster. Start free—no credit card required.
          </p>
          <a
            href="#get-started"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/40"
          >
            Get Started
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <NexusLogo className="h-6 w-6" />
            <span>© {new Date().getFullYear()} Nexus AI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#features" className="transition-colors hover:text-zinc-300">
              Features
            </a>
            <a href="#get-started" className="transition-colors hover:text-zinc-300">
              Privacy
            </a>
            <a href="#get-started" className="transition-colors hover:text-zinc-300">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
