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
    }, isAdmin = false): Promise<ParticipantEntry> {
        // 1. Validate Week is Open
        const week = await this.weeksService.findOne(data.weekId);
        if (!week) throw new NotFoundException('Week not found');

        // Strict Time Check (Skipped if Admin)
        if (!isAdmin) {
            if (week.status !== 'OPEN' || Date.now() > week.closeDate) {
                throw new BadRequestException('La quiniela ya está cerrada (el partido inicial ya comenzó).');
            }
        }

        // 2. Validate Duplicate Name (Firestore Query)
        const snapshot = await this.firebaseService.getDb().collection('picks')
            .where('weekId', '==', data.weekId)
            // Firestore doesn't support case-insensitive queries easily without external tools or "name_lower" field.
            // For MVP, we will fetch strictly. Ideally store "nameLower" field.
            .get();

        const existing = snapshot.docs.find(
            doc => (doc.data() as ParticipantEntry).participantName.toLowerCase() === data.participantName.toLowerCase()
        );

        if (existing) {
            throw new BadRequestException(`Name "${data.participantName}" is already taken for this week. Please use a variation.`);
        }

        // 3. Create Entry
        const id = crypto.randomUUID();
        const newEntry: ParticipantEntry = {
            id,
            weekId: data.weekId,
            participantName: data.participantName,
            totalGoalsPrediction: data.totalGoalsPrediction,
            picks: data.picks,
            paymentStatus: isAdmin ? 'PAID' : 'PENDING', // Admin entries default to PAID? Or Pending? Let's say Pending to be safe, admin can toggle.
            submittedAt: Date.now(),
            score: 0,
            hits: [],
        };

        await this.firebaseService.getDb().collection('picks').doc(id).set(newEntry);
        return newEntry;
    }

    async findAllByWeek(weekId: string): Promise<ParticipantEntry[]> {
        const snapshot = await this.firebaseService.getDb().collection('picks').where('weekId', '==', weekId).get();
        return snapshot.docs.map(doc => doc.data() as ParticipantEntry);
    }

    // Admin: Mark as Paid
    async togglePayment(entryId: string): Promise<ParticipantEntry> {
        const docRef = this.firebaseService.getDb().collection('picks').doc(entryId);
        const doc = await docRef.get();

        if (!doc.exists) throw new NotFoundException('Entry not found');

        const entry = doc.data() as ParticipantEntry;
        const newStatus = entry.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';

        await docRef.update({ paymentStatus: newStatus });
        return { ...entry, paymentStatus: newStatus };
    }
}
