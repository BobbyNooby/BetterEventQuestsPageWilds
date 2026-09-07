/**
 * Parse "MM.DD.YYYY HH:mm" as a UTC instant (Z).
 * If the source time is in some offset (e.g., UTC-7),
 * pass { tzOffsetHours: -7 } to normalize to UTC.
 * Default assumes the scraped time is already UTC=0.
 */
export const getDateFromString = (
	dateString: string | null,
	opts?: { tzOffsetHours?: number }
): Date => {
	if (!dateString) return new Date(NaN);

	const m = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
	if (!m) return new Date(NaN);

	const [, MM, DD, YYYY, HH, mm] = m;
	const month = parseInt(MM, 10) - 1;
	const day = parseInt(DD, 10);
	const year = parseInt(YYYY, 10);
	const hour = parseInt(HH, 10);
	const minute = parseInt(mm, 10);

	// Treat the parsed wall time as if it were UTC, then shift by -offset to get true UTC.
	// Example: time shown in UTC-7 => tzOffsetHours = -7 => add 7h to reach UTC.
	const offsetHours = opts?.tzOffsetHours ?? 0;
	const ms = Date.UTC(year, month, day, hour, minute) - offsetHours * 3600_000;

	return new Date(ms); // always a UTC instant (Z)
};

export const parseISOToCurrentTimezone = (iso: string | null | undefined): string => {
	if (!iso) return 'N/A';
	const d = new Date(iso);

	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-based
	const year = d.getFullYear();

	const hours = String(d.getHours()).padStart(2, '0');
	const minutes = String(d.getMinutes()).padStart(2, '0');

	return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// ---- shared quest helpers (used by the page filters and the card) ----

export type Chronology = 'past' | 'current' | 'future' | 'permanent';

export type QuestLike = {
	startISOUTC?: string | null;
	endISOUTC?: string | null;
	difficulty?: string | null;
	conditions?: string | null;
};

export const questChronology = (q: QuestLike): Chronology => {
	const s = q.startISOUTC ? new Date(q.startISOUTC) : null;
	const e = q.endISOUTC ? new Date(q.endISOUTC) : null;
	if (!s || !e) return 'permanent';
	const now = Date.now();
	if (now < s.getTime()) return 'future';
	if (now > e.getTime()) return 'past';
	return 'current';
};

export const questDifficulty = (q: QuestLike): number =>
	Number((q.difficulty ?? '').replace(/[^\d]/g, '')) || 0;

/** "HR 31 or higher" -> 31; null when no HR requirement is stated */
export const questHr = (q: QuestLike): number | null => {
	const m = (q.conditions ?? '').match(/HR\s*(\d+)/i);
	return m ? parseInt(m[1], 10) : null;
};
