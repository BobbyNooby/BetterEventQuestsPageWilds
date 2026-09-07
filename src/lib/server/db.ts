/**
 * SQLite storage for scraped event quests.
 *
 * The page reads from here instead of Capcom's site; `refresh.ts` writes.
 * One file DB (`data/quests.db`, override with QUESTS_DB_PATH), WAL mode,
 * single writer (the weekly refresh).
 *
 * Quests are upserted keyed by title, so `first_seen_at` doubles as a
 * rotation archive: dropping `is_current` instead of deleting keeps every
 * quest ever scraped queryable.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Quest } from '../types';
import type { ScrapeResult } from '../organizeScrape';

const DB_PATH = process.env.QUESTS_DB_PATH ?? join(process.cwd(), 'data', 'quests.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

db.exec(`
	CREATE TABLE IF NOT EXISTS quests (
		title TEXT PRIMARY KEY,
		difficulty TEXT,
		image TEXT,
		is_new INTEGER NOT NULL DEFAULT 0,
		labels TEXT,
		collab_url TEXT,
		online_only INTEGER NOT NULL DEFAULT 0,
		event_time_text TEXT,
		summary TEXT,
		locales TEXT,
		conditions TEXT,
		completion_conditions TEXT,
		monsters TEXT,
		start_date_time TEXT,
		end_date_time TEXT,
		start_iso TEXT,
		end_iso TEXT,
		week_id TEXT,
		week_label TEXT,
		week_range TEXT,
		is_current INTEGER NOT NULL DEFAULT 0,
		first_seen_at TEXT,
		last_seen_at TEXT
	);

	CREATE TABLE IF NOT EXISTS runs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		ran_at TEXT NOT NULL,
		trigger TEXT NOT NULL,
		status TEXT NOT NULL,
		quest_count INTEGER,
		note TEXT
	);

	CREATE TABLE IF NOT EXISTS meta (
		key TEXT PRIMARY KEY,
		value TEXT
	);
`);

type QuestRow = {
	title: string;
	difficulty: string | null;
	image: string | null;
	is_new: number;
	labels: string | null;
	collab_url: string | null;
	online_only: number;
	event_time_text: string | null;
	summary: string | null;
	locales: string | null;
	conditions: string | null;
	completion_conditions: string | null;
	monsters: string | null;
	start_date_time: string | null;
	end_date_time: string | null;
	start_iso: string | null;
	end_iso: string | null;
};

const rowToQuest = (r: QuestRow): Quest => ({
	title: r.title,
	difficulty: r.difficulty,
	image: r.image,
	isNew: !!r.is_new,
	labels: r.labels ? (JSON.parse(r.labels) as string[]) : [],
	collabUrl: r.collab_url,
	onlineOnly: !!r.online_only,
	eventTimeText: r.event_time_text,
	summary: r.summary,
	locales: r.locales,
	conditions: r.conditions,
	completionConditions: r.completion_conditions,
	monsters: r.monsters ? (JSON.parse(r.monsters) as string[]) : [],
	startDateTime: r.start_date_time,
	endDateTime: r.end_date_time,
	startISOUTC: r.start_iso,
	endISOUTC: r.end_iso
});

/** Active quests, ordered like sortScrape: ending soonest first, permanent (no end) last. */
export const getActiveQuests = (): Quest[] => {
	const rows = db
		.prepare(
			`SELECT * FROM quests WHERE is_current = 1
			 ORDER BY (end_iso IS NULL) ASC, end_iso ASC, title ASC`
		)
		.all() as QuestRow[];
	return rows.map(rowToQuest);
};

export const getMeta = (key: string): string | null => {
	const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
		| { value: string }
		| undefined;
	return row?.value ?? null;
};

export const getLastScrapedAt = (): string | null => getMeta('last_scraped_at');

/**
 * Capcom rotates quests weekly: new quests go live Wednesday 00:00 UTC
 * (Tuesday 17:00 PT). We sync 10 minutes past the slot.
 */
export const WEEKLY_SLOT_UTC = { dayOfWeek: 3 /* Wednesday */, hourUTC: 0, minuteUTC: 10 };

const slotOnDay = (now: Date, dayShift: number): Date =>
	new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() + dayShift,
			WEEKLY_SLOT_UTC.hourUTC,
			WEEKLY_SLOT_UTC.minuteUTC,
			0
		)
	);

