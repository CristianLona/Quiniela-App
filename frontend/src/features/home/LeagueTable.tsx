import { cn } from "../../lib/utils";
import { getTeamLogo } from "../../lib/teams";

// Mock Data representing a realistic Liga MX Table
const MOCK_STANDINGS = [
    { rank: 1, team: "Cruz Azul", mp: 17, w: 13, d: 3, l: 1, gf: 35, ga: 12, pts: 42, form: ['W', 'W', 'D', 'W', 'W'] },
    { rank: 2, team: "Toluca", mp: 17, w: 10, d: 5, l: 2, gf: 38, ga: 16, pts: 35, form: ['W', 'D', 'W', 'L', 'W'] },
    { rank: 3, team: "Tigres", mp: 17, w: 10, d: 4, l: 3, gf: 29, ga: 15, pts: 34, form: ['L', 'W', 'W', 'D', 'W'] },
    { rank: 4, team: "Pumas", mp: 17, w: 9, d: 4, l: 4, gf: 24, ga: 16, pts: 31, form: ['W', 'L', 'D', 'W', 'W'] },
    { rank: 5, team: "Monterrey", mp: 17, w: 9, d: 4, l: 4, gf: 26, ga: 19, pts: 31, form: ['D', 'W', 'L', 'W', 'D'] },
    { rank: 6, team: "San Luis", mp: 17, w: 9, d: 3, l: 5, gf: 27, ga: 19, pts: 30, form: ['W', 'D', 'W', 'L', 'W'] },
    { rank: 7, team: "Tijuana", mp: 17, w: 8, d: 5, l: 4, gf: 24, ga: 22, pts: 29, form: ['D', 'L', 'D', 'D', 'W'] },
    { rank: 8, team: "América", mp: 17, w: 8, d: 3, l: 6, gf: 27, ga: 21, pts: 27, form: ['L', 'W', 'D', 'W', 'W'] },
    { rank: 9, team: "Guadalajara", mp: 17, w: 7, d: 4, l: 6, gf: 22, ga: 15, pts: 25, form: ['L', 'D', 'L', 'W', 'L'] },
    { rank: 10, team: "Atlas", mp: 17, w: 5, d: 7, l: 5, gf: 17, ga: 23, pts: 22, form: ['D', 'D', 'L', 'D', 'D'] },
    { rank: 11, team: "León", mp: 17, w: 3, d: 9, l: 5, gf: 21, ga: 23, pts: 18, form: ['D', 'D', 'D', 'L', 'D'] },
    { rank: 12, team: "Juárez", mp: 17, w: 5, d: 2, l: 10, gf: 22, ga: 36, pts: 17, form: ['W', 'L', 'L', 'L', 'W'] },
    { rank: 13, team: "Necaxa", mp: 17, w: 3, d: 5, l: 9, gf: 19, ga: 29, pts: 14, form: ['L', 'D', 'L', 'L', 'L'] },
    { rank: 14, team: "Mazatlán", mp: 17, w: 2, d: 8, l: 7, gf: 10, ga: 19, pts: 14, form: ['D', 'D', 'L', 'D', 'L'] },
    { rank: 15, team: "Puebla", mp: 17, w: 4, d: 2, l: 11, gf: 17, ga: 31, pts: 14, form: ['L', 'L', 'L', 'L', 'W'] },
    { rank: 16, team: "Pachuca", mp: 17, w: 3, d: 4, l: 10, gf: 20, ga: 29, pts: 13, form: ['D', 'L', 'W', 'L', 'L'] },
    { rank: 17, team: "Querétaro", mp: 17, w: 3, d: 3, l: 11, gf: 13, ga: 31, pts: 12, form: ['L', 'L', 'W', 'L', 'L'] },
    { rank: 18, team: "Santos", mp: 17, w: 2, d: 4, l: 11, gf: 12, ga: 30, pts: 10, form: ['L', 'D', 'L', 'L', 'L'] },
];

export function LeagueTable() {
    return (
        <div className="w-full bg-[#111] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Header */}
            <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img
                        src="https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f98557bda0021f125d9cdb_liga-mx-footballlogos-org.svg"
                        alt="Liga MX"
                        className="w-8 h-8 object-contain"
                    />
                    <div>
                        <h3 className="text-white font-black text-sm uppercase tracking-wider">Tabla General</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Apertura 2024</p>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-pool-green uppercase bg-pool-green/10 px-2 py-1 rounded-full">
                    En Vivo
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/40 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                            <th className="p-3 text-center">#</th>
                            <th className="p-3 w-full">Club</th>
                            <th className="p-3 text-center">JJ</th>
                            <th className="p-3 text-center">DG</th>
                            <th className="p-3 text-center text-white">PTS</th>
                            <th className="p-3 text-center hidden md:table-cell">Forma</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {MOCK_STANDINGS.map((team, idx) => (
                            <tr key={team.team} className="hover:bg-white/5 transition-colors group">
                                <td className="p-3 text-center">
                                    <span className={cn(
                                        "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black",
                                        idx < 4 ? "bg-[#22c55e] text-black" :
                                            idx < 10 ? "bg-[#fbbf24] text-black" : "text-slate-500 bg-white/5"
                                    )}>
                                        {team.rank}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={getTeamLogo(team.team)}
                                            alt={team.team}
                                            className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                            {team.team}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-3 text-center text-xs text-slate-400 font-medium">{team.mp}</td>
                                <td className="p-3 text-center text-xs text-slate-400 font-medium">{team.gf - team.ga}</td>
                                <td className="p-3 text-center text-sm font-black text-white">{team.pts}</td>
                                <td className="p-3 hidden md:flex items-center justify-center gap-1">
                                    {team.form.map((res, i) => (
                                        <div key={i} className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            res === 'W' ? "bg-green-500" :
                                                res === 'D' ? "bg-slate-500" : "bg-red-500"
                                        )} />
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-black/20 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-600 uppercase border-t border-white/5">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Liguilla Directa</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Play-In</div>
            </div>
        </div>
    );
}
