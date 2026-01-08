import { useState, useMemo, useEffect } from 'react';
import type { Match, ParticipantEntry } from '../../types';
import { cn } from '../../lib/utils';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Scoreboard() {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekName, setWeekName] = useState('Cargando...');
    const [currentWeekData, setCurrentWeekData] = useState<any>(null);

    // Auto-Scale Logic
    const [scale, setScale] = useState(1);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [table, setTable] = useState<HTMLTableElement | null>(null);

    useEffect(() => {
        const handleResize = () => {
            if (container && table) {
                const containerWidth = container.clientWidth;
                const tableWidth = table.offsetWidth; // Use offsetWidth for actual rendered width

                if (tableWidth > 0) {
                    const newScale = containerWidth / tableWidth;
                    setScale(newScale);
                }
            };
        };

        // Initial calc
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [container, table]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const weeks = await api.weeks.getAll();
                const sortedWeeks = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const currentWeek = sortedWeeks[0];

                if (currentWeek) {
                    setWeekName(currentWeek.name);
                    setMatches(currentWeek.matches);
                    setCurrentWeekData(currentWeek);
                    const parts = await api.picks.getByWeek(currentWeek.id);
                    const scoredParticipants = parts.map(p => {
                        let score = 0;
                        const hits: string[] = [];
                        p.picks.forEach(pick => {
                            const match = currentWeek.matches.find(m => m.id === pick.matchId);
                            if (match && match.status === 'FINISHED' && match.result?.outcome === pick.selection) {
                                score++;
                                hits.push(match.id);
                            }
                        });
                        return { ...p, score, hits };
                    });
                    setParticipants(scoredParticipants);
                } else {
                    setWeekName('Sin Jornadas');
                }
            } catch (err) {
                console.error("Error loading scoreboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));
    }, [participants]);

    const totalGoals = matches.reduce((acc, m) => {
        if (m.status === 'FINISHED' && m.result) {
            return acc + m.result.homeScore + m.result.awayScore;
        }
        return acc;
    }, 0);

    const prizePot = useMemo(() => {
        if (!currentWeekData) return 0;
        const total = (participants.length * (currentWeekData.price || 50));
        const final = total - (currentWeekData.adminFee || 0);
        return final > 0 ? final : 0;
    }, [participants.length, currentWeekData]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-black text-pool-green">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center p-4 md:p-8 relative overflow-x-hidden font-sans">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3 fixed z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3 fixed z-0" />

            <div className="relative z-10 w-full flex flex-col items-center">

                {/* Top Navigation Bar */}
                <div className="w-full max-w-[1400px] mb-6 md:mb-8 flex items-center justify-between gap-4">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-neutral-200 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold text-neutral-200 hidden md:block">Inicio</span>
                    </button>
                    <h1 className="text-lg md:text-xl font-black text-white tracking-widest uppercase truncate">Resultados</h1>

                    <button onClick={() => navigate('/fill')} className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] rounded-xl hover:bg-[#16a34a] transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <span className="text-sm font-black text-[#020617] uppercase">Jugar</span>
                    </button>
                </div>

                {/* Dashboard Ribbon */}
                <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8 ">
                    {/* 1. Week Info */}
                    <div className="pool-card p-6 bg-linear-to-br from-zinc-900 to-black relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Jornada Actual</p>
                            <h2 className="text-2xl font-black text-white ">{weekName}</h2>
                            <div className="w-12 h-1 bg-[#22c55e] rounded-full mt-2"></div>
                        </div>
                    </div>

                    {/* 2. Prize Display */}
                    <div className="pool-card p-6 bg-linear-to-br from-zinc-900 to-black relative overflow-hidden flex flex-col justify-center ">
                        <div className="absolute inset-0 bg-[#22c55e]/5 group-hover:bg-[#22c55e]/10 transition-colors"></div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1 tracking-widest relative z-10">Premio a Repartir</p>
                        <div className="text-4xl md:text-5xl font-black text-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10">
                            ${prizePot.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase mt-2 relative z-10">
                            ({participants.length} Participantes)
                        </p>
                    </div>

                    {/* 3. Total Goals */}
                    <div className="pool-card p-4 md:p-6 bg-black/40 border border-zinc-800 flex items-center justify-between relative overflow-hidden backdrop-blur-sm bg-linear-to-br from-zinc-900 to-black">
                        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                        <div className="relative z-10">
                            <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Goles (Real)</p>
                            <div className="text-3xl font-black text-white">{totalGoals}</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-full">
                            <Trophy className="w-6 h-6 text-neutral-400" />
                        </div>
                    </div>
                </div>

                {/* Main Scoreboard Table - Full Width Auto-Scale */}
                <div className="w-full max-w-[1400px]">
                    <div className="pool-card bg-black/40 border border-zinc-800 backdrop-blur-sm overflow-hidden">
                        <div
                            ref={setContainer}
                            className="w-full overflow-hidden relative"
                            style={{ height: table ? (table.scrollHeight * scale) : 'auto' }}
                        >
                            <div
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                    width: 'fit-content'
                                }}
                            >
                                <table ref={setTable} className="w-max">
                                    <thead>
                                        <tr className="bg-[#151515]">
                                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-[#151515] z-10">Participante</th>
                                            {matches.map(m => (
                                                <th key={m.id} className="p-2 min-w-[60px] text-center align-bottom relative group">
                                                    <div className="absolute inset-x-0 bottom-0 top-0 bg-white/0 group-hover:bg-white/5 -z-10 transition-colors pointer-events-none" />

                                                    <div className="flex flex-col items-center justify-between h-64 pb-2 pt-2">
                                                        <div className="flex-1 flex items-center justify-center">
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap tracking-wider opacity-80 group-hover:opacity-100 transition-opacity" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                                {m.homeTeam} <span className="text-slate-600 mx-1 font-normal">vs</span> {m.awayTeam}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg text-xs flex items-center justify-center font-black shadow-md border-2 transition-transform group-hover:scale-110",
                                                                m.status === 'FINISHED' ? (
                                                                    m.result?.outcome === 'L' ? 'bg-white border-white text-black' :
                                                                        m.result?.outcome === 'E' ? 'bg-slate-700 border-slate-700 text-white' :
                                                                            'bg-[#22c55e] border-[#22c55e] text-black'
                                                                ) : 'bg-[#151515] border-white/10 text-slate-700'
                                                            )}>
                                                                {m.status === 'FINISHED' ? m.result?.outcome : '-'}
                                                            </div>

                                                            <div className="h-5 text-[10px] font-mono font-bold text-slate-400">
                                                                {m.status === 'FINISHED' && m.result
                                                                    ? `${m.result.homeScore}-${m.result.awayScore}`
                                                                    : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="p-4 text-center text-sm font-black text-[#22c55e] uppercase bg-[#151515]">PTS</th>
                                            <th className="p-4 text-center text-sm font-black text-slate-400 uppercase bg-[#151515]">GOL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedParticipants.map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 whitespace-nowrap sticky left-0 bg-[#0A0A0A] z-10 border-r border-white/5 group-hover:bg-[#111]">
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black",
                                                            idx === 0 ? "bg-[#fbbf24] text-black" :
                                                                idx === 1 ? "bg-slate-300 text-black" :
                                                                    idx === 2 ? "bg-amber-700 text-white" : "text-slate-600 bg-white/5"
                                                        )}>{idx + 1}</span>
                                                        <span className={cn("font-bold text-base", idx < 3 ? "text-white" : "text-slate-300")}>{p.participantName}</span>
                                                    </div>
                                                </td>
                                                {matches.map(m => {
                                                    const pick = p.picks.find(pick => pick.matchId === m.id);
                                                    const isHit = p.hits?.includes(m.id);
                                                    return (
                                                        <td key={m.id} className="p-2 text-center">
                                                            <div className={cn(
                                                                "w-8 h-8 mx-auto rounded-lg text-xs flex items-center justify-center font-bold transition-all border-2",
                                                                isHit
                                                                    ? "bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-110"
                                                                    : "text-slate-500 bg-white/5 border-transparent"
                                                            )}>
                                                                {pick?.selection || '-'}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                                <td className="p-4 text-center font-black text-xl text-white">{p.score}</td>
                                                <td className="p-4 text-center text-sm font-mono text-slate-400">{p.totalGoalsPrediction}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#151515]/50 border-t-2 border-white/10">
                                            <td className="p-4 text-right font-bold text-xs uppercase text-slate-500 sticky left-0 bg-[#0A0A0A]" colSpan={matches.length + 2}>
                                                Total Goles Real:
                                            </td>
                                            <td className="p-4 text-center font-black text-xl text-white bg-[#151515]">
                                                {totalGoals}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
