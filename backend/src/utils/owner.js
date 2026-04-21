const DEFAULT_OWNER_EMAIL = 'owner@seahawk.com';

function getOwnerEmails() {
  return String(process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL)
    .split(',')
    .map((value) => value.trim().toLowerCase())
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
  DEFAULT_OWNER_EMAIL,
  getOwnerEmails,
  isOwnerUser,
};
