import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private db: admin.firestore.Firestore;

    onModuleInit() {
        try {
            // Check if app is already initialized to prevent duplicate errors
            if (admin.apps.length === 0) {
                // Determine path to serviceAccountKey.json
                // Assumes it is in dist/config/serviceAccountKey.json (after build) 
                // OR src/config during dev. Best to try/catch or use env vars in production.
                // For this MVP, let's assume root/src/config logic.
                const serviceAccount = require(path.resolve(process.cwd(), 'src/config/serviceAccountKey.json'));

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
            this.db = admin.firestore();
            console.log('🔥 Firebase Initialized Successfully');
        } catch (error) {
            console.warn('⚠️  Firebase init failed. Missing serviceAccountKey.json? Using Mock/Memory DB if configured (or process will fail).', error.message);
            // In a real app, we might throw here. 
            // For now, let's allow it to fail gracefully so the user sees the error in terminal.
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Firebase DB not initialized. Check serviceAccountKey.json');
        }
        return this.db;
    }
}
