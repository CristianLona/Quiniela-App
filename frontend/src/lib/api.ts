import type { Week, WeekDraft, ParticipantEntry, PickSelection, MatchOutcome } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `API Error: ${res.status}`);
    }

    return res.json();
}

export const api = {
    weeks: {
        parse: (text: string) =>
            fetchJson<WeekDraft>('/weeks/parse', { method: 'POST', body: JSON.stringify({ text }) }),

        create: (name: string, matches: any[], price: number = 50, adminFee: number = 0) =>
            fetchJson<Week>('/weeks', { method: 'POST', body: JSON.stringify({ name, matches, price, adminFee }) }),

        updateResult: (weekId: string, matchId: string, homeScore: number, awayScore: number) =>
            fetchJson<MatchOutcome>(`/weeks/${weekId}/matches/${matchId}`, {
                method: 'PATCH', // Changed to PATCH as it's an update
                body: JSON.stringify({ homeScore, awayScore })
            }),

        getAll: () => fetchJson<Week[]>('/weeks'),

        getOne: (id: string) => fetchJson<Week>(`/weeks/${id}`),

        toggleVisibility: (id: string, hide: boolean) =>
            fetchJson<Week>(`/weeks/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ hide }) }),
    },

    picks: {
        submit: (data: { weekId: string; participantName: string; totalGoalsPrediction: number; picks: PickSelection[] }) =>
            fetchJson<ParticipantEntry>('/picks', { method: 'POST', body: JSON.stringify(data) }),

        getByWeek: (weekId: string) => fetchJson<ParticipantEntry[]>(`/picks/week/${weekId}`),

        togglePayment: (id: string) => fetchJson<ParticipantEntry>(`/picks/${id}/payment`, { method: 'PATCH' }),
    }
};
