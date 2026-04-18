export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | 'POSTPONED';
export type MatchOutcome = 'L' | 'E' | 'V'; 
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
    homeLogo?: string; 
    awayLogo?: string;
    date: string; 
    timestamp: number; 
    status: MatchStatus;
    result?: MatchResult;
    homePosition?: number;
    awayPosition?: number;
}

export interface Week {
    id: string;
    name: string;
    status: 'OPEN' | 'CLOSED' | 'FINISHED';
    closeDate: number;
    matches: Match[];
    totalGoalsResult?: number;
    price?: number;
    adminFee?: number;
    hideUnpaid?: boolean;
    league?: string;
    createdAt: number;
}

export interface PickSelection {
    matchId: string;
    selection: MatchOutcome;
}

export interface ParticipantEntry {
    id: string;     
    weekId: string;
    participantName: string;
    participantNameNormalized?: string;
    totalGoalsPrediction: number;
    picks: PickSelection[];
    paymentStatus: PaymentStatus;
    userEmail?: string;
    phoneNumber?: string;

    score?: number; 
    hits?: string[]; 
    pointsDistance?: number; 
    submittedAt: number;
    hasAcceptedRules?: boolean;
    appVersion?: string;
}

export interface WeekDraft {
    rawText: string;
    parsedMatches: Omit<Match, 'id' | 'weekId' | 'status'>[];
}
