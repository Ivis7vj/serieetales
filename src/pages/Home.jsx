import { useState, useEffect } from 'react';
import { MdStarBorder, MdPlayArrow } from 'react-icons/md';
import { TbTrendingUp } from 'react-icons/tb';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


import './Home.css';
import './Home_Trending.css';
import { getResolvedPosterUrl } from '../utils/globalPosterResolver';
import { tmdbApi } from '../utils/tmdbApi';
import { useLoading } from '../context/LoadingContext';
import HeroCarousel from '../components/HeroCarousel';
import { triggerErrorAutomation } from '../utils/errorAutomation';

const Home = () => {
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [topRatedSeries, setTopRatedSeries] = useState([]);
  const [newSeries, setNewSeries] = useState([]);
  const [heroEpisodes, setHeroEpisodes] = useState([]); // NEW STATE
  const [error, setError] = useState(null);
  const { setIsLoading, stopLoading } = useLoading();
  const { currentUser, userData, globalPosters } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only trigger global loader if we don't have hero episodes (initial load)
        if (heroEpisodes.length === 0) setIsLoading(true);

        // Use cache (default) instead of forceDirect for speed
        const [trendingData, topRated, newReleases, heroData] = await Promise.all([
          tmdbApi.getTrending('weekly'),
          tmdbApi.getTopRated(),
          tmdbApi.getNewReleases(),
          tmdbApi.getHeroEpisodes()
        ]);

        setTrendingSeries(trendingData?.slice(0, 12) || []);
        setTopRatedSeries(topRated?.slice(0, 12) || []);
        setNewSeries(newReleases?.slice(0, 12) || []);

        const validHero = (heroData || []).filter(s => {
          if (!s.backdrop_path && !s.poster_path) return false;

          const today = new Date();
          const twoWeeksAgo = new Date(today);
          twoWeeksAgo.setDate(today.getDate() - 14);

          const oneWeekFuture = new Date(today);
          oneWeekFuture.setDate(today.getDate() + 7);

          // Check Last Episode (Released)
          let lastDate = null;
          if (s.last_episode_to_air?.air_date) {
            lastDate = new Date(s.last_episode_to_air.air_date);
          }

          // Check Next Episode (Upcoming)
          let nextDate = null;
          if (s.next_episode_to_air?.air_date) {
            nextDate = new Date(s.next_episode_to_air.air_date);
          }

          // strict filter: must have an episode in the [-14, +7] days window
          const isRecent = lastDate && lastDate >= twoWeeksAgo && lastDate <= today; // Released recently
          const isUpcoming = nextDate && nextDate >= today && nextDate <= oneWeekFuture; // Coming soon

          // attach metadata for sorting preference
          s.filterDate = nextDate && isUpcoming ? nextDate : lastDate;
          s.isUpcoming = !!(nextDate && isUpcoming); // Flag for UI

          return isRecent || isUpcoming;
        });

        // Sorting: Upcoming/Today first, then descending by date
        validHero.sort((a, b) => {
          const dateA = new Date(a.filterDate || 0);
          const dateB = new Date(b.filterDate || 0);
          return dateB - dateA; // Newest/Future first
        });

        setHeroEpisodes(validHero.slice(0, 20)); // Show 20 items

        stopLoading();
      } catch (error) {
        console.error("Home Data Fetch Error:", error);
        setError("Unable to load latest content. Please check your connection.");
        stopLoading();
      }
    };

    fetchData();
  }, [currentUser, setIsLoading, stopLoading]);

  const SeriesCard = ({ series }) => {
    if (!series) return null;

    return (
      <div className="series-card-container">
        <Link to={`/tv/${series.id}`} className="series-card">

          <div className="series-poster-wrapper">
            <img
              className="series-poster"
              src={getResolvedPosterUrl(series.id, series.poster_path, globalPosters, 'w500')
                || (series.backdrop_path ? `https://image.tmdb.org/t/p/w500${series.backdrop_path}` : '')}
              alt={series.name}
              draggable={false}
              style={{ background: '#1a1a1a' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </Link>
      </div>
    );
  };

  return (
    <>
      {error ? (
        <div style={{ color: '#FFD600', textAlign: 'center', marginTop: '100px', padding: '20px', fontSize: '1.1rem' }}>
          {error}
        </div>
      ) : (
        <div className="home-scroller">
          {/* NEW HERO CAROUSEL SECTION */}
          {/* Dynamically previews Newly Released Episodes */}
          <HeroCarousel episodes={heroEpisodes} />

          {/* Trending Series Section */}
          {trendingSeries.length > 0 && (
            <section className="section">
              <h2 className="section-title">
                Trending Series
              </h2>
              <div className="series-row">
                {trendingSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            </section>
          )}

          {/* Top Rated Series Section */}
          {topRatedSeries.length > 0 && (
            <section className="section">
              <h2 className="section-title">
                Highest Rated Series
              </h2>
              <div className="series-row">
                {topRatedSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            </section>
          )}

          {/* New Releases Section */}
          {newSeries.length > 0 && (
            <section className="section">
              <h2 className="section-title">New This Month</h2>
              <div className="series-row">
                {newSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            </section>
          )}
        </div>

      )}
    </>
  );
};

export default Home;
