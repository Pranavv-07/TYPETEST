/**
 * Google Analytics 4 (GA4) Free Standard Analytics Service
 * 
 * Provides 100% free, client-side Google Analytics integration using the official
 * gtag.js script from Google. Configurable via environment variable (VITE_GA_MEASUREMENT_ID)
 * or through the Institutional Admin Portal UI.
 * 
 * Target hosted domain: https://typetest-gules.vercel.app/
 * Only visible to administrators or directly inside the owner's Google Analytics account.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface AnalyticsEventRecord {
  id: string;
  timestamp: string;
  eventName: string;
  category?: string;
  details: Record<string, any>;
  status: 'sent' | 'buffered';
}

export interface AggregatedTrafficStats {
  totalPageViews: number;
  totalVisits: number;
  testsCompleted: number;
  testsStarted: number;
  certificatesVerified: number;
  routeBreakdown: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  recentPingsCount: number;
  firstTrackedAt: string;
  lastActiveAt: string;
}

const GA_STORAGE_KEY = 'typetest_ga_measurement_id';
const GA_ENABLED_KEY = 'typetest_ga_enabled';
const STATS_STORAGE_KEY = 'typetest_traffic_analytics_v1';
const SESSION_VISIT_KEY = 'typetest_session_counted';
const HOSTED_URL = 'https://typetest-gules.vercel.app';

let initializedId: string | null = null;
const eventLogBuffer: AnalyticsEventRecord[] = [];
const listeners: Array<() => void> = [];

// Setup cross-tab sync channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('typetest_ga_sync') : null;
if (syncChannel) {
  syncChannel.onmessage = (evt) => {
    if (evt.data?.type === 'ga_update') {
      const newId = getGAMeasurementId();
      if (newId && newId !== initializedId) {
        initGA(newId);
      }
      notifyListeners();
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === GA_STORAGE_KEY || e.key === GA_ENABLED_KEY) {
      const newId = getGAMeasurementId();
      if (newId && newId !== initializedId) {
        initGA(newId);
      }
      notifyListeners();
    }
  });
}

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error('Error notifying analytics listener:', err);
    }
  });
}

/**
 * Detect client device category
 */
function getClientDevice(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

/**
 * Detect client browser
 */
function getClientBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua) && !/opr|edge/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios|opr|edge/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/opr\//i.test(ua)) return 'Opera';
  return 'Other Browser';
}

/**
 * Detect client operating system
 */
function getClientOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  return 'Other OS';
}

/**
 * Retrieve local aggregated traffic analytics for admin dashboard
 */
export function getAggregatedStats(): AggregatedTrafficStats {
  const defaultStats: AggregatedTrafficStats = {
    totalPageViews: 0,
    totalVisits: 0,
    testsCompleted: 0,
    testsStarted: 0,
    certificatesVerified: 0,
    routeBreakdown: {
      '/arena': 0,
      '/academy': 0,
      '/tests': 0,
      '/leaderboard': 0,
      '/multiplayer': 0,
      '/verify': 0,
      '/student': 0,
      '/trainer': 0,
      '/admin': 0
    },
    deviceBreakdown: { Desktop: 0, Mobile: 0, Tablet: 0 },
    browserBreakdown: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, 'Other Browser': 0 },
    osBreakdown: { Windows: 0, macOS: 0, Linux: 0, iOS: 0, Android: 0, 'Other OS': 0 },
    recentPingsCount: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultStats,
        ...parsed,
        routeBreakdown: { ...defaultStats.routeBreakdown, ...(parsed.routeBreakdown || {}) },
        deviceBreakdown: { ...defaultStats.deviceBreakdown, ...(parsed.deviceBreakdown || {}) },
        browserBreakdown: { ...defaultStats.browserBreakdown, ...(parsed.browserBreakdown || {}) },
        osBreakdown: { ...defaultStats.osBreakdown, ...(parsed.osBreakdown || {}) }
      };
    }
  } catch {}

  return defaultStats;
}

