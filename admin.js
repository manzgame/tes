import { getAllVideosForAdmin, saveVideo, deleteVideo } from './firebase.js';

let allVideosAdmin = [];

const elAppWrapper = document.getElementById('app-wrapper');
const elGlobalPopup = document.getElementById('global-popup');
const elAdminPopup = document.getElementById('admin-popup');

// Cek Keamanan Berjenjang (Publik -> Admin)
document.addEventListener('DOMContentLoaded', () => {
    let savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        savedTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    }
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Menerapkan update keamanan berlapis: publik & admin object-based
    if (!hasValidPublicAccess()) {
        elGlobalPopup.classList.add('active');
        document.body.classList.add('no-scroll'); 
    } else if (!hasValidAdminAccess()) {
        elAdminPopup.classList.add('active');
        document.body.classList.add('no-scroll'); 
    } else {
        unlockAdminPanel();
    }
});

// Listener untuk memantau manual input URL Thumbnail
document.getElementById('v-thumbnail').addEventListener('input', (e) => {
    updatePreview(e.target.value);
});

function hasValidPublicAccess() {
    try {
        const access = JSON.parse(localStorage.getItem('manzgame_access'));
        if (access && Date.now() < access.expiresAt) return true;
    } catch(e) {}
    return false;
}

function hasValidAdminAccess() {
    try {
        const accessStr = localStorage.getItem('manzgame_admin_access');
        if (!accessStr) return false;
        const access = JSON.parse(accessStr);
        // Proteksi jika dulunya masih tersimpan sebagai "true" string
        if (access && access.granted && Date.now() < access.expiresAt) return true;
    } catch(e) {}
    return false;
}

window.verifyGlobalGate = () => {
    if (document.getElementById('global-password').value === 'qwert67') {
        const expiresAt = Date.now() + (60 * 60 * 1000);
        localStorage.setItem('manzgame_access', JSON.stringify({ granted: true, expiresAt }));
        elGlobalPopup.classList.remove('active');
        
        if (!hasValidAdminAccess()) {
            elAdminPopup.classList.add('active');
        } else {
            unlockAdminPanel();
        }
    } else {
        alert("Password Publik Salah");
    }
}

window.verifyAdminGate = () => {
    const btn = document.getElementById('btn-verify-admin');
    if (document.getElementById('admin-password').value === 'izindatzon25') {
        const expiresAt = Date.now() + (60 * 60 * 1000); // Expiration memori admin 1 Jam
        localStorage.setItem('manzgame_admin_access', JSON.stringify({ granted: true, expiresAt }));
        elAdminPopup.classList.remove('active');
        unlockAdminPanel();
    } else {
        btn.classList.remove('shake');
        void btn.offsetWidth; 
        btn.classList.add('shake');
        alert("Password Admin Salah");
    }
}

function unlockAdminPanel() {
    elAppWrapper.classList.remove('blurred');
    document.body.classList.remove('no-scroll'); // BEBASKAN LAYAR SAAT TERBUKA
    loadAdminData();
    
    // Auto fill upload date create form & setup placeholder
    document.getElementById('v-upload').value = formatToDatetimeLocal(new Date());
    updatePreview('');
}

// --------------------------------------------------
// DATA MANAGEMENT
// --------------------------------------------------
async function loadAdminData() {
    allVideosAdmin = await getAllVideosForAdmin();
    renderAdminDropdown();
}

