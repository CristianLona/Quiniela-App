import React from 'react';
import type { Match, MatchOutcome } from '../types';
import { cn } from '../lib/utils';
import { getTeamLogo } from '../lib/teams';

interface MatchCardProps {
    match: Match;
    selection?: MatchOutcome;
    onSelect: (matchId: string, selection: MatchOutcome) => void;
    readOnly?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    selection,
    onSelect,
    readOnly = false
}) => {
    // Format date
    const dateObj = new Date(match.date);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const time = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

    const homeLogo = match.homeLogo || getTeamLogo(match.homeTeam);
    const awayLogo = match.awayLogo || getTeamLogo(match.awayTeam);

    return (
        <div className="rounded-2xl p-0 overflow-hidden group border border-neutral-800 hover:border-[#22c55e]/50 transition-all bg-black/40 backdrop-blur-md shadow-sm hover:shadow-[#22c55e]/10">
            <div className="flex">
                {/* Date Side-Strip */}
                <div className="w-6 md:w-8 bg-black/60 border-r border-white/5 flex flex-col items-center justify-center py-2 text-center shrink-0">
                    <span className="text-[8px] md:text-[10px] uppercase font-black text-neutral-500 vertical-rl -rotate-90 whitespace-nowrap">{dayName}</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-neutral-400 mt-2">{time}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 flex items-center gap-1 md:gap-2 relative">

                    {/* VS Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden bg-black/60">
                        <span className="text-[100px] font-black text-white/5 italic -rotate-12 translate-y-4">VS</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-1/4 relative z-10">
                        <div className="w-14 h-14 md:w-20 md:h-20 drop-shadow-2xl transition-transform hover:scale-110 duration-200 relative">
                            {match.homePosition && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-black font-black text-xs rounded-full flex items-center justify-center border-2 border-zinc-900 z-20 shadow-lg">
                                    {match.homePosition}
                                </div>
                            )}
                            {homeLogo ? (
                                <img
                                    src={homeLogo}
                                    className="w-full h-full object-contain"
                                    alt={match.homeTeam}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById(`fallback-home-${match.id}`);
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                id={`fallback-home-${match.id}`}
                                className="text-xs font-bold text-neutral-500 w-full h-full flex items-center justify-center bg-neutral-900 rounded-full border border-white/5"
                                style={{ display: homeLogo ? 'none' : 'flex' }}
                            >
                                {match.homeTeam.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-neutral-200 text-center uppercase leading-tight">{match.homeTeam}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-neutral-500/50"></div>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">VS</span>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-neutral-500/50"></div>
                        </div>

                        {/* Selection Cloud */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {(['L', 'E', 'V'] as MatchOutcome[]).map((outcome) => (
                                <button
                                    key={outcome}
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => onSelect(match.id, outcome)}
                                    className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-sm md:text-base flex items-center justify-center transition-all duration-200 border-2 relative overflow-hidden",
                                        selection === outcome
                                            ? "bg-[#22c55e] text-black border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-110 z-10"
                                            : "bg-black/50 text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 hover:bg-neutral-900 hover:scale-105"
                                    )}
                                >
                                    <span className="relative z-10">{outcome}</span>
                                    {selection === outcome && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-1/4 relative z-10">
                        <div className="w-14 h-14 md:w-20 md:h-20 drop-shadow-2xl transition-transform hover:scale-110 duration-200 relative">
                            {match.awayPosition && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-black font-black text-xs rounded-full flex items-center justify-center border-2 border-zinc-900 z-20 shadow-lg">
                                    {match.awayPosition}
                                </div>
                            )}
                            {awayLogo ? (
                                <img
                                    src={awayLogo}
                                    className="w-full h-full object-contain"
                                    alt={match.awayTeam}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById(`fallback-away-${match.id}`);
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                id={`fallback-away-${match.id}`}
                                className="text-xs font-bold text-neutral-500 w-full h-full flex items-center justify-center bg-neutral-900 rounded-full border border-white/5"
                                style={{ display: awayLogo ? 'none' : 'flex' }}
                            >
                                {match.awayTeam.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-neutral-200 text-center uppercase leading-tight">{match.awayTeam}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};
