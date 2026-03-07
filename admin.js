import { getAllVideosForAdmin, saveVideo, deleteVideo } from './firebase.js';

let allVideosAdmin = [];

const elAppWrapper = document.getElementById('app-wrapper');
const elGlobalPopup = document.getElementById('global-popup');
const elAdminPopup = document.getElementById('admin-popup');

// Cek Keamanan Berjenjang (Publik -> Admin)
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (!hasValidPublicAccess()) {
        elGlobalPopup.classList.add('active');
    } else if (!hasValidAdminAccess()) {
        elAdminPopup.classList.add('active');
    } else {
        unlockAdminPanel();
    }
});

function hasValidPublicAccess() {
    try {
        const access = JSON.parse(localStorage.getItem('manzgame_access'));
        if (access && Date.now() < access.expiresAt) return true;
    } catch(e) {}
    return false;
}

function hasValidAdminAccess() {
    return localStorage.getItem('manzgame_admin_access') === 'true';
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
    if (document.getElementById('admin-password').value === 'yuhu67') {
        localStorage.setItem('manzgame_admin_access', 'true');
        elAdminPopup.classList.remove('active');
        unlockAdminPanel();
    } else {
        alert("Password Admin Salah");
    }
}

function unlockAdminPanel() {
    elAppWrapper.classList.remove('blurred');
    loadAdminData();
    
    // Auto fill upload date create form
    document.getElementById('v-upload').value = formatToDatetimeLocal(new Date());
}

// --------------------------------------------------
// DATA MANAGEMENT
// --------------------------------------------------
async function loadAdminData() {
    allVideosAdmin = await getAllVideosForAdmin();
    renderAdminList();
}

function renderAdminList() {
    const listContainer = document.getElementById('admin-list');
    listContainer.innerHTML = '';
    
    allVideosAdmin.forEach(v => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        const isPub = v.isPublished !== false; // Default true
        const statusClass = isPub ? 'status-pub' : 'status-unpub';
        const statusText = isPub ? 'PUBLISHED' : 'HIDDEN';

        item.innerHTML = `
            <img src="${v.thumbnail}" class="list-item-thumb">
            <div class="list-item-info">
                <div class="list-item-title">${v.title}</div>
                <div class="list-item-meta">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span>ID: ${v.id}</span>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn-edit" onclick="editVideo('${v.id}')">Edit</button>
                <button class="btn-del" onclick="delVideo('${v.id}')">X</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

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
        loadAdminData(); // Refresh UI Server
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.delVideo = async (id) => {
    if (confirm(`Yakin ingin MENGHAPUS video ini (${id}) permanen?`)) {
        try {
            await deleteVideo(id);
            loadAdminData();
        } catch (e) {
            alert("Gagal Menghapus: " + e.message);
        }
    }
};

window.resetForm = () => {
    document.getElementById('admin-form').reset();
    document.getElementById('v-upload').value = formatToDatetimeLocal(new Date());
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
