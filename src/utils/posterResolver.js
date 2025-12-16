// Global poster resolution utility
export const resolveSeasonPoster = (seriesId, seasonNumber, fallbackPoster) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (!currentUser.username) {
    return fallbackPoster;
  }

  // Get season progress for this user and series
  const seasonProgress = JSON.parse(
    localStorage.getItem(`seasonProgress_${currentUser.username}_${seriesId}`) || '{}'
  );

  const progress = seasonProgress[seasonNumber];
  
  // Return selected poster if exists, otherwise fallback
  if (progress?.selectedPosterPath) {
    return `https://image.tmdb.org/t/p/w500${progress.selectedPosterPath}`;
  }
  
  return fallbackPoster;
};

export const getSeasonProgress = (seriesId, seasonNumber) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (!currentUser.username) {
    return null;
  }

  const seasonProgress = JSON.parse(
    localStorage.getItem(`seasonProgress_${currentUser.username}_${seriesId}`) || '{}'
  );

  return seasonProgress[seasonNumber] || null;
};