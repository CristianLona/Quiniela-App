
// MANUAL MODE:
// Use local files in /public/teams/ for 100% reliability.
// Images should be PNG or SVG.

export const TEAMS_LOGOS: Record<string, string> = {
    // Grandes
    "América": "/teams/america.png",
    "America": "/teams/america.png",
    "Guadalajara": "/teams/chivas.png",
    "Chivas": "/teams/chivas.png",
    "Cruz Azul": "/teams/cruzazul.png",
    "Pumas": "/teams/pumas.png",
    "UNAM": "/teams/pumas.png",

    // Norte
    "Monterrey": "/teams/monterrey.png",
    "Rayados": "/teams/monterrey.png",
    "Tigres": "/teams/tigres.png",
    "UANL": "/teams/tigres.png",
    "Santos": "/teams/santos.png",
    "Santos Laguna": "/teams/santos.png",
    "Tijuana": "/teams/xolos.png",
    "Xolos": "/teams/xolos.png",
    "Juárez": "/teams/juarez.png",
    "Juarez": "/teams/juarez.png",
    "Bravos": "/teams/juarez.png",

    // Centro / Otros
    "Toluca": "/teams/toluca.png",
    "Pachuca": "/teams/pachuca.png",
    "León": "/teams/leon.png",
    "Leon": "/teams/leon.png",
    "Atlas": "/teams/atlas.png",
    "Puebla": "/teams/puebla.png",
    "Necaxa": "/teams/necaxa.png",
    "San Luis": "/teams/sanluis.png",
    "Atlético San Luis": "/teams/sanluis.png",
    "Querétaro": "/teams/queretaro.png",
    "Queretaro": "/teams/queretaro.png",
    "Gallos": "/teams/queretaro.png",
    "Mazatlán": "/teams/mazatlan.png",
    "Mazatlan": "/teams/mazatlan.png",
};

export function getTeamLogo(teamName: string): string | null {
    if (TEAMS_LOGOS[teamName]) return TEAMS_LOGOS[teamName];

    // Try Case Insensitive
    const key = Object.keys(TEAMS_LOGOS).find(k => k.toLowerCase() === teamName.toLowerCase());
    if (key) return TEAMS_LOGOS[key];

    // Try partial match
    const partial = Object.keys(TEAMS_LOGOS).find(k => teamName.toLowerCase().includes(k.toLowerCase()));
    if (partial) return TEAMS_LOGOS[partial];

    return null;
}
