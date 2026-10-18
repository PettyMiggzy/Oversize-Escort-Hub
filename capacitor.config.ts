import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.oversizeescorthub.app',
  appName: 'Oversize Escort Hub',
  // The app opens the live site; this folder is only the "no connection" page shown if the site cannot be reached
  webDir: 'mobile-fallback',
  server: {
    url: 'https://www.oversize-escort-hub.com',
    errorPath: 'index.html'
  }
};
export default config;
