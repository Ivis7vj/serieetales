// Defines the current app version and OTA logic
// WE ARE "OLD APP" (v1.0.1) - Future updates come from Firebase
import { fetchAndActivate, getString } from "firebase/remote-config";
import { remoteConfig } from "../firebase-config";

// THIS APP'S VERSION (Hardcoded because it's baked into the APK)
export const APP_VERSION = '2.0.0';

// Key to store in localStorage to track if update was seen
export const STORAGE_KEY_VERSION = 'app_version_code';

// ------------------------------------------------------------------
// REMOTE FETCH LOGIC (Future Proofing)
// ------------------------------------------------------------------

export const getLatestVersion = async () => {
    if (!remoteConfig) return APP_VERSION; // Fallback if offline/error
    try {
        // Fetch values from Firebase
        await fetchAndActivate(remoteConfig);
        const remoteVer = getString(remoteConfig, "latest_version");
        console.log("🔥 Remote Config Fetched: Latest Version =", remoteVer);
        return remoteVer || APP_VERSION;
    } catch (error) {
        console.warn("⚠️ Failed to fetch remote config:", error);
        return APP_VERSION; // Fallback: Assume no update
    }
};

export const getDownloadUrl = async () => {
    if (!remoteConfig) return "https://your-default-download-link.com";
    try {
        const url = getString(remoteConfig, "download_url");
        return url || "https://play.google.com/store/apps/details?id=com.seriee.app";
    } catch (error) {
        return "https://play.google.com/store/apps/details?id=com.seriee.app";
    }
};

export const getCodeBundleUrl = async () => {
    if (!remoteConfig) return null;
    try {
        const url = getString(remoteConfig, "code_bundle_url");
        return url || null;
    } catch (error) {
        return null;
    }
};

export const getChangelog = async () => {
    if (!remoteConfig) return ["Update available!"];
    try {
        const raw = getString(remoteConfig, "changelog");
        // console.log("Remote Changelog Raw:", raw); 
        return raw ? JSON.parse(raw) : ["New features and improvements available."];
    } catch (error) {
        console.error("Changelog Parse Error:", error, "Raw Value:", getString(remoteConfig, "changelog"));
        return ["Check the Play Store for details."];
    }
};


// Fallback static changelog (for first run of v1.0.1 welcome screen)
export const CHANGELOG_V1_0_1 = [
    "✨ Refined Banner Selection with perfect 3-column grid alignment and square borders",
    "🎯 Fixed login page flash - authenticated users go straight to home",
    "🖼️ Improved poster grid with uniform sizing and no overflow issues",
    "🔍 Enhanced search overlay - auto-closes instantly on selection",
    "🚀 Performance optimizations and stability improvements",
    "🐛 Fixed all console errors from broken placeholder images",
    "💯 Better authentication flow with persistent sessions"
];
