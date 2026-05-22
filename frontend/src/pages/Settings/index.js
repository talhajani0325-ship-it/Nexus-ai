import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { getInitials, getUserDisplayName } from '../../utils/auth';

const C = {
  bg: '#0a0a0f',
  bgCard: 'rgba(18, 18, 28, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  cyan: '#22d3ee',
};

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const THEME_KEY = 'nexus-theme';
const LANG_KEY = 'nexus-lang';

const gradientText = {
  background: 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 35%, #a78bfa 70%, #c4b5fd 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
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
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: C.textMuted,
};

const primaryBtn = {
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: 600,
  fontFamily: font,
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #7c3aed 100%)',
  boxShadow: '0 0 20px rgba(34, 211, 238, 0.35)',
};

const COPY = {
  en: {
    title: 'Account Settings',
    back: 'Back to Dashboard',
    profile: 'Profile',
    displayName: 'Display name',
    email: 'Email',
    emailHint: 'Email cannot be changed',
    saveProfile: 'Save Profile',
    password: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change Password',
    oauthPassword: 'Password is managed by your sign-in provider.',
    appearance: 'Appearance',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    dangerZone: 'Danger Zone',
    dangerDesc: 'Permanently delete your account and all associated data. This cannot be undone.',
    deleteAccount: 'Delete Account',
    deleteTitle: 'Delete account?',
    deleteBody: 'This will permanently remove your account. You will be signed out immediately.',
    cancel: 'Cancel',
    confirmDelete: 'Yes, delete my account',
    deleting: 'Deleting...',
    saving: 'Saving...',
    changing: 'Updating...',
    profileSaved: 'Profile updated successfully.',
    passwordChanged: 'Password updated successfully.',
    passwordsMismatch: 'New passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters.',
    currentWrong: 'Current password is incorrect.',
    deleteFailed: 'Could not delete account. Try again or contact support.',
  },
  ur: {
    title: 'اکاؤنٹ کی ترتیبات',
    back: 'ڈیش بورڈ پر واپس',
    profile: 'پروفائل',
    displayName: 'ڈسپلے نام',
    email: 'ای میل',
    emailHint: 'ای میل تبدیل نہیں ہو سکتی',
    saveProfile: 'پروفائل محفوظ کریں',
    password: 'پاس ورڈ',
    currentPassword: 'موجودہ پاس ورڈ',
    newPassword: 'نیا پاس ورڈ',
    confirmPassword: 'نیا پاس ورڈ دوبارہ',
    changePassword: 'پاس ورڈ تبدیل کریں',
    oauthPassword: 'پاس ورڈ آپ کے سائن ان فراہم کنندہ کے ذریعے منظم ہے۔',
    appearance: 'ظاہری شکل',
    theme: 'تھیم',
    dark: 'ڈارک',
    light: 'لائٹ',
    language: 'زبان',
    dangerZone: 'خطرے کا زون',
    dangerDesc: 'اپنا اکاؤنٹ اور تمام ڈیٹا مستقل طور پر حذف کریں۔',
    deleteAccount: 'اکاؤنٹ حذف کریں',
    deleteTitle: 'اکاؤنٹ حذف کریں؟',
    deleteBody: 'یہ آپ کا اکاؤنٹ مستقل طور پر ہٹا دے گا۔',
    cancel: 'منسوخ',
    confirmDelete: 'ہاں، میرا اکاؤنٹ حذف کریں',
    deleting: 'حذف ہو رہا ہے...',
    saving: 'محفوظ ہو رہا ہے...',
    changing: 'اپ ڈیٹ ہو رہا ہے...',
    profileSaved: 'پروفائل اپ ڈیٹ ہو گئی۔',
    passwordChanged: 'پاس ورڈ اپ ڈیٹ ہو گیا۔',
    passwordsMismatch: 'نئے پاس ورڈ مماثل نہیں ہیں۔',
    passwordTooShort: 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔',
    currentWrong: 'موجودہ پاس ورڈ غلط ہے۔',
    deleteFailed: 'اکاؤنٹ حذف نہیں ہو سکا۔',
  },
};

