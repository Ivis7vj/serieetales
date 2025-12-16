import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MdEdit, MdStar, MdStarBorder } from 'react-icons/md';

const SeriesDetails = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [seasonProgress, setSeasonProgress] = useState({});
  const [popupVisible, setPopupVisible] = useState(false);
  const [completedSeason, setCompletedSeason] = useState(null);
  const [showEditHint, setShowEditHint] = useState({});
  const posterRef = useRef(null);

  const TMDB_API_KEY = '05587a49bd4890a9630d6c0e544e0f6f';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    fetchSeriesData();
    loadSeasonProgress();
  }, [id]);

  const fetchSeriesData = async () => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      setSeries(data);
      setSeasons(data.seasons || []);
    } catch (error) {
      console.error('Error fetching series:', error);
    }
  };

  const loadSeasonProgress = () => {
    const saved = localStorage.getItem(`seasonProgress_${currentUser.username}_${id}`);
    if (saved) {
      setSeasonProgress(JSON.parse(saved));
    }
  };

  const saveSeasonProgress = (newProgress) => {
    localStorage.setItem(`seasonProgress_${currentUser.username}_${id}`, JSON.stringify(newProgress));
    setSeasonProgress(newProgress);
  };

  const completeSeasonHandler = (seasonNumber) => {
    const newProgress = {
      ...seasonProgress,
      [seasonNumber]: {
        ...seasonProgress[seasonNumber],
        userId: currentUser.username,
        seriesId: id,
        seasonNumber,
        completed: true,
        rated: seasonProgress[seasonNumber]?.rated || false,
        ratingValue: seasonProgress[seasonNumber]?.ratingValue || null,
        selectedPosterPath: seasonProgress[seasonNumber]?.selectedPosterPath || null
      }
    };
    
    saveSeasonProgress(newProgress);
    setCompletedSeason(seasonNumber);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    
    // Auto scroll and highlight after popup closes
    if (completedSeason && seasonProgress[completedSeason]?.completed) {
      setTimeout(() => {
        posterRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        // Show edit hint
        setShowEditHint(prev => ({ ...prev, [completedSeason]: true }));
        
        // Remove hint after 5 seconds
        setTimeout(() => {
          setShowEditHint(prev => ({ ...prev, [completedSeason]: false }));
        }, 5000);
      }, 100);
    }
  };

  const rateSeason = (seasonNumber, rating) => {
    const newProgress = {
      ...seasonProgress,
      [seasonNumber]: {
        ...seasonProgress[seasonNumber],
        userId: currentUser.username,
        seriesId: id,
        seasonNumber,
        completed: seasonProgress[seasonNumber]?.completed || false,
        rated: true,
        ratingValue: rating,
        selectedPosterPath: seasonProgress[seasonNumber]?.selectedPosterPath || null
      }
    };
    
    saveSeasonProgress(newProgress);
  };

  const getSeasonPoster = (season) => {
    const progress = seasonProgress[season.season_number];
    if (progress?.selectedPosterPath) {
      return `https://image.tmdb.org/t/p/w500${progress.selectedPosterPath}`;
    }
    return season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : 
           `https://via.placeholder.com/300x450/141414/FFFF00?text=Season+${season.season_number}`;
  };

  if (!series) return <div className="loading">Loading...</div>;

  return (
    <div className="series-details">
      {/* Completion Popup */}
      {popupVisible && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="completion-popup">
            <h2>Congratulations 🎉</h2>
            <p>You completed Season {completedSeason}</p>
          </div>
        </div>
      )}

      <div className="series-header">
        <h1>{series.name}</h1>
        <p>{series.overview}</p>
      </div>

      <div className="seasons-grid">
        {seasons.map((season) => {
          const progress = seasonProgress[season.season_number] || {};
          const isCompleted = progress.completed;
          const isRated = progress.rated;
          const showHint = showEditHint[season.season_number];

          return (
            <div key={season.season_number} className="season-card">
              <div className="season-poster-container" ref={season.season_number === completedSeason ? posterRef : null}>
                <img
                  src={getSeasonPoster(season)}
                  alt={`Season ${season.season_number}`}
                  className="season-poster"
                />
                
                {/* Edit Poster Button - Only show if completed */}
                {isCompleted && (
                  <button 
                    className={`edit-poster-btn ${showHint ? 'highlight' : ''}`}
                    onClick={() => console.log('Navigate to poster selection')}
                  >
                    <MdEdit />
                  </button>
                )}
                
                {/* Edit Hint */}
                {showHint && (
                  <div className="edit-hint">
                    You are eligible to edit the poster
                  </div>
                )}
              </div>

              <div className="season-info">
                <h3>Season {season.season_number}</h3>
                <p>{season.episode_count} episodes</p>
                
                {/* Complete Season Button */}
                {!isCompleted && (
                  <button 
                    className="complete-btn"
                    onClick={() => completeSeasonHandler(season.season_number)}
                  >
                    Mark as Completed
                  </button>
                )}

                {/* Rating Section - Per Season */}
                <div className="rating-section">
                  <span>Rate this season:</span>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => rateSeason(season.season_number, star)}
                        className="star-btn"
                      >
                        {progress.ratingValue >= star ? <MdStar /> : <MdStarBorder />}
                      </button>
                    ))}
                  </div>
                  {isRated && <span>Rated: {progress.ratingValue}/5</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeriesDetails;