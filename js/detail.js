import { getMovieDetail } from './api.js';
import { Storage } from './ui.js';

const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');
const container = document.getElementById('detail-container');

async function loadDetail() {
    if (!slug) {
        container.innerHTML = '<h1 class="text-2xl text-red-500 mt-20 text-center font-bold">Không tìm thấy mã phim. Vui lòng quay lại trang chủ.</h1>';
        return;
    }

    try {
        const response = await getMovieDetail(slug);
        
        // Cấu trúc API NguonC: thông tin nằm trong .movie hoặc .item
        const movie = response.movie || response.item;
        const episodes = movie?.episodes || response.episodes || [];
        
        if (!movie) throw new Error('Không tìm thấy thông tin phim');

        // Lưu vào Local Storage để hiện ở mục "Tiếp tục xem"
        Storage.addRecent(movie);

        renderDetail(movie, episodes);
    } catch (error) {
        console.error("Lỗi chi tiết phim:", error);
        container.innerHTML = '<div class="text-center mt-20"><h1 class="text-3xl text-red-500 font-bold mb-4">Lỗi tải dữ liệu!</h1><p class="text-gray-400">Không thể kết nối tới máy chủ phim. Vui lòng thử lại sau.</p></div>';
    }
}

function renderDetail(movie, episodesServers) {
    const defaultImg = movie.thumb_url || movie.poster_url;
    
    let html = `
        <div class="flex flex-col md:flex-row gap-8 w-full max-w-5xl bg-gray-900/60 p-6 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm mt-4">
            <div class="w-full md:w-1/3 flex-none">
                <img src="${defaultImg}" alt="${movie.name}" class="rounded-xl shadow-2xl w-full object-cover border border-gray-700">
            </div>
            
            <div class="flex-1 flex flex-col justify-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">${movie.name}</h1>
                <p class="text-gray-400 text-lg mb-6 italic">${movie.original_name || ''} (${movie.year || 'Đang cập nhật'})</p>
                
                <div class="flex flex-wrap gap-3 mb-6 text-sm font-medium">
                    <span class="bg-gray-800/80 px-3 py-1.5 rounded-md border border-gray-700 text-redNetflix">${movie.quality || 'HD'}</span>
                    <span class="bg-gray-800/80 px-3 py-1.5 rounded-md border border-gray-700">${movie.language || 'Vietsub'}</span>
                    <span class="bg-gray-800/80 px-3 py-1.5 rounded-md border border-gray-700">${movie.time || 'N/A'}</span>
                    ${movie.episode_current ? `<span class="bg-redNetflix text-white px-3 py-1.5 rounded-md shadow-lg shadow-redNetflix/30 font-bold">${movie.episode_current}</span>` : ''}
                </div>

                <div class="text-gray-300 leading-relaxed border-t border-gray-700/50 pt-6 max-h-60 overflow-y-auto pr-2 no-scrollbar text-justify text-sm md:text-base">
                    ${movie.description || movie.content || 'Nhà sản xuất chưa cung cấp mô tả cho bộ phim này.'}
                </div>
            </div>
        </div>
    `;

    // Khu vực Video Player & Danh sách tập
    html += `
        <div class="w-full max-w-5xl mt-12 mb-8">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                <span class="w-2 h-6 bg-redNetflix rounded"></span>
                TRÌNH PHÁT VIDEO
            </h2>
            
            <div id="video-container" class="aspect-video w-full bg-black rounded-xl shadow-2xl shadow-black flex items-center justify-center overflow-hidden border border-gray-800 relative group">
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div class="w-20 h-20 bg-gray-800/80 rounded-full flex items-center justify-center mb-4">
                        <svg class="w-10 h-10 text-gray-400 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                    </div>
                    <p class="text-gray-400 font-medium">Đang tải máy chủ phát...</p>
                </div>
            </div>
            
            <div class="mt-8 bg-gray-900/40 p-6 md:p-8 rounded-2xl border border-gray-800">
                <h3 class="text-xl font-semibold mb-6 border-b border-gray-700/50 pb-3">Chọn tập phim</h3>
                <div id="episodes-list" class="flex flex-wrap gap-3 max-h-96 overflow-y-auto no-scrollbar pb-2"></div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.classList.remove('min-h-[70vh]');

    // Xử lý nút tập phim
    const episodesList = document.getElementById('episodes-list');
    
    if (episodesServers && episodesServers.length > 0) {
        episodesList.innerHTML = ''; 
        
        // Lấy server đầu tiên
        const firstServer = episodesServers[0];
        const eps = firstServer.server_data || firstServer.items || [];
        
        if (eps.length > 0) {
            eps.forEach((ep, index) => {
                const btn = document.createElement('button');
                btn.className = 'episode-btn bg-gray-800 border border-gray-700 hover:bg-redNetflix hover:border-redNetflix hover:text-white transition-all duration-300 px-6 py-2.5 rounded-lg text-sm font-semibold focus:outline-none shadow-md';
                btn.textContent = `Tập ${ep.name}`;
                
                const embedUrl = ep.link_embed || ep.embed || ep.link_m3u8;
                
                btn.onclick = () => playEpisode(embedUrl, btn);
                episodesList.appendChild(btn);

                // Tự động phát tập 1
                if (index === 0 && embedUrl) {
                    playEpisode(embedUrl, btn);
                }
            });
        } else {
            episodesList.innerHTML = '<p class="text-gray-400 italic">Server phim chưa cập nhật link xem.</p>';
        }
    } else {
        episodesList.innerHTML = '<p class="text-gray-400 italic">Phim đang cập nhật tập mới, vui lòng quay lại sau...</p>';
    }
}

function playEpisode(embedUrl, activeButton) {
    if (!embedUrl) {
        alert("Link phim bị lỗi hoặc chưa có.");
        return;
    }

    const videoContainer = document.getElementById('video-container');
    
    // Tạo Iframe chiếu phim
    videoContainer.innerHTML = `
        <iframe src="${embedUrl}" 
                class="w-full h-full absolute inset-0 bg-black" 
                frameborder="0" 
                scrolling="no"
                allowfullscreen>
        </iframe>
    `;

    // Cập nhật giao diện nút bấm
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('bg-redNetflix', 'border-redNetflix', 'text-white', 'shadow-redNetflix/40');
        btn.classList.add('bg-gray-800', 'border-gray-700', 'text-gray-300');
    });
    
    activeButton.classList.remove('bg-gray-800', 'border-gray-700', 'text-gray-300');
    activeButton.classList.add('bg-redNetflix', 'border-redNetflix', 'text-white', 'shadow-lg', 'shadow-redNetflix/40');
    
    // Tự động cuộn trang xuống đúng chỗ video để xem cho tiện
    videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', loadDetail);