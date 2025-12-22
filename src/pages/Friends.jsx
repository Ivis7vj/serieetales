import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MdPerson, MdSearch, MdClose, MdStar } from 'react-icons/md';
import PremiumLoader from '../components/PremiumLoader';
import './Friends.css';

import { activityService } from '../utils/activityService';

const Friends = () => {
    const { userData } = useAuth();

    // Feed State
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);

    // Hint Logic
    useEffect(() => {
        const hasSeenHint = localStorage.getItem('friend_search_hint_seen');
        if (!hasSeenHint) {
            setShowHint(true);
            const timer = setTimeout(() => {
                setShowHint(false);
                localStorage.setItem('friend_search_hint_seen', 'true');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Fetch Feed
    useEffect(() => {
        const fetchActivities = async () => {
            if (!userData || !userData.following || userData.following.length === 0) {
                setActivities([]);
                setLoading(false);
                return;
            }

            // Check Cache
            const cached = sessionStorage.getItem('friends_feed_cache_v3');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Simple cache validity check (e.g. 5 mins could be added, but prompt says "Refresh on App open", assuming session storage clears effectively or we overwrite)
                    setActivities(parsed);
                    setLoading(false);
                } catch (e) {
                    // Invalid cache, ignore
                }
            }

            try {
                // Limit valid following list to 10 for Firestore 'in' query limit
                const followingSlice = userData.following.slice(0, 10);

                const q = query(
                    collection(db, 'user_activity'),
                    where('userId', 'in', followingSlice),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter Last 7 Days
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const validItems = items.filter(i => {
                    const time = new Date(i.createdAt).getTime();
                    return time > sevenDaysAgo;
                });

                setActivities(validItems);
                sessionStorage.setItem('friends_feed_cache_v3', JSON.stringify(validItems));

                // MARK AS VIEWED when feed is successfully loaded
                activityService.markActivityViewed();

            } catch (error) {
                if (error.code === 'failed-precondition' && error.message.includes('index')) {
                    console.warn("⚠️ MISSING FIRESTORE INDEX (Friends Feed): Click the link in the console to create it!");
                }
                console.error("Error fetching friends feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [userData]);

    // Search Handler (Unchanged logic mostly)
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchText.trim()) return;

        setSearchLoading(true);
        setSearchResults([]);

        try {
            const q = query(
                collection(db, 'users'),
                where('username', '==', searchText.trim()), // Exact match
                limit(3)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            setSearchResults(results);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearchLoading(false);
        }
    };

    const formatTimeAgo = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return "Just now";
        let interval = Math.floor(seconds / 3600);
        if (interval >= 24) {
            interval = Math.floor(interval / 24);
            return interval === 1 ? "Yesterday" : `${interval}d ago`;
        }
        if (interval >= 1) return `${interval}h ago`;
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval}m ago`;
        return "Just now";
    };

    return (
        <div className="friends-container" style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '70px' }}>
            {/* SEARCH SECTION */}
            <div className="friend-search-container" style={{ padding: '10px 20px', position: 'relative' }}>
                <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        className="friend-search-input"
                        placeholder="Search username... (exact)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', outline: 'none' }}
                    />
                    <button type="submit" className="friend-search-btn" style={{ background: '#333', border: 'none', borderRadius: '8px', width: '50px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {searchLoading ? '...' : <MdSearch size={24} />}
                    </button>
                    {showHint && <div style={{ position: 'absolute', top: '100%', left: '20px', background: '#FFD600', color: '#000', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>Find friends</div>}
                </form>

                {/* SEARCH RESULTS */}
                {searchResults.length > 0 && (
                    <div className="search-results-dropdown" style={{ position: 'absolute', top: '75px', left: '20px', right: '20px', background: '#222', borderRadius: '8px', padding: '10px', zIndex: 100, border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                            <span>Results</span>
                            <MdClose onClick={() => setSearchResults([])} style={{ cursor: 'pointer' }} />
                        </div>
                        {searchResults.map(user => (
                            <Link to={`/profile/${user.uid}`} key={user.uid} className="search-result-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#fff', background: '#111', borderRadius: '6px', marginBottom: '5px' }}>
                                <img src={user.photoURL || 'https://placehold.co/40'} alt={user.username} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{ fontWeight: 'bold' }}>{user.username}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* FEED SECTION */}
            <div className="activity-feed" style={{ padding: '0 20px' }}>
                {loading ? (
                    <div style={{ height: '300px', position: 'relative' }}><PremiumLoader message="Fetching feed..." /></div>
                ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#FFD600', marginTop: '50px' }}>
                        <p style={{ marginBottom: '10px' }}>No recent activity.</p>
                        <p style={{ fontSize: '12px', color: '#FFD600' }}>Follow people to see what they're watching.</p>
                    </div>
                ) : (
                    <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {activities.map(item => {
                            // UI Logic
                            let actionText = "";
                            let detailText = "";
                            if (item.type === 'watched_episode') {
                                actionText = "watched";
                                detailText = `Season ${item.seasonNumber} · Episode ${item.episodeNumber}`;
                            } else if (item.type === 'completed_season') {
                                actionText = "completed a season";
                                detailText = `Season ${item.seasonNumber}`;
                            } else if (item.type === 'poster_updated') {
                                actionText = "updated the series poster";
                            } else if (item.type === 'rated_season') {
                                actionText = "rated";
                                detailText = (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                                        <span>Season {item.seasonNumber}</span>
                                        <div style={{ display: 'flex', gap: '1px', color: '#FFD600' }}>
                                            {[...Array(5)].map((_, i) => (
                                                (item.rating || 0) > i ? <MdStar key={i} size={12} /> : null
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    {/* PFP Left */}
                                    <Link to={`/profile/${item.userId}`} style={{ flexShrink: 0 }}>
                                        {item.userProfilePicURL ? (
                                            <img src={item.userProfilePicURL} alt={item.username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MdPerson size={20} color="#888" />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Content Center */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                            <Link to={`/profile/${item.userId}`} style={{ fontWeight: 'bold', color: '#fff', textDecoration: 'none', marginRight: '4px' }}>{item.username}</Link>
                                            <span style={{ color: '#aaa' }}>{actionText}</span>
                                        </div>

                                        <Link to={`/tv/${item.tmdbId}`} style={{ display: 'block', marginTop: '4px', textDecoration: 'none' }}>
                                            <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '8px', borderRadius: '8px', alignItems: 'center' }}>
                                                {/* Optional Thumbnail */}
                                                {item.posterPath && (
                                                    <img src={`https://image.tmdb.org/t/p/w92${item.posterPath}`} alt="" style={{ width: '30px', borderRadius: '4px', aspectRatio: '2/3', objectFit: 'cover' }} />
                                                )}
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.seriesName}</div>
                                                    {detailText && <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{detailText}</div>}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Time Right */}
                                    <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
                                        {formatTimeAgo(item.createdAt)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
