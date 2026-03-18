import { getMovieDetail } from './api.js';
import { Storage } from './ui.js';

const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');
const container = document.getElementById('detail-container');

async function loadDetail() {
    if (!slug) {
        container.innerHTML = '<h1 class="text-2xl text-red-500">Không tìm thấy mã phim.</h1>';
        return;
    }

    try {
        const response = await getMovieDetail(slug);
        
        // API NguonC thường bọc thông tin trong object "movie"
        const movie = response.movie || response.item;
        
        // Danh sách tập thường nằm trong movie.episodes
        const episodes = movie?.episodes || response.episodes || [];
        
        if (!movie) throw new Error('Không tìm thấy thông tin phim');

        // Lưu vào danh sách vừa xem
        Storage.addRecent(movie);

        renderDetail(movie, episodes);
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        container.innerHTML = '<h1 class="text-2xl text-red-500">Lỗi khi tải thông tin phim. Vui lòng thử lại.</h1>';
    }
}

function renderDetail(movie, episodesServers) {
    const defaultImg = movie.thumb_url || movie.poster_url;
    
    let html = `
        <div class="flex flex-col md:flex-row gap-8 w-full max-w-5xl bg-gray-900/50 p-6 rounded-lg shadow-xl backdrop-blur-sm">
            <div class="w-full md:w-1/3 flex-none">
                <img src="${defaultImg}" alt="${movie.name}" class="rounded-lg shadow-2xl w-full object-cover">
            </div>
            
            <div class="flex-1">
                <h1 class="text-4xl font-bold mb-2">${movie.name}</h1>
                <p class="text-gray-400 text-lg mb-4">${movie.original_name || ''} (${movie.year || 'Đang cập nhật'})</p>
                
                <div class="flex flex-wrap gap-2 mb-6 text-sm text-gray-300">
                    <span class="bg-gray-800 px-2 py-1 rounded border border-gray-700">${movie.quality || 'HD'}</span>
                    <span class="bg-gray-800 px-2 py-1 rounded border border-gray-700">${movie.language || 'Vietsub'}</span>
                    <span class="bg-gray-800 px-2 py-1 rounded border border-gray-700">${movie.time || 'N/A'}</span>
                    ${movie.episode_current ? `<span class="bg-redNetflix text-white px-2 py-1 rounded font-bold">${movie.episode_current}</span>` : ''}
                </div>

                <div class="mb-6 text-gray-200 leading-relaxed border-t border-gray-700 pt-4 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    ${movie.description || movie.content || 'Chưa có mô tả cho phim này.'}
                </div>
            </div>
        </div>
    `;

    // Render Video Player Area
    html += `
        <div class="w-full max-w-5xl mt-10">
            <h2 class="text-2xl font-bold mb-4">Trình phát video</h2>
            <div id="video-container" class="aspect-video w-full bg-black rounded-lg shadow-2xl flex items-center justify-center overflow-hidden border border-gray-800 relative">
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <svg class="w-16 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                    <p class="text-gray-500 font-medium">Chọn tập phim bên dưới để xem</p>
                </div>
            </div>
            
            <div class="mt-8 bg-gray-900/50 p-6 rounded-lg">
                <h3 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Danh sách tập</h3>
                <div id="episodes-list" class="flex flex-wrap gap-3"></div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.classList.remove('min-h-[70vh]');

    // Render Episodes Buttons
    const episodesList = document.getElementById('episodes-list');
    
    if (episodesServers && episodesServers.length > 0) {
        episodesList.innerHTML = ''; // Xóa chữ "Đang cập nhật..."
        
        // Lấy danh sách tập từ server đầu tiên (thường API trả về 1 mảng các server)
        const firstServer = episodesServers[0];
        // Linh hoạt xử lý key của API (có thể là server_data hoặc items)
        const eps = firstServer.server_data || firstServer.items || [];
        
        if (eps.length > 0) {
            eps.forEach((ep, index) => {
                const btn = document.createElement('button');
                btn.className = 'episode-btn bg-gray-800 border border-gray-700 hover:bg-redNetflix hover:border-redNetflix hover:text-white transition-all duration-300 px-5 py-2.5 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-redNetflix/50 shadow-lg';
                btn.textContent = `Tập ${ep.name}`;
                
                // Linh hoạt lấy link nhúng (có thể là link_embed hoặc embed)
                const embedUrl = ep.link_embed || ep.embed || ep.link_m3u8;
                
                btn.onclick = () => playEpisode(embedUrl, btn);
                episodesList.appendChild(btn);

                // Tự động phát tập 1 khi vừa load trang chi tiết xong
                if (index === 0 && embedUrl) {
                    playEpisode(embedUrl, btn);
                }
            });
        } else {
            episodesList.innerHTML = '<p class="text-gray-400 italic">Server phim chưa có dữ liệu tập.</p>';
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
    
    // Gắn iframe vào container
    videoContainer.innerHTML = `
        <iframe src="${embedUrl}" 
                class="w-full h-full absolute inset-0 bg-black" 
                frameborder="0" 
                scrolling="no"
                allowfullscreen>
        </iframe>
    `;

    // Xóa màu đỏ (active) ở tất cả các nút tập phim
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('bg-redNetflix', 'border-redNetflix', 'text-white');
        btn.classList.add('bg-gray-800', 'border-gray-700');
    });
    
    // Đổi màu nút tập phim đang được chọn
    activeButton.classList.remove('bg-gray-800', 'border-gray-700');
    activeButton.classList.add('bg-redNetflix', 'border-redNetflix', 'text-white');
    
    // Cuộn mượt màn hình lên chỗ player
    videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', loadDetail);