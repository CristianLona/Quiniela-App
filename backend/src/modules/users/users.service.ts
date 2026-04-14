import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../common/firebase/firebase.service';

@Injectable()
export class UsersService {
    constructor(private firebaseService: FirebaseService) {}

    async saveFcmToken(userId: string, token: string): Promise<void> {
        const db = this.firebaseService.getDb();
        const userRef = db.collection('users').doc(userId);
        
        // Use arrayUnion to store multiple tokens if the user logs in from multiple devices
        const admin = require('firebase-admin');
        await userRef.set({
            fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    async getAllTokens(): Promise<string[]> {
        const db = this.firebaseService.getDb();
        const usersSnap = await db.collection('users').get();
        let allTokens: string[] = [];
        
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                allTokens.push(...data.fcmTokens);
            }
        });

        // Deduplicate
        return [...new Set(allTokens)];
    }

    async broadcastNotification(title: string, body: string, data?: any): Promise<void> {
        const tokens = await this.getAllTokens();
        if (tokens.length === 0) return;

        const messaging = this.firebaseService.getMessaging();
        try {
            const response = await messaging.sendEachForMulticast({
                tokens,
                notification: { title, body },
                data: data || {},
                // webpush allows specifying icon/badge directly, but general format covers it for simple payloads
            });
            console.log(`Successfully broadcasted push to ${response.successCount} devices. Failed: ${response.failureCount}`);
        } catch (error) {
            console.error('Error broadcasting push notification', error);
        }
    }
}
