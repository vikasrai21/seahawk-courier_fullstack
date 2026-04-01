import axios from 'axios';
import api, { tokenManager } from './api';

const baseUrl = import.meta.env.VITE_API_URL || '/api';

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function seedCsrfCookie() {
  try {
    await axios.get(`${baseUrl}/health`, { withCredentials: true });
  } catch {
    // Best effort only.
  }
}

export async function refreshSession() {
  const csrf = getCookie('csrf_token');
  const res = await axios.post(
    `${baseUrl}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    }
  );

  const token = res.data?.data?.accessToken;
  if (!token) throw new Error('No access token returned');
  tokenManager.set(token);
  return api.get('/auth/me');
}

export function clearSession() {
  tokenManager.clear();
}
