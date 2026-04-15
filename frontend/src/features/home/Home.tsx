import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Loader2, Play, Activity, Timer, HelpCircle, LogOut, User, AlertTriangle, ShieldCheck, Target, Calculator, Banknote, Bell, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import StandingsTable from './StandingsTable';
import { Modal } from '../../components/ui/Modal';
import PaymentInfoModal from '../../components/PaymentInfoModal';
import { useAuth } from '../../context/AuthContext';
import { requestNotificationPermission } from '../../lib/notifications';
import { toast } from 'sonner';

export default function Home() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = adminEmail && user?.email?.toLowerCase() === adminEmail.toLowerCase();

    const [weekName, setWeekName] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);
    const [closeDate, setCloseDate] = useState<number | string | null>(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [activeLeague, setActiveLeague] = useState<string>("liga-mx");
    const [showRules, setShowRules] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const handleEnableNotifications = async () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            const token = await requestNotificationPermission();
            if (token) {
                toast.success('Notificaciones activadas', { description: 'Te avisaremos cuando haya nuevas jornadas.' });
            } else {
                toast.error('No se pudo activar', { description: 'Verifica los permisos en el candado de tu navegador.' });
            }
        } else if ('Notification' in window && Notification.permission === 'granted') {
            toast.info('Ya tienes las notificaciones activas');
            // Try to refetch token silently just to be sure it's in backend
            requestNotificationPermission();
        }
    };

    useEffect(() => {
        api.weeks.getAll()
            .then(weeks => {
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];
                if (active) {
                    setWeekName(active.name);
                    if (active.matches && active.matches.length > 0) {
                        const earliest = [...active.matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                        setCloseDate(earliest.date);
                    } else {
                        setCloseDate(active.closeDate);
                    }
                    if (active.league) setActiveLeague(active.league);
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
        <div className="min-h-screen bg-[#09090b] font-sans relative overflow-x-hidden">

            {/* Background Texture - Dot Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Gradient Orbs Container */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
            </div>

            {/* ════════════════════════════════════════════════════════ */}
            {/* MOBILE LAYOUT (< md) — vertical scroll, app-like       */}
            {/* DESKTOP LAYOUT (>= md) — two column hero + actions      */}
            {/* ════════════════════════════════════════════════════════ */}

            <div className="relative z-10 w-full max-w-6xl mx-auto">

                {/* ─── TOP BAR ─── */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2 md:px-12 md:pt-10">
                    {/* User Profile - clean and minimal */}
                    <div className="flex items-center gap-3 p-2.5 rounded-3xl border border-zinc-800">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full ring-2 ring-[#22c55e]/40 shadow-lg shadow-[#22c55e]/10" />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center ring-2 ring-zinc-600 shadow-lg">
                                <User className="w-4 h-4 text-zinc-300" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white max-w-[140px] sm:max-w-[200px] truncate leading-tight">
                                {user?.displayName || user?.email || 'Usuario'}
                            </span>
                            <span className="text-[10px] text-zinc-500 leading-tight font-medium">Bienvenido de vuelta</span>
                        </div>
                        <div className="h-5 w-px bg-zinc-700 ml-1"></div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 -mr-1 rounded-lg hover:bg-transparent transition-all"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-400 transition-colors" />
                        </button>
                    </div>

                    {/* Right: Admin (if applicable) */}

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/20 rounded-xl transition-all active:scale-95"
                        >
                            <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
                            <span className="text-[11px] font-semibold text-[#22c55e]">Admin</span>
                        </button>
                    )}
                </div>

                {/* ─── JORNADA STATUS CARD ─── */}
                <div className="px-5 pt-3 md:px-12">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#22c55e]/15 via-zinc-900/90 to-zinc-900 border border-[#22c55e]/20 p-4 shadow-xl shadow-[#22c55e]/5">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#22c55e]/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Animated jornada indicator */}
                                <div className="p-2.5 bg-[#22c55e]/15 rounded-xl border border-[#22c55e]/20">
                                    <Timer className="w-5 h-5 text-[#22c55e]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                                        </span>
                                        <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">{weekName}</span>
                                    </div>
                                    {timeLeft && (
                                        <span className="text-xl font-black text-white font-mono tracking-tight leading-none">
                                            {timeLeft}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status badge */}
                            {timeLeft && (
                                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 rounded-full">
                                    <span className="flex h-1.5 w-1.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                                    </span>
                                    <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">En Curso</span>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#22c55e] to-[#22c55e]/40 rounded-full w-3/4 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* ─── MAIN CONTENT GRID ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 px-5 pt-6 md:px-12 md:pt-12 items-center">

                    {/* LEFT COLUMN: Brand + Hero */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 md:space-y-8">

                        {/* Brand */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#22c55e] blur-xl opacity-25 rounded-full"></div>
                                <Trophy className="w-10 h-10 md:w-14 md:h-14 text-[#22c55e] relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                                    Pro<span className="text-[#22c55e]">Quiniela</span>
                                </h1>
                                <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-0.5 text-left">
                                    Official App
                                </p>
                            </div>
                        </div>

                        {/* Hero Text */}
                        <div>
                            <h2 className="text-2xl md:text-5xl font-medium text-white leading-tight">
                                Demuestra tu <br />
                                <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-emerald-300">PASIÓN</span>
                            </h2>
                            <p className="text-zinc-500 mt-2 md:mt-5 text-xs md:text-base max-w-md mx-auto md:mx-0 leading-relaxed">
                                Predice los resultados, compite con amigos y gana premios cada semana.
                            </p>
                        </div>

                        {/* Quick Actions - Moved here as elegant small buttons */}
                        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start pt-1">

                            {/* <button
                                onClick={() => setShowPayment(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all active:scale-95"
                            >
                                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[11px] font-semibold text-amber-400">Pagar</span>
                            </button> */}
                            <button
                                onClick={handleEnableNotifications}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all active:scale-95"
                                title="Activar o verificar notificaciones"
                            >
                                <Bell className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[11px] font-semibold text-blue-400">Alertas</span>
                            </button>
                            <button
                                onClick={() => setShowRules(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all active:scale-95"
                            >
                                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[11px] font-semibold text-amber-400">Reglas</span>
                            </button>
                        </div>

                        {/* Footer Info (Desktop Only) */}
                        <div className="hidden md:block pt-6 border-t border-zinc-800/60 w-full">
                            <p className="text-xs text-zinc-600 font-mono">
                                v1.8.0 • Powered by React & Firebase
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action Cards */}
                    <div className="w-full max-w-md mx-auto md:max-w-none flex flex-col gap-4 md:gap-6">

                        {/* Main Card: PLAY */}
                        <button
                            onClick={() => navigate('/fill')}
                            className="group relative w-full h-44 md:h-64 bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden hover:border-[#22c55e]/50 transition-all duration-300 shadow-2xl hover:shadow-[#22c55e]/20 active:scale-[0.98]"
                        >
                            <div className="absolute right-0 top-0 w-48 h-48 bg-[#22c55e]/5 rounded-full blur-3xl group-hover:bg-[#22c55e]/20 transition-colors"></div>

                            <div className="absolute top-5 right-5 md:top-6 md:right-6 bg-zinc-800 p-2.5 md:p-3 rounded-full group-hover:bg-[#22c55e] group-hover:text-black transition-all">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </div>

                            <div className="absolute left-6 bottom-6 md:left-8 md:bottom-8 text-left">
                                <div className="flex items-center gap-2 mb-3 md:mb-4">
                                    <div className="p-1.5 md:p-2 bg-[#22c55e] rounded-lg">
                                        <Play className="w-4 h-4 md:w-5 md:h-5 text-black fill-black" />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-[#22c55e] uppercase tracking-wider bg-[#22c55e]/10 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full">
                                        Disponible
                                    </span>
                                </div>
                                <p className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-1 md:mb-2">
                                    Jugar Ahora
                                </p>
                                <p className="text-xs md:text-sm text-zinc-400 font-medium">
                                    Arma tu quiniela en segundos
                                </p>
                            </div>
                        </button>

                        {/* Secondary Card: RESULTS */}
                        <button
                            onClick={() => navigate('/scoreboard')}
                            className="group relative w-full h-24 md:h-32 bg-[#0e0e11] border border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden hover:bg-zinc-900 transition-all p-0 active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 flex items-center justify-between px-6 md:px-8">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-800 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-[#22c55e]/20 transition-colors">
                                        <Activity className="w-6 h-6 md:w-7 md:h-7 text-white group-hover:text-[#22c55e] transition-colors" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xl md:text-2xl font-bold text-white leading-none mb-0.5 group-hover:text-[#22c55e] transition-colors">Resultados</p>
                                        <p className="text-[10px] md:text-xs text-zinc-500 font-medium uppercase tracking-wider">Ver la Tabla General</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                        </button>
                    </div>

                </div>

                {/* ─── STANDINGS TABLE ─── */}
                <div className="px-5 pt-8 md:px-12 md:pt-16 pb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <StandingsTable league={activeLeague} />
                </div>

                {/* ─── MOBILE FOOTER ─── */}
                <div className="md:hidden text-center pb-8 safe-area-bottom">
                    <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
                        Quiniela App © 2026
                    </p>
                </div>

            </div>

            {/* ════════ MODALS ════════ */}

            <Modal
                isOpen={showRules}
                onClose={() => setShowRules(false)}
                title="Cómo Jugar la Quiniela"
            >
                <div className="space-y-4 text-sm text-zinc-300 pb-2">
                    {/* Alerta de Pago Importante */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex gap-4 relative overflow-hidden shadow-lg shadow-red-500/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        <AlertTriangle className="w-7 h-7 text-red-500 shrink-0 relative z-10" />
                        <div className="relative z-10">
                            <h4 className="font-black text-red-500 uppercase tracking-widest text-sm mb-2">Advertencia de Pago</h4>
                            <p className="text-red-200/90 leading-relaxed font-medium">
                                Toda quiniela <strong className="text-white bg-red-500/30 px-1.5 py-0.5 rounded ml-1">sin pagar</strong> antes del silbatazo inicial del primer partido <strong className="text-white underline decoration-red-500 decoration-2">quedará automáticamente fuera de participación</strong>, sin excepciones. Es tu responsabilidad reportar el pago a tiempo al administrador.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 group hover:border-[#22c55e]/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                                <Target className="w-5 h-5 text-[#22c55e]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wide text-xs mb-2">1. La Dinámica</h4>
                                <p className="text-zinc-400 text-xs leading-relaxed">Predice de manera sencilla el resultado de todos los partidos semanales: <span className="text-white">Local, Empate o Visita</span>.</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 group hover:border-blue-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wide text-xs mb-2">2. Puntuación</h4>
                                <p className="text-zinc-400 text-xs leading-relaxed">Sumarás <strong className="text-blue-400">1 punto</strong> exacto por cada predicción correcta. Quien logre sumar más puntos en total, se lleva la bolsa.</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 sm:col-span-2 group hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <Calculator className="w-5 h-5 text-purple-500" />
                                </div>
                                <h4 className="font-bold text-white uppercase tracking-wide text-xs">3. Criterio de Desempate (Goles)</h4>
                            </div>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Si hay un empate en primer lugar, se decidirá utilizando el <strong className="text-white">Total de Goles de toda la Jornada</strong>. Quien se haya acercado más al número total de goles reales anotados en conjunto (no importa si se pasó o le faltaron) será el gran ganador.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>

            <PaymentInfoModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
        </div>
    );
}