/** The most recent Wednesday 00:10 UTC at or before `now`. */
export const mostRecentSlot = (now: Date = new Date()): Date => {
	const slot = slotOnDay(now, 0);
	const daysBack = (now.getUTCDay() - WEEKLY_SLOT_UTC.dayOfWeek + 7) % 7;
	if (daysBack > 0) slot.setUTCDate(slot.getUTCDate() - daysBack);
	else if (now.getTime() < slot.getTime()) slot.setUTCDate(slot.getUTCDate() - 7);
	return slot;
};

/** The next Wednesday 00:10 UTC strictly after `now`. */
export const nextWeeklySlot = (now: Date = new Date()): Date => {
	const slot = mostRecentSlot(now);
	if (slot.getTime() <= now.getTime()) slot.setUTCDate(slot.getUTCDate() + 7);
	return slot;
};

/** True when the DB predates the current weekly slot (or is empty). */
export const isStale = (now: Date = new Date()): boolean => {
	const last = getLastScrapedAt();
	if (!last) return true;
	return new Date(last).getTime() < mostRecentSlot(now).getTime();
};

const insertQuest = db.prepare(`
	INSERT INTO quests (
		title, difficulty, image, is_new, labels, collab_url, online_only,
		event_time_text, summary, locales, conditions, completion_conditions, monsters,
		start_date_time, end_date_time, start_iso, end_iso,
		week_id, week_label, week_range,
		is_current, first_seen_at, last_seen_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
	ON CONFLICT(title) DO UPDATE SET
		difficulty = excluded.difficulty,
		image = excluded.image,
		is_new = excluded.is_new,
		labels = excluded.labels,
		collab_url = excluded.collab_url,
		online_only = excluded.online_only,
		event_time_text = excluded.event_time_text,
		summary = excluded.summary,
		locales = excluded.locales,
		conditions = excluded.conditions,
		completion_conditions = excluded.completion_conditions,
		monsters = excluded.monsters,
		start_date_time = excluded.start_date_time,
		end_date_time = excluded.end_date_time,
		start_iso = excluded.start_iso,
		end_iso = excluded.end_iso,
		week_id = excluded.week_id,
		week_label = excluded.week_label,
		week_range = excluded.week_range,
		is_current = 1,
		last_seen_at = excluded.last_seen_at
`);

export type SaveResult = { questCount: number; ranAt: string };

/** Replace the current rotation with a fresh scrape, inside one transaction. */
export const saveScrape = (data: ScrapeResult, trigger: string): SaveResult => {
	const now = new Date().toISOString();
	const flat = [
		...data.limitedTime.flatMap((block) =>
			block.quests.map((q) => ({
				q,
				weekId: block.id,
				weekLabel: block.label,
				weekRange: block.rangeText
			}))
		),
		...data.permanent.map((q) => ({ q, weekId: null, weekLabel: null, weekRange: null }))
	];

	db.exec('BEGIN');
	try {
		db.prepare('UPDATE quests SET is_current = 0').run();
		for (const { q, weekId, weekLabel, weekRange } of flat) {
			insertQuest.run(
				q.title,
				q.difficulty ?? null,
				q.image ?? null,
				q.isNew ? 1 : 0,
				q.labels ? JSON.stringify(q.labels) : null,
				q.collabUrl ?? null,
				q.onlineOnly ? 1 : 0,
				q.eventTimeText ?? null,
				q.summary ?? null,
				q.locales ?? null,
				q.conditions ?? null,
				q.completionConditions ?? null,
				q.monsters ? JSON.stringify(q.monsters) : null,
				q.startDateTime ?? null,
				q.endDateTime ?? null,
				q.startISOUTC ?? null,
				q.endISOUTC ?? null,
				weekId,
				weekLabel,
				weekRange,
				now, // first_seen_at (preserved on conflict — not in the UPDATE set)
				now // last_seen_at
			);
		}
		db.prepare(
			`INSERT INTO meta (key, value) VALUES ('last_scraped_at', ?)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
		).run(now);
		db.prepare(
			`INSERT INTO runs (ran_at, trigger, status, quest_count) VALUES (?, ?, 'ok', ?)`
		).run(now, trigger, flat.length);
		db.exec('COMMIT');
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}

	return { questCount: flat.length, ranAt: now };
};

export const recordRunError = (trigger: string, note: string): void => {
	db.prepare(`INSERT INTO runs (ran_at, trigger, status, note) VALUES (?, ?, 'error', ?)`).run(
		new Date().toISOString(),
		trigger,
		note
	);
};
