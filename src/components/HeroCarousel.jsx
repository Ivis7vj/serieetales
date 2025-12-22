import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getResolvedPosterUrl } from '../utils/globalPosterResolver';
import { MdPlayArrow, MdLocalFireDepartment } from 'react-icons/md';
import './HeroCarousel.css';

const HeroCarousel = ({ episodes = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Touch State (useRef to avoid re-renders on scroll)
    const touchStart = useRef(0);
    const touchEnd = useRef(0);

    const navigate = useNavigate();
    const { globalPosters } = useAuth();
    const timerRef = useRef(null);

    // REMOVED: Internal Fetching Logic
    // Data is now passed via props to sync loading with Home.jsx

    // 2. Auto-Swipe Logic
    useEffect(() => {
        if (episodes.length <= 1 || isPaused) return;

        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % episodes.length);
        }, 5000);

        return () => clearInterval(timerRef.current);
    }, [episodes.length, isPaused]);

    // 3. Handlers
    const handleTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
        setIsPaused(true); // Pause interacting
    };

    const handleTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            setCurrentIndex(prev => (prev + 1) % episodes.length);
        } else if (isRightSwipe) {
            setCurrentIndex(prev => (prev - 1 + episodes.length) % episodes.length);
        }

        // Resume auto-play after a delay
        setTimeout(() => setIsPaused(false), 3000);

        touchStart.current = 0;
        touchEnd.current = 0;
    };

    if (episodes.length === 0) return null; // Or skeleton

    return (
        <div
            className="hero-carousel-root"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                className="hero-carousel-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {episodes.map((series, idx) => (
                    <div className="hero-slide" key={series.id}>
                        {/* Background Image */}
                        <img
                            src={getResolvedPosterUrl(series.id, series.backdrop_path, globalPosters, 'w780')
                                || `https://image.tmdb.org/t/p/w780${series.poster_path}`}
                            alt={series.name}
                            className="hero-slide-backdrop"
                            loading={idx === 0 ? "eager" : "lazy"}
                        />

                        {/* Gradient */}
                        <div className="hero-slide-gradient"></div>

                        {/* Content */}
                        <div className="hero-slide-content">
                            <div className="hero-slide-eyebrow">
                                <MdLocalFireDepartment color="#ffd700" size={16} />
                                {series.genres?.[0]?.name || 'Trending Now'}
                            </div>

                            <h2 className="hero-slide-title">{series.name}</h2>

                            {/* Metadata using last_episode_to_air (Released) */}
                            {series.last_episode_to_air && (
                                <div className="hero-slide-meta">
                                    S{series.last_episode_to_air.season_number} E{series.last_episode_to_air.episode_number} • {series.last_episode_to_air.name}
                                </div>
                            )}

                            <button
                                className="hero-view-btn"
                                onClick={() => navigate(`/tv/${series.id}`)}
                            >
                                <MdPlayArrow size={18} /> View Series
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Indicators */}
            <div className="hero-indicators">
                {episodes.map((_, idx) => (
                    <div
                        key={idx}
                        className={`indicator-dot ${currentIndex === idx ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
