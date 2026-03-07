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

// Data Fallback (Hanya dipakai jika Firestore benar-benar kosong/error jaringan)
const fallbackVideos = [];
const today = new Date();
for (let i = 1; i <= 3; i++) {
    let uploadDate = new Date(today);
    uploadDate.setDate(today.getDate() - (i % 3)); 
    let expiryDate = new Date(uploadDate);
    expiryDate.setDate(expiryDate.getDate() + 7);

    fallbackVideos.push({
        id: `vid-${i}`,
        title: `Premium Video Content Chapter ${i}`,
        thumbnail: `https://picsum.photos/seed/${i+100}/640/360`,
        passwordLink: `https://example.com/pw-${i}`,
        noPasswordLink: `https://example.com/nopw-${i}`,
        videoPassword: `rahasia${i}`,
        youtubePasswordLink: `https://youtube.com/watch?v=ex${i}`,
        uploadDate: uploadDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        isPublished: true
    });
}

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
            // Hanya tampilkan yang published = true
            if (data.isPublished === true) {
                videos.push({ id: doc.id, ...data });
            }
        });
        
        // Urutkan dari yang terbaru (opsional)
        videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        return videos.length > 0 ? videos : [];
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
            videos.push({ id: doc.id, ...doc.data() });
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
