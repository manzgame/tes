import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Ganti konfigurasi ini dengan konfigurasi Firebase Anda nanti
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase belum dikonfigurasi. Menggunakan data Fallback sementara.");
}

// Data MOCK/Fallback agar UI tetap bisa diuji sempurna tanpa error
const fallbackVideos = [];
const today = new Date();

// Membuat 15 data contoh (beberapa belum expired, beberapa sudah expired)
for (let i = 1; i <= 15; i++) {
    let uploadDate = new Date(today);
    // Data 1-3 sudah expired (diupload 10 hari lalu)
    // Data 4-15 belum expired (diupload hari ini atau kemarin)
    if (i <= 3) {
        uploadDate.setDate(today.getDate() - 10); 
    } else {
        uploadDate.setDate(today.getDate() - (i % 3)); 
    }

    fallbackVideos.push({
        id: `vid-${i}`,
        title: `Premium Video Content Chapter ${i} - Full HD Resolution 60FPS Review Lengkap`,
        thumbnail: `https://picsum.photos/seed/${i+100}/640/360`,
        passwordLink: `https://example.com/password-content-${i}`,
        noPasswordLink: `https://example.com/no-password-content-${i}`,
        videoPassword: `rahasia${i}`,
        youtubePasswordLink: `https://youtube.com/watch?v=example${i}`,
        uploadDate: uploadDate.toISOString()
    });
}

// Fungsi utama untuk mengambil data
export async function getVideos() {
    try {
        if (!db) throw new Error("DB Not Initialized");
        const querySnapshot = await getDocs(collection(db, "videos"));
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        return videos.length > 0 ? videos : fallbackVideos;
    } catch (error) {
        console.warn("Gagal mengambil Firestore, menggunakan fallback:", error.message);
        return fallbackVideos;
    }
}
