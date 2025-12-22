import React, { useState, useEffect } from 'react';
import { APP_VERSION, STORAGE_KEY_VERSION, getLatestVersion, getChangelog, getDownloadUrl, getCodeBundleUrl, CHANGELOG_V1_0_1 } from '../utils/versionConfig';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App } from '@capacitor/app';

const UpdateManager = () => {
    const [status, setStatus] = useState('idle'); // idle, prompt, updating, completed
    const [progress, setProgress] = useState(0);
    const [updateChangelog, setUpdateChangelog] = useState([]);
    const [remoteVersion, setRemoteVersion] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [codeBundleUrl, setCodeBundleUrl] = useState(null);

    useEffect(() => {
        const checkVersion = async () => {
            const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

            // ---------------------------------------------------------
            // 1. WELCOME SCREEN LOGIC (Upgraded from v1.0.0 -> v1.0.1)
            // ---------------------------------------------------------
            const hasUsedApp = localStorage.getItem('firebase:authUser') || localStorage.getItem('user_data');

            if (hasUsedApp && !storedVersion) {
                console.log("🚀 Detected Upgrade from Legacy App -> Showing Welcome Changelog");
                localStorage.setItem(STORAGE_KEY_VERSION, APP_VERSION);
                setUpdateChangelog(CHANGELOG_V1_0_1); // Use local static changelog for v1.0.1 welcome
                setRemoteVersion(APP_VERSION);
                setStatus('completed');
                return;
            }

            // ---------------------------------------------------------
            // 2. REMOTE OTA CHECK (Future Updates v1.0.2+)
            // ---------------------------------------------------------
            try {
                const latestVer = await getLatestVersion();
                console.log(`🔍 Version Check: Installed=${APP_VERSION}, Remote=${latestVer}`);

                // Compare versions
                if (latestVer !== APP_VERSION && latestVer > APP_VERSION) {
                    const changeLog = await getChangelog();
                    const apkUrl = await getDownloadUrl();
                    const zipUrl = await getCodeBundleUrl(); // Check for Code Push Bundle

                    setUpdateChangelog(changeLog);
                    setRemoteVersion(latestVer);
                    setDownloadUrl(apkUrl);
                    setCodeBundleUrl(zipUrl);

                    // Delay to not block startup
                    setTimeout(() => {
                        setStatus('prompt');
                    }, 2000);
                }
            } catch (err) {
                console.error("OTA Check Failed:", err);
            }
        };

        checkVersion();
    }, []);

    const handleUpdate = async () => {
        setStatus('updating');

        // --- OPTION A: CODE PUSH (Hot Update) ---
        if (codeBundleUrl) {
            try {
                // Download the bundle
                const version = await CapacitorUpdater.download({
                    url: codeBundleUrl,
                    version: remoteVersion // ID for the new bundle
                });

                // Set as active
                await CapacitorUpdater.set(version);

                // Reload App with new code
                // Note: On Android, we might need a force reload or restart
                localStorage.setItem(STORAGE_KEY_VERSION, remoteVersion);
                setStatus('idle');
                window.location.reload();

            } catch (error) {
                console.error("Code Push Failed:", error);
                // Fallback to APK Download if code push fails
                if (downloadUrl) {
                    window.open(downloadUrl, '_system');
                } else {
                    alert("Update failed. Please check your internet.");
                    setStatus('idle');
                }
            }
            return;
        }

        // --- OPTION B: APK DOWNLOAD (Fallback) ---
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 5; // Faster simulation
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);

                if (downloadUrl) {
                    // Open in system browser (default android behavior for APK download)
                    window.open(downloadUrl, '_system');
                }
            }
            setProgress(currentProgress);
        }, 50);
    };

    const handleCloseChangelog = () => {
        // Mark this version as "seen"
        if (remoteVersion) {
            localStorage.setItem(STORAGE_KEY_VERSION, remoteVersion);
        }
        setStatus('idle');
    };

    const handleDownloadRedirect = () => {
        handleCloseChangelog();
    };

    if (status === 'idle') return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
        }}>
            {/* --- UPDATE PROMPT --- */}
            {status === 'prompt' && (
                <div style={{
                    background: '#121212', padding: '30px', borderRadius: '20px',
                    width: '90%', maxWidth: '350px', textAlign: 'center', border: '1px solid #333',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ marginBottom: '15px' }}>
                        <span style={{ fontSize: '3rem' }}>📲</span>
                    </div>
                    <h2 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.4rem' }}>Update Available</h2>
                    <p style={{ color: '#aaa', marginBottom: '25px', fontSize: '0.95rem', lineHeight: '1.4' }}>
                        A new version <strong>({remoteVersion})</strong> is ready to install.
                        {codeBundleUrl ? " (Instant Update)" : " (Download Required)"}
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setStatus('idle')}
                            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#222', color: '#fff', fontWeight: '600' }}
                        >
                            Later
                        </button>
                        <button
                            onClick={handleUpdate}
                            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#FFD700', color: '#000', fontWeight: 'bold' }}
                        >
                            Update Now
                        </button>
                    </div>
                </div>
            )}

            {/* --- UPDATING UI --- */}
            {status === 'updating' && (
                <div style={{
                    background: '#121212', padding: '40px', borderRadius: '20px',
                    width: '90%', maxWidth: '350px', textAlign: 'center', border: '1px solid #333'
                }}>
                    <h3 style={{ color: '#fff', marginBottom: '25px' }}>
                        {codeBundleUrl ? "Installing Update..." : "Starting Download..."}
                    </h3>

                    {/* Fake Progress Bar for UI feel */}
                    <div style={{ width: '100%', height: '8px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: '100%', height: '100%', background: '#FFD700',
                            animation: 'indeterminate 1.5s infinite linear',
                            boxShadow: '0 0 10px #FFD700'
                        }} />
                    </div>
                    <style>
                        {`
                        @keyframes indeterminate {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        `}
                    </style>
                    <p style={{ color: '#888', marginTop: '15px', fontSize: '0.9rem' }}>
                        Please wait...
                    </p>
                </div>
            )}

            {/* --- CHANGELOG (COMPLETED) --- */}
            {status === 'completed' && (
                <div style={{
                    background: '#000', padding: '30px', borderRadius: '20px',
                    width: '90%', maxWidth: '400px', textAlign: 'left', border: '1px solid #222',
                    boxShadow: '0 0 50px rgba(255, 215, 0, 0.15)',
                    maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.6rem', margin: 0 }}>What's New</h2>
                        <span style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>v{remoteVersion || APP_VERSION}</span>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                        <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0, color: '#ddd' }}>
                            {updateChangelog.map((item, idx) => (
                                <li key={idx} style={{
                                    marginBottom: '15px',
                                    lineHeight: '1.5',
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px'
                                }}>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleDownloadRedirect}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px', marginTop: '25px',
                            background: '#fff', color: '#000', fontWeight: '800', border: 'none', fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Awesome!
                    </button>
                </div>
            )}
        </div>
    );
};

export default UpdateManager;
