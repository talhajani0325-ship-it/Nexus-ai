import React from 'react';
import { Link } from 'react-router-dom';

/* ─── Design tokens ─── */
const C = {
  bg: '#0a0a0f',
  bgCard: 'rgba(18, 18, 28, 0.85)',
  bgElevated: '#12121c',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(34, 211, 238, 0.35)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  purple: '#818cf8',
};

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const FEATURES = [
  {
    title: 'AI Code Completion',
    description:
      'Context-aware suggestions that understand your entire codebase and accelerate every keystroke.',
    color: '#22d3ee',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    title: 'Natural Language to Code',
    description:
      'Describe features in plain English and watch Nexus AI generate production-ready implementations.',
    color: '#a78bfa',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: 'Intelligent Debugging',
    description:
      'Pinpoint root causes instantly with AI-driven analysis and trusted, actionable fix suggestions.',
    color: '#34d399',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75V8.25m0 0a48.11 48.11 0 00-5.876-.54M12 8.25V3.75m0 4.5a48.11 48.11 0 015.876-.54M15.75 12a48.11 48.11 0 01-5.25 0" />
      </svg>
    ),
  },
  {
    title: 'Smart Refactoring',
    description:
      'Restructure legacy code safely with guided transformations that preserve behavior and team style.',
    color: '#fbbf24',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    title: 'Real-time Collaboration',
    description:
      'Pair program with your team and AI in sync—shared context, reviews, and live edits in one workspace.',
    color: '#f472b6',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Context-Aware Docs',
    description:
      'Auto-generate documentation and inline explanations tailored to your project architecture.',
    color: '#60a5fa',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const gradientText = {
  background: 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 35%, #a78bfa 70%, #c4b5fd 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const glowBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 32px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff',
  textDecoration: 'none',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontFamily: font,
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #7c3aed 100%)',
  boxShadow: '0 0 24px rgba(34, 211, 238, 0.45), 0 0 48px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

function NXBadge({ size = 40 }) {
  const fontSize = Math.round(size * 0.38);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '11px',
        background: 'linear-gradient(145deg, rgba(18, 18, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.4)',
        boxShadow:
          '0 0 18px rgba(34, 211, 238, 0.45), 0 0 36px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: '-3px',
          borderRadius: '13px',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.35), rgba(167, 139, 250, 0.35))',
          opacity: 0.5,
          filter: 'blur(6px)',
          zIndex: 0,
        }}
      />
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          fontFamily: font,
          background: 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 40%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.7)) drop-shadow(0 0 14px rgba(167, 139, 250, 0.4))',
        }}
      >
        NX
      </span>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function HomePage() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nx-glow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(34, 211, 238, 0.55), 0 0 64px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.25) !important;
        }
        .nx-outline-btn:hover {
          border-color: rgba(34, 211, 238, 0.5) !important;
          background: rgba(34, 211, 238, 0.08) !important;
          color: #f4f4f5 !important;
        }
        .nx-nav-link:hover { color: #f4f4f5 !important; }
        .nx-feature-card:hover {
          border-color: rgba(34, 211, 238, 0.35) !important;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 24px rgba(34, 211, 238, 0.08) !important;
        }
        .nx-footer-link:hover { color: #d4d4d8 !important; }
        @keyframes nx-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.8); }
        }
        @keyframes nx-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .nx-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 640px) {
          .nx-features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .nx-features-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .nx-nav-links { display: none; }
        @media (min-width: 768px) {
          .nx-nav-links { display: flex; }
        }
        .nx-hero-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .nx-hero-actions { flex-direction: row; justify-content: center; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: C.bg,
          color: C.text,
          fontFamily: font,
          WebkitFontSmoothing: 'antialiased',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {/* Ambient glow orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '720px',
              height: '520px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30%',
              right: '-80px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '-60px',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          {/* Subtle grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)',
            }}
          />
        </div>

        {/* Navbar */}
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            borderBottom: `1px solid ${C.border}`,
            background: 'rgba(10, 10, 15, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              maxWidth: '1152px',
              margin: '0 auto',
              padding: '0 24px',
              height: '68px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
              <NXBadge size={42} />
              <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                <span style={{ color: C.text }}>Nexus </span>
                <span style={gradientText}>AI</span>
              </span>
            </Link>

            <div className="nx-nav-links" style={{ alignItems: 'center', gap: '36px' }}>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="nx-nav-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: font,
                  padding: 0,
                }}
              >
                Features
              </button>
              <a href="#get-started" className="nx-nav-link" style={{ color: C.textMuted, fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                Pricing
              </a>
              <a href="#get-started" className="nx-nav-link" style={{ color: C.textMuted, fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                Docs
              </a>
            </div>

            <Link to="/login" className="nx-glow-btn" style={{ ...glowBtn, padding: '10px 22px', fontSize: '14px' }}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header style={{ position: 'relative', zIndex: 1, padding: '140px 24px 80px', textAlign: 'center' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 18px',
                marginBottom: '28px',
                borderRadius: '100px',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                background: 'rgba(34, 211, 238, 0.06)',
                fontSize: '13px',
                fontWeight: 500,
                color: C.cyan,
              }}
            >
              <span style={{ position: 'relative', width: '8px', height: '8px' }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: C.cyan,
                    animation: 'nx-pulse 2s ease-in-out infinite',
                  }}
                />
                <span style={{ position: 'relative', display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: C.cyan }} />
              </span>
              Next-generation AI coding platform
            </div>

            <h1
              style={{
                margin: '0 0 24px',
                fontSize: 'clamp(2.5rem, 6vw, 4.25rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: C.text,
              }}
            >
              Build faster with{' '}
              <span style={gradientText}>intelligent code</span>
            </h1>

            <p
              style={{
                margin: '0 auto 40px',
                maxWidth: '620px',
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                lineHeight: 1.65,
                color: C.textMuted,
              }}
            >
              Nexus AI pairs with your workflow—completing, debugging, and refactoring code so you ship
              production software with confidence.
            </p>

            <div className="nx-hero-actions">
              <Link to="/login" className="nx-glow-btn" style={glowBtn}>
                Get Started <ArrowIcon />
              </Link>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="nx-outline-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: C.textMuted,
                  background: 'rgba(18, 18, 28, 0.6)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: font,
                  transition: 'all 0.2s ease',
                }}
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Code preview */}
          <div style={{ maxWidth: '720px', margin: '64px auto 0', padding: '0 8px' }}>
            <div
              style={{
                borderRadius: '16px',
                border: `1px solid ${C.border}`,
                background: C.bgCard,
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55), 0 0 1px rgba(255,255,255,0.1)',
                overflow: 'hidden',
                animation: 'nx-float 6s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  borderBottom: `1px solid ${C.border}`,
                  background: C.bgElevated,
                }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ marginLeft: '12px', fontFamily: 'monospace', fontSize: '12px', color: C.textDim }}>
                  nexus-ai — main.tsx
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '24px',
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  textAlign: 'left',
                  overflowX: 'auto',
                }}
              >
                <code>
                  <span style={{ color: '#c4b5fd' }}>const</span>{' '}
                  <span style={{ color: '#67e8f9' }}>app</span> ={' '}
                  <span style={{ color: '#fcd34d' }}>createApp</span>
                  <span style={{ color: C.textDim }}>({'{'}</span>
                  {'\n  '}
                  <span style={{ color: '#71717a' }}>{'// Nexus AI suggests optimal structure'}</span>
                  {'\n  '}
                  <span style={{ color: '#67e8f9' }}>plugins</span>
                  <span style={{ color: C.textDim }}>: [</span>
                  <span style={{ color: '#34d399' }}>aiAssist</span>
                  <span style={{ color: C.textDim }}>()],</span>
                  {'\n'}
                  <span style={{ color: C.textDim }}>{'}'});</span>
                  {'\n'}
                  <span style={{ color: '#c4b5fd' }}>await</span> <span style={{ color: '#67e8f9' }}>app</span>
                  <span style={{ color: C.textDim }}>.</span>
                  <span style={{ color: '#fcd34d' }}>launch</span>
                  <span style={{ color: C.textDim }}>();</span>
                </code>
              </pre>
            </div>
          </div>
        </header>

        {/* Features */}
        <section id="features" style={{ position: 'relative', zIndex: 1, padding: '96px 24px' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                Everything you need to <span style={gradientText}>code smarter</span>
              </h2>
              <p style={{ margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', fontSize: '17px', color: C.textMuted, lineHeight: 1.6 }}>
                Six powerful capabilities designed for modern developers—from solo builders to enterprise teams.
              </p>
            </div>

            <div className="nx-features-grid">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="nx-feature-card"
                  style={{
                    padding: '28px',
                    borderRadius: '16px',
                    border: `1px solid ${C.border}`,
                    background: C.bgCard,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: '14px',
                      marginBottom: '20px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${feature.color}22, ${feature.color}08)`,
                      border: `1px solid ${feature.color}33`,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 600, color: C.text }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: C.textMuted }}>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="get-started" style={{ position: 'relative', zIndex: 1, padding: '0 24px 96px' }}>
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)',
              textAlign: 'center',
              borderRadius: '24px',
              border: `1px solid ${C.border}`,
              background: 'linear-gradient(145deg, rgba(18, 18, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
              boxShadow: '0 0 80px rgba(34, 211, 238, 0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(34,211,238,0.04) 0%, transparent 50%, rgba(167,139,250,0.04) 100%)',
                pointerEvents: 'none',
              }}
            />
            <h2
              style={{
                position: 'relative',
                margin: '0 0 16px',
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Ready to transform how you code?
            </h2>
            <p style={{ position: 'relative', margin: '0 auto 32px', maxWidth: '480px', fontSize: '17px', color: C.textMuted, lineHeight: 1.6 }}>
              Join thousands of developers using Nexus AI to write better software, faster. Start free—no credit card required.
            </p>
            <Link to="/login" className="nx-glow-btn" style={{ ...glowBtn, position: 'relative', padding: '16px 40px', fontSize: '18px' }}>
              Get Started <ArrowIcon />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            position: 'relative',
            zIndex: 1,
            borderTop: `1px solid ${C.border}`,
            padding: '32px 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1152px',
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: C.textDim }}>
              <NXBadge size={28} />
              <span>© {new Date().getFullYear()} Nexus AI. All rights reserved.</span>
            </div>
            <div style={{ display: 'flex', gap: '28px' }}>
              <a href="#features" className="nx-footer-link" style={{ fontSize: '14px', color: C.textDim, textDecoration: 'none' }}>
                Features
              </a>
              <a href="#get-started" className="nx-footer-link" style={{ fontSize: '14px', color: C.textDim, textDecoration: 'none' }}>
                Privacy
              </a>
              <a href="#get-started" className="nx-footer-link" style={{ fontSize: '14px', color: C.textDim, textDecoration: 'none' }}>
                Terms
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default HomePage;
