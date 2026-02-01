import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private db: admin.firestore.Firestore;

    onModuleInit() {
        if (admin.apps.length > 0) {
            this.db = admin.firestore();
            return;
        }

        try {
            let serviceAccount;
            // 1. Try Environment Variable (Production/Render)
            if (process.env.FIREBASE_CREDENTIALS) {
                try {
                    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
                    console.log('Using Firebase Credentials from Environment Variable');
                } catch (e) {
                    console.warn('Failed to parse FIREBASE_CREDENTIALS');
                }
            }

            // 2. Try Local File (Development)
            if (!serviceAccount) {
                try {
                    const filePath = path.resolve(process.cwd(), 'src/config/serviceAccountKey.json');
                    serviceAccount = require(filePath);
                    console.log('Using Firebase Credentials from Local File');
                } catch (e) {
                    // Ignore if file missing
                }
            }

            if (!serviceAccount) {
                // Fallback to Application Default Credentials (for Cloud Functions/Run)
                console.log('No explicit credentials found. Using Application Default Credentials.');
                admin.initializeApp();
            } else {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }

            this.db = admin.firestore();
            console.log('Firebase Initialized Successfully');
        } catch (error) {
            console.warn('Firebase init failed.', error.message);
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Firebase DB not initialized. Check serviceAccountKey.json');
        }
        return this.db;
    }
}
