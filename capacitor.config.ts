import type { CapacitorConfig } from '@capacitor/cli';

// The app is served from https://localhost inside the Android WebView,
// which Firebase Auth accepts by default.
const config: CapacitorConfig = {
  appId: 'app.kurashii.mobile',
  appName: 'Kurashii',
  webDir: 'dist',
  server: { androidScheme: 'https' },
};

export default config;
