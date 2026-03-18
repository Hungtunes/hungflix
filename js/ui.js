/**
 * Tạo thẻ phim (Movie Card) - Responsive
 */
export function createMovieCard(movie) {
    const a = document.createElement('a');
    a.href = `detail.html?slug=${movie.slug}`;
    
    // w-36 (mobile), w-40 (tablet), w-48 (desktop)
    a.className = 'flex-none w-36 sm:w-40 md:w-48 relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-20';
    
    const imgUrl = movie.thumb_url?.startsWith('http') ? movie.thumb_url : movie.poster_url;

    a.innerHTML = `
        <div class="relative w-full h-56 sm:h-64 md:h-72 rounded overflow-hidden shadow-lg shadow-black/50 border border-transparent group-hover:border-gray-500 transition-colors">
            <img src="${imgUrl}" alt="${movie.name}" loading="lazy" 
                 class="w-full h-full object-cover pointer-events-none">
            <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                <h3 class="text-white text-xs md:text-sm font-bold truncate">${movie.name}</h3>
                <p class="text-gray-300 text-[10px] md:text-xs mt-1">${movie.year || ''}</p>
            </div>
            ${movie.quality ? `<div class="absolute top-2 right-2 bg-redNetflix text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none">${movie.quality}</div>` : ''}
        </div>
    `;
    return a;
}

/**
 * Tạo thẻ "Xem Tất Cả" ở cuối danh sách
 */
export function createViewMoreCard(categorySlug) {
    const a = document.createElement('a');
    a.href = `category.html?slug=${categorySlug}`;
    a.className = 'flex-none w-36 sm:w-40 md:w-48 h-56 sm:h-64 md:h-72 relative group cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center bg-gray-900 rounded border border-gray-800 hover:border-redNetflix shadow-lg';
    
    a.innerHTML = `
        <div class="text-center group-hover:text-redNetflix transition-colors pointer-events-none">
            <svg class="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="font-semibold text-xs md:text-sm block opacity-70 group-hover:opacity-100">Xem Tất Cả</span>
        </div>
    `;
    return a;
}

/**
 * Tạo hiệu ứng loading (Skeletons)
 */
export function renderSkeletons(container, count = 10) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'flex-none w-36 sm:w-40 md:w-48 h-56 sm:h-64 md:h-72 rounded bg-gray-800 animate-pulse border border-gray-700';
        container.appendChild(div);
    }
}

/**
 * Đổ danh sách phim ra màn hình
 */
export function renderMovieList(containerId, movies, categorySlug = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; 
    
    if (!movies || movies.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm italic py-4 px-2">Đang cập nhật danh sách...</p>';
        return;
    }

    movies.forEach(movie => {
        container.appendChild(createMovieCard(movie));
    });

    if (categorySlug) {
        container.appendChild(createViewMoreCard(categorySlug));
    }
}

/**
 * Local Storage helpers (Lịch sử xem)
 */
export const Storage = {
    getKey: () => 'nstream_recent_movies',
    getRecent: () => JSON.parse(localStorage.getItem(Storage.getKey())) || [],
    addRecent: (movie) => {
        let recents = Storage.getRecent();
        recents = recents.filter(m => m.slug !== movie.slug);
        recents.unshift({ slug: movie.slug, name: movie.name, thumb_url: movie.thumb_url || movie.poster_url });
        if (recents.length > 10) recents.pop();
        localStorage.setItem(Storage.getKey(), JSON.stringify(recents));
    }
}