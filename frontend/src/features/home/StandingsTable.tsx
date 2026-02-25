import { useEffect, useState } from 'react';
import { apiScraper } from '../../lib/api-scraper';
import type { StandingsResponse } from '../../lib/api-scraper';
import { Loader2, AlertCircle } from 'lucide-react';

interface StandingsTableProps {
    league?: string;
}

export default function StandingsTable({ league }: StandingsTableProps) {
    const [standingsInfo, setStandingsInfo] = useState<StandingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                // League 262 is typical for Liga MX. Change if needed.
                // 2024 is the current/recent season depending on API availability.
                const data = await apiScraper.getStandings(league);
                if (data && data.league && data.league.standings && data.league.standings.length > 0) {
                    setStandingsInfo(data);
                } else {
                    setError("No se encontraron resultados de la tabla.");
                }
            } catch (err) {
                setError("Error al cargar la tabla de posiciones.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [league]);

    if (loading) {
        return (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin mb-4" />
                <p className="text-zinc-500 font-medium text-sm">Cargando tabla de posiciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <p className="text-white font-medium">{error}</p>
                <p className="text-zinc-500 text-sm mt-2">Verifica la API key o la conexión a internet.</p>
            </div>
        );
    }

    if (!standingsInfo || !standingsInfo.league.standings[0]) return null;

    const standingsGroup: any[] = standingsInfo.league.standings[0];

    return (
        <div className="w-[80%] mx-auto bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>

            <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <img
                        src={standingsInfo.league.logo}
                        alt={standingsInfo.league.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Tabla General</h3>
                        <p className="text-xs font-bold text-[#22c55e] uppercase tracking-wider">
                            {standingsInfo.league.name}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto relative z-10 w-full no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-8 sm:w-12">Pos</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3">Club</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-8 sm:w-12" title="Partidos Jugados">PJ</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-12 hidden sm:table-cell" title="Goles a Favor">GF</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-12 hidden sm:table-cell" title="Goles en Contra">GC</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-8 sm:w-12" title="Diferencia de Goles">DG</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-10 sm:w-16 text-[#22c55e]">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standingsGroup.map((team) => (
                            <tr
                                key={team.team.id}
                                className="border-b border-zinc-800/50 hover:bg-zinc-800/80 transition-colors group"
                            >
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                    <span className={`text-xs font-bold ${team.rank <= 4 ? 'text-[#22c55e]' : team.rank <= 10 ? 'text-[#fbbf24]' : 'text-zinc-500'}`}>
                                        {team.rank}
                                    </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <img
                                            src={team.team.logo}
                                            alt={team.team.name}
                                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                            loading="lazy"
                                        />
                                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#22c55e] transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                                            {team.team.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-zinc-400 font-mono">
                                    {team.all.played}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-zinc-400 font-mono hidden sm:table-cell">
                                    {team.all.goals.for}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-zinc-400 font-mono hidden sm:table-cell">
                                    {team.all.goals.against}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-mono">
                                    <span className={team.goalsDiff > 0 ? 'text-[#22c55e]' : team.goalsDiff < 0 ? 'text-red-400' : 'text-zinc-500'}>
                                        {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                                    </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                    <span className="text-sm font-black text-white font-mono">
                                        {team.points}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-600 font-mono">
                    Última actualización: {standingsInfo.league.standings[0]?.[0]?.update ? new Date(standingsInfo.league.standings[0][0].update).toLocaleDateString() : 'N/A'}
                </p>
            </div>
        </div>
    );
}
