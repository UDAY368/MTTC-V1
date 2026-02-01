import { API_BASE_URL } from './apiBaseUrl';

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

interface TrackPageVisitParams {
  pageUrl: string;
  pageType?: string;
}

/**
 * Track a page visit
 */
export const trackPageVisit = async ({ pageUrl, pageType }: TrackPageVisitParams): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    const sessionId = getSessionId();
    const referrer = document.referrer || undefined;
    const userAgent = navigator.userAgent;

    await fetch(`${API_BASE_URL}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageUrl,
        pageType,
        referrer,
        userAgent,
        sessionId,
      }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
};

/**
 * Hook to track page visits
 */
export const usePageTracking = (pageUrl: string, pageType?: string) => {
  if (typeof window !== 'undefined') {
    // Track on mount
    trackPageVisit({ pageUrl, pageType });
  }
};
