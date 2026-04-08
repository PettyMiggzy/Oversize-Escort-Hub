import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.oversizeescorthub.app',
  appName: 'Oversize Escort Hub',
  webDir: 'out',
  server: {
    url: 'https://www.oversize-escort-hub.com',
    cleartext: true
  }
};
export default config;
