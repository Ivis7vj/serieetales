import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbApi } from '../utils/tmdbApi';
import { getResolvedPosterUrl } from '../utils/globalPosterResolver';
import { useAuth } from '../context/AuthContext';
import { MdPlayArrow, MdTrendingUp } from 'react-icons/md';
import './HeroPreview.css';

const HeroPreview = ({ seriesId }) => {
    const [seriesData, setSeriesData] = useState(null);
    const [trailerKey, setTrailerKey] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { globalPosters } = useAuth(); // For poster fallback

    // 1. Fetch Data & Find Trailer
    useEffect(() => {
        if (!seriesId) return;

        const fetchData = async () => {
            try {
                // This uses your existing backend cache (24h TTL)
                // It fetches videos automatically via append_to_response
                const data = await tmdbApi.getSeriesDetails(seriesId);
                setSeriesData(data);

                // Find Trailer: Type="Trailer" + Site="YouTube"
                // Prefer Official
                const videos = data.videos?.results || [];
                const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official)
                    || videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');

                if (trailer) {
                    setTrailerKey(trailer.key);
                }
            } catch (err) {
                console.warn("[HeroPreview] Failed to fetch:", err);
            }
        };

        fetchData();
    }, [seriesId]);

    // 2. Intersection Observer (Auto-Play/Pause)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.5 } // 50% visible to play
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, []);

    if (!seriesData) return null; // Or a skeleton loader if preferred

    // Label Logic: New Season vs New Episode
    // Simple heuristic: if last_episode_to_air is recent (< 7 days)
    // Fix Purity: Calculate current time once on render or use independent check.
    // Date.now() is impure. We can use a stable reference or just suppress if we accept it changes.
    // Better: useMemo to lock it for this render cycle.
    const label = React.useMemo(() => {
        if (!seriesData) return "";
        const lastAirDate = new Date(seriesData.last_episode_to_air?.air_date);
        const isNew = (Date.now() - lastAirDate.getTime()) < (7 * 24 * 60 * 60 * 1000);
        return isNew ? "BRAND NEW EPISODE" : "TRENDING NOW";
    }, [seriesData]);

    return (
        <div className="hero-preview-container" ref={containerRef} onClick={() => navigate(`/tv/${seriesId}`)}>

            {/* A. MEDIA LAYER */}
            <div className="hero-media-wrapper">
                {trailerKey && isVisible ? (
                    <iframe
                        className={`hero-video-iframe ${isVideoLoaded ? 'visible' : ''}`}
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${window.location.origin}`}
                        title="Hero Trailer"
                        allow="autoplay; encrypted-media"
                        onLoad={() => setIsVideoLoaded(true)}
                    />
                ) : null}

                {/* Fallback Poster (Visible while loading or if no video) */}
                <img
                    className="hero-fallback-poster"
                    src={getResolvedPosterUrl(seriesData.id, seriesData.backdrop_path, globalPosters, 'w780') || ''}
                    alt={seriesData.name}
                    style={{ display: isVideoLoaded && isVisible ? 'none' : 'block' }}
                />
            </div>

            {/* B. OVERLAY GRADIENT */}
            <div className="hero-overlay-gradient"></div>

            {/* C. CONTENT LAYER */}
            <div className="hero-content-layer">
                <div className="hero-eyebrow">
                    <MdTrendingUp size={16} /> {label}
                </div>

                <h1 className="hero-title">{seriesData.name}</h1>

                {/* Optional: Description Blurb (Desktop mostly) */}
                <p className="hero-desc-blurb">
                    {seriesData.overview}
                </p>

                <button className="hero-cta-btn">
                    <MdPlayArrow className="play-icon-mini" /> View Series
                </button>
            </div>
        </div>
    );
};

export default HeroPreview;
