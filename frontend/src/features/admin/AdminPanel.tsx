import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Lock, Plus, Play, Loader2, Trophy, ClipboardList, PenTool } from 'lucide-react';
import type { WeekDraft, Match } from '../../types';
import { api } from '../../lib/api';

export default function AdminPanel() {
    const [auth, setAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'create-week' | 'results'>('create-week');

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

            </main>
        </div>
    );
}

function ResultsEditor() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [weekId, setWeekId] = useState<string | null>(null);

    useEffect(() => {
        api.weeks.getAll().then(weeks => {
            const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
            if (sorted.length > 0) {
                setWeekId(sorted[0].id);
                setMatches(sorted[0].matches);
            }
        });
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

    if (matches.length === 0) return <div className="text-center text-slate-500 py-12">No hay partidos cargados.</div>;

    return (
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4">
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
    )
}