/**
 * Internal helper to save updated statistics
 */
function saveAggregatedStats(stats: AggregatedTrafficStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Unable to persist local traffic stats:', err);
  }
}

/**
 * Reset local aggregated stats (admin only)
 */
export function clearAggregatedStats(): void {
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_VISIT_KEY);
    notifyListeners();
  } catch {}
}

/**
 * Get active Google Analytics Measurement ID
 */
export function getGAMeasurementId(): string {
  try {
    const saved = localStorage.getItem(GA_STORAGE_KEY);
    if (saved && saved.trim().startsWith('G-')) {
      return saved.trim();
    }
  } catch {}

  const envId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof envId === 'string' && envId.trim().startsWith('G-')) {
    return envId.trim();
  }

  return '';
}

/**
 * Check if GA tracking is enabled by the admin
 */
export function isGATrackingEnabled(): boolean {
  try {
    const pref = localStorage.getItem(GA_ENABLED_KEY);
    if (pref !== null) {
      return pref === 'true';
    }
  } catch {}
  return true; // Enabled by default if ID is configured
}

/**
 * Enable or disable GA tracking
 */
export function setGATrackingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(GA_ENABLED_KEY, String(enabled));
    if (syncChannel) syncChannel.postMessage({ type: 'ga_update' });
    notifyListeners();
  } catch (err) {
    console.error('Failed to save GA enabled state:', err);
  }
}

/**
 * Save custom Google Analytics Measurement ID (e.g. G-XXXXXXXXXX)
 */
export function setGAMeasurementId(id: string): boolean {
  const cleanId = id.trim().toUpperCase();
  if (cleanId && !cleanId.startsWith('G-')) {
    return false;
  }

  try {
    if (cleanId) {
      localStorage.setItem(GA_STORAGE_KEY, cleanId);
      initGA(cleanId);
    } else {
      localStorage.removeItem(GA_STORAGE_KEY);
      initializedId = null;
    }

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ga_update', measurementId: cleanId });
    }
    notifyListeners();
    return true;
  } catch (err) {
    console.error('Failed to save Measurement ID:', err);
    return false;
  }
}

/**
 * Initialize Google Analytics (gtag.js)
 */
export function initGA(explicitId?: string): boolean {
  if (typeof window === 'undefined') return false;

  const targetId = (explicitId || getGAMeasurementId()).trim();
  if (!targetId || !targetId.startsWith('G-')) {
    return false;
  }

  if (!isGATrackingEnabled()) {
    return false;
  }

  // Setup dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
  }

  // Check if script element already exists
  const existingScript = document.getElementById('google-analytics-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'google-analytics-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(targetId)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', targetId, {
      send_page_view: false, // SPA views are manually dispatched for high precision
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
      app_name: 'TYPETEST',
      platform: 'Web'
    });
  } else if (initializedId !== targetId) {
    // Reconfigure with updated ID
    window.gtag('config', targetId, {
      send_page_view: false,
      anonymize_ip: true
    });
  }

  initializedId = targetId;
  notifyListeners();
  return true;
}

/**
 * Track Single-Page Application (SPA) Page View
 */
