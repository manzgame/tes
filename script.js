import { getVideos } from './firebase.js';

// --- STATE ---
let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
let layoutMode = 1; // 1: 1 kolom (5 item), 2: 2 kolom (10 item)
let isIslandActive = false;
let selectedVideo = null;

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
document.addEventListener('DOMContentLoaded', async () => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Fetch data
    allVideos = await getVideos();
    filteredVideos = [...allVideos];
    
    // Bind global events (Menggunakan onclick langsung mencegah bug klik ganda)
    document.getElementById('btn-verify-global').onclick = verifyGlobalPassword;
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Cek Akses Memori LocalStorage (1 Jam)
    const accessStr = localStorage.getItem('manzgame_access');
    let hasAccess = false;
    
    if (accessStr) {
        try {
            const access = JSON.parse(accessStr);
            if (Date.now() < access.expiresAt) {
                hasAccess = true;
            } else {
                localStorage.removeItem('manzgame_access'); // Expired
            }
        } catch(e) {}
    }

    if (hasAccess) {
        elAppWrapper.classList.remove('blurred');
        renderGrid();
    } else {
        // Memicu animasi smooth entrance setelah DOM dimuat
        requestAnimationFrame(() => {
            elGlobalPopup.classList.add('active');
        });
    }
});

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
        btnElement.onclick = onComplete; // Menerapkan listener bersih setelah selesai
    }, seconds * 1000);
}

// --- GLOBAL PASSWORD LOGIC ---
function verifyGlobalPassword() {
    const input = document.getElementById('global-password').value;
    const errorEl = document.getElementById('global-error');
    const btn = document.getElementById('btn-verify-global');

    if (input !== 'qwert67') {
        showDynamicIsland("PASSWORD SALAH!");
        errorEl.innerText = ""; // Clear inline error karena memakai Dynamic Island
        return;
    }
    
    errorEl.innerText = "";
    // 1. Buka Iklan
    window.open('https://www.effectivegatecpm.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274', '_blank');
    
    // 2. Animasi Loading 10 Detik
    animateDots(btn, "Menyiapkan", 10, "Berikutnya", () => {
        // Simpan status sukses ke localStorage selama 1 jam
        const expiresAt = Date.now() + (60 * 60 * 1000);
        localStorage.setItem('manzgame_access', JSON.stringify({ granted: true, expiresAt }));

        // 3. Buka Akses Web dengan Smooth Exit Animation
        elGlobalPopup.classList.add('slide-down');
        setTimeout(() => {
            elGlobalPopup.classList.remove('active');
            elGlobalPopup.classList.remove('slide-down');
            elAppWrapper.classList.remove('blurred');
            renderGrid();
        }, 500);
    });
}

// --- HEADER & SEARCH LOGIC ---
window.toggleSearch = () => {
    const isActive = elSearchContainer.classList.contains('search-active');
    if (!isActive) {
        elSearchContainer.classList.add('search-active');
        elHeaderTitle.style.opacity = '0'; // Hide text to make room
        elSearchInput.focus();
    }
};

window.clearSearch = () => {
    elSearchInput.value = '';
    elSearchContainer.classList.remove('search-active');
    elHeaderTitle.style.opacity = '1';
    handleSearch(); // reset
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
    
    elVideoGrid.className = `video-grid layout-${mode}`;
    renderGrid();
};

function renderGrid() {
    elVideoGrid.innerHTML = '';
    const itemsPerPage = layoutMode === 1 ? 5 : 10;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVideos = filteredVideos.slice(start, end);

    if (pageVideos.length === 0) {
        elVideoGrid.innerHTML = '<p style="text-align:center; padding: 20px; color:var(--text-sub);">Tidak ada video ditemukan.</p>';
        renderPagination(0);
        return;
    }

    const now = new Date();

    pageVideos.forEach(video => {
        // Calculate Expiry
        const uploadDate = new Date(video.uploadDate);
        const expiryDate = new Date(uploadDate);
        expiryDate.setDate(expiryDate.getDate() + 7);
        const diffTime = expiryDate - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft <= 0;

        let badgeHtml = '';
        if (isExpired) {
            badgeHtml = `<div class="badge-expired danger">Expired! harap pakai link no password dulu</div>`;
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

// --- CARD ACTIONS ---
window.handlePasswordBtn = (id, isExpired, btnElement) => {
    if (isExpired) {
        // Shake animation
        btnElement.classList.remove('shake');
        void btnElement.offsetWidth; // trigger reflow
        btnElement.classList.add('shake');
        
        showDynamicIsland("Maaf Link Sudah Expired");
    } else {
        selectedVideo = allVideos.find(v => v.id === id);
        document.getElementById('video-popup-title').innerText = selectedVideo.title;
        document.getElementById('video-password').value = '';
        document.getElementById('video-error').innerText = '';
        
        // Reset button verify state (Menghindari event bertumpuk)
        const btnVerify = document.getElementById('btn-verify-video');
        btnVerify.innerText = 'Verifikasi';
        btnVerify.onclick = verifyVideoPassword; 
        
        document.getElementById('btn-lihat-password').onclick = () => {
            window.open(selectedVideo.youtubePasswordLink, '_blank');
        };

        elVideoPopup.classList.add('active');
    }
};

// --- VIDEO PASSWORD LOGIC ---
function verifyVideoPassword() {
    const btn = document.getElementById('btn-verify-video');
    const errorEl = document.getElementById('video-error');
    errorEl.innerText = "";
    
    // 1. Buka Iklan
    window.open('https://www.effectivegatecpm.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274', '_blank');
    
    // 2. Animasi Loading 5 Detik
    animateDots(btn, "Menyiapkan", 5, "Lanjut", () => {
        // Cek input pas klik "Lanjut"
        const input = document.getElementById('video-password').value;
        if (input === selectedVideo.videoPassword) {
            window.open(selectedVideo.passwordLink, '_blank');
            closeVideoPopup();
        } else {
            errorEl.innerText = "Password video salah. Silakan cek ulang.";
            // Reset button to verify again
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
    if (isIslandActive) return; // Ignore spam clicks
    isIslandActive = true;
    
    document.getElementById('island-text').innerText = message;
    elMainHeader.classList.add('header-dimmed');
    elIsland.classList.remove('island-hidden');
    
    // Wait a tick then expand
    setTimeout(() => {
        elIsland.classList.add('island-expanded');
    }, 50);

    // Hide after 3s
    setTimeout(() => {
        elIsland.classList.remove('island-expanded');
        setTimeout(() => {
            elIsland.classList.add('island-hidden');
            elMainHeader.classList.remove('header-dimmed');
            isIslandActive = false;
        }, 500); // wait for shrink animation
    }, 3000);
}

// --- PAGINATION LOGIC ---
function renderPagination(totalPages) {
    elPagination.innerHTML = '';
    if (totalPages <= 1) return;

    // Prev
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '❮';
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => { currentPage--; renderGrid(); };
    elPagination.appendChild(btnPrev);

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => { currentPage = i; renderGrid(); };
        elPagination.appendChild(btn);
    }

    // Next
    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = '❯';
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => { currentPage++; renderGrid(); };
    elPagination.appendChild(btnNext);
}
