import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

const LEAGUE_MAPPINGS: Record<string, { name: string; logo: string; url: string }> = {
    'liga-mx': {
        name: 'Liga MX',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Liga_MX.svg/1200px-Liga_MX.svg.png',
        url: 'https://www.espn.com.mx/futbol/posiciones/_/liga/mex.1'
    },
    'champions-league': {
        name: 'Champions League',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/200px-UEFA_Champions_League_logo_2.svg.png',
        url: 'https://www.espn.com.mx/futbol/posiciones/_/liga/uefa.champions'
    },
    'premier-league': {
        name: 'Premier League',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png',
        url: 'https://www.espn.com.mx/futbol/posiciones/_/liga/eng.1'
    }
};

@Injectable()
export class StandingsService {
    private readonly logger = new Logger(StandingsService.name);
    private cachedStandings: Record<string, { data: any, time: number }> = {};
    private readonly CACHE_TTL_MS = 12 * 60 * 60 * 1000; //12 horas

    async getStandingsFromESPN(leagueSlug: string = 'liga-mx'): Promise<{ name: string; logo: string; standings: ScrapedStanding[][] }> {
        const now = Date.now();
        const cacheEntry = this.cachedStandings[leagueSlug];

        if (cacheEntry && (now - cacheEntry.time < this.CACHE_TTL_MS)) {
            return cacheEntry.data;
        }

        const leagueConfig = LEAGUE_MAPPINGS[leagueSlug] || LEAGUE_MAPPINGS['liga-mx'];

        try {
            const { data } = await axios.get(leagueConfig.url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });

            const $ = cheerio.load(data);
            const standings: ScrapedStanding[] = [];

            const teamRows = $('.Table__TBODY').eq(0).find('tr');
            const statsRows = $('.Table__TBODY').eq(1).find('tr');

            teamRows.each((index, element) => {
                const teamEl = $(element).find('.hide-mobile');
                const name =
                    teamEl.text().trim() ||
                    $(element).find('.show-mobile').text().trim();
                const rankStr = $(element)
                    .find('.team-position')
                    .text()
                    .trim();
                let rank = index + 1; // Default
                if (rankStr) {
                    const parsed = parseInt(rankStr, 10);
                    if (!isNaN(parsed)) rank = parsed;
                }

                const link = $(element).find('a').attr('href') || '';
                const idMatch = link.match(/\/id\/(\d+)\//);
                const teamId = idMatch ? parseInt(idMatch[1], 10) : index + 1;

                const logo = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/${teamId}.png`;

                const stats = $(statsRows[index]).find('td');
                const played = parseInt($(stats[0]).text().trim(), 10) || 0;
                const win = parseInt($(stats[1]).text().trim(), 10) || 0;
                const draw = parseInt($(stats[2]).text().trim(), 10) || 0;
                const lose = parseInt($(stats[3]).text().trim(), 10) || 0;
                const goalsFor = parseInt($(stats[4]).text().trim(), 10) || 0;
                const goalsAgainst =
                    parseInt($(stats[5]).text().trim(), 10) || 0;
                const goalsDiff = parseInt($(stats[6]).text().trim(), 10) || 0;
                const points = parseInt($(stats[7]).text().trim(), 10) || 0;

                standings.push({
                    rank,
                    team: {
                        id: teamId,
                        name,
                        logo,
                    },
                    points,
                    goalsDiff,
                    all: {
                        played,
                        win,
                        draw,
                        lose,
                        goals: {
                            for: goalsFor,
                            against: goalsAgainst,
                        },
                    },
                    update: new Date().toISOString(),
                });
            });

            const result = {
                name: leagueConfig.name,
                logo: leagueConfig.logo,
                standings: [standings]
            };

            this.cachedStandings[leagueSlug] = { data: result, time: now };
            return result;
        } catch (error) {
            this.logger.error('Failed to scrape ESPN standings', error);
            throw new Error('Could not parse standings');
        }
    }
}
