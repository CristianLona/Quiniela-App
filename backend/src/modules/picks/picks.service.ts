import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ParticipantEntry, PickSelection } from '../../common/types';
import { WeeksService } from '../weeks/weeks.service';
import * as crypto from 'crypto';
import { FirebaseService } from '../../common/firebase/firebase.service';

@Injectable()
export class PicksService {
    constructor(
        private readonly weeksService: WeeksService,
        private readonly firebaseService: FirebaseService
    ) { }

    async submitPick(data: {
        weekId: string;
        participantName: string;
        totalGoalsPrediction: number;
        picks: PickSelection[];
        userEmail?: string;
        userId?: string;
        appVersion?: string;
    }, isAdmin = false): Promise<ParticipantEntry> {
        // Validación de input
        if (!data.participantName || data.participantName.trim().length < 2) {
            throw new BadRequestException('El nombre debe tener al menos 2 caracteres.');
        }
        if (data.participantName.length > 50) {
            throw new BadRequestException('El nombre no puede tener más de 50 caracteres.');
        }

        const week = await this.weeksService.findOne(data.weekId);
        if (!week) throw new NotFoundException('Week not found');

        if (!isAdmin) {
            if (week.status !== 'OPEN' || Date.now() > week.closeDate) {
                throw new BadRequestException('La quiniela ya está cerrada (el partido inicial ya comenzó).');
            }
        }

        // Buscar duplicados de forma optimizada con campo normalizado
        const normalizedName = data.participantName.trim().toLowerCase();
        const snapshot = await this.firebaseService.getDb().collection('picks')
            .where('weekId', '==', data.weekId)
            .where('participantNameNormalized', '==', normalizedName)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            throw new BadRequestException(`Name "${data.participantName}" is already taken for this week. Please use a variation.`);
        }

        const id = crypto.randomUUID();
        const newEntry: ParticipantEntry = {
            id,
            weekId: data.weekId,
            participantName: data.participantName.trim(),
            participantNameNormalized: normalizedName,
            totalGoalsPrediction: data.totalGoalsPrediction,
            picks: data.picks,
            paymentStatus: isAdmin ? 'PAID' : 'PENDING',
            submittedAt: Date.now(),
            score: 0,
            hits: [],
            ...(data.userEmail && { userEmail: data.userEmail }),
            ...(data.appVersion && { appVersion: data.appVersion })
        };

        if (data.userId) {
            const userDoc = await this.firebaseService.getDb().collection('users').doc(data.userId).get();
            if (userDoc.exists && userDoc.data().phoneNumber) {
                newEntry.phoneNumber = userDoc.data().phoneNumber;
            }
        }

        await this.firebaseService.getDb().collection('picks').doc(id).set(newEntry);
        return newEntry;
    }

    async findAllByWeek(weekId: string): Promise<ParticipantEntry[]> {
        const snapshot = await this.firebaseService.getDb()
            .collection('picks')
            .where('weekId', '==', weekId)
            .get();
        return snapshot.docs.map(doc => doc.data() as ParticipantEntry);
    }

    async findAllByWeekAdmin(weekId: string): Promise<ParticipantEntry[]> {
        const picks = await this.findAllByWeek(weekId);
        
        // Populate phones dynamically if missing
        const auth = this.firebaseService.getAuth();
        const db = this.firebaseService.getDb();
        
        const cache = new Map<string, { phone?: string, hasAcceptedRules?: boolean }>();
        
        for (const pick of picks) {
            if (pick.userEmail) {
                if (cache.has(pick.userEmail)) {
                    const cachedData = cache.get(pick.userEmail);
                    if (!pick.phoneNumber && cachedData?.phone) pick.phoneNumber = cachedData.phone;
                    pick.hasAcceptedRules = cachedData?.hasAcceptedRules || false;
                } else {
                    try {
                        const userRecord = await auth.getUserByEmail(pick.userEmail);
                        const userDoc = await db.collection('users').doc(userRecord.uid).get();
                        if (userDoc.exists) {
                            const data = userDoc.data();
                            if (!pick.phoneNumber && data?.phoneNumber) pick.phoneNumber = data.phoneNumber;
                            pick.hasAcceptedRules = data?.hasAcceptedRules || false;
                            
                            cache.set(pick.userEmail, { phone: data?.phoneNumber, hasAcceptedRules: data?.hasAcceptedRules });
                        } else {
                            cache.set(pick.userEmail, { hasAcceptedRules: false });
                            pick.hasAcceptedRules = false;
                        }
                    } catch (e) {
                        cache.set(pick.userEmail, { hasAcceptedRules: false });
                        pick.hasAcceptedRules = false;
                    }
                }
            }
        }
        
        return picks;
    }

    async patchOldPicksPhoneNumbers() {
        // Implementation for patching if needed
        return { success: true };
    }

    async togglePayment(entryId: string): Promise<ParticipantEntry> {
        const docRef = this.firebaseService.getDb().collection('picks').doc(entryId);
        const doc = await docRef.get();

        if (!doc.exists) throw new NotFoundException('Entry not found');

        const entry = doc.data() as ParticipantEntry;
        const newStatus = entry.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';

        await docRef.update({ paymentStatus: newStatus });
        return { ...entry, paymentStatus: newStatus };
    }

    async updatePick(id: string, updateData: Partial<ParticipantEntry>): Promise<ParticipantEntry> {
        const docRef = this.firebaseService.getDb().collection('picks').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundException('Entry not found');

        // Sanitizar: no permitir actualizar campos sensibles directamente
        const { id: _id, weekId: _weekId, userEmail: _email, ...safeUpdate } = updateData;
        
        await docRef.update(safeUpdate);
        return { ...(doc.data() as ParticipantEntry), ...safeUpdate };
    }

    async deletePick(id: string): Promise<{ success: boolean }> {
        const docRef = this.firebaseService.getDb().collection('picks').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundException('Entry not found');

        await docRef.delete();
        return { success: true };
    }
}

