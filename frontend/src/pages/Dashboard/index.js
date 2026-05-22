import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getUserDisplayName } from '../../utils/auth';

const C = {
  bg: '#0a0a0f',
  bgSidebar: '#0d0d14',
  bgCard: 'rgba(18, 18, 28, 0.85)',
  bgElevated: '#12121c',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  cyan: '#22d3ee',
  violet: '#a78bfa',
};

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const gradientText = {
  background: 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 35%, #a78bfa 70%, #c4b5fd 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const MENU_ITEMS = [
  {
    id: 'Home',
    label: 'Home',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 'Projects',
    label: 'Projects',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.591-.06l-2.12 2.12a1.5 1.5 0 00-.06 1.591l2.12 2.12a1.5 1.5 0 001.591.06l2.12-2.12a1.5 1.5 0 00.06-1.591z" />
      </svg>
    ),
  },
  {
    id: 'Editor',
    label: 'Editor',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    id: 'Academy',
    label: 'Academy',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
  },
  {
    id: 'University',
    label: 'University',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    id: 'Settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const STATS = [
  { label: 'Projects', value: '12', change: '+2 this month', color: '#22d3ee' },
  { label: 'Files', value: '248', change: 'Across all repos', color: '#a78bfa' },
  { label: 'AI Requests', value: '1,432', change: '+18% vs last week', color: '#34d399' },
  { label: 'Learning Progress', value: '68%', change: 'Academy track', color: '#fbbf24' },
];

const RECENT_PROJECTS = [
  { name: 'nexus-api-gateway', lang: 'TypeScript', updated: '2 hours ago', status: 'Active' },
  { name: 'ml-pipeline-v2', lang: 'Python', updated: 'Yesterday', status: 'Review' },
  { name: 'design-system', lang: 'React', updated: '3 days ago', status: 'Active' },
  { name: 'mobile-client', lang: 'Swift', updated: '1 week ago', status: 'Paused' },
];

const QUICK_ACTIONS = [
  { label: 'New Project', color: '#22d3ee' },
  { label: 'Open Editor', color: '#a78bfa' },
  { label: 'Start Learning', color: '#34d399' },
  { label: 'Ask AI', color: '#f472b6' },
];

function UserAvatar({ name, size = 40 }) {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.35);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        background: 'linear-gradient(145deg, rgba(18, 18, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.4)',
        boxShadow: '0 0 18px rgba(34, 211, 238, 0.4), 0 0 32px rgba(124, 58, 237, 0.2)',
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontFamily: font,
          background: 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 40%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 12px rgba(167, 139, 250, 0.35))',
        }}
      >
        {initials}
      </span>
    </div>
  );
}

function NXBadge({ size = 40 }) {
  const fontSize = Math.round(size * 0.38);
  return (
    <div
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
        boxShadow: '0 0 18px rgba(34, 211, 238, 0.4), 0 0 32px rgba(124, 58, 237, 0.2)',
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.06em',
          fontFamily: font,
          background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        NX
      </span>
    </div>
  );
}

const glowBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontFamily: font,
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #7c3aed 100%)',
  boxShadow:
    '0 0 24px rgba(34, 211, 238, 0.45), 0 0 48px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
};

