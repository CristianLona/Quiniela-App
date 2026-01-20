const DAYS_REGEX = /(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|lun|mar|mié|mie|jue|vie|sáb|sab|dom)\.?/i;

function spanishDayToIndex(day) {
    const map = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3,
        'jueves': 4, 'viernes': 5, 'sábado': 6
    };
    if (day.includes('dom')) return 0;
    if (day.includes('lun')) return 1;
    if (day.includes('mar')) return 2;
    if (day.includes('mié') || day.includes('mie')) return 3;
    if (day.includes('jue')) return 4;
    if (day.includes('vie')) return 5;
    if (day.includes('sáb') || day.includes('sab')) return 6;
    return 0;
}

function parseSpanishDateString(dateString, refDate) {
    if (!dateString) return refDate.getTime();
    const dayMatch = dateString.match(DAYS_REGEX);
    if (!dayMatch) return refDate.getTime();
    const dayName = dayMatch[0].toLowerCase();
    const timeMatch = dateString.match(/(\d{1,2}):(\d{2})\s?(am|pm)?/i);
    let hours = 12;
    let minutes = 0;
    if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3]?.toLowerCase();
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
    }
    const targetDate = new Date(refDate);
    const currentDay = targetDate.getDay();
    const targetDayIndex = spanishDayToIndex(dayName);
    let dayDiff = targetDayIndex - currentDay;
    if (dayDiff < 0) dayDiff += 7;
    targetDate.setDate(targetDate.getDate() + dayDiff);
    targetDate.setHours(hours, minutes, 0, 0);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    const mexicoOffsetHours = 6;
    const utcDate = new Date(Date.UTC(y, m, d, hours + mexicoOffsetHours, minutes, 0));
    return utcDate.getTime();
}

function parseLineToMatchDraft(line, refDate = new Date()) {
    const cleanLine = line.trim();
    const vsSplit = cleanLine.split(/\s+vs\s+/i);
    if (vsSplit.length < 2) return null;

    const homeTeam = vsSplit[0].trim();
    let restOfLine = vsSplit[1].trim();

    let homePosition;
    let awayPosition;

    const posMatch = restOfLine.match(/\s+(\d+)\s+(\d+)$/);
    if (posMatch) {
        homePosition = parseInt(posMatch[1], 10);
        awayPosition = parseInt(posMatch[2], 10);
        restOfLine = restOfLine.substring(0, posMatch.index).trim();
    }

    const dayMatch = restOfLine.match(DAYS_REGEX);
    let awayTeam = restOfLine;
    let datePart = '';

    if (dayMatch && dayMatch.index !== undefined) {
        awayTeam = restOfLine.substring(0, dayMatch.index).trim();
        datePart = restOfLine.substring(dayMatch.index).trim();
    }

    const timestamp = parseSpanishDateString(datePart, refDate);

    return {
        homeTeam,
        awayTeam,
        date: new Date(timestamp).toISOString(),
        timestamp,
        status: 'SCHEDULED',
        homePosition,
        awayPosition,
    };
}

const lines = [
    "Puebla vs Toluca viernes 30-01 19:00 14 2",
    "Pumas UNAM vs Santos Laguna viernes 30-01 21:00 7 17"
];

lines.forEach(l => console.log(JSON.stringify(parseLineToMatchDraft(l), null, 2)));
