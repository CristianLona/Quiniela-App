// Importamos el URL base del backend desde donde se encuentre (ej. api.ts)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

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

export interface StandingsResponse {
    league: {
        name: string;
        logo: string;
        standings: ScrapedStanding[][];
    };
}

export const apiScraper = {
    getStandings: async (league?: string): Promise<StandingsResponse> => {
        try {
            // Hacemos fetch a nuestro propio backend (NestJS / Firebase Functions)
            const url = league ? `${API_URL}/standings?league=${league}` : `${API_URL}/standings`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Local API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch standings from local backend:", error);
            throw error;
        }
    }
};
