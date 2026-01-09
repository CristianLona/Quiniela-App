import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Lock, Plus, Play, Loader2, Trophy, ClipboardList, PenTool, User, Eye, EyeOff, DollarSign, CheckCircle2 } from 'lucide-react';
import type { WeekDraft, Match, ParticipantEntry } from '../../types';
import { api } from '../../lib/api';

export default function AdminPanel() {
    const [auth, setAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'create-week' | 'results' | 'participants'>('create-week');

    // Create Week State
    const [weekName, setWeekName] = useState('Jornada 1');
    const [price, setPrice] = useState(50);
    const [adminFee, setAdminFee] = useState(0);
    const [weekText, setWeekText] = useState('');
    const [draft, setDraft] = useState<WeekDraft | null>(null);

    // Login Handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') setAuth(true);
        else alert('Wrong password');
    };

    // Parser Handler
    const handleParse = async () => {
        if (!weekText.trim()) return;
        setLoading(true);
        try {
            const result = await api.weeks.parse(weekText);
            setDraft(result);
        } catch (err: unknown) {
            alert('Error: ' + String(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!draft) return;
        if (!confirm('¿Publicar?')) return;
        setLoading(true);
        try {
            await api.weeks.create(weekName, draft.parsedMatches, price, adminFee);
            alert('Publicado');
            setWeekText('');
            setDraft(null);
        } catch (err) { alert(String(err)); }
        finally { setLoading(false); }
    };

    if (!auth) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-white/5">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center text-pool-green border border-white/10 shadow-inner">
                            <Lock className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-center text-2xl font-bold text-white mb-8 tracking-tight">Admin Access</h2>
                    <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0f172a] text-white p-4 border border-slate-700 rounded-xl mb-4 focus:border-pool-green outline-none font-bold" />
                    <button type="submit" className="w-full bg-pool-green text-[#020617] font-bold py-4 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-pool-green/20">Entrar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans">
            <header className="bg-[#020617] text-white p-6 sticky top-0 z-20 border-b border-white/5 shadow-xl">
                <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
                    <h1 className="font-bold text-xl flex items-center gap-2"><PenTool className="w-5 h-5 text-pool-accent" /> Panel Administrativo</h1>
                    <button onClick={() => setAuth(false)} className="text-xs font-bold text-slate-500 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">Salir</button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
                {/* Tabs */}
                <div className="flex gap-4 p-1 bg-[#1e293b] rounded-xl w-fit border border-white/5">
                    <button onClick={() => setTab('create-week')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", tab === 'create-week' ? "bg-pool-green text-[#020617] shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                        <Plus className="w-4 h-4" /> Nueva Jornada
                    </button>
                    <button onClick={() => setTab('results')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", tab === 'results' ? "bg-pool-green text-[#020617] shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                        <ClipboardList className="w-4 h-4" /> Capturar Resultados
                    </button>
                    <button onClick={() => setTab('participants')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", tab === 'participants' ? "bg-pool-green text-[#020617] shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                        <User className="w-4 h-4" /> Participantes
                    </button>
                </div>

                {tab === 'create-week' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-white/5">
                                <h2 className="text-xs font-bold text-pool-accent uppercase mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded bg-pool-accent/10 flex items-center justify-center text-[10px]">1</span> Configurar Jornada</h2>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nombre</label>
                                    <input value={weekName} onChange={e => setWeekName(e.target.value)} className="w-full bg-[#0f172a] text-white text-sm font-bold border border-slate-700 rounded-lg p-3 focus:border-pool-green outline-none transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Precio ($)</label>
                                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-[#0f172a] text-white text-sm font-bold border border-slate-700 rounded-lg p-3 focus:border-pool-green outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Gastos/Resta ($)</label>
                                        <input type="number" value={adminFee} onChange={e => setAdminFee(Number(e.target.value))} className="w-full bg-[#0f172a] text-white text-sm font-bold border border-slate-700 rounded-lg p-3 focus:border-pool-green outline-none" />
                                    </div>
                                </div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Pegar Partidos (Texto)</label>
                                <textarea value={weekText} onChange={e => setWeekText(e.target.value)} placeholder={`Real Madrid vs Barcelona sábado 8:00pm...`} className="w-full h-48 bg-[#0f172a] p-4 text-sm text-slate-300 border border-slate-700 rounded-lg focus:border-pool-green outline-none font-mono resize-none mb-4" />
                                <button onClick={handleParse} disabled={loading} className="w-full text-sm bg-slate-700 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-600 disabled:opacity-50 transition-colors">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} <span>Procesar Texto</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {draft ? (
                                <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-white/5 h-full flex flex-col">
                                    <h2 className="text-xs font-bold text-pool-accent uppercase mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded bg-pool-accent/10 flex items-center justify-center text-[10px]">2</span> Vista Previa</h2>
                                    <div className="flex-1 space-y-3 mb-6 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                        {draft.parsedMatches.map((m, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-[#0f172a] rounded-lg border border-white/5">
                                                <span className="font-bold text-slate-200">{m.homeTeam}</span>
                                                <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded">VS</span>
                                                <span className="font-bold text-slate-200">{m.awayTeam}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handlePublish} disabled={loading} className="w-full bg-pool-green text-[#020617] font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-400 flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:scale-105">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />} Publicar Jornada Ahora
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center">
                                    <div className="max-w-[150px]"><Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-sm font-medium">Procesa el texto para ver la vista previa aquí</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'results' && <ResultsEditor />}
                {tab === 'participants' && <ParticipantsEditor />}

            </main>
        </div>
    );
}

function ResultsEditor() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [week, setWeek] = useState<any | null>(null);
    const [weekId, setWeekId] = useState<string | null>(null);
    const [participantsCount, setParticipantsCount] = useState(0);

    const fetchData = async () => {
        try {
            const weeks = await api.weeks.getAll();
            const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
            if (sorted.length > 0) {
                const currentWeek = sorted[0];
                setWeekId(currentWeek.id);
                setWeek(currentWeek);
                setMatches(currentWeek.matches);

                const parts = await api.picks.getByWeek(currentWeek.id);
                // User requested to calculate based on TOTAL participants, not just paid ones
                setParticipantsCount(parts.length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateScore = async (matchId: string, home: number, away: number) => {
        if (!weekId) return;
        try {
            // Optimistic Update
            setMatches(prev => prev.map(m => {
                if (m.id === matchId) {
                    return { ...m, result: { homeScore: home, awayScore: away, outcome: home > away ? 'L' : away > home ? 'V' : 'E' }, status: 'FINISHED' };
                }
                return m;
            }));

            // API Call
            await api.weeks.updateResult(weekId, matchId, home, away);
        } catch (e) {
            alert('Error updating score: ' + String(e));
        }
    };

    const handleUpdateFee = async (newFee: number) => {
        if (!weekId) return;
        try {
            setWeek((prev: any) => ({ ...prev, adminFee: newFee }));
            await api.weeks.update(weekId, { adminFee: newFee });
        } catch (e) {
            alert('Error updating fee');
            fetchData();
        }
    };

    if (matches.length === 0) return <div className="text-center text-slate-500 py-12">No hay partidos cargados.</div>;

    const totalPot = participantsCount * (week?.price || 0);
    const realPrize = totalPot - (week?.adminFee || 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Prize Management Section */}
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Recaudado (Total: {participantsCount})</label>
                    <div className="text-2xl font-black text-white bg-[#0f172a] p-3 rounded-lg border border-white/5 flex items-center gap-2">
                        <span className="text-slate-500 text-base">$</span>
                        {totalPot.toLocaleString()}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-pool-accent mb-2 uppercase">Ganancia / Gastos</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                        <input
                            type="number"
                            value={week?.adminFee || 0}
                            onChange={(e) => handleUpdateFee(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#0f172a] text-white text-xl font-bold border border-pool-accent/50 rounded-lg p-3 pl-8 focus:border-pool-green outline-none transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-2 uppercase">Premio Real a Repartir</label>
                    <div className="text-3xl font-black text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 flex items-center gap-2">
                        <span className="text-emerald-500/50 text-xl">$</span>
                        {realPrize.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl">
                <h2 className="text-xs font-bold text-pool-accent uppercase mb-6 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Capturar Marcadores (Guardado Automático)
                </h2>
                <div className="space-y-4">
                    {matches.map(m => (
                        <div key={m.id} className="bg-[#0f172a] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 justify-end">
                                <span className="font-bold text-white text-right">{m.homeTeam}</span>
                                <div className="bg-slate-800 rounded-lg p-1 w-12 text-center">
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-center text-white font-bold outline-none"
                                        defaultValue={m.result?.homeScore}
                                        onBlur={(e) => handleUpdateScore(m.id, parseInt(e.target.value) || 0, m.result?.awayScore || 0)}
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-slate-600 font-bold px-2">VS</span>
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-slate-800 rounded-lg p-1 w-12 text-center">
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-center text-white font-bold outline-none"
                                        defaultValue={m.result?.awayScore}
                                        onBlur={(e) => handleUpdateScore(m.id, m.result?.homeScore || 0, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <span className="font-bold text-white text-left">{m.homeTeam}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ParticipantsEditor() {
    const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
    const [weekId, setWeekId] = useState<string | null>(null);
    const [hideUnpaid, setHideUnpaid] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const weeks = await api.weeks.getAll();
            const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
            if (sorted.length > 0) {
                const active = sorted.find(w => w.status === 'OPEN') || sorted[0];
                setWeekId(active.id);
                setHideUnpaid(!!active.hideUnpaid);

                const parts = await api.picks.getByWeek(active.id);
                setParticipants(parts.sort((a, b) => b.submittedAt - a.submittedAt));
                // setParticipants(parts);
            }
        } catch (e) {
            alert('Error loading participants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const togglePayment = async (p: ParticipantEntry) => {
        try {
            const updated = await api.picks.togglePayment(p.id);
            setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, paymentStatus: updated.paymentStatus } : item));
        } catch (e) {
            alert('Error updating payment status');
        }
    };

    const toggleVisibility = async () => {
        if (!weekId) return;
        try {
            const newVal = !hideUnpaid;
            await api.weeks.toggleVisibility(weekId, newVal);
            setHideUnpaid(newVal);
        } catch (e) {
            alert('Error updating visibility');
        }
    };

    if (loading && participants.length === 0) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-pool-green" /></div>;

    if (!weekId) return <div className="text-slate-500 text-center py-12">No hay jornada activa.</div>;

    return (
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-bold text-pool-accent uppercase flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Gestión de Participantes
                </h2>

                <button
                    onClick={toggleVisibility}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border",
                        hideUnpaid
                            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                >
                    {hideUnpaid ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {hideUnpaid ? "Ocultando No Pagados" : "Mostrando Todos"}
                </button>
            </div>

            <div className="space-y-3">
                {participants.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No hay participantes aún.</div>
                ) : (
                    participants.map(p => (
                        <div key={p.id} className="bg-[#0f172a] p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white", p.paymentStatus === 'PAID' ? "bg-emerald-600" : "bg-slate-700")}>
                                    {p.participantName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{p.participantName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(p.submittedAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => togglePayment(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all border",
                                    p.paymentStatus === 'PAID'
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                                )}
                            >
                                {p.paymentStatus === 'PAID' ? (
                                    <><CheckCircle2 className="w-3 h-3" /> Pagado</>
                                ) : (
                                    <><DollarSign className="w-3 h-3" /> Pendiente</>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
