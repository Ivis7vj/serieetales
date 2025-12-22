import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { MdStar } from 'react-icons/md';
import { Link } from 'react-router-dom';
import PremiumLoader from '../components/PremiumLoader';

const ActivityFeed = ({ userId, feed }) => {
    const [activityFeed, setActivityFeed] = useState([]);
    const [loading, setLoading] = useState(!feed);

    useEffect(() => {
        if (feed) {
            setActivityFeed(feed);
            setLoading(false);
            return;
        }

        const fetchActivity = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'user_activity'),
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(30)
                );
                const snapshot = await getDocs(q);
                setActivityFeed(snapshot.docs.map(doc => doc.data()));
            } catch (error) {
                console.error("Error fetching activity:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [userId, feed]);

    if (loading) return <div style={{ height: '300px', position: 'relative' }}><PremiumLoader message="Loading activity..." /></div>;

    if (activityFeed.length === 0) {
        return <p style={{ color: '#FFD600', textAlign: 'center', marginTop: '20px' }}>No recent activity.</p>;
    }

    return (
        <div className="activity-feed-container" style={{ paddingBottom: '20px' }}>
            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activityFeed.map((item, idx) => {
                    const date = new Date(item.createdAt);
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const finalTime = `${dateStr} · ${timeStr}`;

                    let titleText = item.seriesName;
                    let subText = "";
                    let headerText = "";
                    const isNew = (new Date() - date) < 24 * 60 * 60 * 1000;

                    if (item.type === 'watched_episode') {
                        headerText = "watched";
                        subText = `S${item.seasonNumber} · E${item.episodeNumber}`;
                    } else if (item.type === 'completed_season') {
                        headerText = "finished";
                        subText = `Season ${item.seasonNumber}`;
                    } else if (item.type === 'poster_updated') {
                        headerText = item.customText || "chose this poster for";
                        subText = "";
                    } else if (item.type === 'rated_season') {
                        headerText = "rated";
                        subText = (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>S${item.seasonNumber}</span>
                                <div style={{ display: 'flex', gap: '2px', color: '#FFD600' }}>
                                    {[...Array(Math.floor(item.rating || 0))].map((_, i) => (
                                        <MdStar key={i} size={14} />
                                    ))}
                                    {(item.rating % 1 !== 0) && <MdStar size={14} style={{ opacity: 0.5 }} />}
                                </div>
                            </div>
                        );
                    } else if (item.type === 'watchlist_add') {
                        headerText = "watchlisted";
                    } else if (item.type === 'liked_series') {
                        headerText = "liked";
                    }

                    return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                            {/* User PFP */}
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#111', border: '1px solid #333' }}>
                                <img
                                    src={item.userProfilePicURL || `https://ui-avatars.com/api/?name=${item.username || 'U'}&background=random`}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>

                            <div style={{ width: '40px', aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#222', position: 'relative' }}>
                                {(item.posterPath) && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}
                            </div>

                            {/* Text Right */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#888', fontSize: '12px', marginBottom: '1px' }}>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.userId === userId ? 'You' : (item.username || 'User')}</span> {headerText}
                                </div>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {titleText}
                                </div>
                                {subText && <div style={{ color: '#888', fontSize: '12px', marginTop: '1px' }}>{subText}</div>}
                            </div>

                            {/* Time Absolute Right */}
                            <div style={{ color: '#666', fontSize: '12px', whiteSpace: 'nowrap', alignSelf: 'flex-start', paddingTop: '2px' }}>
                                {finalTime}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityFeed;
