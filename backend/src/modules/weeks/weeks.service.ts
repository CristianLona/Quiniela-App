import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Week, WeekDraft } from '../../common/types';
import { parseLineToMatchDraft } from '../../common/utils/parser';
import * as crypto from 'crypto';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { EventsGateway } from '../../events/events.gateway';
import { UsersService } from '../users/users.service';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

@Injectable()
export class WeeksService {
    private readonly logger = new Logger(WeeksService.name);
    private weeksCache: CacheEntry<Week[]> | null = null;

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly eventsGateway: EventsGateway,
        private readonly usersService: UsersService
    ) { }

    private invalidateCache() {
        this.weeksCache = null;
    }

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
        this.invalidateCache();
        
        // Broadcast push notification to everyone in the background
        this.usersService.broadcastNotification(
            '¡Nueva Jornada Abierta!',
            `Se ha abierto la quiniela para ${name}. ¡Llena tus pronósticos antes del cierre!`,
            { url: '/fill' }
        ).catch(e => this.logger.error("Error sending push notifications", e));

        return newWeek;
    }

    async findAll(limit?: number, offset?: number): Promise<Week[]> {
        // Revisar caché
        if (this.weeksCache && Date.now() < this.weeksCache.expiresAt) {
            this.logger.debug('Weeks cache HIT');
            const allWeeks = this.weeksCache.data;
            if (limit !== undefined && offset !== undefined) {
                return allWeeks.slice(offset, offset + limit);
            }
            return allWeeks;
        }

        this.logger.debug('Weeks cache MISS — fetching from Firestore');
        const snapshot = await this.firebaseService.getDb()
            .collection('weeks')
            .get();

        const allWeeks = snapshot.docs
            .map(doc => doc.data() as Week)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Guardar en caché
        this.weeksCache = {
            data: allWeeks,
            expiresAt: Date.now() + CACHE_TTL_MS,
        };

        if (limit !== undefined && offset !== undefined) {
            return allWeeks.slice(offset, offset + limit);
        }
        return allWeeks;
    }

    async findOne(id: string): Promise<Week | undefined> {
        const doc = await this.firebaseService.getDb().collection('weeks').doc(id).get();
        return doc.exists ? (doc.data() as Week) : undefined;
    }

    async updateMatch(weekId: string, matchId: string, homeScore: number, awayScore: number, status?: string): Promise<Week> {
        const result = await this.firebaseService.getDb().runTransaction(async (t) => {
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

            // Emit WS event
            this.eventsGateway.emitMatchUpdate(weekId, matchId, match);

            return week;
        });

        this.invalidateCache();
        return result;
    }

    async toggleVisibility(id: string, hide: boolean): Promise<Week> {
        const result = await this.firebaseService.getDb().runTransaction(async (t) => {
            const ref = this.firebaseService.getDb().collection('weeks').doc(id);
            const doc = await t.get(ref);

            if (!doc.exists) throw new BadRequestException('Week not found');

            const week = doc.data() as Week;
            week.hideUnpaid = hide;

            t.set(ref, week);
            return week;
        });

        this.invalidateCache();
        return result;
    }

    async updateWeek(id: string, data: Partial<Week>): Promise<Week> {
        await this.firebaseService.getDb().collection('weeks').doc(id).set(data, { merge: true });
        this.invalidateCache();
        return this.findOne(id);
    }

    async updateMatches(weekId: string, matches: { matchId: string; homeScore: number; awayScore: number; status?: string }[]): Promise<Week> {
        const result = await this.firebaseService.getDb().runTransaction(async (t) => {
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

            // Emit WS events for all updated matches
            matches.forEach(update => {
                const match = week.matches.find(m => m.id === update.matchId);
                if (match) {
                    this.eventsGateway.emitMatchUpdate(weekId, match.id, match);
                }
            });

            return week;
        });

        this.invalidateCache();

        const finishedCount = result.matches.filter(m => m.status === 'FINISHED').length;
        const totalCount = result.matches.length;

        this.usersService.broadcastNotification(
            '¡Resultados Actualizados!',
            `Se actualizaron los marcadores de ${result.name} (${finishedCount}/${totalCount} partidos finalizados). ¡Revisa la tabla!`,
            { url: '/scoreboard' }
        ).catch(e => this.logger.error("Error sending results push notification", e));

        return result;
    }

    async deleteWeek(id: string): Promise<{ success: boolean }> {
        await this.firebaseService.getDb().collection('weeks').doc(id).delete();
        this.invalidateCache();
        return { success: true };
    }
}

