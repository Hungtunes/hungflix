import { searchMovies } from './api.js';
import { createMovieCard, renderSkeletons } from './ui.js';

const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('search-results');
const messageDiv = document.getElementById('search-message');

// Đọc URL xem có từ khóa từ navbar truyền qua không
const urlParams = new URLSearchParams(window.location.search);
const initialKeyword = urlParams.get('keyword');

function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
}

async function performSearch(keyword) {
    if (!keyword || !keyword.trim()) {
        resultsContainer.innerHTML = '';
        messageDiv.textContent = 'Hãy nhập từ khóa để tìm kiếm phim.';
        messageDiv.classList.remove('hidden');
        return;
    }

    // Hiển thị loading
    messageDiv.classList.add('hidden');
    resultsContainer.className = "flex overflow-hidden space-x-4 p-4 opacity-50"; 
    renderSkeletons(resultsContainer, 10);

    try {
        const response = await searchMovies(keyword);
        const movies = response.items || [];

        // Trả lại layout Grid
        resultsContainer.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6";
        resultsContainer.innerHTML = '';

        if (movies.length === 0) {
            messageDiv.textContent = `Không tìm thấy kết quả nào cho "${keyword}".`;
            messageDiv.classList.remove('hidden');
            return;
        }

        movies.forEach(movie => {
            const card = createMovieCard(movie);
            card.className = 'w-full relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20';
            resultsContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        resultsContainer.innerHTML = '';
        messageDiv.textContent = 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.';
        messageDiv.classList.remove('hidden');
    }
}

// Lắng nghe sự kiện gõ chữ trực tiếp trong trang search
searchInput.addEventListener('input', debounce((e) => {
    const newKeyword = e.target.value;
    // Cập nhật URL mà không reload trang (để copy link chia sẻ dễ dàng)
    const url = new URL(window.location);
    url.searchParams.set('keyword', newKeyword);
    window.history.pushState({}, '', url);
    
    performSearch(newKeyword);
}, 600));

// Tự động tìm kiếm nếu có keyword từ Navbar gửi sang
document.addEventListener('DOMContentLoaded', () => {
    if (initialKeyword) {
        searchInput.value = initialKeyword;
        performSearch(initialKeyword);
    } else {
        searchInput.focus();
    }
});