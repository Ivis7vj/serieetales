import { supabase } from '../supabase-config';
import { db } from '../firebase-config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

/**
 * Diary entries represent major milestones:
 * - SEASON_COMPLETED: User finished all episodes in a season.
 * - SEASON_RATED: User submitted a review/rating for a season.
 * - SERIES_COMPLETED: User finished all RELEASED seasons of a series.
 */

/**
 * Robustly parses a TMDB ID, ensuring it's a number.
 */
const parseTmdbId = (id) => {
    if (!id) return null;
    if (typeof id === 'number') return id;
    if (typeof id === 'string' && id.includes('-S')) {
        const numeric = parseInt(id.split('-S')[0]);
        return isNaN(numeric) ? null : numeric;
    }
    const numeric = parseInt(id);
    if (isNaN(numeric) || (typeof id === 'string' && id.match(/[a-z]/i) && !id.includes('-S'))) return null;
    return numeric;
};

/**
 * Normalizes diary entries from both Supabase and Firebase to a consistent format.
 */
const normalizeEntry = (entry, source) => {
    if (source === 'supabase') {
        return {
            id: entry.id,
            userId: entry.user_id,
            tmdbId: entry.tmdb_id,
            name: entry.series_name,
            poster_path: entry.poster_path, // Season poster or Series poster
            type: entry.entry_type,
            seasonNumber: entry.season_number,
            rating: entry.rating,
            date: entry.watched_at,
            createdAt: entry.created_at,
            source: 'supabase',
            // UI Helpers
            isSeason: entry.entry_type === 'SEASON_COMPLETED' || entry.entry_type === 'SEASON_RATED',
            isSeries: entry.entry_type === 'SERIES_COMPLETED'
        };
    } else {
        // Firebase legacy entries (based on user_review.jsx and previous observations)
        const tmdbId = parseTmdbId(entry.tmdbId || entry.id);
        if (!tmdbId) return null;

        return {
            id: entry.id,
            userId: entry.userId,
            tmdbId: tmdbId,
            name: entry.name,
            poster_path: entry.poster_path,
            type: entry.type === 'season' ? 'SEASON_COMPLETED' : (entry.type === 'series' ? 'SERIES_COMPLETED' : entry.type),
            seasonNumber: entry.seasonNumber,
            rating: entry.rating,
            date: entry.date || entry.updatedAt || entry.createdAt,
            source: 'firebase',
            // UI Helpers
            isSeason: entry.isSeason || entry.type === 'season',
            isSeries: entry.type === 'series'
        };
    }
};

/**
 * Write Functions (Supabase ONLY)
 */

export const addSeasonCompletedEntry = async (userId, tmdbId, seasonNumber, name, posterPath, date = new Date().toISOString().split('T')[0]) => {
    const { data, error } = await supabase
        .from('diary_entries')
        .upsert({
            user_id: userId,
            tmdb_id: tmdbId,
            series_name: name,
            poster_path: posterPath,
            entry_type: 'SEASON_COMPLETED',
            season_number: seasonNumber,
            watched_at: date
        }, { onConflict: 'user_id, tmdb_id, entry_type, season_number' });

    if (error) {
        console.error('Error adding SEASON_COMPLETED diary entry:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

export const addSeasonRatedEntry = async (userId, tmdbId, seasonNumber, rating, name, posterPath, date = new Date().toISOString().split('T')[0]) => {
    const { data, error } = await supabase
        .from('diary_entries')
        .upsert({
            user_id: userId,
            tmdb_id: tmdbId,
            series_name: name,
            poster_path: posterPath,
            entry_type: 'SEASON_RATED',
            season_number: seasonNumber,
            rating: rating,
            watched_at: date
        }, { onConflict: 'user_id, tmdb_id, entry_type, season_number' });

    if (error) {
        console.error('Error adding SEASON_RATED diary entry:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

export const addSeriesCompletedEntry = async (userId, tmdbId, name, posterPath, date = new Date().toISOString().split('T')[0]) => {
    const { data, error } = await supabase
        .from('diary_entries')
        .upsert({
            user_id: userId,
            tmdb_id: tmdbId,
            series_name: name,
            poster_path: posterPath,
            entry_type: 'SERIES_COMPLETED',
            watched_at: date
        }, { onConflict: 'user_id, tmdb_id, entry_type, season_number' });

    if (error) {
        console.error('Error adding SERIES_COMPLETED diary entry:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

/**
 * Read Functions (Dual-source)
 */

export const getUserDiary = async (userId) => {
    try {
        // 1. Try Supabase first
        const { data: supabaseData, error: supabaseError } = await supabase
            .from('diary_entries')
            .select('*')
            .eq('user_id', userId)
            .order('watched_at', { ascending: false });

        if (supabaseError) throw supabaseError;

        // 2. If Supabase has data, return it ONLY (SSOT migration)
        if (supabaseData && supabaseData.length > 0) {
            console.log("Using Supabase Diary Data (SSOT)");
            return supabaseData.map(entry => normalizeEntry(entry, 'supabase')).filter(e => e !== null);
        }

        // 3. Fallback to Firebase for legacy users
        console.log('Falling back to Firebase for diary data for user:', userId);
        const q = query(
            collection(db, 'reviews'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        // Filter reviews that represent milestones (Season/Series reviews)
        // AND also fetch legacy 'watched' array from user doc? 
        // The previous Profile.jsx merged 'watched' array and 'reviews'.
        // To be strictly 'DIARY', we might want to capture milestones from 'watched' too?
        // The prompt says: "Firebase diary data: READ ONLY... Used ONLY as fallback".

        // Profile.jsx logic was: reviews + watched, sorted by date.
        // We should replicate this for the fallback.

        const firebaseEntries = [];

        // A. From Reviews
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isSeason || (!data.isEpisode && !data.isSeason)) {
                const entry = normalizeEntry({ ...data, id: doc.id }, 'firebase');
                if (entry) firebaseEntries.push(entry);
            }
        });

        // B. From User Watched Array (if needed for completion events that didn't have reviews)
        // Accessing db 'users' collection for 'watched' array is expensive here if not passed.
        // But for a fallback, we must do it if we want to match legacy behavior.
        // However, Profile.jsx already fetched user doc. 
        // Ideally getUserDiary should take the userDoc if available, or fetch it.
        // Let's implement a fetch here for robustness.
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const watched = userData.watched || [];
            watched.forEach(item => {
                const tmdbId = parseTmdbId(item.id);
                if (!tmdbId) return;

                if (item.type === 'tv' || item.type === 'series') {
                    const entry = normalizeEntry({
                        ...item,
                        id: `legacy-watched-${item.id}`,
                        userId,
                        tmdbId: tmdbId,
                        type: 'SERIES_COMPLETED', // Assumption for legacy watched list items
                        seasonNumber: null,
                        rating: item.vote_average,
                        date: item.date
                    }, 'firebase');
                    if (entry) firebaseEntries.push(entry);
                }
            });
        }

        // Deduplicate and Sort
        const unique = [];
        const seen = new Set();
        // Prioritize reviews over watched items if dupes
        [...firebaseEntries].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(item => {
            const key = `${item.tmdbId}-${item.type}-${item.seasonNumber}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        });

        return unique.sort((a, b) => new Date(b.date) - new Date(a.date));

    } catch (error) {
        console.error('Error getting user diary:', error);
        return [];
    }
};
