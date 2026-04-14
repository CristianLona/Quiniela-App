import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: 'TBD' | 'LIVE' | 'FINISHED'; 
}

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const LEAGUE_URLS: Record<string, string> = {
    'liga-mx': 'https://www.espn.com.mx/futbol/calendario/_/liga/mex.1',
    'champions-league': 'https://www.espn.com.mx/futbol/calendario/_/liga/uefa.champions',
    'premier-league': 'https://www.espn.com.mx/futbol/calendario/_/liga/eng.1'
};

const CACHE_TTL_MS = 10 * 60 * 1000; 

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);
    private readonly cache = new Map<string, CacheEntry<ScrapedMatch[]>>();

    private readonly HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    /**
     * Extrae los partidos de la semana actual listados en la página de calendarios/resultados
     * Resultados cacheados por 10 minutos por liga.
     */
    async scrapeMatches(leagueSlug: string): Promise<ScrapedMatch[]> {
        // Revisar caché
        const cached = this.cache.get(leagueSlug);
        if (cached && Date.now() < cached.expiresAt) {
            this.logger.debug(`Cache HIT for ${leagueSlug} (expira en ${Math.round((cached.expiresAt - Date.now()) / 1000)}s)`);
            return cached.data;
        }

        const url = LEAGUE_URLS[leagueSlug] || LEAGUE_URLS['liga-mx'];

        try {
            this.logger.debug(`Cache MISS for ${leagueSlug} — scraping ESPN...`);
            const { data } = await axios.get(url, { headers: this.HEADERS, timeout: 15000 });
            const $ = cheerio.load(data);
            const matches: ScrapedMatch[] = [];

            $('.ResponsiveTable').each((i, tableNode) => {
                const dateStr = $(tableNode).find('.Table__Title').text().trim();

                $(tableNode).find('tbody tr').each((j, row) => {
                    const tds = $(row).find('td');
                    if (tds.length < 3) return;

                    let homeTeam = '', awayTeam = '', resultOrTime = '';

                    const homeNode1 = $(row).find('.home');
                    const awayNode1 = $(row).find('.away');
                    const localNode = $(row).find('.local');

                    if (localNode.length > 0) {
                        homeTeam = $(tds[0]).find('.Table__Team, a.team-name span').last().text().trim() || $(tds[0]).text().trim();
                        awayTeam = localNode.find('.Table__Team, a.team-name span').last().text().trim() || localNode.text().replace(/[0-9\-:v\sF]/g, '').trim();

                        const scoreText = localNode.find('a.at').text().trim();
                        if (scoreText.includes('-')) {
                            resultOrTime = scoreText;
                        } else {
                            resultOrTime = $(tds[2]).text().trim();
                        }
                    } else if (homeNode1.length && awayNode1.length) {
                        homeTeam = homeNode1.find('a.team-name span').first().text().trim() || homeNode1.text().trim();
                        awayTeam = awayNode1.find('a.team-name span').first().text().trim() || awayNode1.text().trim();
                        resultOrTime = $(row).find('.result, .time').text().trim();
                    } else {
                        homeTeam = $(tds[0]).find('.hide-mobile').first().text().trim() || $(tds[0]).text().trim();
                        awayTeam = $(tds[1]).find('.hide-mobile').first().text().trim() || $(tds[1]).text().trim();
                        resultOrTime = $(tds[2]).text().trim();
                    }

                    awayTeam = awayTeam.replace(/^v\s*/i, '').trim();

                    if (!homeTeam || !awayTeam) return;

                    let homeScore: number | undefined;
                    let awayScore: number | undefined;
                    let status: 'TBD' | 'LIVE' | 'FINISHED' = 'TBD';
                    let matchTime = '';

                    if (resultOrTime.includes('-')) {
                        const match = resultOrTime.match(/(\d+)\s*-\s*(\d+)/);
                        if (match) {
                            homeScore = parseInt(match[1], 10);
                            awayScore = parseInt(match[2], 10);
                            status = 'FINISHED';
                        }
                    } else if (resultOrTime.includes(':')) {
                        matchTime = resultOrTime;
                    }

                    matches.push({
                        date: matchTime ? `${dateStr} ${matchTime}` : dateStr,
                        homeTeam,
                        awayTeam,
                        homeScore,
                        awayScore,
                        status
                    });
                });
            });

            // Guardar en caché
            this.cache.set(leagueSlug, {
                data: matches,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });

            this.logger.debug(`Scraped ${matches.length} matches for ${leagueSlug}, cached for 10 min`);
            return matches;

        } catch (error) {
            // Si hay caché expirado, mejor retornar datos viejos que fallar
            if (cached) {
                this.logger.warn(`Error scraping ${leagueSlug}, returning stale cache: ${error.message}`);
                return cached.data;
            }
            this.logger.error(`Error scraping matches: ${error.message}`);
            throw error;
        }
    }
}

