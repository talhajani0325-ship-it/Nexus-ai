import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { isEmailVerified } from '../../utils/auth';

const C = {
  bg: '#0a0a0f',
  bgCard: 'rgba(18, 18, 28, 0.9)',
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

const glowBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  width: '100%',
  padding: '14px 24px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontFamily: font,
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #7c3aed 100%)',
  boxShadow:
    '0 0 24px rgba(34, 211, 238, 0.45), 0 0 48px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const inputBase = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '15px',
  fontFamily: font,
  color: C.text,
  background: 'rgba(10, 10, 15, 0.8)',
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: C.textMuted,
};

function NXBadge({ size = 52 }) {
  const fontSize = Math.round(size * 0.38);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '11px',
        background: 'linear-gradient(145deg, rgba(18, 18, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.4)',
        boxShadow:
          '0 0 18px rgba(34, 211, 238, 0.45), 0 0 36px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
      }}
    >
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const messageBox = (type) => ({
  marginBottom: '20px',
  padding: '12px 14px',
  borderRadius: '10px',
  fontSize: '14px',
  lineHeight: 1.5,
  border:
    type === 'error'
      ? '1px solid rgba(239, 68, 68, 0.35)'
      : type === 'success'
        ? '1px solid rgba(34, 211, 238, 0.35)'
        : `1px solid ${C.border}`,
  background:
    type === 'error'
      ? 'rgba(239, 68, 68, 0.1)'
      : type === 'success'
        ? 'rgba(34, 211, 238, 0.08)'
        : 'rgba(18, 18, 28, 0.6)',
  color: type === 'error' ? '#fca5a5' : type === 'success' ? C.cyan : C.textMuted,
});

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isLogin = mode === 'login';

  useEffect(() => {
    const logoutMessage = location.state?.logoutMessage || sessionStorage.getItem('logoutMessage');
    if (logoutMessage) {
      setSuccess(logoutMessage);
      sessionStorage.removeItem('logoutMessage');
    }
  }, [location.state]);

  useEffect(() => {
    if (!authLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, session, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (signInError) throw signInError;

        if (!isEmailVerified(data.user)) {
          await supabase.auth.signOut();
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
        }

        navigate('/dashboard', { replace: true });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { full_name: form.name.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session && data.user && isEmailVerified(data.user)) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setSuccess('Please check your email to verify your account before signing in.');
        setForm((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.bg,
          color: C.textMuted,
          fontFamily: font,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <style>{`
        .nx-auth-glow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(34, 211, 238, 0.55), 0 0 64px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.25) !important;
        }
        .nx-auth-google-btn:hover {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .nx-auth-input:focus {
          border-color: rgba(34, 211, 238, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12), 0 0 20px rgba(34, 211, 238, 0.15) !important;
        }
        .nx-auth-tab-active {
          color: #f4f4f5 !important;
          border-bottom-color: #22d3ee !important;
        }
        .nx-auth-tab:hover { color: #d4d4d8 !important; }
        .nx-auth-toggle-link:hover { color: #22d3ee !important; }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: C.bg,
          color: C.text,
          fontFamily: font,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              right: '-60px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <NXBadge size={56} />
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              <span style={{ color: C.text }}>Nexus </span>
              <span style={gradientText}>AI</span>
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: C.textMuted }}>
              {isLogin ? 'Welcome back. Sign in to continue.' : 'Create your account and start coding smarter.'}
            </p>
          </div>

          <div
            style={{
              padding: '32px',
              borderRadius: '20px',
              border: `1px solid ${C.border}`,
              background: C.bgCard,
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', marginBottom: '28px', borderBottom: `1px solid ${C.border}` }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={isLogin ? 'nx-auth-tab nx-auth-tab-active' : 'nx-auth-tab'}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: font,
                  color: C.textDim,
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={!isLogin ? 'nx-auth-tab nx-auth-tab-active' : 'nx-auth-tab'}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: font,
                  color: C.textDim,
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                }}
              >
                Sign Up
              </button>
            </div>

            {error && <div style={messageBox('error')}>{error}</div>}
            {success && <div style={messageBox('success')}>{success}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="name" style={labelStyle}>Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Developer"
                    value={form.name}
                    onChange={handleChange}
                    className="nx-auth-input"
                    style={inputBase}
                    required={!isLogin}
                  />
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  className="nx-auth-input"
                  style={inputBase}
                  required
                />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="nx-auth-input"
                  style={inputBase}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="nx-auth-glow-btn"
                style={{ ...glowBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
              <span style={{ fontSize: '13px', color: C.textDim }}>or</span>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="nx-auth-google-btn"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 500,
                color: C.text,
                fontFamily: font,
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: C.textMuted }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                className="nx-auth-toggle-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: C.cyan,
                  cursor: 'pointer',
                  fontFamily: font,
                }}
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: C.textDim }}>
            <Link to="/" style={{ color: C.textDim, textDecoration: 'none' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default AuthPage;
