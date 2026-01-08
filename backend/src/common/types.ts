export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | 'POSTPONED';
export type MatchOutcome = 'L' | 'E' | 'V'; // Local, Empate, Visita
export type PaymentStatus = 'PENDING' | 'PAID';

export interface MatchResult {
    homeScore: number;
    awayScore: number;
    outcome: MatchOutcome;
}

export interface Match {
    id: string;
    weekId: string;
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string; // URL or placeholder mapping key
    awayLogo?: string;
    date: string; // ISO String for storage
    timestamp: number; // Unix timestamp for efficient sorting/filtering
    status: MatchStatus;
    result?: MatchResult;
}

export interface Week {
    id: string; // e.g., "S24-W01"
    name: string; // "Jornada 1"
    status: 'OPEN' | 'CLOSED' | 'FINISHED';
    closeDate: number; // Timestamp of the first match start
    matches: Match[]; // Array of matches in this week
    totalGoalsResult?: number; // Sum of all goals (valid only when all matches finished)
    price?: number;
    adminFee?: number;
    hideUnpaid?: boolean; // Toggle to hide unpaid participants from public
    createdAt: number;
}

export interface PickSelection {
    matchId: string;
    selection: MatchOutcome;
}

export interface ParticipantEntry {
    id: string; // Auto-generated UUID
    weekId: string;
    participantName: string; // "Carlos Lona"
    totalGoalsPrediction: number; // Tiebreaker input by user
    picks: PickSelection[];
    paymentStatus: PaymentStatus;

    // Computed fields (for Leaderboard performance)
    score?: number; // Number of correct picks
    hits?: string[]; // IDs of matches guessed correctly
    pointsDistance?: number; // Abs(totalGoalsPrediction - Week.totalGoalsResult) for tiebreak
    submittedAt: number;
}

// Helper types for Admin UI
export interface WeekDraft {
    rawText: string;
    parsedMatches: Omit<Match, 'id' | 'weekId' | 'status'>[];
}
