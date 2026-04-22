import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Match } from '../types';
import { getShortName } from './teams';

interface ExportParticipant {
    participantName: string;
    picks: { matchId: string; selection: string }[];
    score: number;
    hits?: string[];
    totalGoalsPrediction: number;
    paymentStatus: string;
}

// Color palette matching the app's dark theme
const COLORS = {
    bgDark: '09090B',
    bgCard: '18181B',
    bgHeader: '111111',
    green: '22C55E',
    greenDark: '166534',
    gold: 'FBBF24',
    silver: 'CBD5E1',
    bronze: 'B45309',
    white: 'FFFFFF',
    textMuted: '71717A',
    textLight: 'A1A1AA',
    borderLight: '27272A',
    hitBg: '14532D',
    missBg: '1C1C1E',
};

export async function exportScoreboardToExcel(
    participants: ExportParticipant[],
    matches: Match[],
    weekName: string,
    totalGoals: number,
    prizePot: number,
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Quiniela App';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Resultados', {
        properties: {
            tabColor: { argb: COLORS.green },
            defaultColWidth: 12,
        },
        views: [{ state: 'frozen', xSplit: 1, ySplit: 5 }],
    });

    const sorted = [...participants].sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) {
            return (b.score || 0) - (a.score || 0);
        }
        const aGoalsDiff = Math.abs((a.totalGoalsPrediction || 0) - totalGoals);
        const bGoalsDiff = Math.abs((b.totalGoalsPrediction || 0) - totalGoals);
        return aGoalsDiff - bGoalsDiff;
    });
    const matchCount = matches.length;
    const totalCols = 1 + matchCount + 2; 

    // ─── TITLE SECTION ───────────────────────────────────────────────
    // Row 1: Title
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `🏆  QUINIELA — ${weekName.toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: COLORS.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 42;

    // Row 2: Sub-info
    ws.mergeCells(2, 1, 2, totalCols);
    const subCell = ws.getCell(2, 1);
    subCell.value = `Premio: $${prizePot.toLocaleString()}  ·  Participantes: ${sorted.length}  ·  Goles Totales: ${totalGoals}`;
    subCell.font = { name: 'Calibri', size: 11, color: { argb: COLORS.textLight }, italic: true };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 24;

    // Row 3: Spacer
    ws.mergeCells(3, 1, 3, totalCols);
    ws.getCell(3, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    ws.getRow(3).height = 6;

    // ─── ROW 4: Match Results Row ────────────────────────────────────
    const resultsRow = ws.getRow(4);
    resultsRow.height = 22;

    const emptyHeaderCell = ws.getCell(4, 1);
    emptyHeaderCell.value = '';
    emptyHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };

    matches.forEach((m, i) => {
        const cell = ws.getCell(4, 2 + i);
        if (m.status === 'FINISHED' && m.result) {
            cell.value = `${m.result.homeScore}-${m.result.awayScore}`;
            const outcomeBg = m.result.outcome === 'L' ? COLORS.white :
                m.result.outcome === 'E' ? COLORS.textMuted : COLORS.green;
            const outcomeFg = m.result.outcome === 'L' ? COLORS.bgDark :
                m.result.outcome === 'E' ? COLORS.white : COLORS.bgDark;
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: outcomeFg } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: outcomeBg } };
        } else {
            cell.value = '-';
            cell.font = { name: 'Calibri', size: 9, color: { argb: COLORS.textMuted } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
        };
    });

    // PTS / GOL header cells in row 4
    const ptsHeaderCell4 = ws.getCell(4, 2 + matchCount);
    ptsHeaderCell4.value = '';
    ptsHeaderCell4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
    const golHeaderCell4 = ws.getCell(4, 3 + matchCount);
    golHeaderCell4.value = '';
    golHeaderCell4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };

    // ─── ROW 5: Table Header ─────────────────────────────────────────
    const headerRow = ws.getRow(5);
    headerRow.height = 28;

    const participantHeader = ws.getCell(5, 1);
    participantHeader.value = 'PARTICIPANTE';
    participantHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.textLight } };
    participantHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
    participantHeader.alignment = { horizontal: 'left', vertical: 'middle' };
    participantHeader.border = {
        bottom: { style: 'medium', color: { argb: COLORS.green } },
    };

    // Column widths
    ws.getColumn(1).width = 26;

    matches.forEach((m, i) => {
        const col = 2 + i;
        const cell = ws.getCell(5, col);
        cell.value = `${getShortName(m.homeTeam)} vs ${getShortName(m.awayTeam)}`;
        cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: COLORS.textMuted } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            bottom: { style: 'medium', color: { argb: COLORS.green } },
        };
        ws.getColumn(col).width = 14;
    });

    // PTS header
    const ptsHeader = ws.getCell(5, 2 + matchCount);
    ptsHeader.value = 'PTS';
    ptsHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.green } };
    ptsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
    ptsHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    ptsHeader.border = { bottom: { style: 'medium', color: { argb: COLORS.green } } };
    ws.getColumn(2 + matchCount).width = 10;

    // GOL header
    const golHeader = ws.getCell(5, 3 + matchCount);
    golHeader.value = 'GOL';
    golHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.textLight } };
    golHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgHeader } };
    golHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    golHeader.border = { bottom: { style: 'medium', color: { argb: COLORS.green } } };
    ws.getColumn(3 + matchCount).width = 10;

    // ─── DATA ROWS ───────────────────────────────────────────────────
    sorted.forEach((p, idx) => {
        const rowNum = 6 + idx;
        const row = ws.getRow(rowNum);
        row.height = 28;

        const isEvenRow = idx % 2 === 0;
        const rowBg = isEvenRow ? COLORS.bgDark : COLORS.bgCard;

        // Medal / rank emoji
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `${idx + 1}. `;

        // Name cell
        const nameCell = ws.getCell(rowNum, 1);
        nameCell.value = `${medal}${p.participantName}`;
        nameCell.font = {
            name: 'Calibri',
            size: 11,
            bold: idx < 3,
            color: { argb: idx < 3 ? COLORS.white : COLORS.textLight },
        };
        nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
            right: { style: 'thin', color: { argb: COLORS.borderLight } },
        };

        // Pick cells
        matches.forEach((m, i) => {
            const col = 2 + i;
            const pick = p.picks.find(pk => pk.matchId === m.id);
            const isHit = p.hits?.includes(m.id);
            const cell = ws.getCell(rowNum, col);

            cell.value = pick?.selection || '-';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
            };

            if (isHit) {
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.bgDark } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.green } };
            } else {
                cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.textMuted } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            }
        });

        // PTS cell
        const ptsCell = ws.getCell(rowNum, 2 + matchCount);
        ptsCell.value = p.score || 0;
        ptsCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.white } };
        ptsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        ptsCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ptsCell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
            left: { style: 'thin', color: { argb: COLORS.borderLight } },
        };

        // GOL cell
        const golCell = ws.getCell(rowNum, 3 + matchCount);
        golCell.value = p.totalGoalsPrediction;
        golCell.font = { name: 'Calibri', size: 11, color: { argb: COLORS.textLight } };
        golCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        golCell.alignment = { horizontal: 'center', vertical: 'middle' };
        golCell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
        };
    });

    // ─── FOOTER ROW ──────────────────────────────────────────────────
    const footerRowNum = 6 + sorted.length;
    const footerRow = ws.getRow(footerRowNum);
    footerRow.height = 30;

    ws.mergeCells(footerRowNum, 1, footerRowNum, 1 + matchCount);
    const footerLabel = ws.getCell(footerRowNum, 1);
    footerLabel.value = 'TOTAL GOLES REAL:';
    footerLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.textMuted } };
    footerLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    footerLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    footerLabel.border = { top: { style: 'medium', color: { argb: COLORS.green } } };

    // Empty PTS footer
    const ptsFooter = ws.getCell(footerRowNum, 2 + matchCount);
    ptsFooter.value = '';
    ptsFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    ptsFooter.border = { top: { style: 'medium', color: { argb: COLORS.green } } };

    const golFooter = ws.getCell(footerRowNum, 3 + matchCount);
    golFooter.value = totalGoals;
    golFooter.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.white } };
    golFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    golFooter.alignment = { horizontal: 'center', vertical: 'middle' };
    golFooter.border = { top: { style: 'medium', color: { argb: COLORS.green } } };

    // ─── TIMESTAMP ───────────────────────────────────────────────────
    const tsRowNum = footerRowNum + 1;
    ws.mergeCells(tsRowNum, 1, tsRowNum, totalCols);
    const tsCell = ws.getCell(tsRowNum, 1);
    const now = new Date();
    tsCell.value = `Generado el ${now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} a las ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    tsCell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: COLORS.textMuted } };
    tsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
    tsCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ─── GENERATE & DOWNLOAD ─────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const safeName = weekName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '').trim().replace(/\s+/g, '_');
    saveAs(blob, `Quiniela_${safeName}_${now.toISOString().slice(0, 10)}.xlsx`);
}