function ProfileAvatar({ name, size = 88 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 35%, #7c3aed 70%, #a78bfa 100%)',
        boxShadow: '0 0 28px rgba(34, 211, 238, 0.45)',
        border: '1px solid rgba(34, 211, 238, 0.35)',
      }}
    >
      <span style={{ fontSize: Math.round(size * 0.32), fontWeight: 800, color: '#fff', fontFamily: font }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayNameFromUser = useMemo(() => getUserDisplayName(user), [user]);
  const email = user?.email || '';

  const [displayName, setDisplayName] = useState(displayNameFromUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem(LANG_KEY) || 'en');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

  const t = COPY[language] || COPY.en;

  const hasEmailProvider = useMemo(
    () => user?.identities?.some((id) => id.provider === 'email') ?? Boolean(user?.email),
    [user]
  );

  useEffect(() => {
    setDisplayName(displayNameFromUser);
  }, [displayNameFromUser]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  const cardStyle = {
    padding: '28px',
    borderRadius: '16px',
    border: `1px solid ${C.border}`,
    background: C.bgCard,
    marginBottom: '24px',
  };

  const msgColor = (type) => (type === 'success' ? '#34d399' : '#f87171');

  async function handleSaveProfile() {
    const trimmed = displayName.trim();
    if (!trimmed) return;

    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });

    setProfileLoading(false);
    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
      return;
    }
    setProfileMsg({ type: 'success', text: t.profileSaved });
  }

  async function handleChangePassword() {
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: t.passwordTooShort });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: t.passwordsMismatch });
      return;
    }

    setPasswordLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordLoading(false);
      setPasswordMsg({ type: 'error', text: t.currentWrong });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ type: 'success', text: t.passwordChanged });
  }

  async function handleDeleteAccount() {
    if (!user?.id) return;

    setDeleteLoading(true);
    setDeleteMsg({ type: '', text: '' });

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    setDeleteLoading(false);

    if (error) {
      setDeleteMsg({ type: 'error', text: error.message || t.deleteFailed });
      return;
    }

    setShowDeleteConfirm(false);
    await signOut();
    navigate('/login', { replace: true, state: { logoutMessage: 'Your account has been deleted.' } });
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: font }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 64px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
            fontSize: '14px',
            fontWeight: 600,
            color: C.textMuted,
            textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t.back}
        </Link>

        <h1 style={{ margin: '0 0 32px', fontSize: '32px', fontWeight: 800, ...gradientText }}>{t.title}</h1>

        {/* Profile */}
        <section style={cardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>{t.profile}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <ProfileAvatar name={displayName || displayNameFromUser} />
            <div>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{displayName || displayNameFromUser}</p>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: C.textMuted }}>{email}</p>
            </div>
          </div>

          <label style={labelStyle}>
            {t.displayName}
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputBase} />
          </label>

          <label style={{ ...labelStyle, marginTop: '16px' }}>
            {t.email}
            <input type="email" value={email} readOnly style={{ ...inputBase, opacity: 0.85, cursor: 'not-allowed' }} />
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: C.textMuted }}>{t.emailHint}</span>
          </label>

          {profileMsg.text && (
            <p style={{ margin: '12px 0 0', fontSize: '14px', color: msgColor(profileMsg.type) }}>{profileMsg.text}</p>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={profileLoading || !displayName.trim()}
            style={{
              ...primaryBtn,
              marginTop: '20px',
              opacity: profileLoading || !displayName.trim() ? 0.6 : 1,
              cursor: profileLoading || !displayName.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {profileLoading ? t.saving : t.saveProfile}
          </button>
        </section>

        {/* Password */}
        <section style={cardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>{t.password}</h2>

          {!hasEmailProvider ? (
            <p style={{ margin: 0, fontSize: '15px', color: C.textMuted, lineHeight: 1.5 }}>{t.oauthPassword}</p>
          ) : (
            <>
              <label style={labelStyle}>
                {t.currentPassword}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  style={inputBase}
                />
              </label>
              <label style={{ ...labelStyle, marginTop: '16px' }}>
                {t.newPassword}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={inputBase}
                />
              </label>
              <label style={{ ...labelStyle, marginTop: '16px' }}>
                {t.confirmPassword}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={inputBase}
                />
              </label>

              {passwordMsg.text && (
                <p style={{ margin: '12px 0 0', fontSize: '14px', color: msgColor(passwordMsg.type) }}>{passwordMsg.text}</p>
              )}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                style={{
                  ...primaryBtn,
                  marginTop: '20px',
                  opacity: passwordLoading || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1,
                  cursor:
                    passwordLoading || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                }}
              >
                {passwordLoading ? t.changing : t.changePassword}
              </button>
            </>
          )}
        </section>

        {/* Appearance */}
        <section style={cardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>{t.appearance}</h2>

          <span style={labelStyle}>{t.theme}</span>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['dark', 'light'].map((mode) => {
              const active = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: font,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: active ? '1px solid rgba(34, 211, 238, 0.5)' : `1px solid ${C.border}`,
                    background: active
                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(124, 58, 237, 0.2) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: active ? C.cyan : C.textMuted,
                  }}
                >
                  {mode === 'dark' ? t.dark : t.light}
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>
            {t.language}
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
              <option value="en">English</option>
              <option value="ur">اردو (Urdu)</option>
            </select>
          </label>
        </section>

        {/* Danger zone */}
        <section
          style={{
            ...cardStyle,
            marginBottom: 0,
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.08)',
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>{t.dangerZone}</h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.textMuted, lineHeight: 1.55 }}>{t.dangerDesc}</p>

          {deleteMsg.text && (
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: msgColor(deleteMsg.type) }}>{deleteMsg.text}</p>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: font,
              color: '#fff',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.35)',
            }}
          >
            {t.deleteAccount}
          </button>
        </section>
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: C.bgCard,
            }}
          >
            <h2 id="delete-dialog-title" style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700 }}>
              {t.deleteTitle}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '15px', color: C.textMuted, lineHeight: 1.5 }}>{t.deleteBody}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: font,
                  color: C.textMuted,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: font,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {deleteLoading ? t.deleting : t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
