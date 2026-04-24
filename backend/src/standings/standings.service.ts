import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ScrapedStanding {
    rank: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    points: number;
    goalsDiff: number;
    all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
    update: string;
}

// ─── Configuración de ligas ───────────────────────────────────────────────────
//
// Usamos la API JSON de ESPN (site.api.espn.com) para las posiciones.
// Endpoint: https://site.api.espn.com/apis/v2/sports/soccer/{slug}/standings
//

const LEAGUE_MAPPINGS: Record<string, { name: string; logo: string; slug: string }> = {
    'liga-mx': {
        name: 'Liga MX',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Liga_MX.svg/1200px-Liga_MX.svg.png',
        slug: 'mex.1',
    },
    'champions-league': {
        name: 'Champions League',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/200px-UEFA_Champions_League_logo_2.svg.png',
        slug: 'uefa.champions',
    },
    'premier-league': {
        name: 'Premier League',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png',
        slug: 'eng.1',
    },
};

const ESPN_STANDINGS_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer';

@Injectable()
export class StandingsService {
    private readonly logger = new Logger(StandingsService.name);
    private cachedStandings: Record<string, { data: any, time: number }> = {};
    private readonly CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

    async getStandingsFromESPN(leagueSlug: string = 'liga-mx'): Promise<{ name: string; logo: string; standings: ScrapedStanding[][] }> {
        const now = Date.now();
        const cacheEntry = this.cachedStandings[leagueSlug];

        if (cacheEntry && (now - cacheEntry.time < this.CACHE_TTL_MS)) {
            return cacheEntry.data;
        }

        const leagueConfig = LEAGUE_MAPPINGS[leagueSlug] || LEAGUE_MAPPINGS['liga-mx'];

        try {
            const url = `${ESPN_STANDINGS_BASE}/${leagueConfig.slug}/standings`;
            this.logger.debug(`Fetching standings from ESPN API: ${url}`);

            const { data } = await axios.get(url, {
                timeout: 20_000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
            });

            const standings: ScrapedStanding[] = [];

            // La API devuelve: data.children[0].standings.entries[]
            // Cada entry tiene: team, stats[]
            if (data?.children?.[0]?.standings?.entries) {
                const entries = data.children[0].standings.entries;

                for (const entry of entries) {
                    const t = entry.team;
                    const stats: any[] = entry.stats || [];

                    const getStat = (name: string): number => {
                        const s = stats.find((x: any) => x.name === name);
                        return s ? s.value : 0;
                    };

                    const teamId = parseInt(t.id, 10) || 0;
                    const logo = t.logos?.[0]?.href
                        || `https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/${teamId}.png`;

                    standings.push({
                        rank: getStat('rank') || 0,
                        team: {
                            id: teamId,
                            name: t.displayName || t.name,
                            logo,
                        },
                        points: getStat('points'),
                        goalsDiff: getStat('pointDifferential'),
                        all: {
                            played: getStat('gamesPlayed'),
                            win: getStat('wins'),
                            draw: getStat('ties'),
                            lose: getStat('losses'),
                            goals: {
                                for: getStat('pointsFor'),
                                against: getStat('pointsAgainst'),
                            },
                        },
                        update: new Date().toISOString(),
                    });
                }
            }

            // Ordenar por rank (por si la API no los devuelve ordenados)
            standings.sort((a, b) => a.rank - b.rank);

            const result = {
                name: leagueConfig.name,
                logo: leagueConfig.logo,
                standings: [standings],
            };

            this.cachedStandings[leagueSlug] = { data: result, time: now };
            this.logger.debug(`ESPN Standings API → ${standings.length} equipos para ${leagueSlug}`);
            return result;

        } catch (error: any) {
            this.logger.error(`Failed to fetch ESPN standings: ${error.message}`);
            // Devolver caché expirado si existe
            if (cacheEntry) {
                this.logger.warn('Returning stale standings cache');
                return cacheEntry.data;
            }
            throw new Error('Could not fetch standings');
        }
    }
}
