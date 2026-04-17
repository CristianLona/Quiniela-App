import { useState, useEffect } from "react";
import type { Match, MatchOutcome } from "../../types";
import { MatchCard } from "../../components/MatchCard";
import { Trophy, Clock, Loader2, User, Target, ArrowLeft, CheckCircle2, Ticket, Timer, AlertTriangle, ShieldCheck, Calculator } from "lucide-react";
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { getShortName } from "../../lib/teams";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function FillQuiniela() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Extraemos solo el primer nombre
    const defaultName = user?.displayName ? user.displayName.split(' ')[0] : (user?.email?.split('@')[0] || "");
    const [name, setName] = useState(defaultName);
    const [goals, setGoals] = useState<string>("");
    const [picks, setPicks] = useState<Record<string, MatchOutcome>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Terms and Conditions State
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [acceptingTerms, setAcceptingTerms] = useState(false);

    const [matches, setMatches] = useState<Match[]>([]);
    const [weekID, setWeekID] = useState<string | null>(null);
    const [weekName, setWeekName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [closeDate, setCloseDate] = useState<number | string>(0);
    const [timeLeft, setTimeLeft] = useState("");
    const [teamsPositionsMap, setTeamsPositionsMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (user && !name) {
            const firstName = user.displayName ? user.displayName.split(' ')[0] : (user.email?.split('@')[0] || "");
            setName(firstName);
        }
    }, [user]);

    useEffect(() => {
        api.weeks.getAll()
            .then(weeks => {
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];

                if (active) {
                    setWeekID(active.id);
                    setWeekName(active.name);
                    setMatches(active.matches);
                    setPrice(active.price || 0);

                    // Use earliest match date
                    if (active.matches && active.matches.length > 0) {
                        const earliest = [...active.matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                        setCloseDate(earliest.date);
                    } else {
                        setCloseDate(active.closeDate || 0);
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load weeks", err);
                toast.error("Error cargando la jornada activa");
            });

        // Parallel fetch for User state
        api.users.getMe()
            .then(res => {
                if (res.success && res.user && res.user.hasAcceptedRules) {
                    setHasAcceptedTerms(true);
                }
            })
            .catch(err => console.error("Error fetching user profile for terms", err))
            .finally(() => setFetching(false));

        // Background fetch for standings
        const fetchPositions = async () => {
            try {
                console.log("[fetchPositions] Fetching positions for leagues...");
                const leagues = ['liga-mx', 'premier-league', 'champions-league'];
                const results = await Promise.all(
                    leagues.map(l => api.scraper.getStandings(l).catch((err) => {
                        console.error(`Error fetching ${l}:`, err);
                        return null;
                    }))
                );

                console.log("[fetchPositions] API Results:", JSON.parse(JSON.stringify(results)));

                const map: Record<string, number> = {};
                results.forEach((res: any) => {
                    if (res && res.league && res.league.standings && res.league.standings[0]) {
                        res.league.standings[0].forEach((teamBlock: any) => {
                            if (teamBlock.team && teamBlock.team.name) {
                                const short = getShortName(teamBlock.team.name);
                                map[short] = teamBlock.rank;
                                map[teamBlock.team.name] = teamBlock.rank;
                                map[teamBlock.team.name.toLowerCase()] = teamBlock.rank;
                            }
                        });
                    }
                });

                console.log("[fetchPositions] Final Teams Map:", map);
                setTeamsPositionsMap(map);
            } catch (err) {
                console.error("Failed to load standings for positions", err);
            }
        };
        fetchPositions();
    }, []);

    /* Countdown Logic */
    useEffect(() => {
        if (!closeDate) return;

        const targetTime = new Date(closeDate).getTime();
        console.log("Countdown Debug:", { closeDate, targetTime, now: Date.now() });

        const timer = setInterval(() => {
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                setTimeLeft("Cerrada");
                clearInterval(timer);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            const h = hours < 10 ? `0${hours}` : hours;
            const m = minutes < 10 ? `0${minutes}` : minutes;

            if (days > 0) {
                setTimeLeft(`${days}d ${h}h ${m}m`);
            } else {
                setTimeLeft(`${h}h ${m}m`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [closeDate]);

    const handleSelect = (matchId: string, selection: MatchOutcome) => {
        setPicks(prev => ({ ...prev, [matchId]: selection }));
    };

    const isComplete =
        name.trim().length > 0 &&
        goals !== "" &&
        matches.length > 0 &&
        matches.every(m => picks[m.id]);

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete || !weekID) return;

        if (!hasAcceptedTerms) {
            setShowTermsModal(true);
        } else {
            setShowConfirmModal(true);
        }
    };

    const handleAcceptTerms = async () => {
        if (!termsChecked) return;
        setAcceptingTerms(true);
        try {
            await api.users.acceptRules();
            setHasAcceptedTerms(true);
            setShowTermsModal(false);
            setTimeout(() => {
                setShowConfirmModal(true);
            }, 150);
        } catch (error) {
            toast.error("Error al registrar aceptación. Intenta de nuevo.");
            console.error("Terms error:", error);
        } finally {
            setAcceptingTerms(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!weekID) return;
        setLoading(true);
        const picksArray = Object.entries(picks).map(([matchId, selection]) => ({ matchId, selection }));

        try {
            await api.picks.submit({
                weekId: weekID,
                participantName: name.trim(),
                totalGoalsPrediction: parseInt(goals),
                picks: picksArray
            });

            toast.success("¡Quiniela enviada con éxito! Mucha suerte");
            setName("");
            setGoals("");
            setPicks({});
            setShowConfirmModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate('/scoreboard');
        } catch (err: unknown) {
            toast.error("Error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#09090b] text-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#22c55e]" />
        </div>
    );

    if (!weekID || matches.length === 0) return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 animate-pulse border border-zinc-800">
                    <Trophy className="w-10 h-10 text-zinc-600" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-wider">Sin Jornada Activa</h2>
                <p className="text-zinc-500 font-medium mb-8 max-w-sm">
                    No hay partidos disponibles para jugar en este momento.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-3 bg-[#22c55e] hover:bg-[#1faa50] text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#22c55e]/20"
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3 fixed z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3 fixed z-0" />

            {/* Header Sticky */}
            <div className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white hidden md:block">Inicio</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Pro<span className="text-[#22c55e]">Quiniela</span>
                        </h1>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{weekName}</p>
                    </div>

                    <button
                        onClick={() => navigate('/scoreboard')}
                        className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-[#22c55e]/50 transition-colors group"
                    >
                        <Trophy className="w-5 h-5 text-zinc-500 group-hover:text-[#22c55e] transition-colors" />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 relative z-10 pb-32">

                {/* Intro & Stats (Price/Time) */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Price Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Ticket className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Costo</span>
                        </div>
                        <div className="font-black text-2xl text-white">
                            ${price}
                        </div>
                    </div>

                    {/* Timer Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Timer className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Cierra en</span>
                        </div>
                        <div className="font-black text-xl md:text-2xl text-[#22c55e] font-mono">
                            {timeLeft || "Calculando..."}
                        </div>
                    </div>
                </div>

                {/* Intro Text */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">
                        Arma tu <span className="text-[#22c55e]">Jugada</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">Completa todos los pronósticos para participar.</p>
                </div>

                {/* Progress Bar (Sticky under header approx) */}
                {timeLeft !== 'Cerrada' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 bg-[#22c55e] transition-all duration-500" style={{ width: `${(Object.keys(picks).length / matches.length) * 100}%` }}></div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800 rounded-lg">
                                <Clock className="w-5 h-5 text-[#22c55e]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tu Progreso</p>
                                <p className="text-white font-bold text-sm">
                                    {Object.keys(picks).length} <span className="text-zinc-600">/</span> {matches.length} Seleccionados
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#22c55e]">{Math.round((Object.keys(picks).length / matches.length) * 100)}%</span>
                        </div>
                    </div>
                )}

                {timeLeft === 'Cerrada' ? (
                    <div className="bg-[#18181b] border border-red-500/50 rounded-2xl p-8 py-16 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        <Clock className="w-16 h-16 text-red-500 mx-auto opacity-80" />
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">Jornada Cerrada</h2>
                        <p className="text-zinc-400 max-w-sm mx-auto text-sm">El tiempo límite para enviar tu quiniela ha expirado. El primer partido ya ha comenzado y no se aceptan más participaciones.</p>
                        <button onClick={() => navigate('/')} className="mt-8 bg-red-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-sm mx-auto block shadow-lg shadow-red-500/20">
                            Volver a Resultados
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePreSubmit} className="space-y-8">

                        {/* Section: User Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[#22c55e]" />
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tus Datos</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/50 transition-all hover:bg-zinc-900">
                                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Tu Apodo"
                                        className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-zinc-700"
                                    />
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/50 transition-all">
                                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1 flex items-center justify-between w-full">
                                        Goles Totales
                                        <span className="text-[#fbbf24] text-[8px] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded ml-2">Desempate</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={goals}
                                        onChange={e => {
                                            if (e.target.value.length <= 2) {
                                                setGoals(e.target.value);
                                            }
                                        }}
                                        placeholder="0"
                                        className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Matches */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 sticky top-[72px] bg-[#09090b]/95 backdrop-blur-sm py-2 z-40 border-b border-zinc-800/50">
                                <Target className="w-4 h-4 text-[#22c55e]" />
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Partidos de la Jornada</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                                {matches.map((match) => {
                                    const mapHome = getShortName(match.homeTeam);
                                    const mapAway = getShortName(match.awayTeam);

                                    const hydratedMatch = {
                                        ...match,
                                        homePosition: teamsPositionsMap[mapHome] || teamsPositionsMap[match.homeTeam.toLowerCase()] || undefined,
                                        awayPosition: teamsPositionsMap[mapAway] || teamsPositionsMap[match.awayTeam.toLowerCase()] || undefined
                                    };

                                    return (
                                        <MatchCard
                                            key={match.id}
                                            match={hydratedMatch}
                                            selection={picks[match.id]}
                                            onSelect={handleSelect}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Button Floating */}
                        <div className="bottom-6 left-0 right-0 px-6 max-w-xl mx-auto z-50">
                            <button
                                type="submit"
                                disabled={!isComplete || loading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all transform shadow-2xl backdrop-blur-md border border-white/5",
                                    isComplete
                                        ? "bg-[#22c55e] text-black shadow-[#22c55e]/20 hover:scale-[1.02] active:scale-[0.98]"
                                        : "bg-zinc-900/90 text-zinc-600 border-zinc-800"
                                )}
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        {isComplete && <CheckCircle2 className="w-5 h-5" />}
                                        {isComplete ? "Enviar Quiniela" : "Completa los campos"}
                                        {!isComplete && <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />}
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                )}


                {/* Confirm Modal */}
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Confirmar Quiniela"
                >
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase">Participante</span>
                                <span className="text-white font-black text-lg">{name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase">Goles Totales</span>
                                <span className="text-[#22c55e] font-black text-lg">{goals}</span>
                            </div>
                            <div className="h-px bg-zinc-800 my-2"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase">Pronósticos</span>
                                <span className="text-white font-bold">{Object.keys(picks).length} de {matches.length}</span>
                            </div>
                        </div>

                        <p className="text-zinc-400 text-sm text-center">
                            ¿Estás seguro de enviar tu quiniela? <br />
                            <span className="text-xs text-zinc-600">No podrás modificarla despues.</span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Revisar
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={loading}
                                className="flex-1 bg-[#22c55e] text-black font-black px-4 py-3 rounded-xl hover:bg-[#1faa50] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#22c55e]/20"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Enviar Ahora
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Terms Modal */}
                <Modal
                    isOpen={showTermsModal}
                    onClose={() => setShowTermsModal(false)}
                    title="Condiciones de Participación"
                >
                    <div className="space-y-6 text-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-4 shadow-inner custom-scrollbar">
                            <p className="text-zinc-400 text-xs mb-2">Para garantizar un juego justo para todos, debes conocer y aceptar nuestras reglas antes de enviar tu primera quiniela:</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Target className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
                                    <div><strong className="text-white block mb-1">1. La Dinámica</strong>
                                    <span className="text-zinc-400 text-xs">Predice el resultado final de todos los partidos semanales: Local, Empate o Visita. Toda quiniela sin pagar antes del inicio del primer partido será eliminada.</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div><strong className="text-white block mb-1">2. Puntuación</strong>
                                    <span className="text-zinc-400 text-xs">Sumarás 1 punto por cada predicción correcta. Quien logre más puntos se lleva la bolsa.</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <Calculator className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                    <div><strong className="text-white block mb-1">3. Criterio de Desempate</strong>
                                    <span className="text-zinc-400 text-xs">En caso de empate en puntos, gana quien se acerque más al "Total de Goles" de la jornada. Si hay empate exacto también en goles, gana quien haya enviado y registrado su quiniela primero.</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div><strong className="text-white block mb-1">4. Partidos Suspendidos</strong>
                                    <span className="text-zinc-400 text-xs">Si un partido se suspende por causas de fuerza mayor, quedará anulado de la quiniela y nadie recibirá puntos por él.</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <Timer className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                                    <div><strong className="text-white block mb-1">5. Resultados Oficiales</strong>
                                    <span className="text-zinc-400 text-xs">Valen los resultados estrictamente al silbatazo final de los 90 min reglamentarios. No se cuentan tiempos extra, penales ni decisiones en la mesa. Las modificaciones a la quiniela posterior al envío no están permitidas.</span></div>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="relative flex items-start pt-1">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={termsChecked}
                                    onChange={(e) => setTermsChecked(e.target.checked)}
                                />
                                <div className="w-5 h-5 border-2 border-zinc-500 rounded bg-zinc-900 peer-checked:bg-[#22c55e] peer-checked:border-[#22c55e] transition-colors flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-xs text-zinc-300 font-medium leading-relaxed select-none">
                                He leído, entendido y acepto las reglas y condiciones de juego para participar en la quiniela.
                            </span>
                        </label>

                        <button
                            onClick={handleAcceptTerms}
                            disabled={!termsChecked || acceptingTerms}
                            className={cn(
                                "w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2",
                                termsChecked
                                    ? "bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20 hover:scale-[1.02]"
                                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                            )}
                        >
                            {acceptingTerms ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aceptar y Continuar"}
                        </button>
                    </div>
                </Modal>
            </div>
        </div >
    );
}