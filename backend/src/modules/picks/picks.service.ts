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
    }, isAdmin = false): Promise<ParticipantEntry> {
        const week = await this.weeksService.findOne(data.weekId);
        if (!week) throw new NotFoundException('Week not found');

        if (!isAdmin) {
            if (week.status !== 'OPEN' || Date.now() > week.closeDate) {
                throw new BadRequestException('La quiniela ya está cerrada (el partido inicial ya comenzó).');
            }
        }

        const snapshot = await this.firebaseService.getDb().collection('picks')
            .where('weekId', '==', data.weekId)
            .get();

        const existing = snapshot.docs.find(
            doc => (doc.data() as ParticipantEntry).participantName.toLowerCase() === data.participantName.toLowerCase()
        );

        if (existing) {
            throw new BadRequestException(`Name "${data.participantName}" is already taken for this week. Please use a variation.`);
        }

        const id = crypto.randomUUID();
        const newEntry: ParticipantEntry = {
            id,
            weekId: data.weekId,
            participantName: data.participantName,
            totalGoalsPrediction: data.totalGoalsPrediction,
            picks: data.picks,
            paymentStatus: isAdmin ? 'PAID' : 'PENDING',
            submittedAt: Date.now(),
            score: 0,
            hits: [],
            ...(data.userEmail && { userEmail: data.userEmail })
        };

        await this.firebaseService.getDb().collection('picks').doc(id).set(newEntry);
        return newEntry;
    }

    async findAllByWeek(weekId: string): Promise<ParticipantEntry[]> {
        const snapshot = await this.firebaseService.getDb().collection('picks').where('weekId', '==', weekId).get();
        return snapshot.docs.map(doc => doc.data() as ParticipantEntry);
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

        await docRef.update(updateData);
        return { ...(doc.data() as ParticipantEntry), ...updateData };
    }

    async deletePick(id: string): Promise<{ success: boolean }> {
        await this.firebaseService.getDb().collection('picks').doc(id).delete();
        return { success: true };
    }
}
