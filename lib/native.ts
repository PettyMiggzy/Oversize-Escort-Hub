/**
 * Native-app (Capacitor webview) detection helpers.
 *
 * In the iOS/Android builds, accounts are created and purchases are made on
 * the website; the mobile app then signs in with the existing account.
 */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  if (ua.includes('Capacitor')) return true;
  // Preview switch for testers: open any page with ?app=1 to see the phone-app view in a normal browser (kept for the tab session). ?app=0 turns it off.
  try {
    const q = new URLSearchParams(window.location.search).get('app');
    if (q === '1') window.sessionStorage.setItem('oeh_app_preview', '1');
    if (q === '0') window.sessionStorage.removeItem('oeh_app_preview');
    if (window.sessionStorage.getItem('oeh_app_preview') === '1') return true;
  } catch { /* storage blocked: no preview */ }
  // @ts-expect-error - Capacitor injects a global at runtime
  if (typeof window.Capacitor !== 'undefined') return true;
  return false;
};

export const WEB_HOST = 'https://www.oversize-escort-hub.com';

/** Open a URL in the system browser from inside the native app. */
export const openInBrowser = (path: string) => {
  const url = path.startsWith('http') ? path : `${WEB_HOST}${path.startsWith('/') ? path : '/' + path}`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
};
