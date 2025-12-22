import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.seriee.app',
    appName: 'SERIEE',
    webDir: 'dist',
    plugins: {
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#000000'
        },
        SplashScreen: {
            backgroundColor: '#000000',
            showSpinner: false,
            androidScaleType: 'CENTER_CROP',
            splashFullScreen: true,
            splashImmersive: true
        },
        CapacitorUpdater: {
            autoUpdate: true,
            statsUrl: "", // Optional: Your stats server
        }
    }
};

export default config;
