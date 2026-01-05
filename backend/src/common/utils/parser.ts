import { Match } from '../types';

const DAYS_REGEX = /(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i;

export function parseLineToMatchDraft(line: string, refDate: Date = new Date()): Partial<Match> | null {
    const cleanLine = line.trim();
    if (!cleanLine) return null;

    // 1. Split Home vs Rest
    const vsSplit = cleanLine.split(/\s+vs\s+/i);
    if (vsSplit.length < 2) return null;

    const homeTeam = vsSplit[0].trim();
    const restOfLine = vsSplit[1].trim();

    // 2. Find Day of Week to split AwayTeam
    const dayMatch = restOfLine.match(DAYS_REGEX);
    let awayTeam = restOfLine;
    let datePart = '';

    if (dayMatch && dayMatch.index !== undefined) {
        awayTeam = restOfLine.substring(0, dayMatch.index).trim();
        datePart = restOfLine.substring(dayMatch.index).trim();
    }

    // 3. Simple Date Parser
    const timestamp = parseSpanishDateString(datePart, refDate);

    return {
        homeTeam,
        awayTeam,
        date: new Date(timestamp).toISOString(),
        timestamp,
        status: 'SCHEDULED',
    };
}

function parseSpanishDateString(dateString: string, refDate: Date): number {
    if (!dateString) return refDate.getTime();

    // Extract Day Name
    const dayMatch = dateString.match(DAYS_REGEX);
    if (!dayMatch) return refDate.getTime();

    const dayName = dayMatch[0].toLowerCase();

    // Extract Time: 08:15am or 8:15
    const timeMatch = dateString.match(/(\d{1,2}):(\d{2})\s?(am|pm)?/i);
    let hours = 12; // default noon if failed
    let minutes = 0;

    if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3]?.toLowerCase();

        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
    }

    // Calculate target date
    const targetDate = new Date(refDate);
    const currentDay = targetDate.getDay(); // 0 = Sun, 1 = Mon...
    const targetDayIndex = spanishDayToIndex(dayName);

    let dayDiff = targetDayIndex - currentDay;
    if (dayDiff < 0) dayDiff += 7; // Next occurrence

    targetDate.setDate(targetDate.getDate() + dayDiff);
    targetDate.setHours(hours, minutes, 0, 0);

    return targetDate.getTime();
}

function spanishDayToIndex(day: string): number {
    const map: { [key: string]: number } = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3,
        'jueves': 4, 'viernes': 5, 'sábado': 6
    };
    // Normalize
    if (day.includes('dom')) return 0;
    if (day.includes('lun')) return 1;
    if (day.includes('mar')) return 2;
    if (day.includes('mié') || day.includes('mie')) return 3;
    if (day.includes('jue')) return 4;
    if (day.includes('vie')) return 5;
    if (day.includes('sáb') || day.includes('sab')) return 6;
    return 0;
}