function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const userName = getUserDisplayName(user);
  const userEmail = user?.email || 'Your Account';
  const firstName = userName.split(' ')[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <style>{`
        .nx-dash-nav:hover:not(.nx-dash-nav-active) {
          background: rgba(255, 255, 255, 0.04) !important;
          color: #d4d4d8 !important;
        }
        .nx-dash-search:focus {
          border-color: rgba(34, 211, 238, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1), 0 0 20px rgba(34, 211, 238, 0.12) !important;
        }
        .nx-dash-action:hover {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.35) !important;
        }
        .nx-dash-project:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .nx-dash-icon-btn:hover {
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .nx-dash-glow-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .nx-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 900px) {
          .nx-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .nx-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .nx-actions-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: C.bg,
          color: C.text,
          fontFamily: font,
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: '260px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgSidebar,
            borderRight: `1px solid ${C.border}`,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <div style={{ padding: '24px 20px 28px' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <NXBadge size={40} />
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                <span style={{ color: C.text }}>Nexus </span>
                <span style={gradientText}>AI</span>
              </span>
            </Link>
          </div>

          <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={isActive ? 'nx-dash-nav nx-dash-nav-active' : 'nx-dash-nav'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 14px',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: font,
                    color: isActive ? C.cyan : C.textMuted,
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.03) 100%)'
                      : 'transparent',
                    border: isActive ? '1px solid rgba(34, 211, 238, 0.25)' : '1px solid transparent',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 0 20px rgba(34, 211, 238, 0.12), inset 0 0 0 1px rgba(34, 211, 238, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ color: isActive ? C.cyan : C.textDim, display: 'flex' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User profile */}
          <div
            style={{
              margin: '12px',
              padding: '14px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: 'rgba(18, 18, 28, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserAvatar name={userName} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </div>
                <div style={{ fontSize: '12px', color: C.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Header */}
          <header
            style={{
              height: '68px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '0 28px',
              borderBottom: `1px solid ${C.border}`,
              background: 'rgba(10, 10, 15, 0.9)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ flex: 1, maxWidth: '480px', margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textDim }}
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search projects, files, docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nx-dash-search"
                  style={{
                    width: '100%',
                    padding: '11px 16px 11px 42px',
                    fontSize: '14px',
                    fontFamily: font,
                    color: C.text,
                    background: 'rgba(18, 18, 28, 0.8)',
                    border: `1px solid ${C.border}`,
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="nx-dash-icon-btn"
              aria-label="Notifications"
              style={{
                position: 'relative',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(18, 18, 28, 0.8)',
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                cursor: 'pointer',
                color: C.textMuted,
                transition: 'background 0.2s ease',
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: C.cyan,
                  boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)',
                }}
              />
            </button>

            <UserAvatar name={userName} size={42} />
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
            {activeNav === 'Settings' ? (
              <section
                style={{
                  maxWidth: '560px',
                  padding: '28px',
                  borderRadius: '16px',
                  border: `1px solid ${C.border}`,
                  background: C.bgCard,
                }}
              >
                <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700 }}>Settings</h1>
                <p style={{ margin: '0 0 28px', fontSize: '15px', color: C.textMuted }}>
                  Manage your account and session.
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                    borderRadius: '12px',
                    border: `1px solid ${C.border}`,
                    background: 'rgba(10, 10, 15, 0.5)',
                  }}
                >
                  <UserAvatar name={userName} size={48} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: C.text }}>{userName}</div>
                    <div style={{ fontSize: '14px', color: C.textDim }}>{userEmail}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="nx-dash-glow-btn"
                  style={{
                    ...glowBtn,
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    boxShadow: '0 0 20px rgba(220, 38, 38, 0.35)',
                    opacity: loggingOut ? 0.7 : 1,
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loggingOut ? 'Signing out...' : 'Log Out'}
                </button>
              </section>
            ) : (
              <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Welcome back, <span style={gradientText}>{firstName}</span>
              </h1>
              <p style={{ margin: 0, fontSize: '15px', color: C.textMuted }}>
                Here&apos;s what&apos;s happening across your workspace today.
              </p>
            </div>

            {/* Stats */}
            <div className="nx-stats-grid" style={{ marginBottom: '32px' }}>
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '22px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: C.bgCard,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: C.textMuted, marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', color: C.textDim }}>{stat.change}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {/* Recent Projects */}
              <section
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: `1px solid ${C.border}`,
                  background: C.bgCard,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Recent Projects</h2>
                  <button
                    type="button"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: C.cyan,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: font,
                    }}
                  >
                    View all
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {RECENT_PROJECTS.map((project) => (
                    <div
                      key={project.name}
                      className="nx-dash-project"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${C.border}`,
                        background: 'rgba(10, 10, 15, 0.5)',
                        transition: 'background 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))',
                            border: `1px solid ${C.border}`,
                            color: C.cyan,
                          }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{project.name}</div>
                          <div style={{ fontSize: '12px', color: C.textDim }}>
                            {project.lang} · {project.updated}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '4px 10px',
                          borderRadius: '100px',
                          color: project.status === 'Active' ? '#34d399' : project.status === 'Review' ? '#fbbf24' : C.textDim,
                          background:
                            project.status === 'Active'
                              ? 'rgba(52, 211, 153, 0.12)'
                              : project.status === 'Review'
                                ? 'rgba(251, 191, 36, 0.12)'
                                : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${
                            project.status === 'Active'
                              ? 'rgba(52, 211, 153, 0.25)'
                              : project.status === 'Review'
                                ? 'rgba(251, 191, 36, 0.25)'
                                : C.border
                          }`,
                        }}
                      >
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: `1px solid ${C.border}`,
                  background: C.bgCard,
                }}
              >
                <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Quick Actions</h2>
                <div className="nx-actions-grid">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="nx-dash-action"
                      style={{
                        padding: '20px 16px',
                        borderRadius: '12px',
                        border: `1px solid ${C.border}`,
                        background: 'rgba(10, 10, 15, 0.6)',
                        cursor: 'pointer',
                        fontFamily: font,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: C.text,
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          margin: '0 auto 10px',
                          borderRadius: '10px',
                          background: `${action.color}18`,
                          border: `1px solid ${action.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: action.color,
                        }}
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                      {action.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
