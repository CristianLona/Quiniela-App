import { Match, MatchOutcome, ParticipantEntry } from '../types';

export function calculateMatchOutcome(homeScore: number, awayScore: number): MatchOutcome {
    if (homeScore > awayScore) return 'L';
    if (awayScore > homeScore) return 'V';
    return 'E';
}

export function scoreParticipant(
    participant: ParticipantEntry,
    matches: Match[]
): ParticipantEntry {
    let score = 0;
    const hits: string[] = [];

    participant.picks.forEach(p => {
        const match = matches.find(m => m.id === p.matchId);
        if (match && match.status === 'FINISHED' && match.result) {
            if (p.selection === match.result.outcome) {
                score++;
                hits.push(match.id);
            }
        }
    });

    return {
        ...participant,
        score,
        hits,
    };
}

export function sortLeaderboard(
    participants: ParticipantEntry[],
    weekTotalGoals: number
): ParticipantEntry[] {
    return [...participants].sort((a, b) => {
        // 1. Primary: Score (Descending)
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        // 2. Secondary: Total Goals Difference (Ascending)
        const diffA = Math.abs((a.totalGoalsPrediction || 0) - weekTotalGoals);
        const diffB = Math.abs((b.totalGoalsPrediction || 0) - weekTotalGoals);

        return diffA - diffB;
    });
}