export function trackPageView(viewName: string, title?: string): void {
  const measurementId = getGAMeasurementId();
  const path = viewName.startsWith('/') ? viewName : `/${viewName}`;
  const pageTitle = title || `TYPETEST - ${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `${HOSTED_URL}${path}`;

  // Update in-app aggregated metrics for admin dashboard
  try {
    const stats = getAggregatedStats();
    stats.totalPageViews += 1;
    stats.lastActiveAt = new Date().toISOString();

    // Check unique visit session
    if (typeof sessionStorage !== 'undefined') {
      if (!sessionStorage.getItem(SESSION_VISIT_KEY)) {
        stats.totalVisits += 1;
        sessionStorage.setItem(SESSION_VISIT_KEY, '1');
      }
    }

    // Route breakdown
    const cleanRoute = path.split('?')[0].split('#')[0] || '/arena';
    stats.routeBreakdown[cleanRoute] = (stats.routeBreakdown[cleanRoute] || 0) + 1;

    // Device / Browser / OS breakdown
    const dev = getClientDevice();
    const bro = getClientBrowser();
    const os = getClientOS();
    stats.deviceBreakdown[dev] = (stats.deviceBreakdown[dev] || 0) + 1;
    stats.browserBreakdown[bro] = (stats.browserBreakdown[bro] || 0) + 1;
    stats.osBreakdown[os] = (stats.osBreakdown[os] || 0) + 1;

    saveAggregatedStats(stats);
  } catch {}

  const eventRecord: AnalyticsEventRecord = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    eventName: 'page_view',
    category: 'navigation',
    details: {
      page_path: path,
      page_title: pageTitle,
      page_location: currentUrl,
      hosted_site: HOSTED_URL
    },
    status: measurementId && isGATrackingEnabled() ? 'sent' : 'buffered'
  };

  eventLogBuffer.unshift(eventRecord);
  if (eventLogBuffer.length > 30) eventLogBuffer.pop();

  if (measurementId && isGATrackingEnabled() && typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: pageTitle,
        page_location: currentUrl
      });
    } catch (e) {
      console.warn('Failed to dispatch GA page_view:', e);
    }
  }

  notifyListeners();
}

/**
 * Track custom user actions (test completion, certificate verification, academy milestones)
 */
export function trackEvent(
  eventName: string,
  params: Record<string, any> = {},
  category: string = 'engagement'
): void {
  const measurementId = getGAMeasurementId();

  // Update in-app aggregated counts
  try {
    const stats = getAggregatedStats();
    stats.lastActiveAt = new Date().toISOString();

    if (eventName === 'test_started') {
      stats.testsStarted += 1;
    } else if (eventName === 'test_completed') {
      stats.testsCompleted += 1;
    } else if (eventName === 'certificate_verified') {
      stats.certificatesVerified += 1;
    } else if (eventName === 'admin_test_ping') {
      stats.recentPingsCount += 1;
    }

    saveAggregatedStats(stats);
  } catch {}

  const eventRecord: AnalyticsEventRecord = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    eventName,
    category,
    details: params,
    status: measurementId && isGATrackingEnabled() ? 'sent' : 'buffered'
  };

  eventLogBuffer.unshift(eventRecord);
  if (eventLogBuffer.length > 30) eventLogBuffer.pop();

  if (measurementId && isGATrackingEnabled() && typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, {
        ...params,
        event_category: category,
        hosted_site: HOSTED_URL
      });
    } catch (e) {
      console.warn(`Failed to dispatch GA event ${eventName}:`, e);
    }
  }

  notifyListeners();
}

/**
 * Send a verification ping event so the administrator can confirm live data in Google Analytics Realtime
 */
export function sendTestPing(triggeredBy = 'Admin Console'): boolean {
  const measurementId = getGAMeasurementId();
  if (!measurementId || !isGATrackingEnabled()) {
    return false;
  }

  trackEvent(
    'admin_test_ping',
    {
      source: triggeredBy,
      website: HOSTED_URL,
      ping_time: new Date().toISOString(),
      screen_resolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '1920x1080',
      device: getClientDevice(),
      browser: getClientBrowser()
    },
    'diagnostic'
  );

  return true;
}

/**
 * Retrieve recent events buffer for admin live preview
 */
export function getRecentEvents(): AnalyticsEventRecord[] {
  return [...eventLogBuffer];
}

/**
 * Subscribe to analytics state changes
 */
export function subscribeToAnalytics(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Export hosted website URL constant
 */
export const VERIFIED_HOSTED_URL = HOSTED_URL;
