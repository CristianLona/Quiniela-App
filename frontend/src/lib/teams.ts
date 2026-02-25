
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

    // Premier League
    "West Ham": "/teams/west-ham-united.png",
    "West Ham United": "/teams/west-ham-united.png",
    "Sunderland": "/teams/sunderland.png",
    "Burnley": "/teams/burnley.png",
    "Tottenham": "/teams/tottenham.png",
    "Tottenham Hotspur": "/teams/tottenham.png",
    "Fulham": "/teams/fulham.png",
    "Brighton": "/teams/brighton.png",
    "Brighton and Hove Albion": "/teams/brighton.png",
    "Man City": "/teams/manchester-city.png",
    "Manchester City": "/teams/manchester-city.png",
    "Wolves": "/teams/wolverhampton.png",
    "Wolverhampton": "/teams/wolverhampton.png",
    "Wolverhampton Wanderers": "/teams/wolverhampton.png",
    "Bournemouth": "/teams/bournemouth.png",
    "Liverpool": "/teams/liverpool.png",
    "Brentford": "/teams/brentford.png",
    "Nottingham": "/teams/nottingham-forest.png",
    "Nottingham Forest": "/teams/nottingham-forest.png",
    "Crystal Palace": "/teams/crystal-palace.png",
    "Chelsea": "/teams/chelsea.png",
    "Newcastle": "/teams/newcastle.png",
    "Newcastle United": "/teams/newcastle.png",
    "Aston Villa": "/teams/aston-villa.png",
    "Arsenal": "/teams/arsenal.png",
    "Man Utd": "/teams/manchester-united.png",
    "Manchester United": "/teams/manchester-united.png",
    "Everton": "/teams/everton.png",
    "Luton": "/teams/luton.png",
    "Luton Town": "/teams/luton.png",
    "Sheffield": "/teams/sheffield.png",
    "Sheffield United": "/teams/sheffield.png",
    "Leicester City": "/teams/leicester.png",
    "Southampton": "/teams/southampton.png",
    "Ipswich Town": "/teams/ipswich.png",

    // Champions League / Rest of Europe
    "Paris Saint-Germain": "/teams/psg.png",
    "Internazionale": "/teams/inter.png",
    "Inter Milan": "/teams/inter.png",
    "Borussia Dortmund": "/teams/dortmund.png",
    "Bayer Leverkusen": "/teams/leverkusen.png",
    "Atlético Madrid": "/teams/atletico-madrid.png",
    "Atletico Madrid": "/teams/atletico-madrid.png",
    "Real Madrid": "/teams/real-madrid.png",
    "FC Barcelona": "/teams/barcelona.png",
    "Barcelona": "/teams/barcelona.png",
    "Bayern Munich": "/teams/bayern-munich.png",
    "Club Brugge": "/teams/brugge.png",
    "AS Monaco": "/teams/monaco.png",
    "FK Qarabag": "/teams/qarabag.png",
    "Sporting CP": "/teams/sporting.png",
    "Sporting Lisbon": "/teams/sporting.png",
    "RB Leipzig": "/teams/leipzig.png",
    "Red Bull Salzburg": "/teams/salzburg.png",
    "Shakhtar Donetsk": "/teams/shakhtar.png",
    "BSC Young Boys": "/teams/young-boys.png",
    "Crvena Zvezda": "/teams/estrella-roja.png",
    "Red Star Belgrade": "/teams/estrella-roja.png",
    "Galatasaray": "/teams/galatasaray.png",
    "Juventus": "/teams/juventus.png",
    "Atalanta": "/teams/atalanta.png",
    "Bodo/Glimt": "/teams/bodo-glimt.png",
    "PSV Eindhoven": "/teams/psv.png",
    "Feyenoord": "/teams/feyenoord.png",
    "Girona": "/teams/girona.png",
    "Stuttgart": "/teams/stuttgart.png",
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

export const SHORT_NAMES: Record<string, string> = {
    // Premier League
    "Wolverhampton Wanderers": "Wolves",
    "Brighton and Hove Albion": "Brighton",
    "Tottenham Hotspur": "Spurs",
    "Manchester United": "Man Utd",
    "Manchester City": "Man City",
    "Nottingham Forest": "Forest",
    "West Ham United": "West Ham",
    "Newcastle United": "Newcastle",
    "Sheffield United": "Sheffield",
    "Luton Town": "Luton",
    "Crystal Palace": "Palace",
    "Aston Villa": "Villa",
    "Bournemouth": "Bournemouth",
    "Brentford": "Brentford",

    // Champions League / Rest of Europe
    "Paris Saint-Germain": "PSG",
    "Internazionale": "Inter",
    "Inter Milan": "Inter",
    "Borussia Dortmund": "Dortmund",
    "Bayer Leverkusen": "Leverkusen",
    "Atlético Madrid": "Atlético",
    "Atletico Madrid": "Atlético",
    "Real Madrid": "R. Madrid",
    "FC Barcelona": "Barça",
    "Barcelona": "Barça",
    "Bayern Munich": "Bayern",
    "Club Brugge": "Brugge",
    "AS Monaco": "Monaco",
    "FK Qarabag": "Qarabag",
    "Sporting CP": "Sporting",
    "Sporting Lisbon": "Sporting",
    "RB Leipzig": "Leipzig",
    "Red Bull Salzburg": "Salzburg",
    "Shakhtar Donetsk": "Shakhtar",
    "BSC Young Boys": "Young Boys",
    "Crvena Zvezda": "Estrella Roja",
    "Red Star Belgrade": "Estrella Roja",
    "Galatasaray": "Galatasaray",
    "Juventus": "Juve",
    "Atalanta": "Atalanta",
    "Bodo/Glimt": "Bodo/Glimt",
    "PSV Eindhoven": "PSV",
    "Feyenoord": "Feyenoord",
    "Girona": "Girona",
    "Stuttgart": "Stuttgart",

    // Liga MX
    "Pumas UNAM": "Pumas",
    "Club América": "América",
    "Santos Laguna": "Santos",
    "Atlético de San Luis": "San Luis",
    "Mazatlán FC": "Mazatlán",
    "Tigres UANL": "Tigres",
    "Rayados de Monterrey": "Monterrey",
    "Guadalajara": "Chivas",
    "Gallos Blancos de Querétaro": "Querétaro",
    "Xolos de Tijuana": "Tijuana",
};

export function getShortName(name: string): string {
    if (SHORT_NAMES[name]) return SHORT_NAMES[name];

    const normalizedKey = name.toLowerCase().replace(/ & /g, ' and ');
    const key = Object.keys(SHORT_NAMES).find(k => k.toLowerCase() === normalizedKey);

    return key ? SHORT_NAMES[key] : name;
}
