/**
 * Global Poster Resolution Utilities
 * Central logic for resolving which poster to display based on user selection
 */

/**
 * Get the poster to display for a series/season
 * Checks user's selected posters first, falls back to TMDB poster
 * 
 * @param {object} userData - User data from AuthContext
 * @param {string|number} seriesId - TMDB series ID
 * @param {number} seasonNumber - Season number (null for series-level)
 * @param {string} defaultPoster - Fallback TMDB poster path
 * @returns {string} Poster path to use
 */
export const getResolvedPoster = (userData, seriesId, seasonNumber, defaultPoster) => {
    // If no season specified, return default
    if (!seasonNumber || !userData) return defaultPoster;

    // Check if user has a selected poster for this season
    const key = `${seriesId}_${seasonNumber}`;
    const selectedPoster = userData?.selectedPosters?.[key];

    return selectedPoster || defaultPoster;
};

/**
 * Check if a season is marked as completed
 * 
 * @param {object} userData - User data from AuthContext
 * @param {string|number} seriesId - TMDB series ID
 * @param {number} seasonNumber - Season number
 * @returns {boolean} True if season is completed
 */
export const isSeasonCompleted = (userData, seriesId, seasonNumber) => {
    if (!userData || !seriesId || !seasonNumber) return false;

    const completedKey = String(seriesId);
    const completedSeasons = userData.completedSeasons?.[completedKey] || [];

    return completedSeasons.includes(seasonNumber);
};

/**
 * Format full poster URL from TMDB path
 * 
 * @param {string} posterPath - TMDB poster path
 * @param {string} size - Image size (default: w500)
 * @returns {string} Full URL
 */
export const getFullPosterUrl = (posterPath, size = 'w500') => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};
