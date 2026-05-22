export function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getUserDisplayName(user) {
  if (!user) return 'User';

  const meta = user.user_metadata || {};
  if (meta.full_name) return meta.full_name;
  if (meta.name) return meta.name;

  const email = user.email || '';
  if (email) {
    const local = email.split('@')[0];
    return local
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return 'User';
}

export function isEmailVerified(user) {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}
