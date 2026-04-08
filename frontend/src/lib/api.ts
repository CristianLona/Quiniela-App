import type { Week, WeekDraft, ParticipantEntry, PickSelection, MatchOutcome } from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : `http://${window.location.hostname}:3000/api`);
export const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : (import.meta.env.PROD ? '/' : `http://${window.location.hostname}:3000`);

import { auth } from './firebase';

// Legacy compatibility
export const setAuthToken = (token: string | null) => {
    if (token) localStorage.setItem('adminToken', token);
    else localStorage.removeItem('adminToken');
};

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
    };

    try {
        const firebaseToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const savedToken = localStorage.getItem('adminToken');
        const finalToken = firebaseToken || savedToken;

        if (finalToken) {
            headers['Authorization'] = `Bearer ${finalToken}`;
        }
    } catch (error) {
        console.error("Error getting Firebase token", error);
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `API Error: ${res.status}`);
    }

    return res.json();
}

export const api = {
    auth: {
        login: (password: string) => fetchJson<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
    },
    weeks: {
        parse: (text: string) =>
            fetchJson<WeekDraft>('/weeks/parse', { method: 'POST', body: JSON.stringify({ text }) }),

        create: (name: string, matches: any[], price: number = 50, adminFee: number = 0, league: string = 'liga-mx') =>
            fetchJson<Week>('/weeks', { method: 'POST', body: JSON.stringify({ name, matches, price, adminFee, league }) }),

        updateResult: (weekId: string, matchId: string, homeScore: number, awayScore: number, status?: string) =>
            fetchJson<MatchOutcome>(`/weeks/${weekId}/matches/${matchId}`, {
                method: 'PATCH', // Changed to PATCH as it's an update
                body: JSON.stringify({ homeScore, awayScore, status })
            }),

        updateMatches: (weekId: string, matches: { matchId: string; homeScore: number; awayScore: number; status?: string }[]) =>
            fetchJson<Week>(`/weeks/${weekId}/matches`, {
                method: 'PATCH',
                body: JSON.stringify({ matches })
            }),

        delete: (id: string) => fetchJson<{ success: boolean }>(`/weeks/${id}`, { method: 'DELETE' }),

        getAll: () => fetchJson<Week[]>(`/weeks?t=${Date.now()}`),

        getOne: (id: string) => fetchJson<Week>(`/weeks/${id}`),

        toggleVisibility: (id: string, hide: boolean) =>
            fetchJson<Week>(`/weeks/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ hide }) }),

        update: (id: string, data: { adminFee?: number; price?: number }) =>
            fetchJson<Week>(`/weeks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },

    picks: {
        submit: (data: { weekId: string; participantName: string; totalGoalsPrediction: number; picks: PickSelection[] }) =>
            fetchJson<ParticipantEntry>('/picks', { method: 'POST', body: JSON.stringify(data) }),

        adminSubmit: (data: { weekId: string; participantName: string; totalGoalsPrediction: number; picks: PickSelection[] }) =>
            fetchJson<ParticipantEntry>('/picks/admin', { method: 'POST', body: JSON.stringify(data) }),

        getByWeek: (weekId: string) => fetchJson<ParticipantEntry[]>(`/picks/week/${weekId}`),

        togglePayment: (id: string) => fetchJson<ParticipantEntry>(`/picks/${id}/payment`, { method: 'PATCH' }),

        update: (id: string, data: Partial<ParticipantEntry>) =>
            fetchJson<ParticipantEntry>(`/picks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

        delete: (id: string) =>
            fetchJson<{ success: boolean }>(`/picks/${id}`, { method: 'DELETE' }),
    },

    scraper: {
        getMatches: (league: string = 'liga-mx') =>
            fetchJson<any[]>(`/scraper/matches?league=${league}`),

        getResults: (league: string = 'liga-mx') =>
            fetchJson<any[]>(`/scraper/results?league=${league}`),

        getStandings: (league: string = 'liga-mx') =>
            fetchJson<any>(`/standings?league=${league}`),
    }
};
