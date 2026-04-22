import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Lock, Plus, Play, Loader2, Trophy, ClipboardList, PenTool, User, Eye, EyeOff, DollarSign, CheckCircle2, Circle, History, ArrowRight, Trash2, AlertTriangle, ShieldCheck, Download} from 'lucide-react';
import type { WeekDraft, Match, MatchStatus, ParticipantEntry, Week } from '../../types';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { exportScoreboardToExcel } from '../../lib/exportScoreboard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = user?.email?.toLowerCase() === adminEmail.toLowerCase();

    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'create-week' | 'results' | 'participants' | 'manual-entry' | 'history'>('create-week');

    // Create Week State
    const [weekName, setWeekName] = useState('Jornada 1');
    const [price, setPrice] = useState(50);
    const [adminFee, setAdminFee] = useState(0);
    const [draft, setDraft] = useState<WeekDraft | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [autoLeague, setAutoLeague] = useState('liga-mx');
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    // DND State
    const [bankMatches, setBankMatches] = useState<Omit<Match, 'id' | 'weekId' | 'status'>[]>([]);
    const [selectedMatches, setSelectedMatches] = useState<Omit<Match, 'id' | 'weekId' | 'status'>[]>([]);
    const [weekText, setWeekText] = useState('');

    useEffect(() => {
        if (selectedMatches.length > 0) {
            setDraft({ rawText: 'Generado con Drag & Drop', parsedMatches: selectedMatches });
        } else {
            setDraft(null);
        }
    }, [selectedMatches]);

    // Format date string for display
    const formatDisplayDate = (isoString?: string) => {
        if (!isoString) return '';
        const dateObj = new Date(isoString);
        return dateObj.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '');
    };

    // Parser Handler
    const handleParse = async () => {
        if (!weekText.trim()) return;
        setLoading(true);
        try {
            const result = await api.weeks.parse(weekText);
            setBankMatches(prev => [...prev, ...result.parsedMatches]);
            setWeekText('');
            toast.success(`Se agregaron ${result.parsedMatches.length} partidos manuales al Banco`);
        } catch (err: unknown) {
            toast.error('Error al procesar: ' + String(err));
        } finally {
            setLoading(false);
        }
    };

    // DND Handlers
    const handleDragStart = (e: React.DragEvent, source: 'bank' | 'selected', index: number) => {
        e.dataTransfer.setData('source', source);
        e.dataTransfer.setData('index', String(index));
    };

    const handleDrop = (e: React.DragEvent, target: 'bank' | 'selected') => {
        e.preventDefault();
        const source = e.dataTransfer.getData('source');
        const indexStr = e.dataTransfer.getData('index');
        if (!source || !indexStr) return;
        const sourceIndex = parseInt(indexStr, 10);

        if (source === target) return;

        if (source === 'bank' && target === 'selected') {
            const item = bankMatches[sourceIndex];
            setBankMatches(prev => prev.filter((_, i) => i !== sourceIndex));
            setSelectedMatches(prev => [...prev, item].sort((a, b) => a.timestamp - b.timestamp));
        } else if (source === 'selected' && target === 'bank') {
            const item = selectedMatches[sourceIndex];
            setSelectedMatches(prev => prev.filter((_, i) => i !== sourceIndex));
            setBankMatches(prev => [...prev, item]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const moveToSelected = (index: number) => {
        const item = bankMatches[index];
        setBankMatches(prev => prev.filter((_, i) => i !== index));
        setSelectedMatches(prev => [...prev, item].sort((a, b) => a.timestamp - b.timestamp));
    };

    const moveToBank = (index: number) => {
        const item = selectedMatches[index];
        setSelectedMatches(prev => prev.filter((_, i) => i !== index));
        setBankMatches(prev => [...prev, item]);
    };

    // Auto-Generate Handler
    const handleAutoGenerate = async () => {
        setIsAutoGenerating(true);
        try {
            const matches = await api.scraper.getMatches(autoLeague);
            if (!matches || matches.length === 0) {
                toast.error('No se encontraron partidos para esta liga esta semana.');
                return;
            }

            const limit = autoLeague === 'liga-mx' ? 9 : (autoLeague === 'premier-league' ? 10 : 15);
            const limitedMatches = matches.slice(0, limit);

            const rawTextLines = limitedMatches.map((m: any) => `${m.homeTeam} vs ${m.awayTeam} ${m.date}`);
            const newText = rawTextLines.join('\n');

            const result = await api.weeks.parse(newText);
            setBankMatches(prev => [...prev, ...result.parsedMatches]);
            toast.success(`Se agregaron ${result.parsedMatches.length} partidos al Banco`);

        } catch (err) {
            toast.error('Error al autogenerar: ' + String(err));
        } finally {
            setIsAutoGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!draft) return;
        setLoading(true);
        try {
            await api.weeks.create(weekName, draft.parsedMatches, price, adminFee, autoLeague);
            toast.success('Jornada Publicada Exitosamente');
            setBankMatches([]);
            setSelectedMatches([]);
            setDraft(null);
            setShowPublishModal(false);
        } catch (err) { toast.error(String(err)); }
        finally { setLoading(false); }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
                <div className="bg-[#18181b] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-red-500/20 text-center animate-in fade-in zoom-in-95">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Acceso Denegado</h2>
                    <p className="text-zinc-500 text-sm mb-6">Esta área está restringida exclusivamente para el administrador.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors">Volver al Inicio</button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'create-week' as const, label: 'Nueva', icon: Plus },
        { id: 'results' as const, label: 'Resultados', icon: ClipboardList },
        { id: 'participants' as const, label: 'Pagos', icon: User },
        { id: 'manual-entry' as const, label: 'Manual', icon: PenTool },
        { id: 'history' as const, label: 'Historial', icon: History },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col font-sans">
            <header className="bg-black/40 backdrop-blur-md text-white px-4 py-3 md:p-6 sticky top-0 z-20 border-b border-white/5 shadow-xl">
                <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
                    <h1 className="font-bold text-base md:text-xl flex items-center gap-2">
                        <PenTool className="w-4 h-4 md:w-5 md:h-5 text-pool-accent" />
                        <span className="hidden sm:inline">Panel Administrativo</span>
                        <span className="sm:hidden">Admin</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/')} 
                            className="text-xs font-bold text-zinc-500 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
                        >
                            <span className="hidden sm:inline">Volver al Inicio</span>
                            <span className="sm:hidden">Inicio</span>
                        </button>
                        <button 
                            onClick={() => { signOut(); navigate('/'); }} 
                            className="text-xs font-bold text-zinc-500 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
                        >
                            <span className="hidden sm:inline">Cerrar Sesión</span>
                            <span className="sm:hidden">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-5 md:p-6 max-w-4xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Tabs - scrollable on mobile */}
                <div className="flex gap-1.5 md:gap-2 p-1 bg-[#18181b] rounded-xl w-full md:w-fit border border-white/5 overflow-x-auto no-scrollbar">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "shrink-0 flex-1 md:flex-initial px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center md:justify-start gap-1.5 md:gap-2",
                                tab === t.id
                                    ? "bg-pool-green text-[#020617] shadow-md"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <t.icon className="w-4 h-4" />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {tab === 'create-week' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* COLUMNA IZQUIERDA: Configuración y Banco */}
                        <div className="space-y-4 md:space-y-6 flex flex-col h-full md:max-h-[900px]">
                            <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl shadow-lg border border-white/5 shrink-0">
                                <h2 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded bg-pool-accent/10 flex items-center justify-center text-[10px]">1</span> Configuración Principal</h2>
                                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Nombre de la Jornada</label>
                                        <input value={weekName} onChange={e => setWeekName(e.target.value)} className="w-full bg-[#09090b] text-white text-sm font-bold border border-zinc-800 rounded-lg p-3 focus:border-pool-green outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Precio ($)</label>
                                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-[#09090b] text-white text-sm font-bold border border-zinc-800 rounded-lg p-3 focus:border-pool-green outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Gastos ($)</label>
                                        <input type="number" value={adminFee} onChange={e => setAdminFee(Number(e.target.value))} className="w-full bg-[#09090b] text-white text-sm font-bold border border-zinc-800 rounded-lg p-3 focus:border-pool-green outline-none" />
                                    </div>
                                </div>

                                <div className="bg-[#09090b] p-3 rounded-xl border border-white/5 flex flex-col gap-3">
                                    <label className="block text-[10px] font-bold text-pool-green uppercase">Importar Partidos</label>
                                    <div className="flex gap-2 w-full">
                                        <select value={autoLeague} onChange={e => setAutoLeague(e.target.value)} className="flex-1 bg-[#18181b] text-white text-xs font-bold border border-zinc-800 rounded-lg p-2 focus:border-pool-green outline-none appearance-none cursor-pointer">
                                            <option value="liga-mx">Liga MX</option>
                                            <option value="champions-league">Champions League</option>
                                            <option value="premier-league">Premier League</option>
                                        </select>
                                        <button onClick={handleAutoGenerate} disabled={isAutoGenerating} className="shrink-0 text-xs bg-pool-green/10 text-pool-green border border-white/5 font-bold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-pool-green/20 transition-colors">
                                            {isAutoGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Generar
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-zinc-800 flex-1"></div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">O manual</span>
                                        <div className="h-px bg-zinc-800 flex-1"></div>
                                    </div>

                                    <textarea value={weekText} onChange={e => setWeekText(e.target.value)} placeholder={`Equipo VS Equipo`} className="w-full h-16 bg-[#18181b] p-3 text-xs text-zinc-300 border border-zinc-800 rounded-lg focus:border-pool-green outline-none font-mono resize-none custom-scrollbar" />
                                    <button onClick={handleParse} disabled={loading || !weekText.trim()} className="w-full text-xs bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} <span>Procesar Texto al Banco</span>
                                    </button>
                                </div>
                            </div>

                            {/* Banco de Partidos (Arrastrables) */}
                            <div className="bg-[#18181b] p-4 rounded-2xl shadow-lg border border-white/5 flex-1 flex flex-col overflow-hidden"
                                onDrop={(e) => handleDrop(e, 'bank')}
                                onDragOver={handleDragOver}
                            >
                                <div className="flex justify-between items-center mb-3 md:mb-4 shrink-0">
                                    <h2 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px]">A</span> Banco de Partidos</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-600 font-bold">{bankMatches.length}</span>
                                        {bankMatches.length > 0 && (
                                            <button onClick={() => {
                                                setSelectedMatches(prev => [...prev, ...bankMatches].sort((a, b) => a.timestamp - b.timestamp));
                                                setBankMatches([]);
                                                toast.success(`${bankMatches.length} partidos movidos a la Jornada Final`);
                                            }} className="text-[10px] bg-pool-green/10 text-pool-green font-bold px-2 py-1 rounded hover:bg-pool-green/20 transition-colors uppercase cursor-pointer" title="Mover todos">
                                                + Todos
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 md:pr-2 pb-2">
                                    {bankMatches.map((m, idx) => (
                                        <div
                                            key={idx}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, 'bank', idx)}
                                            onDoubleClick={() => moveToSelected(idx)}
                                            className="group relative flex flex-col p-2.5 md:p-3 bg-[#09090b] rounded-lg border border-white/5 cursor-grab active:cursor-grabbing hover:border-pool-green/30 transition-all hover:translate-x-1"
                                        >
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <button onClick={(e) => { e.stopPropagation(); moveToSelected(idx); }} className="w-7 h-7 md:w-8 md:h-8 bg-pool-green text-[#020617] rounded-full flex items-center justify-center font-bold shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Plus className="text-[#22c55e] w-3.5 h-3.5 md:w-4 md:h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center text-xs md:text-sm pr-10">
                                                <span className="font-bold text-zinc-300 w-2/5 text-right truncate">{m.homeTeam}</span>
                                                <span className="text-[9px] text-zinc-500 font-bold bg-white/5 px-1.5 md:px-2 py-0.5 rounded mx-1.5 md:mx-2 shrink-0">VS</span>
                                                <span className="font-bold text-zinc-300 w-2/5 text-left truncate">{m.awayTeam}</span>
                                            </div>
                                            <span className="text-[8px] md:text-[9px] text-zinc-600 text-center mt-1 uppercase tracking-wider pr-10">{formatDisplayDate(m.date)}</span>
                                        </div>
                                    ))}
                                    {bankMatches.length === 0 && (
                                        <div className="h-full min-h-[80px] md:min-h-[100px] flex items-center justify-center text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl p-4">
                                            <p className="text-xs">Usa el generador arriba para importar partidos aquí.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: Jornada Final */}
                        <div className="space-y-4 md:space-y-6 flex flex-col h-full max-h-auto">
                            <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl shadow-lg border border-white/5 flex-1 flex flex-col relative overflow-hidden"
                                onDrop={(e) => handleDrop(e, 'selected')}
                                onDragOver={handleDragOver}
                            >
                                {/* Active background glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-pool-green/5 rounded-full blur-[80px] pointer-events-none"></div>

                                <div className="flex justify-between items-center mb-3 md:mb-4 shrink-0 relative z-10">
                                    <h2 className="text-xs font-bold text-pool-green uppercase flex items-center gap-2"><span className="w-6 h-6 rounded bg-pool-green text-[#020617] flex items-center justify-center text-[10px]">2</span> Jornada Final</h2>
                                    <span className="text-[10px] text-white bg-pool-green/20 px-2 py-1 rounded-full font-bold">{selectedMatches.length} partidos</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 md:pr-2 relative z-10 pb-4">
                                    {selectedMatches.map((m, idx) => (
                                        <div
                                            key={idx}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, 'selected', idx)}
                                            onDoubleClick={() => moveToBank(idx)}
                                            className="group relative flex flex-col p-2.5 md:p-3 bg-black/60 backdrop-blur-sm rounded-lg border border-white/5 cursor-grab active:cursor-grabbing hover:border-pool-green shadow-sm"
                                        >
                                            <button onClick={() => moveToBank(idx)} className="absolute -top-2 -right-2 w-6 h-6 md:w-5 md:h-5 bg-red-500 text-white rounded-full text-sm md:text-xs font-black shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">×</button>
                                            <div className="flex justify-between items-center text-xs md:text-sm">
                                                <span className="font-bold text-white w-2/5 text-right truncate">{m.homeTeam}</span>
                                                <span className="text-[9px] text-zinc-500 font-bold bg-white/5 px-1.5 md:px-2 py-0.5 rounded mx-1.5 md:mx-2 shrink-0">VS</span>
                                                <span className="font-bold text-white w-2/5 text-left truncate">{m.awayTeam}</span>
                                            </div>
                                            <span className="text-[8px] md:text-[9px] text-zinc-400 text-center mt-1 uppercase tracking-wider">{formatDisplayDate(m.date)}</span>
                                        </div>
                                    ))}
                                    {selectedMatches.length === 0 && (
                                        <div className="h-full min-h-[160px] md:min-h-[200px] flex items-center justify-center text-zinc-600 border-2 border-dashed border-pool-green/20 rounded-xl p-6 md:p-8 text-center bg-black/20">
                                            <div className="max-w-[200px]">
                                                <Trophy className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 opacity-20 text-pool-green" />
                                                <p className="text-xs">Arrastra o toca + para mover partidos desde el Banco hacia aquí.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => setShowPublishModal(true)} disabled={selectedMatches.length === 0 || loading} className="shrink-0 mt-4 w-full bg-pool-green text-zinc-500 font-black py-3.5 md:py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:text-zinc-100 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />} Publicar {selectedMatches.length} Partidos
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'results' && <ResultsEditor />}
                {tab === 'participants' && <ParticipantsEditor />}
                {tab === 'manual-entry' && <ManualEntryEditor />}
                {tab === 'history' && <HistoryViewer />}

                {/* Publish Confirmation Modal */}
                <Modal
                    isOpen={showPublishModal}
                    onClose={() => setShowPublishModal(false)}
                    title="Confirmar Publicación"
                >
                    <div className="space-y-4">
                        <p className="text-zinc-300 text-sm">
                            Estás a punto de publicar la jornada <strong>"{weekName}"</strong> con {draft?.parsedMatches.length} partidos.
                        </p>
                        <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Precio:</span>
                                <span className="font-bold text-white">${price}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Gastos:</span>
                                <span className="font-bold text-white">${adminFee}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowPublishModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={loading}
                                className="flex-1 bg-pool-green text-zinc-500 font-bold px-4 py-3 rounded-xl hover:bg-emerald-400 hover:text-black transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmar y Publicar
                            </button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}

function ResultsEditor() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [week, setWeek] = useState<any | null>(null);
    const [weekId, setWeekId] = useState<string | null>(null);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [autoLeague, setAutoLeague] = useState('liga-mx');
    const [isScrapingResults, setIsScrapingResults] = useState(false);

    const fetchData = async () => {
        try {
            const weeks = await api.weeks.getAll();
            const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
            if (sorted.length > 0) {
                const currentWeek = sorted[0];
                setWeekId(currentWeek.id);
                setWeek(currentWeek);
                setMatches(currentWeek.matches);
                setHasChanges(false);

                const parts = await api.picks.getByWeek(currentWeek.id);
                setParticipantsCount(parts.length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLocalUpdate = (matchId: string, home: number, away: number) => {
        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return { ...m, result: { homeScore: home, awayScore: away, outcome: home > away ? 'L' : away > home ? 'V' : 'E' }, status: 'FINISHED' };
            }
            return m;
        }));
        setHasChanges(true);
    };

    const handleToggleStatus = (m: Match) => {
        let newStatus: MatchStatus = 'SCHEDULED';
        if (m.status === 'SCHEDULED') newStatus = 'FINISHED';
        if (m.status === 'FINISHED') newStatus = 'POSTPONED';
        if (m.status === 'POSTPONED') newStatus = 'SCHEDULED';

        setMatches(prev => prev.map(match => {
            if (match.id === m.id) {
                return { ...match, status: newStatus };
            }
            return match;
        }));
        setHasChanges(true);
    };

    const handleSaveAll = async () => {
        if (!weekId) return;
        setSaving(true);
        try {
            const updates = matches.map(m => ({
                matchId: m.id,
                homeScore: m.result?.homeScore || 0,
                awayScore: m.result?.awayScore || 0,
                status: m.status
            }));

            await api.weeks.updateMatches(weekId, updates);
            toast.success('Resultados guardados correctamente');
            setHasChanges(false);
            // Reload data to verify persistence immediately
            await fetchData();
        } catch (e) {
            toast.error('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoScrapeResults = async () => {
        setIsScrapingResults(true);
        try {
            const scrapedMatches = await api.scraper.getMatches(autoLeague);
            if (!scrapedMatches || scrapedMatches.length === 0) {
                toast.error('No se encontraron resultados en ESPN para esta liga.');
                return;
            }

            let matchesUpdated = 0;

            // Map the scraped scores to our existing matches based on team names
            const newMatches = [...matches];

            // Helper to remove accents, spaces, and punctuation for bulletproof matching
            const normalize = (s: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "") : "";

            newMatches.forEach(m => {
                // Try to find the match in the scraped data by matching home or away team roughly
                const homeNorm = normalize(m.homeTeam);
                const awayNorm = normalize(m.awayTeam);

                const scrapedMatch = scrapedMatches.find(sm => {
                    const smHome = normalize(sm.homeTeam);
                    const smAway = normalize(sm.awayTeam);

                    const isHomeMatch = homeNorm.includes(smHome) || smHome.includes(homeNorm);
                    const isAwayMatch = awayNorm.includes(smAway) || smAway.includes(awayNorm);

                    return isHomeMatch || isAwayMatch;
                });

                if (scrapedMatch && scrapedMatch.homeScore !== undefined && scrapedMatch.awayScore !== undefined) {
                    // Update if the status is finished or if it has scores
                    const hScore = scrapedMatch.homeScore;
                    const aScore = scrapedMatch.awayScore;
                    const newStatus = scrapedMatch.status === 'FINISHED' ? 'FINISHED' : m.status;

                    const isDifferent = m.result?.homeScore !== hScore || m.result?.awayScore !== aScore || m.status !== newStatus;

                    if (isDifferent) {
                        m.result = {
                            homeScore: hScore,
                            awayScore: aScore,
                            outcome: hScore > aScore ? 'L' : aScore > hScore ? 'V' : 'E'
                        };
                        m.status = newStatus;
                        matchesUpdated++;
                    }
                }
            });

            setMatches(newMatches);

            if (matchesUpdated > 0) {
                setHasChanges(true);
                toast.success(`Se actualizaron ${matchesUpdated} marcadores automáticamente. Recuerda GUARDAR.`);
            } else {
                toast.warning('No se encontraron marcadores nuevos para estos equipos.');
            }

        } catch (e) {
            toast.error('Error al descargar marcadores: ' + String(e));
        } finally {
            setIsScrapingResults(false);
        }
    };

    const handleUpdateFee = async (newFee: number) => {
        if (!weekId) return;
        try {
            setWeek((prev: any) => ({ ...prev, adminFee: newFee }));
            await api.weeks.update(weekId, { adminFee: newFee });
        } catch (e) {
            toast.error('Error actualizando fee');
            fetchData();
        }
    };

    if (matches.length === 0) return <div className="text-center text-zinc-500 py-12">No hay partidos cargados.</div>;

    const totalPot = participantsCount * (week?.price || 0);
    const realPrize = totalPot - (week?.adminFee || 0);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Prize Management Section */}
            <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div>
                    <label className="block text-[10px] md:text-xs font-bold text-zinc-500 mb-2 uppercase">Recaudado ({participantsCount})</label>
                    <div className="text-xl md:text-2xl font-black text-white bg-[#09090b] p-3 rounded-lg border border-white/5 flex items-center gap-2">
                        <span className="text-zinc-500 text-sm md:text-base">$</span>
                        {totalPot.toLocaleString()}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] md:text-xs font-bold text-pool-accent mb-2 uppercase">Gastos</label>
                    <div className="relative">
                        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
                        <input
                            type="number"
                            value={week?.adminFee || 0}
                            onChange={(e) => handleUpdateFee(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#09090b] text-white text-lg md:text-xl font-bold border border-pool-accent/50 rounded-lg p-3 pl-7 md:pl-8 focus:border-pool-green outline-none transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] md:text-xs font-bold text-emerald-400 mb-2 uppercase">Premio Real</label>
                    <div className="text-2xl md:text-3xl font-black text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 flex items-center gap-2">
                        <span className="text-emerald-500/50 text-lg md:text-xl">$</span>
                        {realPrize.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl relative">
                {/* Header: stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Capturar Marcadores
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-[#09090b] rounded-lg border border-white/5 overflow-hidden">
                            <select value={autoLeague} onChange={e => setAutoLeague(e.target.value)} className="bg-transparent text-white text-xs font-bold px-2 py-1.5 outline-none border-r border-white/5">
                                <option value="liga-mx">Liga MX</option>
                                <option value="champions-league">Champions</option>
                                <option value="premier-league">Premier</option>
                            </select>
                            <button
                                onClick={handleAutoScrapeResults}
                                disabled={isScrapingResults}
                                className="text-xs font-bold px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors flex items-center gap-1.5"
                            >
                                {isScrapingResults ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ESPN'}
                            </button>
                        </div>
                        {hasChanges && (
                            <span className="text-[10px] font-bold text-amber-500 animate-pulse">
                                ⚠ Sin guardar
                            </span>
                        )}
                        <button
                            onClick={handleSaveAll}
                            disabled={!hasChanges || saving}
                            className={cn(
                                "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                                hasChanges
                                    ? "bg-pool-green text-[#020617] hover:bg-emerald-400 shadow-lg shadow-pool-green/20"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            )}
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Guardar
                        </button>
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4 mb-4">
                    {matches.map(m => (
                        <div key={m.id} className="bg-[#09090b] p-3 md:p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                            {/* Match row: team - score - status - score - team */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white text-xs md:text-sm flex-1 text-right truncate">{m.homeTeam}</span>
                                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                    <div className="bg-zinc-800 rounded-lg p-1 w-10 md:w-12 text-center">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent text-center text-white font-bold outline-none text-sm"
                                            value={m.result?.homeScore || 0}
                                            onChange={(e) => handleLocalUpdate(m.id, parseInt(e.target.value) || 0, m.result?.awayScore || 0)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus(m)}
                                        className="focus:outline-none hover:scale-110 transition-transform p-0.5"
                                        title={m.status === 'FINISHED' ? 'Finalizado' : m.status === 'POSTPONED' ? 'Suspendido' : 'Pendiente'}
                                    >
                                        {m.status === 'FINISHED' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        ) : m.status === 'POSTPONED' ? (
                                            <AlertTriangle className="w-5 h-5 text-zinc-500" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-zinc-600" />
                                        )}
                                    </button>
                                    <div className="bg-zinc-800 rounded-lg p-1 w-10 md:w-12 text-center">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent text-center text-white font-bold outline-none text-sm"
                                            value={m.result?.awayScore || 0}
                                            onChange={(e) => handleLocalUpdate(m.id, m.result?.homeScore || 0, parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <span className="font-bold text-white text-xs md:text-sm flex-1 text-left truncate">{m.awayTeam}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ParticipantsEditor({ weekId: propWeekId }: { weekId?: string }) {
    const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
    const [weekId, setWeekId] = useState<string | null>(propWeekId || null);
    const [hideUnpaid, setHideUnpaid] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editingPart, setEditingPart] = useState<ParticipantEntry | null>(null);
    const [editName, setEditName] = useState('');
    const [editGoals, setEditGoals] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (propWeekId) {
                // Load specific week logic
                setWeekId(propWeekId);
                const week = await api.weeks.getOne(propWeekId);
                setHideUnpaid(!!week.hideUnpaid);
                const parts = await api.picks.getAdminByWeek(propWeekId);
                setParticipants(parts.sort((a, b) => b.submittedAt - a.submittedAt));
            } else {
                // Load active/latest week logic 
                const weeks = await api.weeks.getAll();
                const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
                if (sorted.length > 0) {
                    const active = sorted.find(w => w.status === 'OPEN') || sorted[0];
                    setWeekId(active.id);
                    setHideUnpaid(!!active.hideUnpaid);

                    const parts = await api.picks.getAdminByWeek(active.id);
                    setParticipants(parts.sort((a, b) => b.submittedAt - a.submittedAt));
                }
            }
        } catch (e) {
            toast.error('Error cargando participantes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Re-fetch when prop changes
        fetchData();
    }, [propWeekId]);

    const togglePayment = async (p: ParticipantEntry) => {
        try {
            const updated = await api.picks.togglePayment(p.id);
            setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, paymentStatus: updated.paymentStatus } : item));
        } catch (e) {
            toast.error('Error cambiando estado de pago');
        }
    };

    const toggleVisibility = async () => {
        if (!weekId) return;
        try {
            const newVal = !hideUnpaid;
            await api.weeks.toggleVisibility(weekId, newVal);
            setHideUnpaid(newVal);
        } catch (e) {
            toast.error('Error cambiando visibilidad');
        }
    };

    const deleteParticipant = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este participante permanentemente?')) return;
        try {
            await api.picks.delete(id);
            setParticipants(prev => prev.filter(p => p.id !== id));
            toast.success('Participante eliminado con éxito');
        } catch (e) {
            toast.error('Error eliminando participante');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingPart || !editName.trim()) return;
        setSavingEdit(true);
        try {
            const updated = await api.picks.update(editingPart.id, {
                participantName: editName.trim(),
                totalGoalsPrediction: parseInt(editGoals) || 0
            });
            setParticipants(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
            toast.success('Participante actualizado');
            setEditingPart(null);
        } catch (e) {
            toast.error('Error al actualizar participante');
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading && participants.length === 0) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-pool-green" /></div>;

    if (!weekId) return <div className="text-zinc-500 text-center py-12">No hay jornada activa.</div>;

    return (
        <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
                <h2 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Gestión de Participantes
                </h2>

                <button
                    onClick={toggleVisibility}
                    className={cn(
                        "px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border w-fit",
                        hideUnpaid
                            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                >
                    {hideUnpaid ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {hideUnpaid ? "Ocultando No Pagados" : "Mostrando Todos"}
                </button>
            </div>

            <div className="space-y-2.5 md:space-y-3">
                {participants.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">No hay participantes aún.</div>
                ) : (
                    participants.map(p => (
                        <div key={p.id} className="bg-[#09090b] p-3 md:p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                            {/* Mobile: stack vertically. Desktop: single row */}
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0", p.paymentStatus === 'PAID' ? "bg-emerald-600" : "bg-zinc-800")}>
                                    {p.participantName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <p className="font-bold text-white text-sm truncate">{p.participantName}</p>
                                        {p.hasAcceptedRules && (
                                            <span title="Aceptó términos" className="flex shrink-0">
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                            </span>
                                        )}
                                        {p.appVersion ? (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono tracking-wider border border-emerald-500/20" title="Versión enviada">{p.appVersion}</span>
                                        ) : (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 font-mono tracking-wider border border-red-500/20" title="Versión antigua - Sin registro">v1.x</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{new Date(p.submittedAt).toLocaleDateString()}</p>
                                    {(p.userEmail || p.phoneNumber) && (
                                        <div className="text-[10px] text-zinc-400 mt-1 truncate">
                                            {p.userEmail && <p> {p.userEmail}</p>}
                                            {p.phoneNumber && <p> {p.phoneNumber}</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                    <button
                                        onClick={() => togglePayment(p)}
                                        className={cn(
                                            "px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 md:gap-1.5 transition-all border",
                                            p.paymentStatus === 'PAID'
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                                        )}
                                    >
                                        {p.paymentStatus === 'PAID' ? (
                                            <><CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Pagado</span><span className="sm:hidden">✓</span></>
                                        ) : (
                                            <><DollarSign className="w-3 h-3" /> <span className="hidden sm:inline">Pendiente</span><span className="sm:hidden">$</span></>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setEditingPart(p);
                                            setEditName(p.participantName);
                                            setEditGoals(String(p.totalGoalsPrediction || 0));
                                        }}
                                        className="p-1.5 md:p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                        title="Editar Participante"
                                    >
                                        <PenTool className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>

                                    <button
                                        onClick={() => deleteParticipant(p.id)}
                                        className="p-1.5 md:p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Eliminar Participante"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={!!editingPart}
                onClose={() => setEditingPart(null)}
                title="Editar Participante"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nombre</label>
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#09090b] text-white p-3 border border-zinc-800 rounded-xl focus:border-pool-green outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Goles Totales (Desempate)</label>
                        <input
                            type="number"
                            value={editGoals}
                            onChange={(e) => setEditGoals(e.target.value)}
                            className="w-full bg-[#09090b] text-white p-3 border border-zinc-800 rounded-xl focus:border-pool-green outline-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setEditingPart(null)}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit || !editName.trim()}
                            className="flex-1 bg-pool-green text-[#020617] font-bold px-4 py-3 rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                        >
                            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

function ManualEntryEditor() {
    const [name, setName] = useState("");
    const [goals, setGoals] = useState<string>("");
    const [picks, setPicks] = useState<Record<string, any>>({}); // any for MatchOutcome mapping
    const [loading, setLoading] = useState(false);

    // Data state
    const [matches, setMatches] = useState<Match[]>([]);
    const [weekID, setWeekID] = useState<string | null>(null);

    useEffect(() => {
        // Load latest week regardless of status (OPEN or CLOSED)
        api.weeks.getAll().then(weeks => {
            const sorted = weeks.sort((a, b) => b.createdAt - a.createdAt);
            if (sorted.length > 0) {
                const latest = sorted[0];
                setWeekID(latest.id);
                setMatches(latest.matches);
            }
        });
    }, []);

    const handleSelect = (matchId: string, selection: any) => {
        setPicks(prev => ({ ...prev, [matchId]: selection }));
    };

    const isComplete = name.trim().length > 0 && goals !== "" && matches.every(m => picks[m.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete || !weekID) return;

        setLoading(true);
        const picksArray = Object.entries(picks).map(([matchId, selection]) => ({ matchId, selection }));

        try {
            await api.picks.adminSubmit({
                weekId: weekID,
                participantName: name.trim(),
                totalGoalsPrediction: parseInt(goals),
                picks: picksArray
            });
            toast.success("Registro manual exitoso");
            setName("");
            setGoals("");
            setPicks({});
        } catch (err: unknown) {
            toast.error("Error: " + String(err));
        } finally {
            setLoading(false);
        }
    };

    if (!weekID) return <div className="text-center py-12 text-zinc-500">Cargando jornada...</div>;

    return (
        <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase mb-5 md:mb-6 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Registro Manual (Admin)
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Participante</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#09090b] text-white p-3 rounded-lg border border-zinc-700 focus:border-pool-green outline-none" placeholder="Nombre" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Goles Totales</label>
                        <input type="number" value={goals} onChange={e => setGoals(e.target.value)} className="w-full bg-[#09090b] text-white p-3 rounded-lg border border-zinc-700 focus:border-pool-green outline-none" placeholder="0" />
                    </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 md:pr-2 border border-white/5 rounded-xl p-2 bg-[#09090b]/50">
                    {matches.map(m => (
                        <div key={m.id} className="flex items-center gap-2 text-xs p-2.5 md:p-2 bg-[#09090b] rounded border border-white/5">
                            <span className="font-bold text-zinc-300 flex-1 text-right truncate text-[11px] md:text-xs">{m.homeTeam}</span>
                            <div className="flex gap-1 shrink-0">
                                {(['L', 'E', 'V'] as const).map(opt => (
                                    <button
                                        type="button"
                                        key={opt}
                                        onClick={() => handleSelect(m.id, opt)}
                                        className={cn(
                                            "w-8 h-8 rounded font-black transition-colors border text-xs",
                                            picks[m.id] === opt
                                                ? "bg-pool-green text-black border-pool-green"
                                                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <span className="font-bold text-zinc-300 flex-1 text-left truncate text-[11px] md:text-xs">{m.awayTeam}</span>
                        </div>
                    ))}
                </div>

                <button disabled={!isComplete || loading} className="w-full bg-pool-green text-black font-black py-3.5 md:py-4 rounded-xl disabled:opacity-50 hover:bg-emerald-400 transition-colors text-sm md:text-base">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Registrar Quiniela"}
                </button>
            </form>
        </div>
    );
}

function HistoryViewer() {
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);

    const fetchWeeks = async () => {
        setLoading(true);
        try {
            const data = await api.weeks.getAll();
            setWeeks(data.sort((a, b) => b.createdAt - a.createdAt));
        } catch (e) {
            toast.error('Error cargando historial');
        } finally {
            setLoading(false);
        }
    };

    const handleExportWeek = async (week: Week) => {
        setExportingId(week.id);
        try {
            const rawParts = await api.picks.getAdminByWeek(week.id);
            const paidParts = rawParts.filter(p => p.paymentStatus === 'PAID');
            
            if (paidParts.length === 0) {
                toast.error('No hay participantes pagados en esta jornada.');
                setExportingId(null);
                return;
            }

            const totalGoals = week.matches.reduce((acc, m) => {
                if (m.status === 'FINISHED' && m.result) {
                    return acc + m.result.homeScore + m.result.awayScore;
                }
                return acc;
            }, 0);

            const participants = paidParts.map(p => {
                let score = 0;
                const hits: string[] = [];
                p.picks.forEach(pick => {
                    const match = week.matches.find(m => m.id === pick.matchId);
                    if (match && match.status === 'FINISHED' && match.result?.outcome === pick.selection) {
                        score++;
                        hits.push(match.id);
                    }
                });
                return { ...p, score, hits };
            });

            const prizePot = (participants.length * (week.price || 0)) - (week.adminFee || 0);
            const finalPot = prizePot > 0 ? prizePot : 0;

            await exportScoreboardToExcel(
                participants,
                week.matches,
                week.name,
                totalGoals,
                finalPot
            );
            toast.success('Excel generado correctamente');
        } catch (e) {
            console.error(e);
            toast.error('Error al exportar histórico');
        } finally {
            setExportingId(null);
        }
    };

    useEffect(() => {
        fetchWeeks();
    }, []);

    const handleDeleteWeek = async (id: string, name: string) => {
        if (!confirm(`¿Estás SEGURO de querer borrar la jornada "${name}"? Esta acción es irreversible y podría causar inconsistencias si la jornada está activa.`)) return;

        setLoading(true);
        try {
            await api.weeks.delete(id);
            toast.success(`Jornada "${name}" eliminada correctamente`);
            if (selectedWeekId === id) setSelectedWeekId(null);
            await fetchWeeks(); // Reload
        } catch (e) {
            toast.error('Error al eliminar jornada: ' + String(e));
        } finally {
            setLoading(false);
        }
    };

    if (selectedWeekId) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <button
                    onClick={() => setSelectedWeekId(null)}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Volver al Historial
                </button>
                <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 mb-4">
                    <h2 className="text-xl font-black text-white">{weeks.find(w => w.id === selectedWeekId)?.name}</h2>
                </div>
                <ParticipantsEditor weekId={selectedWeekId} />
            </div>
        );
    }

    return (
        <div className="bg-[#18181b] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase mb-5 md:mb-6 flex items-center gap-2">
                <History className="w-4 h-4" />
                Historial de Jornadas
            </h2>

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pool-green" /></div>
            ) : (
                <>
                    {/* Desktop: Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase">
                                    <th className="p-4">Jornada</th>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-center">Partidos</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {weeks.map(week => (
                                    <tr key={week.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-white">{week.name}</td>
                                        <td className="p-4 text-zinc-400">{new Date(week.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider",
                                                week.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                                            )}>
                                                {week.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-zinc-400 font-mono">{week.matches?.length || 0}</td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleExportWeek(week)}
                                                disabled={exportingId === week.id}
                                                className="px-3 py-1.5 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                                                title="Exportar a Excel"
                                            >
                                                {exportingId === week.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                Excel
                                            </button>
                                            <button
                                                onClick={() => setSelectedWeekId(week.id)}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Participantes
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWeek(week.id, week.name)}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
                                                title="Eliminar Jornada"
                                            >
                                                Borrar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile: Card list */}
                    <div className="md:hidden space-y-3">
                        {weeks.map(week => (
                            <div key={week.id} className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-white text-sm">{week.name}</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                        week.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                                    )}>
                                        {week.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                                    <span>{new Date(week.createdAt).toLocaleDateString()}</span>
                                    <span className="font-mono">{week.matches?.length || 0} partidos</span>
                                </div>
                                <div className="flex gap-2 text-center items-stretch h-8">
                                    <button
                                        onClick={() => handleExportWeek(week)}
                                        disabled={exportingId === week.id}
                                        className="w-10 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] rounded-lg text-xs font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                                        title="Exportar a Excel"
                                    >
                                        {exportingId === week.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setSelectedWeekId(week.id)}
                                        className="flex-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                                    >
                                        Participantes
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWeek(week.id, week.name)}
                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
                                        title="Eliminar Jornada"
                                    >
                                        Borrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
