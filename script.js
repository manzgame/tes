import { getVideos } from './firebase.js';

window.SOCIAL_LINKS = {
    youtube: "https://youtube.com/@contoh",
    whatsapp: "https://whatsapp.com/channel/contoh",
    telegram: "https://t.me/contoh"
};

let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
let layoutMode = 1; 
let isIslandActive = false;
let selectedVideo = null;

const ACCESS_KEY = 'manzgame_access';
const ACCESS_DURATION = 60 * 60 * 1000; 

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

document.addEventListener('DOMContentLoaded', () => {
    initializeAppState();
    initData();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!hasValidAccess() && !elGlobalPopup.classList.contains('active')) {
            applyLockedState();
        }
    }
});

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
    if (access && Date.now() < access.expiresAt) return true;
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
    requestAnimationFrame(() => elGlobalPopup.classList.add('active'));
    document.body.classList.add('no-scroll'); // PENCEGAH SCROLL SAAT POPUP
    
    const btn = document.getElementById('btn-verify-global');
    btn.innerText = 'Verifikasi';
    btn.onclick = verifyGlobalPassword;
    document.getElementById('global-password').value = '';
}

function applyUnlockedState(animate = false) {
    if (animate) {
        elGlobalPopup.classList.add('slide-down');
        setTimeout(() => {
            elGlobalPopup.classList.remove('active', 'slide-down');
            elAppWrapper.classList.remove('blurred');
            document.body.classList.remove('no-scroll'); // MEMBEBASKAN SCROLL SAAT POPUP TUTUP
        }, 500);
    } else {
        elGlobalPopup.classList.remove('active', 'slide-down');
        elAppWrapper.classList.remove('blurred');
        document.body.classList.remove('no-scroll'); // MEMBEBASKAN SCROLL SAAT POPUP TUTUP
    }
}

function initializeAppState() {
    let savedTheme = localStorage.getItem('theme');
    // PENCEGAHAN BUG CACHE: Set paksa ke 'dark' bila memori tidak valid
    if (savedTheme !== 'light' && savedTheme !== 'dark') {
        savedTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    }
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('btn-verify-global').onclick = verifyGlobalPassword;
    document.getElementById('search-input').addEventListener('input', handleSearch);

    if (hasValidAccess()) applyUnlockedState(false);
    else applyLockedState();
}

async function initData() {
    allVideos = await getVideos();
    filteredVideos = [...allVideos];
    document.getElementById('total-video-count').innerText = allVideos.length;

    if (hasValidAccess()) renderGrid();
}

window.toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
};

window.togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
    btn.style.color = input.type === "text" ? "var(--accent-blue)" : "var(--text-sub)";
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

window.toggleSidebar = () => {
    const sidebarActive = document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
    
    // PENCEGAH SCROLL LOKAL SAAT SIDEBAR TERBUKA
    if (sidebarActive) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
};

window.navHome = () => {
    window.toggleSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openAdminPopup = () => {
    window.toggleSidebar(); // Menutup sidebar otomatis yang meniadakan no-scroll
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-popup').classList.add('active');
    document.body.classList.add('no-scroll'); // Pasang kembali no-scroll untuk popup admin
};

window.closeAdminPopup = () => {
    document.getElementById('admin-popup').classList.remove('active');
    document.body.classList.remove('no-scroll'); // Membebaskan scroll layar
};

window.verifyAdminPassword = () => {
    const input = document.getElementById('admin-password').value;
    const btn = document.getElementById('btn-verify-admin');
    
    // VALIDASI NEW ADMIN PASSWORD
    if (input === 'izindatzon25') {
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 Jam Expired Memory Admin
        localStorage.setItem('manzgame_admin_access', JSON.stringify({ granted: true, expiresAt }));
        window.location.href = 'admin.html';
    } else {
        btn.classList.remove('shake');
        void btn.offsetWidth; 
        btn.classList.add('shake');
        showDynamicIsland("Maaf Password Salah");
    }
};

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

    elVideoGrid.className = `video-grid layout-${layoutMode}`;
    const now = new Date();

    pageVideos.forEach(video => {
        let expiryDate = null;
        if (video.expiryDate) {
            expiryDate = new Date(video.expiryDate);
        }
        
        if (!expiryDate || isNaN(expiryDate.getTime())) {
            const uploadDate = video.uploadDate ? new Date(video.uploadDate) : now;
            expiryDate = new Date(uploadDate);
            if(isNaN(expiryDate.getTime())) expiryDate = new Date(now); 
            expiryDate.setDate(expiryDate.getDate() + 7);
        }

        const diffTime = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = diffTime <= 0;

        let badgeHtml = '';
        if (isExpired) {
            badgeHtml = `<div class="badge-expired danger">Expired! harap pakai link no password dulu</div>`;
        } else if (isNaN(daysLeft)) {
            badgeHtml = `<div class="badge-expired danger">Link Tersedia</div>`;
        } else {
            badgeHtml = `<div class="badge-expired">Expired ${daysLeft} hari lagi...</div>`;
        }

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
        document.body.classList.add('no-scroll'); // PENCEGAH SCROLL SAAT POPUP
    }
};

function verifyVideoPassword() {
    const btn = document.getElementById('btn-verify-video');
    window.open('https://www.effectivegatecpm.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274', '_blank');
    
    animateDots(btn, "Menyiapkan", 5, "Lanjut", () => {
        const input = document.getElementById('video-password').value;
        if (input === selectedVideo.videoPassword) {
            window.open(selectedVideo.passwordLink, '_blank');
            closeVideoPopup();
        } else {
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
    document.body.classList.remove('no-scroll'); // MEMBEBASKAN SCROLL SAAT POPUP TUTUP
};

function showDynamicIsland(message = "Maaf Link Sudah Expired") {
    if (isIslandActive) return; 
    isIslandActive = true;
    document.getElementById('island-text').innerText = message;
    elMainHeader.classList.add('header-dimmed');
    elIsland.classList.remove('island-hidden');
    setTimeout(() => elIsland.classList.add('island-expanded'), 50);
    setTimeout(() => {
        elIsland.classList.remove('island-expanded');
        setTimeout(() => {
            elIsland.classList.add('island-hidden');
            elMainHeader.classList.remove('header-dimmed');
            isIslandActive = false;
        }, 500); 
    }, 3000);
}

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
