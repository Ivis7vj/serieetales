import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdStar, MdCalendarToday, MdAccessTime, MdPerson, MdRateReview } from 'react-icons/md';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { db } from '../firebase-config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as reviewService from '../utils/reviewService';
import { triggerErrorAutomation } from '../utils/errorAutomation';


const TMDB_API_KEY = "3fd2be6f0c70a2a598f084ddfb75487c";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const EpisodeDetails = () => {
    const { id, seasonNumber, episodeNumber } = useParams(); // id is Series ID
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [episode, setEpisode] = useState(null);
    const [loading, setLoading] = useState(true);
    const { stopLoading } = useLoading();

    // Reviews State
    // Reviews State
    const [firestoreReviews, setFirestoreReviews] = useState([]); // Reviews from DB

    useEffect(() => {
        const fetchEpisodeDetails = async () => {
            setLoading(true);
            try {
                // Fetch Episode Details with Credits (Cast/Guest Stars) and External IDs
                const res = await fetch(`${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}&append_to_response=credits,images,videos,external_ids`);
                const data = await res.json();
                setEpisode(data);

                // Fetch Series Details (for Name) - check if used elsewhere. It matches unused logic removal above.

                // Fetch Reviews via reviewService (Dual-Read: Supabase → Firebase)
                if (data.id) {
                    const dbReviews = await reviewService.getEpisodeReviews(
                        parseInt(id),
                        parseInt(seasonNumber),
                        parseInt(episodeNumber)
                    );
                    setFirestoreReviews(dbReviews);
                }



            } catch (error) {
                triggerErrorAutomation(error);
            } finally {
                setLoading(false);
                stopLoading();
            }
        };

        fetchEpisodeDetails();
    }, [id, seasonNumber, episodeNumber]);

    if (loading && !episode) return null; // Wait for data
    if (!episode) return <div style={{ color: '#FFD600', textAlign: 'center', marginTop: '100px' }}>Episode not found</div>;

    const backdropUrl = episode.still_path
        ? `https://image.tmdb.org/t/p/original${episode.still_path}`
        : null;

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '50px' }}>
            {/* Header / Backdrop */}
            <div style={{ position: 'relative', height: '60vh', width: '100%' }}>
                {backdropUrl && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: `url(${backdropUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.5)'
                    }} />
                )}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #000 100%)'
                }} />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <MdArrowBack size={24} />
                </button>

                {/* Title & Info */}
                <div style={{
                    position: 'absolute', bottom: '20px', left: '0', width: '100%',
                    padding: '20px 40px', boxSizing: 'border-box'
                }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                        {episode.name} <span style={{ fontSize: '1.5rem', fontWeight: '400', color: '#ccc' }}>S{seasonNumber} E{episodeNumber}</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '1rem', color: '#ccc' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MdCalendarToday size={16} /> {episode.air_date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MdAccessTime size={16} /> {episode.runtime} min
                        </span>
                    </div>

                    {/* Episode Ratings */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                        {(() => {
                            // Filter for THIS episode (Multi-Sourced: Supabase/Firestore)
                            const epReviews = firestoreReviews.filter(r =>
                                r.tmdbId === parseInt(id) &&
                                r.seasonNumber === parseInt(seasonNumber) &&
                                r.episodeNumber === parseInt(episodeNumber) &&
                                r.isEpisode
                            );
                            const count = epReviews.length;
                            const avg = count > 0 ? (epReviews.reduce((acc, r) => acc + parseFloat(r.rating), 0) / count).toFixed(1) : null;

                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', border: '1px solid #FFCC00' }}>
                                    <div style={{ background: '#FFCC00', color: 'black', fontWeight: '900', borderRadius: '2px', padding: '0 4px', fontSize: '0.8rem' }}>S</div>
                                    {count > 0 ? (
                                        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{avg}/5 <span style={{ fontSize: '0.8em', color: '#ccc' }}>({count})</span></span>
                                    ) : (
                                        <span style={{ fontWeight: 'bold', color: '#ccc', fontSize: '0.85rem' }}>No Ratings</span>
                                    )}
                                </div>
                            );
                        })()}

                        {firestoreReviews.length === 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', border: '1px dashed #666', color: '#ccc', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                Be the first to rate! 😢
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 40px' }}>
                {/* Actions Row */}
                <div style={{ marginBottom: '30px' }}>
                    <button
                        className="action-btn"
                        onClick={() => navigate(`/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}/reviews`)}
                        style={{
                            background: 'transparent',
                            color: 'white',
                            border: '1px solid #444',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '0',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        <MdRateReview size={20} /> Episode Reviews
                    </button>
                </div>

                {/* Overview */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', color: '#FFCC00' }}>Overview</h2>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#ddd' }}>
                        {episode.overview || "No overview available for this episode."}
                    </p>
                </section>

                {/* Guest Stars */}
                {episode.guest_stars && episode.guest_stars.length > 0 && (
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', color: '#FFCC00' }}>Guest Stars</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            {episode.guest_stars.map(star => (
                                <div key={star.id} onClick={() => navigate(`/person/${star.id}`)} style={{ textAlign: 'center', width: '100px', cursor: 'pointer' }}>
                                    <img
                                        src={star.profile_path ? `https://image.tmdb.org/t/p/w200${star.profile_path}` : 'https://via.placeholder.com/200x300/141414/FFFF00?text=?'}
                                        alt={star.name}
                                        style={{ width: '100%', height: '120px', objectFit: 'cover', border: '1px solid #333' }}
                                    />
                                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: '#fff', fontWeight: 'bold' }}>{star.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{star.character}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Regular Cast */}
                {episode.credits && episode.credits.cast && episode.credits.cast.length > 0 && (
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', color: '#FFCC00' }}>Series Regulars</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            {episode.credits.cast.map(actor => (
                                <div key={actor.id} onClick={() => navigate(`/person/${actor.id}`)} style={{ textAlign: 'center', width: '100px', cursor: 'pointer' }}>
                                    <img
                                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : 'https://via.placeholder.com/200x300/141414/FFFF00?text=?'}
                                        alt={actor.name}
                                        style={{ width: '100%', height: '120px', objectFit: 'cover', border: '1px solid #333' }}
                                    />
                                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: '#fff', fontWeight: 'bold' }}>{actor.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{actor.character}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ReviewsDrawer REMOVED - Using dedicated reviews page */}
        </div>
    );
};

export default EpisodeDetails;
