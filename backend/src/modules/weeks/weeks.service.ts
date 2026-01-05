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

    async createWeek(name: string, matchDrafts: any[], price: number = 50, adminFee: number = 0): Promise<Week> {
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

    async updateMatch(weekId: string, matchId: string, homeScore: number, awayScore: number): Promise<Week> {
        const week = await this.findOne(weekId);
        if (!week) throw new BadRequestException('Week not found');

        const match = week.matches.find(m => m.id === matchId);
        if (!match) throw new BadRequestException('Match not found');

        match.result = {
            homeScore,
            awayScore,
            outcome: homeScore > awayScore ? 'L' : awayScore > homeScore ? 'V' : 'E'
        };
        match.status = 'FINISHED';

        // Update the entire week document for simplicity (since matches are nested)
        await this.firebaseService.getDb().collection('weeks').doc(weekId).set(week);
        return week;
    }
}
