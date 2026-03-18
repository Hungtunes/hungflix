import { searchMovies } from './api.js';
import { createMovieCard, renderSkeletons } from './ui.js';

// Khai báo các thành phần HTML
const searchInput = document.getElementById('global-search');
const resultsContainer = document.getElementById('search-results');
const messageDiv = document.getElementById('search-message');
const paginationContainer = document.getElementById('pagination-container');

// Đọc URL xem có keyword và page truyền sang không
const urlParams = new URLSearchParams(window.location.search);
let currentKeyword = urlParams.get('keyword') || '';
let currentPage = parseInt(urlParams.get('page')) || 1;
let totalPages = 1;

// Hàm chống gọi API liên tục khi gõ chữ nhanh
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
}

// Hàm thực hiện tìm kiếm chính
async function performSearch(keyword, page = 1) {
    currentKeyword = keyword;
    currentPage = page;

    if (!keyword || !keyword.trim()) {
        resultsContainer.innerHTML = '';
        messageDiv.textContent = 'Hãy nhập từ khóa để tìm kiếm phim.';
        messageDiv.classList.remove('hidden');
        paginationContainer.innerHTML = '';
        return;
    }

    // Hiển thị skeleton loading
    messageDiv.classList.add('hidden');
    resultsContainer.className = "flex overflow-hidden space-x-4 p-4 opacity-50"; 
    renderSkeletons(resultsContainer, 10);
    paginationContainer.innerHTML = ''; 

    try {
        // Cập nhật lên thanh địa chỉ URL (để khi người dùng F5 không bị mất kết quả)
        const url = new URL(window.location);
        url.searchParams.set('keyword', keyword);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url);

        // Fetch API
        const response = await searchMovies(keyword, page);
        const movies = response.items || [];

        // Trả lại Layout Grid
        resultsContainer.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6";
        resultsContainer.innerHTML = '';

        if (movies.length === 0) {
            messageDiv.textContent = `Không tìm thấy kết quả nào cho "${keyword}".`;
            messageDiv.classList.remove('hidden');
            return;
        }

        // Render phim
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            card.className = 'w-full relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20';
            resultsContainer.appendChild(card);
        });

        // Tính tổng số trang
        if (response.paginate) {
            totalPages = response.paginate.total_page || 1;
        } else {
            totalPages = 1; // Fallback
        }

        renderPagination();

    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        resultsContainer.innerHTML = '';
        messageDiv.innerHTML = '<span class="text-red-500">Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.</span>';
        messageDiv.classList.remove('hidden');
    }
}

// Hàm tạo giao diện thanh phân trang
function renderPagination() {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return; // 1 trang thì khỏi hiện
    
    const createBtn = (text, pageToLoad, isCurrent = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.className = `px-4 py-2 rounded font-bold transition-all duration-300 ${
            isCurrent 
            ? 'bg-redNetflix text-white shadow-lg shadow-redNetflix/50' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        
        if (!isDisabled && !isCurrent) {
            btn.onclick = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu
                performSearch(currentKeyword, pageToLoad);
            };
        }
        return btn;
    };

    // Nút Prev
    paginationContainer.appendChild(createBtn('&laquo;', currentPage - 1, false, currentPage === 1));

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 2) endPage = Math.min(totalPages, 5);
    if (currentPage >= totalPages - 1) startPage = Math.max(1, totalPages - 4);

    if (startPage > 1) {
        paginationContainer.appendChild(createBtn('1', 1));
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'px-2 py-2 text-gray-500';
            dots.innerHTML = '...';
            paginationContainer.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createBtn(i, i, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'px-2 py-2 text-gray-500';
            dots.innerHTML = '...';
            paginationContainer.appendChild(dots);
        }
        paginationContainer.appendChild(createBtn(totalPages, totalPages));
    }

    // Nút Next
    paginationContainer.appendChild(createBtn('&raquo;', currentPage + 1, false, currentPage === totalPages));
}

// Gõ trực tiếp trên trang search -> reset về trang 1
if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
        performSearch(e.target.value, 1);
    }, 600));
}

// Tự động tìm ngay khi tải trang (nếu có keyword trên URL)
document.addEventListener('DOMContentLoaded', () => {
    if (currentKeyword) {
        if (searchInput) searchInput.value = currentKeyword;
        performSearch(currentKeyword, currentPage);
    } else if (searchInput) {
        searchInput.focus();
    }
});