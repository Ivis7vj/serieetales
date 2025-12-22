import React, { useState, useEffect } from 'react';
import { APP_VERSION, STORAGE_KEY_VERSION, getLatestVersion, getChangelog, getDownloadUrl, getCodeBundleUrl, CHANGELOG_V1_0_1 } from '../utils/versionConfig';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { MdSystemUpdate, MdCloudDownload, MdCheckCircle, MdClose, MdRocketLaunch } from 'react-icons/md';
import SplashScreen from './SplashScreen';
import UpdateAnimation from './UpdateAnimation';
import './UpdateManager.css'; // Extract styles if needed, but inline is fine for now

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
            // 2. REMOTE OTA CHECK (Is there a NEWER version?)
            // ---------------------------------------------------------
            try {
                const latestVer = await getLatestVersion();
                console.log(`🔍 Version Check: Installed=${APP_VERSION}, Remote=${latestVer}`);

                // STRICT CHECK: If versions match, DO NOTHING.
                if (latestVer === APP_VERSION) {
                    // Ensure tracking is up to date
                    if (storedVersion !== APP_VERSION) {
                        localStorage.setItem(STORAGE_KEY_VERSION, APP_VERSION);
                    }
                    return;
                }

                // If remote is NEWER
                if (latestVer > APP_VERSION) {
                    const changeLog = await getChangelog();
                    const apkUrl = await getDownloadUrl();
                    const zipUrl = await getCodeBundleUrl();

                    setUpdateChangelog(changeLog);
                    setRemoteVersion(latestVer);
                    setDownloadUrl(apkUrl);
                    setCodeBundleUrl(zipUrl);

                    // Delay prompt slightly
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
        setProgress(0);

        // --- OPTION A: CODE PUSH (Hot Update) ---
        if (codeBundleUrl && codeBundleUrl !== 'fake_url') {
            try {
                const version = await CapacitorUpdater.download({
                    url: codeBundleUrl,
                    version: remoteVersion
                });
                // Progress simulation for user feedback since `download` promise doesn't emit progress
                let simProgress = 0;
                const simInt = setInterval(() => {
                    simProgress += 10;
                    if (simProgress > 90) simProgress = 90;
                    setProgress(simProgress);
                }, 200);

                await CapacitorUpdater.set(version);
                clearInterval(simInt);
                setProgress(100);

                // CRITICAL: Do NOT set localStorage here. 
                // We want the App to reload -> Startup Check -> "Stored != APP_VERSION" -> Show Changelog
                setStatus('idle');
                window.location.reload();
            } catch (error) {
                console.error("Code Push Failed:", error);
                alert("Update failed. Please retry.");
                setStatus('idle');
            }
            return;
        }

        // --- OPTION B: FAKE/APK DOWNLOAD (Fallback or Test) ---
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 1;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);

                if (downloadUrl) {
                    window.open(downloadUrl, '_system');
                    setStatus('idle');
                }
            }
            setProgress(currentProgress);
        }, 50);
    };

    const handleCloseChangelog = () => {
        localStorage.setItem(STORAGE_KEY_VERSION, APP_VERSION);
        setStatus('idle');
        // Reload to apply "new files" (simulated or real)
        window.location.reload();
    };

    if (status === 'idle') return null;

    // --- FULL SCREEN CONTAINER (Z-Index High) ---
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 99999, // Higher than everything
            background: status === 'updating' ? '#000' : 'rgba(0,0,0,0.95)', // Pure black for update
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>

            {/* --- 1. PROMPT (Pure Black Card) --- */}
            {status === 'prompt' && (
                <div className="update-card-enter" style={{
                    background: '#000', padding: '40px 30px', borderRadius: '24px',
                    width: '90%', maxWidth: '360px', textAlign: 'center',
                    border: '1px solid #222',
                    boxShadow: '0 0 60px rgba(0,0,0,0.8)'
                }}>
                    <div style={{
                        margin: '0 auto 20px', width: '70px', height: '70px',
                        background: '#111', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #333'
                    }}>
                        <MdSystemUpdate size={32} color="#FFD700" />
                    </div>

                    <h2 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.5rem', fontFamily: 'Anton, sans-serif', letterSpacing: '0.5px' }}>
                        UPDATE AVAILABLE
                    </h2>

                    <p style={{ color: '#888', marginBottom: '30px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Version <span style={{ color: '#fff', fontWeight: 'bold' }}>{remoteVersion}</span> is ready.
                        <br />
                        {codeBundleUrl ? "Seamless instant update." : "Download required."}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={handleUpdate}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                                background: '#FFD700', color: '#000', fontWeight: '800',
                                fontSize: '1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <MdCloudDownload size={20} />
                            UPDATE NOW
                        </button>

                        <button
                            onClick={() => setStatus('idle')}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #333',
                                background: 'transparent', color: '#666', fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Not Now
                        </button>
                    </div>
                </div>
            )}

            {/* --- 2. UPDATING (Splash Screen Loop + Overlay) --- */}
            {status === 'updating' && (
                <>
                    {/* Background Animation - Centered & Large */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.2)',
                        width: '100%', height: '100%', zIndex: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {/* We pass isUpdateMode to reuse the S-Logo animation loop */}
                        <div style={{ transform: 'scale(0.8)' }}>
                            <UpdateAnimation />
                        </div>
                    </div>

                    {/* Foreground Info - Horizontal Loading */}
                    <div style={{
                        zIndex: 10, position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
                        width: '80%', maxWidth: '300px', textAlign: 'center'
                    }}>
                        <h3 style={{
                            color: '#fff', fontSize: '1rem', marginBottom: '15px',
                            textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold',
                            opacity: 0.9, fontFamily: 'monospace'
                        }}>
                            Updating Codebase...
                        </h3>

                        {/* Horizontal Progress Bar */}
                        <div style={{
                            width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)',
                            borderRadius: '10px', overflow: 'hidden', position: 'relative',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{
                                width: `${progress}%`, height: '100%', background: '#FFD700',
                                transition: 'width 0.1s linear',
                                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                            }} />
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', marginTop: '8px',
                            color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold'
                        }}>
                            <span>Applying Patch</span>
                            <span>{progress}%</span>
                        </div>
                    </div>
                </>
            )}

            {/* --- 3. COMPLETED / CHANGELOG (Pure Black) --- */}
            {status === 'completed' && (
                <div className="update-card-enter" style={{
                    background: '#000', padding: '0', borderRadius: '24px',
                    width: '90%', maxWidth: '420px', height: '70vh',
                    border: '1px solid #222', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 0 80px rgba(255, 215, 0, 0.1)'
                }}>
                    {/* Header */}
                    <div style={{ padding: '30px', borderBottom: '1px solid #1a1a1a', background: '#050505' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <MdRocketLaunch color="#FFD700" size={24} />
                            <span style={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>WHAT'S NEW</span>
                        </div>
                        <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0, fontFamily: 'Anton, sans-serif' }}>
                            v{remoteVersion || APP_VERSION}
                        </h1>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                        <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0 }}>
                            {updateChangelog.map((item, idx) => (
                                <li key={idx} style={{
                                    marginBottom: '20px', color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6',
                                    display: 'flex', gap: '12px'
                                }}>
                                    <MdCheckCircle color="#333" size={20} style={{ minWidth: '20px', marginTop: '3px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '20px 30px', borderTop: '1px solid #1a1a1a', background: '#050505' }}>
                        <button
                            onClick={handleCloseChangelog}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                background: '#fff', color: '#000', fontWeight: '800', border: 'none', fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            LET'S GO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateManager;
