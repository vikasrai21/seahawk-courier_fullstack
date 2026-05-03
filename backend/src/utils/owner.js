const DEFAULT_OWNER_EMAIL = 'admin@seahawk.com';

function getOwnerEmails() {
  const raw = process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL;
  return raw
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);
}

function isOwnerUser(userOrEmail) {
  if (typeof userOrEmail === 'object' && userOrEmail?.role === 'OWNER') {
    return true;
  }
  const email = typeof userOrEmail === 'string'
    ? userOrEmail
    : userOrEmail?.email;
  if (!email) return false;
  return getOwnerEmails().includes(String(email).trim().toLowerCase());
}

module.exports = {
  getOwnerEmails,
  isOwnerUser,
  DEFAULT_OWNER_EMAIL,
};
