/**
 * Backend API base URL (no trailing slash).
 * Set NEXT_PUBLIC_API_URL in .env.local for production (e.g. Railway backend).
 * Falls back to localhost only when env is not set (local dev).
 */
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return url.replace(/\/+$/, '');
}

export const API_BASE_URL = getApiBaseUrl();
