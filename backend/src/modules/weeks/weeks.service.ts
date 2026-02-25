import { Injectable, BadRequestException } from '@nestjs/common';
import { Week, WeekDraft } from '../../common/types';
import { parseLineToMatchDraft } from '../../common/utils/parser';
import * as crypto from 'crypto';
import { FirebaseService } from '../../common/firebase/firebase.service';

@Injectable()
export class WeeksService {
    constructor(private readonly firebaseService: FirebaseService) { }

    parseWeekText(text: string): WeekDraft {
        if (!text) throw new BadRequestException('Text input required');

        const lines = text.split('\n');
        const parsedMatches = lines
            .map((line) => parseLineToMatchDraft(line))
            .filter((m) => m !== null) as any[];

        return {
            rawText: text,
            parsedMatches,
        };
    }

    async createWeek(name: string, matchDrafts: any[], price: number = 50, adminFee: number = 0, league: string = 'liga-mx'): Promise<Week> {
        const sortedDates = matchDrafts
            .map((m) => new Date(m.date).getTime())
            .sort((a, b) => a - b);
        const closeDate = sortedDates[0] || Date.now();

        const id = crypto.randomUUID();
        const newWeek: Week = {
            id,
            name,
            status: 'OPEN',
            closeDate,
            price,
            adminFee,
            league,
            createdAt: Date.now(),
            matches: matchDrafts.map((m) => ({
                ...m,
                id: crypto.randomUUID(),
                weekId: id,
                status: 'SCHEDULED'
            })),
        };

        await this.firebaseService.getDb().collection('weeks').doc(id).set(newWeek);
        return newWeek;
    }

    async findAll(): Promise<Week[]> {
        const snapshot = await this.firebaseService.getDb().collection('weeks').get();
        return snapshot.docs.map(doc => doc.data() as Week);
    }

    async findOne(id: string): Promise<Week | undefined> {
        const doc = await this.firebaseService.getDb().collection('weeks').doc(id).get();
        return doc.exists ? (doc.data() as Week) : undefined;
    }

    async updateMatch(weekId: string, matchId: string, homeScore: number, awayScore: number, status?: string): Promise<Week> {
        return this.firebaseService.getDb().runTransaction(async (t) => {
            const ref = this.firebaseService.getDb().collection('weeks').doc(weekId);
            const doc = await t.get(ref);

            if (!doc.exists) {
                throw new BadRequestException('Week not found');
            }

            const week = doc.data() as Week;
            const match = week.matches.find(m => m.id === matchId);

            if (!match) {
                throw new BadRequestException('Match not found');
            }

            match.result = {
                homeScore,
                awayScore,
                outcome: homeScore > awayScore ? 'L' : awayScore > homeScore ? 'V' : 'E'
            };

            if (status) {
                match.status = status as any;
            } else {
                match.status = 'FINISHED';
            }

            t.set(ref, week);
            return week;
        });
    }

    async toggleVisibility(id: string, hide: boolean): Promise<Week> {
        return this.firebaseService.getDb().runTransaction(async (t) => {
            const ref = this.firebaseService.getDb().collection('weeks').doc(id);
            const doc = await t.get(ref);

            if (!doc.exists) throw new BadRequestException('Week not found');

            const week = doc.data() as Week;
            week.hideUnpaid = hide;

            t.set(ref, week);
            return week;
        });
    }

    async updateWeek(id: string, data: Partial<Week>): Promise<Week> {
        await this.firebaseService.getDb().collection('weeks').doc(id).set(data, { merge: true });
        return this.findOne(id);
    }
    async updateMatches(weekId: string, matches: { matchId: string; homeScore: number; awayScore: number; status?: string }[]): Promise<Week> {
        return this.firebaseService.getDb().runTransaction(async (t) => {
            const ref = this.firebaseService.getDb().collection('weeks').doc(weekId);
            const doc = await t.get(ref);

            if (!doc.exists) {
                throw new BadRequestException('Week not found');
            }

            const week = doc.data() as Week;

            matches.forEach(update => {
                const match = week.matches.find(m => m.id === update.matchId);
                if (match) {
                    match.result = {
                        homeScore: update.homeScore,
                        awayScore: update.awayScore,
                        outcome: update.homeScore > update.awayScore ? 'L' : update.awayScore > update.homeScore ? 'V' : 'E'
                    };

                    if (update.status) {
                        match.status = update.status as any;
                    } else {
                        match.status = 'FINISHED';
                    }
                }
            });

            t.set(ref, week);
            return week;
        });
    }

    async deleteWeek(id: string): Promise<{ success: boolean }> {
        await this.firebaseService.getDb().collection('weeks').doc(id).delete();
        return { success: true };
    }
}
