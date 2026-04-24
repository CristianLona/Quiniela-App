import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ScrapedMatch {
    matchId:   string;
    date:      string;          // ISO date string (e.g. "2026-04-25T03:00Z")
    homeTeam:  string;
    awayTeam:  string;
    homeScore: number | null;   // null = partido no jugado todavía
    awayScore: number | null;
    status:    'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
    league:    string;
}

interface CacheEntry {
    data:      ScrapedMatch[];
    expiresAt: number;
}

// ─── Configuración de ligas ───────────────────────────────────────────────────
//
// Usamos la API JSON de ESPN (site.api.espn.com), que es pública y estable.
// Cada liga se identifica con su slug ESPN en la URL del scoreboard.
//
// Para agregar nuevas ligas, basta con encontrar el slug correcto en:
//   https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/scoreboard
//

const LEAGUES: Record<string, { name: string; slug: string }> = {
    'liga-mx': {
        name: 'Liga MX',
        slug: 'mex.1',
    },
    'champions-league': {
        name: 'UEFA Champions League',
        slug: 'uefa.champions',
    },
    'premier-league': {
        name: 'Premier League',
        slug: 'eng.1',
    },
    'la-liga': {
        name: 'La Liga',
        slug: 'esp.1',
    },
    'serie-a': {
        name: 'Serie A',
        slug: 'ita.1',
    },
    'bundesliga': {
        name: 'Bundesliga',
        slug: 'ger.1',
    },
    'ligue-1': {
        name: 'Ligue 1',
        slug: 'fra.1',
    },
    'mls': {
        name: 'MLS',
        slug: 'usa.1',
    },
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);
    private readonly cache  = new Map<string, CacheEntry>();

    // ── Métodos públicos ──────────────────────────────────────────────────────

    /**
     * Retorna los partidos para una liga usando la API JSON de ESPN.
     * Incluye partidos recientes (con marcador) y próximos (programados).
     * Por defecto usa 'liga-mx'.
     */
    async scrapeMatches(leagueSlug: string = 'liga-mx'): Promise<ScrapedMatch[]> {
        // Revisar caché
        const cached = this.cache.get(leagueSlug);
        if (cached && Date.now() < cached.expiresAt) {
            this.logger.debug(`Cache HIT for ${leagueSlug} (expira en ${Math.round((cached.expiresAt - Date.now()) / 1000)}s)`);
            return cached.data;
        }

        const league = LEAGUES[leagueSlug] || LEAGUES['liga-mx'];
        const leagueName = league.name;

        try {
            this.logger.debug(`Cache MISS for ${leagueSlug} — consultando ESPN API...`);
            const matches = await this.fetchFromESPN(league.slug, leagueName);

            // Guardar en caché
            this.cache.set(leagueSlug, {
                data: matches,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });

            this.logger.debug(`ESPN API → ${matches.length} partidos para ${leagueSlug}, cacheados por 10 min`);
            return matches;

        } catch (error: any) {
            // Si hay caché expirado, mejor retornar datos viejos que fallar
            if (cached) {
                this.logger.warn(`Error consultando ESPN para ${leagueSlug}, devolviendo caché expirado: ${error.message}`);
                return cached.data;
            }
            this.logger.error(`Error obteniendo partidos de ESPN: ${error.message}`);
            throw error;
        }
    }

    // ── Lógica de consulta a ESPN API ─────────────────────────────────────────

    /**
     * Genera el rango de fechas para la consulta a ESPN:
     *   - 2 meses atrás (para obtener resultados recientes)
     *   - 6 meses adelante (para obtener próximos partidos)
     */
    private getDateRange(): string {
        const now = new Date();

        const past = new Date(now);
        past.setMonth(now.getMonth() - 2);

        const future = new Date(now);
        future.setMonth(now.getMonth() + 6);

        const fmt = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}${m}${day}`;
        };

        return `${fmt(past)}-${fmt(future)}`;
    }

    /**
     * Consulta la API de ESPN y transforma los eventos en ScrapedMatch[].
     *
     * Endpoint: GET {ESPN_BASE}/{slug}/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=1000
     *
     * Cada evento de ESPN tiene esta estructura (simplificada):
     *   event.id                                     → matchId
     *   event.date                                   → ISO date string
     *   event.status.type.name                       → "STATUS_SCHEDULED" | "STATUS_FULL_TIME" | ...
     *   event.competitions[0].competitors[]           → array con home y away
     *     .homeAway                                  → "home" | "away"
     *     .team.displayName                          → nombre del equipo
     *     .score                                     → marcador (string)
     */
    private async fetchFromESPN(slug: string, leagueName: string): Promise<ScrapedMatch[]> {
        const dateRange = this.getDateRange();
        const url = `${ESPN_BASE}/${slug}/scoreboard?dates=${dateRange}&limit=1000`;

        const { data } = await axios.get(url, {
            timeout: 20_000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            },
        });

        if (!data?.events) {
            this.logger.warn(`ESPN API no devolvió eventos para ${slug}`);
            return [];
        }

        const matches: ScrapedMatch[] = [];

        for (const event of data.events) {
            const comp = event.competitions?.[0];
            if (!comp?.competitors) continue;

            const homeObj = comp.competitors.find((c: any) => c.homeAway === 'home');
            const awayObj = comp.competitors.find((c: any) => c.homeAway === 'away');
            if (!homeObj || !awayObj) continue;

            // Determinar status
            const espnStatus: string = event.status?.type?.name || '';
            let status: ScrapedMatch['status'] = 'SCHEDULED';

            if (espnStatus.includes('FULL_TIME') || espnStatus.includes('FINAL')) {
                status = 'FINISHED';
            } else if (
                espnStatus.includes('IN_PROGRESS') ||
                espnStatus.includes('HALFTIME') ||
                espnStatus.includes('LIVE')
            ) {
                status = 'LIVE';
            } else if (espnStatus.includes('POSTPONED') || espnStatus.includes('CANCELED') || espnStatus.includes('SUSPENDED')) {
                status = 'POSTPONED';
            }

            // Parsear marcador — ESPN siempre retorna score como string
            const homeScoreRaw = parseInt(homeObj.score, 10);
            const awayScoreRaw = parseInt(awayObj.score, 10);

            // Solo asignar marcador si el partido ya se jugó o está en vivo
            const homeScore = (status === 'FINISHED' || status === 'LIVE') && !isNaN(homeScoreRaw) ? homeScoreRaw : null;
            const awayScore = (status === 'FINISHED' || status === 'LIVE') && !isNaN(awayScoreRaw) ? awayScoreRaw : null;

            matches.push({
                matchId:   event.id,
                date:      event.date,           // ISO string nativo de ESPN
                homeTeam:  homeObj.team?.displayName || 'TBD',
                awayTeam:  awayObj.team?.displayName || 'TBD',
                homeScore,
                awayScore,
                status,
                league:    leagueName,
            });
        }

        return matches;
    }
}
