import axios, { type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** TTL for public GET cache (ms) */
const PUBLIC_CACHE_TTL_MS = 60 * 1000; // 1 minute

/** In-memory cache for public GET responses: url -> { data, timestamp } */
const publicGetCache = new Map<string, { data: unknown; timestamp: number }>();

function isPublicGet(config: InternalAxiosRequestConfig): boolean {
  return (config.method ?? 'get').toLowerCase() === 'get' && (config.url ?? '').startsWith('public/');
}

function getCached(key: string): unknown | null {
  const entry = publicGetCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > PUBLIC_CACHE_TTL_MS) {
    publicGetCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: unknown): void {
  publicGetCache.set(key, { data, timestamp: Date.now() });
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s request timeout
});

// Cache GET requests to public routes (no auth) to reduce load time on repeat visits
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isPublicGet(config)) {
    const key = config.url ?? '';
    const cached = getCached(key);
    if (cached !== null) {
      config.adapter = () => Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig;
    if (isPublicGet(config) && config.url) {
      setCached(config.url, response.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
