import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PremiumLoader from './components/PremiumLoader';
import { useAuth } from './context/AuthContext';
import { useLoading } from './context/LoadingContext';
import { useScrollLock } from './hooks/useScrollLock';
import './pages/Home.css'; // Reusing Home layout styles for the main container

const Layout = () => {
    const [activeFooter, setActiveFooter] = useState('home');
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { isLoading, setIsLoading, loadingMessage } = useLoading();

    // Lock scroll during global loading
    useScrollLock(isLoading);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // Show Back Button logic
    const showBackButton = location.pathname !== '/' && location.pathname !== '/login';

    return (
        <div className="home-container" style={{ position: 'relative' }}>
            {isLoading && <PremiumLoader message={loadingMessage} />}
            {showBackButton && (
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'fixed',
                        top: 'calc(20px + env(safe-area-inset-top))',
                        left: '20px',
                        zIndex: 1000,
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        outline: 'none',
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                >
                    <FaArrowLeft size={24} /> Back
                </button>
            )}

            <Header onLogout={handleLogout} />
            <div className="content-wrapper">
                <Sidebar activeFooter={activeFooter} setActiveFooter={setActiveFooter} onLogout={handleLogout} />
                <main className="main-content scrollable-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
