import { useState, useMemo, useEffect } from 'react';
import type { Match, ParticipantEntry } from '../../types';
import { cn } from '../../lib/utils';
import { Trophy, Loader2, ArrowLeft, CheckCircle2, User, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api, SOCKET_URL } from '../../lib/api';
import { getShortName } from '../../lib/teams';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { exportScoreboardToExcel } from '../../lib/exportScoreboard';
import { useAuth } from '../../context/AuthContext';

export default function Scoreboard() {
    const navigate = useNavigate();
    const [rawParticipants, setRawParticipants] = useState<ParticipantEntry[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekName, setWeekName] = useState('Cargando...');
    const [currentWeekData, setCurrentWeekData] = useState<any>(null);
    const [exporting, setExporting] = useState(false);
    const { user } = useAuth();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = adminEmail && user?.email?.toLowerCase() === adminEmail.toLowerCase();

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

                    // Filter based on hideUnpaid setting
                    const visibleParts = currentWeek.hideUnpaid
                        ? parts.filter(p => p.paymentStatus === 'PAID')
                        : parts;

                    setRawParticipants(visibleParts);
                } else {
                    setWeekName('Sin Jornadas');
                }
            } catch (err) {
                console.error("Error loading scoreboard", err);
                toast.error("Error cargando la tabla de resultados");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Websocket Connection
    useEffect(() => {
        if (!currentWeekData) return;

        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to live scores socket');
        });

        socket.on('match_updated', (payload: any) => {
            if (payload.weekId === currentWeekData.id) {
                setMatches(prev => {
                    const idx = prev.findIndex(m => m.id === payload.matchId);
                    if (idx > -1) {
                        const newMatches = [...prev];
                        newMatches[idx] = { ...newMatches[idx], ...payload };
                        return newMatches;
                    }
                    return prev;
                });
                toast.success(`Marcador actualizado: ${getShortName(payload.homeTeam)} vs ${getShortName(payload.awayTeam)}`, { position: 'top-center' });
            }
        });

        return () => {
            socket.off('match_updated');
            socket.disconnect();
        };
    }, [currentWeekData]);

    const participants = useMemo(() => {
        return rawParticipants.map(p => {
            let score = 0;
            const hits: string[] = [];
            p.picks.forEach(pick => {
                const match = matches.find(m => m.id === pick.matchId);
                // Note: We use matches state which is updated by WS
                if (match && match.status === 'FINISHED' && match.result?.outcome === pick.selection) {
                    score++;
                    hits.push(match.id);
                }
            });
            return { ...p, score, hits };
        });
    }, [rawParticipants, matches]);

    const totalGoals = useMemo(() => {
        return matches.reduce((acc, m) => {
            if (m.status === 'FINISHED' && m.result) {
                return acc + m.result.homeScore + m.result.awayScore;
            }
            return acc;
        }, 0);
    }, [matches]);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            if ((b.score || 0) !== (a.score || 0)) {
                return (b.score || 0) - (a.score || 0);
            }
            const aGoalsDiff = Math.abs((a.totalGoalsPrediction || 0) - totalGoals);
            const bGoalsDiff = Math.abs((b.totalGoalsPrediction || 0) - totalGoals);
            return aGoalsDiff - bGoalsDiff;
        });
    }, [participants, totalGoals]);

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

                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button
                                onClick={async () => {
                                    setExporting(true);
                                    try {
                                        await exportScoreboardToExcel(
                                            participants,
                                            matches,
                                            weekName,
                                            totalGoals,
                                            prizePot,
                                        );
                                        toast.success('Excel descargado correctamente');
                                    } catch (err) {
                                        console.error('Export error:', err);
                                        toast.error('Error al exportar el archivo');
                                    } finally {
                                        setExporting(false);
                                    }
                                }}
                                disabled={exporting || sortedParticipants.length === 0}
                                className="group flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Exportar a Excel"
                            >
                                {exporting
                                    ? <Loader2 className="w-5 h-5 text-[#22c55e] animate-spin" />
                                    : <Download className="w-5 h-5 text-[#22c55e] group-hover:translate-y-0.5 transition-transform" />
                                }
                                <span className="text-sm font-bold text-neutral-200 hidden md:block">Excel</span>
                            </button>
                            )}
                            <button onClick={() => navigate('/fill')} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/20 rounded-xl transition-all active:scale-95">
                                <span className="text-sm font-black text-[#22c55e] uppercase">Jugar</span>
                            </button>
                    </div>
                </div>

                {/* Dashboard Ribbon */}
                <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* 1. Week Info */}
                    <div className="pool-card p-6 bg-linear-to-br from-zinc-900 to-black relative overflow-hidden flex flex-col justify-center shadow-lg border border-white/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Jornada Actual</p>
                            <h2 className="text-2xl font-black text-white ">{weekName}</h2>
                            <div className="w-12 h-1 bg-[#22c55e] rounded-full mt-2"></div>
                        </div>
                    </div>

                    {/* 2. Prize Display */}
                    <div className="pool-card p-6 bg-linear-to-br from-zinc-900 to-black relative overflow-hidden flex flex-col justify-center shadow-lg border border-white/5 group">
                        <div className="absolute inset-0 bg-[#22c55e]/5 group-hover:bg-[#22c55e]/10 transition-colors"></div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1 tracking-widest relative z-10">Premio a Repartir</p>
                        <div className="text-4xl md:text-5xl font-black text-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10 transition-transform group-hover:scale-105 duration-300 transform origin-left">
                            ${prizePot.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase mt-2 relative z-10 flex items-center gap-2">
                            <User className="w-3 h-3" /> {participants.length} Participantes
                        </p>
                    </div>

                    {/* 3. Total Goals */}
                    <div className="pool-card p-4 md:p-6 bg-black/40 border border-zinc-800 flex items-center justify-between relative overflow-hidden backdrop-blur-sm bg-linear-to-br from-zinc-900 to-black shadow-lg">
                        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                        <div className="relative z-10">
                            <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Total Goles (Real)</p>
                            <div className="text-3xl font-black text-white drop-shadow-md">{totalGoals}</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-full border border-white/5 shadow-inner">
                            <Trophy className="w-6 h-6 text-neutral-400" />
                        </div>
                    </div>
                </div>

                {/* Main Scoreboard Table - Full Width Auto-Scale */}
                <div className="w-full max-w-[1400px] animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
                    <div className="pool-card bg-[#18181b]/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
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
                                        <tr className="bg-[#09090b]">
                                            <th className="p-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider sticky left-0 bg-[#09090b] z-10">Participante</th>
                                            {matches.map(m => (
                                                <th key={m.id} className="p-2 min-w-[60px] text-center align-bottom relative group">
                                                    <div className="absolute inset-x-0 bottom-0 top-0 bg-white/0 group-hover:bg-white/5 -z-10 transition-colors pointer-events-none" />

                                                    <div className="flex flex-col items-center justify-between h-64 pb-2 pt-2">
                                                        <div className="flex-1 flex items-center justify-center">
                                                            <span className="text-[11px] font-bold text-zinc-400 uppercase whitespace-nowrap tracking-wider opacity-80 group-hover:opacity-100 transition-opacity" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                                {getShortName(m.homeTeam)} <span className="text-zinc-600 mx-1 font-normal">vs</span> {getShortName(m.awayTeam)}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg text-xs flex items-center justify-center font-black shadow-md border-2 transition-transform group-hover:scale-110",
                                                                m.status === 'FINISHED' ? (
                                                                    m.result?.outcome === 'L' ? 'bg-white border-white text-black' :
                                                                        m.result?.outcome === 'E' ? 'bg-zinc-700 border-zinc-700 text-white' :
                                                                            'bg-[#22c55e] border-[#22c55e] text-black'
                                                                ) : m.status === 'POSTPONED' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 line-through decoration-zinc-600'
                                                                : 'bg-[#09090b] border-white/10 text-zinc-700'
                                                            )}>
                                                                {m.status === 'FINISHED' ? m.result?.outcome : m.status === 'POSTPONED' ? 'S' : '-'}
                                                            </div>

                                                            <div className="h-5 text-[10px] font-mono font-bold text-zinc-400">
                                                                {m.status === 'FINISHED' && m.result
                                                                    ? `${m.result.homeScore}-${m.result.awayScore}`
                                                                    : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="p-4 text-center text-sm font-black text-[#22c55e] uppercase bg-[#09090b]">PTS</th>
                                            <th className="p-4 text-center text-sm font-black text-zinc-400 uppercase bg-[#09090b]">GOL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedParticipants.map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 whitespace-nowrap sticky left-0 bg-[#09090b] z-10 border-r border-white/5 group-hover:bg-[#111]">
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black",
                                                            idx === 0 ? "bg-[#fbbf24] text-black" :
                                                                idx === 1 ? "bg-slate-300 text-black" :
                                                                    idx === 2 ? "bg-amber-700 text-white" : "text-zinc-600 bg-white/5"
                                                        )}>{idx + 1}</span>
                                                        <span className={cn("font-bold text-base", idx < 3 ? "text-white" : "text-zinc-300")}>{p.participantName}</span>
                                                        {p.paymentStatus === 'PAID' && (
                                                            <div title="Pagado" className="bg-[#22c55e]/10 border border-[#22c55e]/20 p-0.5 rounded-full">
                                                                <CheckCircle2 className="w-3 h-3 text-[#22c55e]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {matches.map(m => {
                                                    const pick = p.picks.find(pick => pick.matchId === m.id);
                                                    const isHit = p.hits?.includes(m.id);
                                                    return (
                                                        <td key={m.id} className="p-2 text-center">
                                                            <div className={cn(
                                                                "w-8 h-8 mx-auto rounded-lg text-xs flex items-center justify-center font-bold transition-all border-2",
                                                                m.status === 'POSTPONED' ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 line-through decoration-zinc-700" :
                                                                isHit
                                                                    ? "bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-110"
                                                                    : "text-zinc-500 bg-white/5 border-transparent"
                                                            )}>
                                                                {pick?.selection || '-'}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                                <td className="p-4 text-center font-black text-xl text-white">{p.score}</td>
                                                <td className="p-4 text-center text-sm font-mono text-zinc-400">{p.totalGoalsPrediction}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#09090b]/50 border-t-2 border-white/10">
                                            <td className="p-4 text-right sticky left-0 bg-[#09090b]" colSpan={matches.length + 2}>
                                                <div className="flex flex-col items-end justify-center">
                                                    <span className="font-bold text-xs uppercase text-zinc-500">Total Goles Real:</span>
                                                    {matches.some(m => m.status === 'POSTPONED') && (
                                                        <span className="text-[9px] text-amber-500/80 font-medium normal-case mt-0.5">
                                                            *Excluye partidos suspendidos
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-black text-xl text-white bg-[#09090b] align-middle">
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
