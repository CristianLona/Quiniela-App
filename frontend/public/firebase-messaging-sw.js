// public/firebase-messaging-sw.js

// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuración de inicialización, necesitas inyectar estas variables
// o leerlas de la URL si lo configuras dinámicamente. 
// Para el Service Worker usaremos un workaround de leer un path u objeto.
// Pero la forma más fácil es quemar el senderId y el app id (los únicos que necesita FCM al menos).
const firebaseConfig = {
    apiKey: "AIzaSyDUm52HThGqqXZ_NxnXguJATRZ25TsrpzU",
    authDomain: "quinielaapp-d8fed.firebaseapp.com",
    projectId: "quinielaapp-d8fed",
    storageBucket: "quinielaapp-d8fed.firebasestorage.app",
    messagingSenderId: "458382293784",
    appId: "1:458382293784:web:c94c9ca72248a33215bc6d"
};

try {
    // Vite loader will struggle here if we use import.meta.env, 
    // so in production, this script will be served directly by the browser. 
    // We fetch the config dynamically from the URL params to keep it secure-ish or 
    // we use a generated config. For now, we leave placeholders that we will replace via a build script or manual entry.
    // However, since only messagingSenderId and projectId are strictly needed for SW background pushes usually, we can provide them.
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Background push handler
    messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'Quiniela App Update';
        const notificationOptions = {
            body: payload.notification?.body || 'You have a new update.',
            icon: '/vite.svg', // Assuming you have an icon
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error("FCM SW initialization error", e);
}
