// Firebase Configuration - StudyPlanner Pro
console.log('Initializing Firebase...');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFg_r0_TDCX1A1rhG8JrshZqK2iA3MvIw",
    authDomain: "studyplanner-firebase.firebaseapp.com",
    projectId: "studyplanner-firebase",
    storageBucket: "studyplanner-firebase.firebasestorage.app",
    messagingSenderId: "1099409491095",
    appId: "1:1099409491095:web:3b2986b83853413686d5d2",
    measurementId: "G-ZNM1SGNC5S"
};

// Initialize Firebase
try {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK chưa được tải!');
        throw new Error('Firebase SDK not loaded');
    }
    
    // Initialize Firebase App
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully!');
    
    // Initialize Firebase services and make them globally available
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence()
        .then(() => {
            console.log('Firestore offline persistence enabled');
        })
        .catch((err) => {
            console.warn('Firestore offline persistence not supported:', err);
        });
    
    console.log('Firebase services initialized:', {
        auth: !!window.auth,
        db: !!window.db
    });
    
} catch (error) {
    console.error('Lỗi khởi tạo Firebase:', error);
    
    // Fallback: Create mock services for development
    if (typeof window !== 'undefined') {
        window.auth = {
            onAuthStateChanged: (callback) => callback(null),
            signInWithPopup: () => Promise.reject(new Error('Firebase not initialized')),
            signOut: () => Promise.reject(new Error('Firebase not initialized')),
            currentUser: null
        };
        
        window.db = {
            collection: () => ({
                doc: () => ({
                    set: () => Promise.reject(new Error('Firebase not initialized')),
                    get: () => Promise.reject(new Error('Firebase not initialized'))
                }),
                add: () => Promise.reject(new Error('Firebase not initialized')),
                where: () => ({
                    orderBy: () => ({
                        limit: () => ({
                            get: () => Promise.reject(new Error('Firebase not initialized'))
                        })
                    })
                })
            }),
            enablePersistence: () => Promise.resolve()
        };
        
        console.warn('Using mock Firebase services for development');
    }
}