// SvelteKit load that runs on the server.
// Quests come from SQLite (written by the weekly refresh) — Capcom is
// only hit when the DB is empty or predates the current weekly slot.
import { ensureFresh } from '$lib/server/refresh';
import { getActiveQuests, getLastScrapedAt } from '$lib/server/db';

export const load = async () => {
	try {
		await ensureFresh('page-load');
	} catch {
		// refresh failed — serve whatever the DB has (error is recorded in `runs`)
	}

	return {
		status: 200,
		quests: getActiveQuests(),
		lastScrapedAt: getLastScrapedAt()
	};
};
