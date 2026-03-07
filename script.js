import { getVideos } from './firebase.js';

// --- KONFIGURASI LINK EKSTERNAL ---
window.SOCIAL_LINKS = {
    youtube: "https://youtube.com/@contoh",
    whatsapp: "https://whatsapp.com/channel/contoh",
    telegram: "https://t.me/contoh"
};

// --- STATE ---
let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
let layoutMode = 1; // 1: 1 kolom (5 item), 2: 2 kolom (10 item)
let isIslandActive = false;
let selectedVideo = null;

// Konfigurasi Keamanan
const ACCESS_KEY = 'manzgame_access';
const ACCESS_DURATION = 60 * 60 * 1000; // 1 Jam

// --- DOM ELEMENTS ---
const elAppWrapper = document.getElementById('app-wrapper');
const elGlobalPopup = document.getElementById('global-popup');
const elVideoPopup = document.getElementById('video-popup');
const elVideoGrid = document.getElementById('video-grid');
const elPagination = document.getElementById('pagination');
const elSearchInput = document.getElementById('search-input');
const elSearchContainer = document.querySelector('.search-container');
const elHeaderTitle = document.getElementById('header-title');
const elIsland = document.getElementById('dynamic-island');
const elMainHeader = document.getElementById('main-header');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAppState();
    initData();
});

// Menangani Tab Resume / Pindah Tab Browser
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!hasValidAccess() && !elGlobalPopup.classList.contains('active')) {
            applyLockedState();
        }
    }
});

// --- SECURITY & STATE ARCHITECTURE ---
function getStoredAccess() {
    try {
        const accessStr = localStorage.getItem(ACCESS_KEY);
        return accessStr ? JSON.parse(accessStr) : null;
    } catch(e) {
        return null;
    }
}

function hasValidAccess() {
    const access = getStoredAccess();
    if (access && Date.now() < access.expiresAt) {
        return true;
    }
    clearStoredAccess();
    return false;
}

function clearStoredAccess() {
    localStorage.removeItem(ACCESS_KEY);
}

function setStoredAccess() {
    const expiresAt = Date.now() + ACCESS_DURATION;
    localStorage.setItem(ACCESS_KEY, JSON.stringify({ granted: true, expiresAt }));
}

function applyLockedState() {
    elAppWrapper.classList.add('blurred');
    elGlobalPopup.classList.remove('slide-down');
    
    requestAnimationFrame(() => {
        elGlobalPopup.classList.add('active');
    });
    
    const btn = document.getElementById('btn-verify-global');
    btn.innerText = 'Verifikasi';
    btn.onclick = verifyGlobalPassword;
    document.getElementById('global-password').value = '';
}

function applyUnlockedState(animate = false) {
    if (animate) {
        elGlobalPopup.classList.add('slide-down');
        setTimeout(() => {
            elGlobalPopup.classList.remove('active');
            elGlobalPopup.classList.remove('slide-down');
            elAppWrapper.classList.remove('blurred');
        }, 500);
    } else {
        elGlobalPopup.classList.remove('active');
        elGlobalPopup.classList.remove('slide-down');
        elAppWrapper.classList.remove('blurred');
    }
}

function initializeAppState() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    document.getElementById('btn-verify-global').onclick = verifyGlobalPassword;
    document.getElementById('search-input').addEventListener('input', handleSearch);

    if (hasValidAccess()) {
        applyUnlockedState(false);
    } else {
        applyLockedState();
    }
}

async function initData() {
    allVideos = await getVideos();
    filteredVideos = [...allVideos];
    
    // Update Total Video Counter (Realtime Full Database Total)
    document.getElementById('total-video-count').innerText = allVideos.length;

    if (hasValidAccess()) {
        renderGrid();
    }
}

// --- THEME ---
window.toggleTheme = () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
};

// --- PASSWORD UTILS ---
window.togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        btn.style.color = "var(--accent-blue)";
    } else {
        input.type = "password";
        btn.style.color = "var(--text-sub)";
    }
};

