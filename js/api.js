const BASE_URL = 'https://phim.nguonc.com/api';

/**
 * Hàm dùng chung để bắt lỗi và parse JSON
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

// Các endpoint của API NguonC
export const getLatestMovies = (page = 1) => fetchAPI(`/films/phim-moi-cap-nhat?page=${page}`);
export const getMovieDetail = (slug) => fetchAPI(`/film/${slug}`);
// Thêm tham số page vào hàm search
export const searchMovies = (keyword, page = 1) => fetchAPI(`/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);
export const getCategoryMovies = (slug, page = 1) => fetchAPI(`/films/danh-sach/${slug}?page=${page}`);