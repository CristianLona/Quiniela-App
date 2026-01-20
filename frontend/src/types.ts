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
    homePosition?: number;
    awayPosition?: number;
}

export interface Week {
    id: string; // e.g., "S24-W01"
    name: string; // "Jornada 1"
    status: 'OPEN' | 'CLOSED' | 'FINISHED';
    closeDate: number | string; // Timestamp of the first match start
    matches: Match[]; // Array of matches in this week
    totalGoalsResult?: number; // Sum of all goals (valid only when all matches finished)
    price?: number; // Cost to enter the pool
    adminFee?: number; // Amount subtracted from the total pot
    hideUnpaid?: boolean; // Toggle to hide unpaid participants
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

export interface WeekDraft {
    rawText: string;
    parsedMatches: Omit<Match, 'id' | 'weekId' | 'status'>[];
}