function animateDots(btnElement, baseText, seconds, finalBtnText, onComplete) {
    let count = 0;
    btnElement.innerText = baseText;
    btnElement.disabled = true;
    
    const interval = setInterval(() => {
        count = (count + 1) % 4;
        btnElement.innerText = baseText + ".".repeat(count);
    }, 500);

    setTimeout(() => {
        clearInterval(interval);
        btnElement.innerText = finalBtnText;
        btnElement.disabled = false;
        btnElement.onclick = onComplete; 
    }, seconds * 1000);
}

// --- SIDEBAR MENU LOGIC ---
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
};

window.navHome = () => {
    window.toggleSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- ADMIN POPUP LOGIC ---
window.openAdminPopup = () => {
    window.toggleSidebar();
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-popup').classList.add('active');
};

window.closeAdminPopup = () => {
    document.getElementById('admin-popup').classList.remove('active');
};

window.verifyAdminPassword = () => {
    const input = document.getElementById('admin-password').value;
    const btn = document.getElementById('btn-verify-admin');
    
    if (input === 'yuhu67') {
        window.location.href = 'admin.html';
    } else {
        btn.classList.remove('shake');
        void btn.offsetWidth; // trigger reflow untuk re-animasi
        btn.classList.add('shake');
        showDynamicIsland("Maaf Password Salah");
    }
};

// --- GLOBAL PASSWORD LOGIC ---
function verifyGlobalPassword() {
    const input = document.getElementById('global-password').value;
    const btn = document.getElementById('btn-verify-global');

    if (input !== 'qwert67') {
        showDynamicIsland("PASSWORD SALAH!");
        return;
    }
    
    window.open('https://www.effectivegatecpm.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274', '_blank');
    
    animateDots(btn, "Menyiapkan", 10, "Berikutnya", () => {
        setStoredAccess();
        applyUnlockedState(true);
        if (allVideos.length > 0) renderGrid();
    });
}

// --- HEADER & SEARCH LOGIC ---
window.toggleSearch = () => {
    const isActive = elSearchContainer.classList.contains('search-active');
    if (!isActive) {
        elSearchContainer.classList.add('search-active');
        elHeaderTitle.style.opacity = '0';
        elSearchInput.focus();
    }
};

window.clearSearch = () => {
    elSearchInput.value = '';
    elSearchContainer.classList.remove('search-active');
    elHeaderTitle.style.opacity = '1';
    handleSearch();
};

function handleSearch() {
    const query = elSearchInput.value.toLowerCase();
    filteredVideos = allVideos.filter(v => v.title.toLowerCase().includes(query));
    currentPage = 1;
    renderGrid();
}

// --- INFO BOX LOGIC ---
window.toggleInfoBox = () => {
    const box = document.getElementById('info-box');
    const btnPerbesar = document.getElementById('btn-perbesar');
    
    if (box.classList.contains('minimized')) {
        box.classList.remove('minimized');
        btnPerbesar.classList.add('hidden');
    } else {
        box.classList.add('minimized');
        btnPerbesar.classList.remove('hidden');
    }
};

// --- LAYOUT & RENDER LOGIC ---
window.setLayout = (mode) => {
    layoutMode = mode;
    currentPage = 1;
    
    document.getElementById('layout-1-col').classList.toggle('active', mode === 1);
    document.getElementById('layout-2-col').classList.toggle('active', mode === 2);
    
    renderGrid();
};

function renderGrid() {
    elVideoGrid.innerHTML = '';
    const itemsPerPage = layoutMode === 1 ? 5 : 10;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVideos = filteredVideos.slice(start, end);

    if (pageVideos.length === 0) {
        // EMPTY STATE DENGAN CONTAINER KHUSUS (TIDAK TERPENGARUH GRID CLASS)
        elVideoGrid.className = 'empty-state-container';
        elVideoGrid.innerHTML = `
            <div class="empty-state-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <p>Tidak ada video ditemukan.</p>
            </div>
        `;
        renderPagination(0);
        return;
    }

    // Kembalikan ke format Grid Layout saat ada item video
    elVideoGrid.className = `video-grid layout-${layoutMode}`;
    const now = new Date();

    pageVideos.forEach(video => {
        const uploadDate = new Date(video.uploadDate);
        const expiryDate = new Date(uploadDate);
        expiryDate.setDate(expiryDate.getDate() + 7);
        const diffTime = expiryDate - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft <= 0;

        let badgeHtml = isExpired 
            ? `<div class="badge-expired danger">Expired! harap pakai link no password dulu</div>` 
            : `<div class="badge-expired">Expired ${daysLeft} hari lagi...</div>`;

        const card = document.createElement('div');
        card.className = 'card glass-panel';
        card.innerHTML = `
            <div class="card-thumb-wrap">
                <img src="${video.thumbnail}" alt="Thumbnail" class="card-thumb" loading="lazy">
                ${badgeHtml}
            </div>
            <h3 class="card-title">${video.title}</h3>
            <div class="card-actions">
                <button class="glass-btn btn-blue" onclick="handlePasswordBtn('${video.id}', ${isExpired}, this)">Password</button>
                <button class="glass-btn btn-green" onclick="window.open('${video.noPasswordLink}', '_blank')">No Password</button>
            </div>
        `;
        elVideoGrid.appendChild(card);
    });

    renderPagination(Math.ceil(filteredVideos.length / itemsPerPage));
}

// --- CARD ACTIONS ---
window.handlePasswordBtn = (id, isExpired, btnElement) => {
    if (isExpired) {
        btnElement.classList.remove('shake');
        void btnElement.offsetWidth; 
        btnElement.classList.add('shake');
        showDynamicIsland("Maaf Link Sudah Expired");
    } else {
        selectedVideo = allVideos.find(v => v.id === id);
        document.getElementById('video-popup-title').innerText = selectedVideo.title;
        document.getElementById('video-password').value = '';
        
        const btnVerify = document.getElementById('btn-verify-video');
        btnVerify.innerText = 'Verifikasi';
        btnVerify.onclick = verifyVideoPassword; 
        
        document.getElementById('btn-lihat-password').onclick = () => {
            window.open(selectedVideo.youtubePasswordLink, '_blank');
        };

        elVideoPopup.classList.add('active');
    }
};

// --- VIDEO PASSWORD LOGIC (PER-VIDEO VALIDATION) ---
function verifyVideoPassword() {
    const btn = document.getElementById('btn-verify-video');
    window.open('https://www.effectivegatecpm.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274', '_blank');
    
    animateDots(btn, "Menyiapkan", 5, "Lanjut", () => {
        const input = document.getElementById('video-password').value;
        
        // Memastikan kecocokan langsung dengan `videoPassword` spesifik milik video target
        if (input === selectedVideo.videoPassword) {
            window.open(selectedVideo.passwordLink, '_blank');
            closeVideoPopup();
        } else {
            // Memberikan feedback error jika password salah tanpa menutup popup
            btn.classList.remove('shake');
            void btn.offsetWidth;
            btn.classList.add('shake');
            showDynamicIsland("Maaf Password Salah");
            
            btn.innerText = 'Verifikasi';
            btn.onclick = verifyVideoPassword;
        }
    });
}

window.closeVideoPopup = () => {
    elVideoPopup.classList.remove('active');
};

// --- DYNAMIC ISLAND LOGIC ---
function showDynamicIsland(message = "Maaf Link Sudah Expired") {
    if (isIslandActive) return; 
    isIslandActive = true;
    
    document.getElementById('island-text').innerText = message;
    elMainHeader.classList.add('header-dimmed');
    elIsland.classList.remove('island-hidden');
    
    setTimeout(() => {
        elIsland.classList.add('island-expanded');
    }, 50);

    setTimeout(() => {
        elIsland.classList.remove('island-expanded');
        setTimeout(() => {
            elIsland.classList.add('island-hidden');
            elMainHeader.classList.remove('header-dimmed');
            isIslandActive = false;
        }, 500); 
    }, 3000);
}

// --- PAGINATION LOGIC ---
function renderPagination(totalPages) {
    elPagination.innerHTML = '';
    if (totalPages <= 1) return;

    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '❮';
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => { currentPage--; renderGrid(); };
    elPagination.appendChild(btnPrev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => { currentPage = i; renderGrid(); };
        elPagination.appendChild(btn);
    }

    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = '❯';
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => { currentPage++; renderGrid(); };
    elPagination.appendChild(btnNext);
}
