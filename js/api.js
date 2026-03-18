const BASE_URL = 'https://phim.nguonc.com/api';

/**
 * Throws a standard error if API response is not ok
 */
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

export const getLatestMovies = (page = 1) => fetchAPI(`/films/phim-moi-cap-nhat?page=${page}`);
export const getMovieDetail = (slug) => fetchAPI(`/film/${slug}`);
export const searchMovies = (keyword) => fetchAPI(`/films/search?keyword=${encodeURIComponent(keyword)}`);
export const getCategoryMovies = (slug, page = 1) => fetchAPI(`/films/danh-sach/${slug}?page=${page}`);