import { getLatestMovies, getCategoryMovies } from './api.js';
import { renderMovieList, renderSkeletons } from './ui.js';

let heroMovies = [];
let currentHeroIndex = 0;
let heroInterval;

async function initHome() {
    const sections = ['latest-movies', 'movies-single', 'movies-series', 'movies-anime'];
    
    // Tạo bộ khung tải trước
    sections.forEach(id => {
        renderSkeletons(document.getElementById(id), 10); 
    });

    try {
        const [latestRes, singleRes, seriesRes, animeRes] = await Promise.all([
            getLatestMovies(1),
            getCategoryMovies('phim-le', 1),
            getCategoryMovies('phim-bo', 1),
            getCategoryMovies('hoat-hinh', 1)
        ]);

        const latestMovies = latestRes.items || [];
        
        // Đổ dữ liệu thật vào
        renderMovieList('latest-movies', latestMovies, 'phim-moi-cap-nhat');
        renderMovieList('movies-single', singleRes.items || [], 'phim-le');
        renderMovieList('movies-series', seriesRes.items || [], 'phim-bo');
        renderMovieList('movies-anime', animeRes.items || [], 'hoat-hinh');

        // Khởi tạo Hero Banner với 5 phim
        if (latestMovies.length > 0) {
            setupHeroSlider(latestMovies.slice(0, 5));
        }

        // Bật tính năng vuốt mượt có quán tính
        enableDragScroll();

    } catch (error) {
        console.error("Lỗi khi tải trang chủ:", error);
    }
}

// ==========================================
// LOGIC HERO SLIDER (Chuyển cảnh mượt mà)
// ==========================================
function setupHeroSlider(movies) {
    heroMovies = movies;
    if (heroMovies.length === 0) return;
    
    const hero = document.getElementById('hero-section');
    const content = document.getElementById('hero-content');
    
    // Thêm CSS Transition trực tiếp để mượt hơn
    hero.style.transition = 'background-image 0.8s ease-in-out, opacity 0.4s ease-in-out';
    content.style.transition = 'opacity 0.4s ease-in-out, transform 0.4s ease-out';
    content.classList.remove('hidden');

    renderHeroMovie(0);

    // Chuyển cảnh mỗi 6 giây
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
        renderHeroMovie(currentHeroIndex);
    }, 6000);
}

function renderHeroMovie(index) {
    const movie = heroMovies[index];
    const hero = document.getElementById('hero-section');
    const title = document.getElementById('hero-title');
    const desc = document.getElementById('hero-desc');
    const link = document.getElementById('hero-link');
    const content = document.getElementById('hero-content');

    const bgImg = movie.poster_url || movie.thumb_url;

    // Bước 1: Mờ nội dung hiện tại và kéo nhẹ xuống dưới
    content.style.opacity = '0';
    content.style.transform = 'translateY(15px)';
    hero.style.opacity = '0.8'; // Không cho đen hoàn toàn

    // Bước 2: Chờ 400ms để hiệu ứng mờ hoàn thành rồi mới đổi text/ảnh
    setTimeout(() => {
        hero.style.backgroundImage = `url('${bgImg}')`;
        title.textContent = movie.name;
        desc.textContent = movie.original_name || movie.year || 'Đang cập nhật...';
        link.href = `detail.html?slug=${movie.slug}`;
        
        // Hiện trở lại và trượt nhẹ lên (Giống hiệu ứng rạp chiếu)
        hero.style.opacity = '1';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 400); 
}

// ==========================================
// LOGIC VUỐT CÓ QUÁN TÍNH (Momentum Scroll)
// ==========================================
function enableDragScroll() {
    const sliders = document.querySelectorAll('.scroll-container');
    
    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0; // Vận tốc kéo (Tính bằng Pixel)
        let momentumID; // ID của requestAnimationFrame

        slider.classList.add('cursor-grab', 'select-none');

        // Khi nhấn chuột xuống
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('cursor-grabbing');
            slider.classList.remove('cursor-grab');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            cancelAnimationFrame(momentumID); // Khựng lại ngay nếu đang trôi dở
        });

        // Khi rê chuột ra ngoài vùng slider
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove('cursor-grabbing');
            slider.classList.add('cursor-grab');
            beginMomentum(); // Áp dụng quán tính
        });

        // Khi thả chuột ra
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('cursor-grabbing');
            slider.classList.add('cursor-grab');
            beginMomentum(); // Áp dụng quán tính
        });

        // Khi kéo chuột
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX); // Tốc độ trượt chuẩn tỷ lệ 1:1
            
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            
            // Tính toán vận tốc (Lấy vị trí hiện tại trừ vị trí mili-giây trước đó)
            velX = slider.scrollLeft - prevScrollLeft; 
        });

        // Ngăn click nhầm vào phim khi bạn chỉ muốn "Vuốt"
        slider.addEventListener('click', (e) => {
            // Nếu vận tốc vuốt lớn hơn 2px -> Hiểu là đang vuốt chứ không phải click
            if (Math.abs(velX) > 2) { 
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Hàm vật lý trượt tiếp khi thả tay (Momentum)
        function beginMomentum() {
            slider.scrollLeft += velX;
            velX *= 0.92; // 0.92 là hệ số lực ma sát. Số càng lớn trôi càng xa
            
            // Trôi cho đến khi vận tốc nhỏ hơn 0.5px thì dừng hẳn
            if (Math.abs(velX) > 0.5) {
                momentumID = requestAnimationFrame(beginMomentum);
            }
        }
    });
}

// Đổi màu Navbar khi cuộn trang
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.classList.add('bg-black');
        nav.classList.remove('bg-gradient-to-b', 'from-black/90', 'to-transparent');
    } else {
        nav.classList.remove('bg-black');
        nav.classList.add('bg-gradient-to-b', 'from-black/90', 'to-transparent');
    }
});

document.addEventListener('DOMContentLoaded', initHome);