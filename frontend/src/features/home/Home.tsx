import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Trophy, Play, ArrowRight } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasActiveWeek, setHasActiveWeek] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const weeks = await api.weeks.getAll();
                setHasActiveWeek(weeks.length > 0);
            } catch (error) {
                console.error("Failed to fetch status", error);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
                <div className="w-16 h-16 border-4 border-pool-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#22c55e]/10 to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-12 mt-4">
                <h1 className="text-3xl font-black italic tracking-tighter">
                    PRO<span className="text-[#22c55e]">QUINIELA</span>
                </h1>
                {/* Hidden Admin Access - Only via URL or subtle click? User said "solo yo pueda acceder", implied URL or very hidden. 
                    I'll leave it out of the UI completely as requested "el admin panel que no se muestre". 
                */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center gap-6 max-w-md mx-auto w-full relative z-10 pb-12">

                {/* Hero Card - Jugar */}
                <button
                    onClick={() => navigate('/fill')}
                    className="group relative overflow-hidden bg-[#22c55e] p-8 rounded-3xl text-left shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 active:scale-95"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <Play className="w-32 h-32 fill-current text-black" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-black uppercase mb-4 text-black backdrop-blur-sm">
                            {hasActiveWeek ? 'En Curso' : 'Próximamente'}
                        </div>
                        <h2 className="text-4xl font-black text-black mb-2 leading-none uppercase">
                            Jugar<br />Quiniela
                        </h2>
                        <p className="text-black/80 font-bold text-sm max-w-37.5 leading-tight flex items-center gap-2">
                            Haz tus predicciones de la jornada
                            <ArrowRight className="w-4 h-4" />
                        </p>
                    </div>
                </button>

                {/* Secondary Card - Resultados */}
                <button
                    onClick={() => navigate('/scoreboard')}
                    className="group relative overflow-hidden bg-[#1e293b] p-8 rounded-3xl text-left border border-white/5 hover:bg-[#253045] transition-all transform hover:-translate-y-1 active:scale-95"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <Trophy className="w-32 fill-curren h-32" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white mb-2 uppercase">
                            Tabla General
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            Consulta los resultados y posiciones
                        </p>
                    </div>
                </button>

            </div>

            {/* Footer / Copyright */}
            <div className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest pb-6">
                ProQuiniela App v1.0
            </div>

        </div>
    );
}
