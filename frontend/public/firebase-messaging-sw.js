// public/firebase-messaging-sw.js

// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDUm52HThGqqXZ_NxnXguJATRZ25TsrpzU",
    authDomain: "quinielaapp-d8fed.firebaseapp.com",
    projectId: "quinielaapp-d8fed",
    storageBucket: "quinielaapp-d8fed.firebasestorage.app",
    messagingSenderId: "458382293784",
    appId: "1:458382293784:web:c94c9ca72248a33215bc6d"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    
    messaging.onBackgroundMessage((payload) => {
        
        if (payload.notification) {
            return;
        }

        const notificationTitle = payload.data?.title || 'Quiniela App';
        const notificationOptions = {
            body: payload.data?.body || 'Tienes una nueva actualización.',
            icon: '/vite.svg',
            data: payload.data,
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error("FCM SW initialization error", e);
}
