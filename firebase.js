import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Konfigurasi Real Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA90qxHb0lwsUDoO6myCKYvP1M5JtBBjJw",
    authDomain: "videomanz.firebaseapp.com",
    projectId: "videomanz",
    storageBucket: "videomanz.firebasestorage.app",
    messagingSenderId: "781178212379",
    appId: "1:781178212379:web:023bcba61329ee19cb28be",
    measurementId: "G-VYKC7DW17F"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

// Helper: Ekstrak Tanggal Firestore yang Aman (Mencegah "NaN")
function safeDateString(val) {
    if (!val) return null;
    // Jika format Firestore Timestamp
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (val.seconds) return new Date(val.seconds * 1000).toISOString();
    // Jika format Date biasa atau String ISO
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
    return null; // Fallback jika format hancur
}

const fallbackVideos = [];
// (Data fallback tetap ada sebagai safety net jika db belum konek)

// ----------------------------------------------------
// PUBLIC API: Get Only Published Videos
// ----------------------------------------------------
export async function getVideos() {
    try {
        if (!db) throw new Error("DB Not Initialized");
        const querySnapshot = await getDocs(collection(db, "videos"));
        const videos = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isPublished === true) {
                videos.push({ 
                    id: doc.id, 
                    ...data,
                    // Normalisasi saat membaca
                    uploadDate: safeDateString(data.uploadDate),
                    expiryDate: safeDateString(data.expiryDate)
                });
            }
        });
        
        videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        return videos.length > 0 ? videos : fallbackVideos;
    } catch (error) {
        console.warn("Gagal mengambil Firestore, menggunakan fallback:", error.message);
        return fallbackVideos;
    }
}

// ----------------------------------------------------
// ADMIN API: CRUD Operations
// ----------------------------------------------------
export async function getAllVideosForAdmin() {
    try {
        if (!db) throw new Error("DB Not Initialized");
        const querySnapshot = await getDocs(collection(db, "videos"));
        const videos = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            videos.push({ 
                id: doc.id, 
                ...data,
                uploadDate: safeDateString(data.uploadDate),
                expiryDate: safeDateString(data.expiryDate)
            });
        });
        videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        return videos;
    } catch (error) {
        console.error("Gagal memuat semua video untuk admin:", error);
        return [];
    }
}

export async function saveVideo(id, payload) {
    if (!db) throw new Error("DB Not Initialized");
    await setDoc(doc(db, "videos", id), payload);
}

export async function deleteVideo(id) {
    if (!db) throw new Error("DB Not Initialized");
    await deleteDoc(doc(db, "videos", id));
}
