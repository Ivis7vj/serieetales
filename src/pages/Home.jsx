import { useState, useEffect } from 'react';
import { MdStarBorder, MdPlayArrow } from 'react-icons/md';
import { TbTrendingUp } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-config';
import PosterBadge from '../components/PosterBadge';
import './Home.css';

const Home = () => {
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [topRatedSeries, setTopRatedSeries] = useState([]);
  const [newSeries, setNewSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [starSeriesIds, setStarSeriesIds] = useState(new Set());
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '05587a49bd4890a9630d6c0e544e0f6f';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  // Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);

  // Auto Swipe Hero
  useEffect(() => {
    if (trendingSeries.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % trendingSeries.length);
    }, 3000); // 3 Seconds
    return () => clearInterval(interval);
  }, [trendingSeries]);

  useEffect(() => {
    if (!currentUser) {
      setStarSeriesIds(new Set());
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const stars = docSnap.data().starSeries || [];
        setStarSeriesIds(new Set(stars.map(s => s.id)));
      }
    }, (error) => {
      console.error("Error watching stars:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trending, topRated, newReleases] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`).then(r => r.json()),
          fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`).then(r => r.json()),
          fetch(`${TMDB_BASE_URL}/tv/airing_today?api_key=${TMDB_API_KEY}`).then(r => r.json())
        ]);



        setTrendingSeries(trending.results.slice(0, 12));
        setTopRatedSeries(topRated.results.slice(0, 12));
        setNewSeries(newReleases.results.slice(0, 12));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching series:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const SeriesCard = ({ series }) => {
    if (!series) return null;
    return (
      <div className="series-card-container" style={{ paddingTop: '25px', paddingLeft: '25px', transition: 'padding 0.3s' }}>
        <Link to={`/tv/${series.id}`} className="series-card" style={{ position: 'relative', overflow: 'visible', textDecoration: 'none', color: 'inherit' }}>
          {starSeriesIds.has(series.id) && <PosterBadge />}
          <img
            className="series-poster"
            src={series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : (series.backdrop_path ? `https://image.tmdb.org/t/p/w500${series.backdrop_path}` : 'https://via.placeholder.com/200x300/141414/FFFF00?text=No+Image')}
            alt={series.name}
            draggable={false} // Prevent ghost dragging
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'block',
              width: '100%',
              // Force Vertical Aspect Ratio
              aspectRatio: '2/3',
              height: 'auto',
              objectFit: 'cover',
              borderRadius: '8px',
              userSelect: 'none' // Disable selection
            }}
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/200x300/141414/FFFF00?text=${series.name}`;
            }}
          />
          <div className="series-info">
            <div className="series-title">
              {series.name}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="home-scroller">
          {/* HERO SPLIT SECTION */}
          {/* HERO VERTICAL SECTION */}
          <div className="hero-vertical-section">
            {/* TEXT STACK (Top) */}
            {/* TEXT STACK (Top) */}
            <div className="hero-text-stack">
              <h1 className="hero-title-primary">FIND MOVIES</h1>
              <h1 className="hero-title-gradient blue">TV SHOWS</h1>
              <h1 className="hero-title-gradient pink">AND MORE</h1>
            </div>

            {/* POSTER (Bottom) */}
            {/* POSTER REMOVED */}
          </div>

          {/* Trending Series Section */}
          <section className="section">
            <h2 className="section-title">
              <TbTrendingUp style={{ display: 'inline', marginRight: '10px', color: '#ffd900ff' }} />
              Trending Series
            </h2>
            <div className="series-row">
              {trendingSeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          </section>

          {/* Top Rated Series Section */}
          <section className="section">
            <h2 className="section-title">
              <MdStarBorder style={{ display: 'inline', marginRight: '10px', color: '#ffd900ff' }} />
              Highest Rated Series
            </h2>
            <div className="series-row">
              {topRatedSeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          </section>

          {/* New Releases Section */}
          <section className="section">
            <h2 className="section-title">New This Month</h2>
            <div className="series-row">
              {newSeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Home;
