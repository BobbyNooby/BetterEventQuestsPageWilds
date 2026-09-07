/**
 * Refresh pipeline: Capcom page → organizeScrape → SQLite.
 *
 * Never called per-request: the page calls `ensureFresh`, which no-ops
 * unless the DB predates the current weekly slot, and concurrent callers
 * share one in-flight refresh.
 */
import { scrape } from '../scrape';
import { organizeScrape } from '../organizeScrape';
import { isStale, saveScrape, recordRunError } from './db';

const SCHEDULE_URL = 'https://info.monsterhunter.com/wilds/event-quest/en-us/schedule?utc=0';

export type RefreshResult = { ok: true; questCount: number; ranAt: string };

let inflight: Promise<RefreshResult> | null = null;

const doRefresh = async (trigger: string): Promise<RefreshResult> => {
	const started = Date.now();
	try {
		const { status, html } = await scrape(SCHEDULE_URL);
		if (status !== 200) throw new Error(`Capcom page returned ${status}`);
		const result = saveScrape(organizeScrape(html), trigger);
		const out: RefreshResult = {
			ok: true,
			questCount: result.questCount,
			ranAt: result.ranAt
		};
		console.log(
			`[quests] refresh (${trigger}) ok: ${out.questCount} quests in ${Date.now() - started}ms`
		);
		return out;
	} catch (e) {
		const note = e instanceof Error ? e.message : String(e);
		recordRunError(trigger, note);
		console.error(`[quests] refresh (${trigger}) failed: ${note}`);
		throw e;
	}
};

/** Refresh, coalescing concurrent callers into one fetch. */
export const refreshQuests = (trigger: string): Promise<RefreshResult> => {
	if (!inflight) inflight = doRefresh(trigger).finally(() => (inflight = null));
	return inflight;
};

/**
 * Refresh only if the DB is empty or older than this week's slot.
 * Resolves to null when the DB was already fresh.
 */
export const ensureFresh = (trigger = 'auto'): Promise<RefreshResult | null> => {
	if (!isStale()) return Promise.resolve(null);
	return refreshQuests(trigger);
};
