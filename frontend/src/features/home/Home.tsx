import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Loader2, Play, Activity, Timer } from 'lucide-react';
import { api } from '../../lib/api';

export default function Home() {
    const navigate = useNavigate();
    const [weekName, setWeekName] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);
    const [closeDate, setCloseDate] = useState<number | string | null>(null);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        api.weeks.getAll()
            .then(weeks => {
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];
                if (active) {
                    setWeekName(active.name);
                    // Use earliest match date for countdown to ensure accuracy
                    if (active.matches && active.matches.length > 0) {
                        const earliest = [...active.matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                        setCloseDate(earliest.date);
                    } else {
                        setCloseDate(active.closeDate); // Fallback
                    }
                } else {
                    setWeekName("Sin Jornada Activa");
                }
            })
            .catch(() => setWeekName("Quiniela"))
            .finally(() => setLoading(false));
    }, []);

    /* Countdown Logic */
    useEffect(() => {
        if (!closeDate) return;

        const targetTime = new Date(closeDate).getTime();

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

            // Format with leading zeros
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

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#09090b] text-[#22c55e]">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] overflow-hidden font-sans relative flex items-center justify-center">

            {/* Background Texture - Dot Pattern */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

            {/* Main Responsive Container */}
            <div className="w-full max-w-6xl p-6 md:p-12 z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">

                {/* Left Column: Brand & Hero Text */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 md:space-y-10">

                    {/* Header Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                        </span>
                        <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest leading-none">
                            {weekName}
                        </span>
                    </div>

                    {/* Timer Banner - Redesigned */}
                    {timeLeft && (
                        <div className="relative group overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-4 mb-6 shadow-2xl shadow-[#22c55e]/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                            <div className="relative z-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#22c55e]/10 rounded-lg animate-pulse">
                                        <Timer className="w-5 h-5 text-[#22c55e]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Cierre de Jornada</span>
                                        <span className="text-xl md:text-2xl font-black text-white font-mono tracking-tight leading-none">
                                            {timeLeft}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="flex flex-col items-end">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fbbf24] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fbbf24]"></span>
                                    </span>
                                    <span className="text-[8px] font-bold text-[#fbbf24] mt-1 uppercase tracking-widest">En Curso</span>
                                </div>
                            </div>

                            {/* Progress Bar visual decoration */}
                            <div className="absolute bottom-0 left-0 h-0.5 bg-zinc-800 w-full">
                                <div className="h-full bg-gradient-to-r from-[#22c55e] to-zinc-500 w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    )}

                    {/* Main Brand with "OFFICIAL APP" */}
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#22c55e] blur-xl opacity-20 rounded-full"></div>
                                <Trophy className="w-12 h-12 text-[#22c55e] relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                                    Pro<span className="text-[#22c55e]">Quiniela</span>
                                </h1>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1 ml-1 text-left">
                                    Official App
                                </p>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-medium text-white leading-tight mt-8">
                            Demuestra tu <br />
                            <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-zinc-200">PASIÓN</span>
                        </h2>

                        <p className="text-zinc-500 mt-6 text-sm md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed">
                            Predice los resultados, compite con amigos y gana premios cada semana.
                        </p>
                    </div>

                    {/* Footer Info (Desktop Only) */}
                    <div className="hidden md:block pt-8 border-t border-zinc-800 w-full">
                        <p className="text-xs text-zinc-600 font-mono">
                            v1.0.0 • Powered by React & Firebase
                        </p>
                    </div>
                </div>

                {/* Right Column: Actions Grid */}
                <div className="w-full max-w-md mx-auto md:max-w-none flex flex-col gap-6">

                    {/* Main Card: PLAY */}
                    <button
                        onClick={() => navigate('/fill')}
                        className="group relative w-full h-48 md:h-64 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-[#22c55e]/50 transition-all duration-300 shadow-2xl hover:shadow-[#22c55e]/20 hover:-translate-y-1"
                    >
                        <div className="absolute right-0 top-0 w-48 h-48 bg-[#22c55e]/5 rounded-full blur-3xl group-hover:bg-[#22c55e]/20 transition-colors"></div>

                        <div className="absolute top-6 right-6 bg-zinc-800 p-3 rounded-full group-hover:bg-[#22c55e] group-hover:text-black transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </div>

                        <div className="absolute left-8 bottom-8 text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-[#22c55e] rounded-lg">
                                    <Play className="w-5 h-5 text-black fill-black" />
                                </div>
                                <span className="text-xs font-bold text-[#22c55e] uppercase tracking-wider bg-[#22c55e]/10 px-3 py-1 rounded-full">
                                    Disponible
                                </span>
                            </div>
                            <p className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                                Jugar Ahora
                            </p>
                            <p className="text-sm text-zinc-400 font-medium">
                                Arma tu quiniela en segundos
                            </p>
                        </div>
                    </button>

                    {/* Secondary Card: RESULTS */}
                    <button
                        onClick={() => navigate('/scoreboard')}
                        className="group relative w-full h-32 bg-[#0e0e11] border border-zinc-800 rounded-[2rem] overflow-hidden hover:bg-zinc-900 transition-all p-0 hover:translate-x-2"
                    >
                        <div className="absolute inset-0 flex items-center justify-between px-8">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-[#22c55e]/20 transition-colors">
                                    <Activity className="w-7 h-7 text-white group-hover:text-[#22c55e] transition-colors" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-bold text-white leading-none mb-1 group-hover:text-[#22c55e] transition-colors">Resultados</p>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ver la Tabla General</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                    </button>

                    {/* Mobile Footer */}
                    <div className="md:hidden text-center mt-4">
                        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
                            Quiniela App © 2026
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}
