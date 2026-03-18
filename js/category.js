import { getCategoryMovies, getLatestMovies } from './api.js';
import { createMovieCard, renderSkeletons } from './ui.js';

const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug') || 'phim-moi-cap-nhat';
let currentPage = 1;
let totalPages = 1; // Lưu tổng số trang

const titleEl = document.getElementById('category-title');
const resultsContainer = document.getElementById('category-results');
const paginationContainer = document.getElementById('pagination-container');

const categoryNames = {
    'phim-le': 'Phim Lẻ',
    'phim-bo': 'Phim Bộ',
    'hoat-hinh': 'Hoạt Hình - Anime',
    'tv-shows': 'TV Shows',
    'phim-moi-cap-nhat': 'Phim Mới Cập Nhật'
};

async function loadCategoryPage(page) {
    currentPage = page;
    titleEl.textContent = categoryNames[slug] || `Danh sách: ${slug}`;
    
    // Skeleton loading
    resultsContainer.className = "flex overflow-hidden space-x-4 p-4 opacity-50"; 
    renderSkeletons(resultsContainer, 12);
    paginationContainer.innerHTML = ''; // Ẩn phân trang khi đang tải

    try {
        let response = slug === 'phim-moi-cap-nhat' 
            ? await getLatestMovies(page) 
            : await getCategoryMovies(slug, page);

        const movies = response.items || [];
        
        // Trả lại Layout Grid
        resultsContainer.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6";
        resultsContainer.innerHTML = '';

        if (movies.length === 0) {
            resultsContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center text-xl mt-10">Không có dữ liệu cho trang này.</p>';
            return;
        }

        movies.forEach(movie => {
            const card = createMovieCard(movie);
            card.className = 'w-full relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20';
            resultsContainer.appendChild(card);
        });

        // Lấy tổng số trang từ API
        if (response.paginate) {
            totalPages = response.paginate.total_page || 1;
        } else {
            totalPages = page + 1; // Fallback nếu API không trả về total_page
        }

        renderPagination();

    } catch (error) {
        console.error("Lỗi danh mục:", error);
        resultsContainer.innerHTML = '<p class="text-red-500 col-span-full text-center mt-10">Lỗi kết nối API. Vui lòng thử lại.</p>';
    }
}

// Logic tạo các nút phân trang
function renderPagination() {
    paginationContainer.innerHTML = '';
    
    // Hàm tạo 1 nút cơ bản
    const createBtn = (text, pageToLoad, isCurrent = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.className = `px-4 py-2 rounded font-bold transition-all duration-300 ${
            isCurrent 
            ? 'bg-redNetflix text-white shadow-lg shadow-redNetflix/50' // Nút trang hiện tại
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        
        if (!isDisabled && !isCurrent) {
            btn.onclick = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                loadCategoryPage(pageToLoad);
            };
        }
        return btn;
    };

    // Nút "Trang trước" ( < )
    paginationContainer.appendChild(createBtn('&laquo;', currentPage - 1, false, currentPage === 1));

    // Hiển thị tối đa 5 số xung quanh trang hiện tại (Sliding window)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Chỉnh lại nếu đang ở những trang đầu hoặc trang cuối
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

    // Nút "Trang sau" ( > )
    paginationContainer.appendChild(createBtn('&raquo;', currentPage + 1, false, currentPage === totalPages));
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryPage(currentPage);
});