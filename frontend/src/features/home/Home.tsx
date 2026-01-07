import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Play, Star, TrendingUp, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { LeagueTable } from './LeagueTable';

export default function Home() {
    const navigate = useNavigate();
    const [weekName, setWeekName] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.weeks.getAll()
            .then(weeks => {
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];
                if (active) setWeekName(active.name);
                else setWeekName("Sin Jornada Activa");
            })
            .catch(() => setWeekName("Quiniela"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-black text-pool-green">
            <div className="w-16 h-16 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#22c55e] selection:text-black flex flex-col">

            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#22c55e]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 px-6 py-6 flex items-center justify-between w-full max-w-[1800px] mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Trophy className="w-6 h-6 text-black fill-current" />
                    </div>
                    <span className="text-xl font-black italic tracking-tighter leading-none hidden md:block">
                        PRO<span className="text-[#22c55e]">QUINIELA</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{weekName}</span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full px-6 pb-12 flex-1 flex flex-col justify-center max-w-[1800px] mx-auto">

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

                    {/* Hero Text & CTA (5 Cols) */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9]">
                                QUINIELA <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#22c55e] animate-gradient bg-300%">
                                    FAMILIAR
                                </span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
                                Bienvenidos. Aquí jugamos para divertirnos, competir sanamente y ver quién sabe más de fútbol.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/fill')}
                                className="group relative px-8 py-5 bg-[#22c55e] text-black font-black uppercase tracking-wider rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)]"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 flex items-center gap-3">
                                    <Play className="w-5 h-5 fill-current" />
                                    Jugar Ahora
                                </span>
                            </button>

                            <button
                                onClick={() => navigate('/scoreboard')}
                                className="px-8 py-5 bg-white/5 text-white font-bold uppercase tracking-wider rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                                <TrendingUp className="w-5 h-5" />
                                Ver Resultados
                            </button>
                        </div>
                    </div>

                    {/* Visual / Table Preview (7 Cols) */}
                    <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
                        {/* Decorative Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-[#22c55e]/20 to-blue-600/20 opacity-30 blur-3xl rounded-full pointer-events-none" />

                        {/* League Table Container */}
                        <div className="relative w-full max-w-4xl h-[650px] bg-[#0A0A0A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl transform rotate-0 hover:rotate-1 transition-transform duration-500 hover:scale-[1.01]">
                            <div className="bg-[#151515] p-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-6 h-6 text-slate-400" />
                                    <span className="text-lg font-bold text-white uppercase tracking-wider">Tabla General</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">En Vivo</span>
                                </div>
                            </div>
                            <div className="p-2 h-full overflow-y-auto custom-scrollbar pb-20">
                                <LeagueTable />
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
