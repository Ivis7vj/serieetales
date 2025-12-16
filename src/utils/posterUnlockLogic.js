/**
 * Poster Unlock Logic Utilities
 * Determines how many posters should be unlocked based on series completion status
 */

export const getPosterUnlockStatus = (seriesSeasons, completedSeasons, seriesId) => {
    if (!seriesSeasons || seriesSeasons.length === 0) {
        return { unlockCount: 10, isFullSeriesUnlocked: false };
    }

    const totalSeasons = seriesSeasons.length;
    const completedCount = completedSeasons?.[seriesId]?.length || 0;

    // Single season series - unlock all posters
    if (totalSeasons === 1) {
        return { unlockCount: Infinity, isFullSeriesUnlocked: true };
    }

    // Multiple seasons - check if full series completed
    if (completedCount === totalSeasons) {
        // Full series completed - unlock all posters
        return { unlockCount: Infinity, isFullSeriesUnlocked: true };
    }

    // Partial completion - unlock first 10 posters only
    return { unlockCount: 10, isFullSeriesUnlocked: false };
};

export const isSeasonCompleted = (completedSeasons, seriesId, seasonNumber) => {
    const completed = completedSeasons?.[seriesId] || [];
    return completed.includes(seasonNumber);
};