function renderAdminDropdown() {
    const select = document.getElementById('video-select');
    select.innerHTML = '<option value="">-- Pilih Video untuk Dikelola --</option>';
    
    allVideosAdmin.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.id} - ${v.title}`;
        select.appendChild(opt);
    });

    document.getElementById('selected-video-container').innerHTML = '';
}

// Fitur Selektor Spesifik (Mengubah List menjadi 1 Item Fokus)
window.handleVideoSelect = () => {
    const id = document.getElementById('video-select').value;
    const container = document.getElementById('selected-video-container');
    container.innerHTML = '';

    if (!id) return;

    const v = allVideosAdmin.find(video => video.id === id);
    if (!v) return;

    const isPub = v.isPublished !== false; // Default true
    const statusClass = isPub ? 'status-pub' : 'status-unpub';
    const statusText = isPub ? 'PUBLISHED' : 'HIDDEN';

    const item = document.createElement('div');
    item.className = 'list-item';

    item.innerHTML = `
        <img src="${v.thumbnail}" class="list-item-thumb" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22225%22%20fill%3D%22%231e2028%22%2F%3E%3C%2Fsvg%3E'">
        <div class="list-item-info">
            <div class="list-item-title">${v.title}</div>
            <div class="list-item-meta">
                <span class="status-badge ${statusClass}">${statusText}</span>
                <span>ID: ${v.id}</span>
            </div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editVideo('${v.id}')" title="Edit Video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-del" onclick="delVideo('${v.id}')" title="Hapus Video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </div>
    `;
    container.appendChild(item);
};

// --------------------------------------------------
// FORM ACTIONS & UTILS
// --------------------------------------------------
window.generateAutoId = () => {
    if (allVideosAdmin.length === 0) {
        document.getElementById('v-id').value = 'video1';
        return;
    }
    
    let maxNum = 0;
    allVideosAdmin.forEach(v => {
        const match = v.id.match(/\d+$/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
        }
    });
    
    document.getElementById('v-id').value = `video${maxNum + 1}`;
};

// Update Logic Tampilan Image Realtime
function updatePreview(url) {
    const img = document.getElementById('thumb-preview');
    if (!url) {
        img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22225%22%20fill%3D%22%231e2028%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22112.5%22%20fill%3D%22%23a0a0a5%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E';
    } else {
        img.src = url;
    }
}

// CLOUDINARY UPLOAD LOGIC
window.uploadToCloudinary = async (inputElement) => {
    const file = inputElement.files[0];
    if (!file) return;

    const btnSave = document.getElementById('btn-save');
    const statusText = document.getElementById('upload-status');
    
    btnSave.disabled = true;
    statusText.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'manzgame'); // Your Unsigned Preset

    try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dfechxl6d/image/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if(data.secure_url) {
            document.getElementById('v-thumbnail').value = data.secure_url;
            updatePreview(data.secure_url); // Memicu pembaruan gambar preview
            statusText.innerText = "Upload Berhasil!";
            statusText.style.color = "var(--accent-green)";
        } else {
            throw new Error("URL tidak ditemukan");
        }
    } catch (e) {
        statusText.innerText = "Upload Gagal. Coba lagi.";
        statusText.style.color = "var(--error-color)";
    } finally {
        btnSave.disabled = false;
        setTimeout(() => { statusText.style.display = 'none'; statusText.innerText = "Mengunggah..."; statusText.style.color = "var(--accent-blue)"; }, 3000);
    }
};

window.handleFormSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('v-id').value.trim();
    if(!id) return alert("Document ID wajib diisi!");

    const btnSave = document.getElementById('btn-save');
    btnSave.innerText = "Menyimpan...";
    btnSave.disabled = true;

    const payload = {
        title: document.getElementById('v-title').value,
        thumbnail: document.getElementById('v-thumbnail').value,
        passwordLink: document.getElementById('v-pw-link').value,
        noPasswordLink: document.getElementById('v-nopw-link').value,
        videoPassword: document.getElementById('v-pw').value,
        youtubePasswordLink: document.getElementById('v-yt-link').value,
        uploadDate: new Date(document.getElementById('v-upload').value).toISOString(),
        expiryDate: new Date(document.getElementById('v-expiry').value).toISOString(),
        isPublished: document.getElementById('v-published').checked
    };

    try {
        await saveVideo(id, payload);
        alert("Video berhasil disimpan!");
        resetForm();
        loadAdminData(); // Refresh UI Server (termasuk list)
    } catch (error) {
        alert("Gagal menyimpan: " + error.message);
    } finally {
        btnSave.innerText = "Simpan Video";
        btnSave.disabled = false;
    }
};

window.editVideo = (id) => {
    const v = allVideosAdmin.find(video => video.id === id);
    if (!v) return;

    document.getElementById('v-id').value = v.id;
    document.getElementById('v-title').value = v.title || '';
    document.getElementById('v-thumbnail').value = v.thumbnail || '';
    document.getElementById('v-pw-link').value = v.passwordLink || '';
    document.getElementById('v-nopw-link').value = v.noPasswordLink || '';
    document.getElementById('v-pw').value = v.videoPassword || '';
    document.getElementById('v-yt-link').value = v.youtubePasswordLink || '';
    
    document.getElementById('v-upload').value = formatToDatetimeLocal(v.uploadDate ? new Date(v.uploadDate) : new Date());
    document.getElementById('v-expiry').value = formatToDatetimeLocal(v.expiryDate ? new Date(v.expiryDate) : new Date());
    
    document.getElementById('v-published').checked = v.isPublished !== false;
    
    updatePreview(v.thumbnail || ''); // Memanggil image preview khusus untuk edit
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.delVideo = async (id) => {
    if (confirm(`Yakin ingin MENGHAPUS video ini (${id}) permanen?`)) {
        try {
            await deleteVideo(id);
            document.getElementById('selected-video-container').innerHTML = ''; // bersihkan preview spesifik
            loadAdminData();
        } catch (e) {
            alert("Gagal Menghapus: " + e.message);
        }
    }
};

window.resetForm = () => {
    document.getElementById('admin-form').reset();
    document.getElementById('v-upload').value = formatToDatetimeLocal(new Date());
    updatePreview(''); // Reset image area
};

// Date Format Util untuk Input html `datetime-local`
function formatToDatetimeLocal(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

// UI THEME
window.toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
};
