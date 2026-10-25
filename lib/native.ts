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
