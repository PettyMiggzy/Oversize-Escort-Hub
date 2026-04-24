/**
 * Native-app (Capacitor webview) detection helpers.
 *
 * We use these to block in-app sign-up and Stripe checkout on iOS/Android
 * builds so we don't owe Apple/Google 30%. Users create accounts and
 * subscribe on the web; the mobile app then signs them in with the
 * existing account.
 */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  if (ua.includes('Capacitor')) return true;
  // @ts-expect-error - Capacitor injects a global at runtime
  if (typeof window.Capacitor !== 'undefined') return true;
  return false;
};

export const WEB_HOST = 'https://oversize-escort-hub.com';

/** Open a URL in the system browser from inside the native app. */
export const openInBrowser = (path: string) => {
  const url = path.startsWith('http') ? path : `${WEB_HOST}${path.startsWith('/') ? path : '/' + path}`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
};
