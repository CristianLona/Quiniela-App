import { useState, useEffect } from "react";
import type { Match, MatchOutcome } from "../../types";
import { MatchCard } from "../../components/MatchCard";
import { Trophy, Clock, Loader2, User, Target, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function FillQuiniela() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [goals, setGoals] = useState<string>("");
    const [picks, setPicks] = useState<Record<string, MatchOutcome>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [matches, setMatches] = useState<Match[]>([]);
    const [weekID, setWeekID] = useState<string | null>(null);
    const [weekName, setWeekName] = useState("");

    useEffect(() => {
        api.weeks.getAll()
            .then(weeks => {
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];

                if (active) {
                    setWeekID(active.id);
                    setWeekName(active.name);
                    setMatches(active.matches);
                }
            })
            .catch(err => console.error("Failed to load weeks", err))
            .finally(() => setFetching(false));
    }, []);

    const handleSelect = (matchId: string, selection: MatchOutcome) => {
        setPicks(prev => ({ ...prev, [matchId]: selection }));
    };

    const isComplete =
        name.trim().length > 0 &&
        goals !== "" &&
        matches.length > 0 &&
        matches.every(m => picks[m.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete || !weekID) return;

        setLoading(true);
        const picksArray = Object.entries(picks).map(([matchId, selection]) => ({ matchId, selection }));

        try {
            await api.picks.submit({
                weekId: weekID,
                participantName: name.trim(),
                totalGoalsPrediction: parseInt(goals),
                picks: picksArray
            });
            alert("¡Quiniela enviada con éxito! Mucha suerte 🍀");
            setName("");
            setGoals("");
            setPicks({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: unknown) {
            alert("Error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-pool-green" />
        </div>
    );

    if (!weekID || matches.length === 0) return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Trophy className="w-12 h-12 text-slate-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-wider">Sin Quinielas Activas</h2>
            <p className="text-slate-400 font-medium mb-8 max-w-sm">
                No hay partidos disponibles para jugar en este momento. Revisa más tarde o consulta los resultados anteriores.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver al Inicio
                </button>
                <button
                    onClick={() => navigate('/scoreboard')}
                    className="w-full py-4 bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    Ver Resultados
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans pb-20 md:pb-0">

            {/* Header / Hero Section */}
            <div className="px-4 py-6 md:px-8 md:py-8">
                {/* Nav & Title */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm border border-white/5">
                        <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold text-white hidden md:block">Inicio</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">
                            Pro<span className="text-[#22c55e]">Quiniela</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{weekName}</p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Trophy className="w-6 h-6 text-black fill-current" />
                    </div>
                </div>

                {/* Progress Card */}
                <div className="pool-card p-4 flex items-center justify-between mb-4 bg-[#1A1A1A] border-none shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Clock className="w-5 h-5 text-[#fbbf24]" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Progreso</p>
                            <p className="text-white font-bold">{Object.keys(picks).length} de {matches.length} partidos</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 relative flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                className="text-[#22c55e] transition-all duration-500"
                                strokeDasharray={`${((Object.keys(picks).length / matches.length) * 126)} 126`}
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Overlapping the Header */}
            <form onSubmit={handleSubmit} className="flex-1 bg-[#0a0a0a] rounded-t-4xl p-6 -mt-8 relative z-10 border-t border-white/10 shadow-2xl space-y-8">

                {/* Section: Player Info */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                        <User className="w-4 h-4" /> Tus Datos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="pool-card p-4 focus-within:border-[#22c55e] transition-colors">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nombre de Participante</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Tu Nombre"
                                className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-slate-700"
                            />
                        </div>
                        <div className="pool-card p-4 focus-within:border-[#22c55e] transition-colors">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-2">
                                Goles Totales <span className="text-[#fbbf24] text-[8px] bg-[#fbbf24]/10 px-1 rounded">DESEMPATE</span>
                            </label>
                            <input
                                type="number"
                                value={goals}
                                onChange={e => setGoals(e.target.value)}
                                placeholder="0"
                                className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Matches */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Partidos
                    </h2>
                    <div className="space-y-4">
                        {matches.map((match, idx) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                selection={picks[match.id]}
                                onSelect={handleSelect}
                            />
                        ))}
                    </div>
                </div>

                {/* Submit Area */}
                <div className="pt-8 pb-safe">
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete || loading}
                        className={cn(
                            "w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed",
                            isComplete
                                ? "bg-[#22c55e] text-black shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)]"
                                : "bg-slate-800 text-slate-500"
                        )}
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                Enviar Quiniela
                                <div className="bg-black/10 p-1 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

