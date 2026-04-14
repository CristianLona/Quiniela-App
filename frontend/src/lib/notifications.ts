import { getToken, onMessage, isSupported, getMessaging } from 'firebase/messaging';
import { app } from './firebase';
import { api } from './api';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
    const supported = await isSupported();
    if (!supported) {
        console.log('Firebase Messaging is not supported or initialized in this browser.');
        return null;
    }

    const messaging = getMessaging(app);

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        // We save the token on the backend
        await api.users.saveFcmToken(currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Notification permission defined.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onForegroundMessage = async () => {
    const supported = await isSupported();
    if (!supported) return;

    const messaging = getMessaging(app);

    return onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        const notificationTitle = payload.notification?.title || 'Notificación';
        const notificationOptions = payload.notification?.body || 'Tienes una nueva actualización.';

        // Show a visual toast when app is open
        toast.info(notificationTitle, {
            description: notificationOptions,
            duration: 8000,
        });
    });
};
