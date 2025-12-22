const BACKEND_URL = 'http://localhost:5000/api';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '05587a49bd4890a9630d6c0e544e0f6f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * TMDB API Wrapper (Hybrid: Backend Cache -> Direct Fallback)
 */

// Helper for fetching with a timeout
const fetchWithTimeout = async (url, options, timeout = 2000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

const fetchDirect = async (endpoint, params = '') => {
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}${params}`);
    if (!res.ok) throw new Error('TMDB Direct API Failed');
    return await res.json();
};

// In-memory session cache to avoid repeated TMDB calls in the same session
const sessionCache = {
    series: {},
    seasons: {}
};

let backendOffline = false;
let lastBackendCheck = 0;

const getFromBackend = async (endpoint, forceDirect = false) => {
    if (forceDirect) return null;

    // If backend was detected offline, only retry every 30 seconds
    if (backendOffline && Date.now() - lastBackendCheck < 30000) {
        return null;
    }

    try {
        // Try backend cache first with a VERY short timeout (500ms)
        const res = await fetchWithTimeout(`${BACKEND_URL}${endpoint}`, {}, 500);
        if (res.ok) {
            backendOffline = false;
            return await res.json();
        }
    } catch (e) {
        // If it's a network error (refused) or timeout, mark backend as potentially offline
        backendOffline = true;
        lastBackendCheck = Date.now();
    }
    return null;
};

export const tmdbApi = {
    // Get Series Details
    getSeriesDetails: async (id, options = {}) => {
        if (sessionCache.series[id] && !options.forceDirect) return sessionCache.series[id];

        const cached = await getFromBackend(`/series/${id}`, options.forceDirect);
        const data = cached || await fetchDirect(`/tv/${id}`, '&append_to_response=images,credits,videos,external_ids,translations,watch/providers');

        if (data) sessionCache.series[id] = data;
        return data;
    },

    // Get Season Details
    getSeasonDetails: async (id, seasonNumber, options = {}) => {
        const cacheKey = `${id}-${seasonNumber}`;
        if (sessionCache.seasons[cacheKey] && !options.forceDirect) return sessionCache.seasons[cacheKey];

        const cached = await getFromBackend(`/series/${id}/season/${seasonNumber}`, options.forceDirect);
        const data = cached || await fetchDirect(`/tv/${id}/season/${seasonNumber}`, '&append_to_response=images,videos');

        if (data) sessionCache.seasons[cacheKey] = data;
        return data;
    },

    // Get Trending
    getTrending: async (type = 'weekly', options = {}) => {
        const timeWindow = type === 'weekly' ? 'week' : 'day';
        const cached = await getFromBackend(`/trending?type=${type}`, options.forceDirect);
        if (cached) return cached;

        try {
            const data = await fetchDirect(`/trending/tv/${timeWindow}`);
            return data.results || [];
        } catch (error) {
            console.error("TMDB Trending Fetch Error:", error);
            return [];
        }
    },

    // Get Top Rated (TV)
    getTopRated: async (options = {}) => {
        const cached = await getFromBackend('/trending?type=top_rated', options.forceDirect);
        if (cached) return cached;

        const data = await fetchDirect('/tv/top_rated');
        return data.results || [];
    },

    // Get New Releases (Airing Today)
    getNewReleases: async (options = {}) => {
        const cached = await getFromBackend('/trending?type=new_releases', options.forceDirect);
        if (cached) return cached;

        const data = await fetchDirect('/tv/airing_today');
        return data.results || [];
    },

    // Get Hero Episodes (On The Air + Enriched Details)
    getHeroEpisodes: async (options = {}) => {
        // Try to get from backend first
        const cached = await getFromBackend('/hero/new-episodes', options.forceDirect);
        if (cached) return cached;

        try {
            // 1. Fetch "On The Air" list
            const listData = await fetchDirect('/tv/on_the_air');
            const initialList = listData.results || [];

            // 2. Fetch DETAILS for the top 40 results to get accurate air_dates
            // We need 'next_episode_to_air' and 'last_episode_to_air' which are only in details
            const enrichedPromises = initialList.slice(0, 40).map(async (show) => {
                try {
                    return await fetchDirect(`/tv/${show.id}`);
                } catch (e) {
                    return show; // Fallback to list object if fail
                }
            });

            const enrichedList = await Promise.all(enrichedPromises);
            return enrichedList;
        } catch (error) {
            console.error("Hero Fetch Error:", error);
            return [];
        }
    },

    // Search Series
    searchSeries: async (query) => {
        // We don't cache search by default as it's highly dynamic, but we use fetchDirect for consistency
        return await fetchDirect('/search/tv', `&query=${encodeURIComponent(query)}`);
    },

    // Get Recommendations
    getRecommendations: async (id) => {
        const data = await fetchDirect(`/tv/${id}/recommendations`);
        return data.results || [];
    }
};
