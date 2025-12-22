
import { MdSettings, MdLogout, MdDeleteForever, MdLightMode, MdDarkMode, MdReportProblem } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import ReportProblemSheet from '../components/ReportProblemSheet';
import './Home.css';
import { useState } from 'react';

const Settings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { confirm } = useNotification();
    const [isReportOpen, setIsReportOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const isConfirmed = await confirm("Are you sure you want to delete your account? This action cannot be undone.", "Delete Account", "Delete", "Cancel");
        if (isConfirmed) {
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', color: 'var(--text-primary)' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '40px', color: 'var(--text-primary)' }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Account Actions Section */}
                <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <h3 style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontWeight: '800' }}>
                        Account
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                color: '#FFFFFF',
                                fontWeight: '600',
                                fontSize: '1.1rem'
                            }}
                        >
                            <MdLogout size={22} color="#666" /> Log Out
                        </button>

                        <button
                            onClick={() => setIsReportOpen(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <MdReportProblem size={22} color="#666" />
                                <span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: '600' }}>Report a problem</span>
                            </div>
                            <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '37px' }}>Something not working? Tell us.</span>
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                color: '#ff4444',
                                fontWeight: '600',
                                fontSize: '1.1rem'
                            }}
                        >
                            <MdDeleteForever size={22} color="#ff4444" /> Delete Account
                        </button>
                    </div>
                </div>
            </div>

            <ReportProblemSheet isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
        </div>
    );
};

export default Settings;
