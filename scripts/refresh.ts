/**
 * Standalone refresh entry: fetch Capcom's schedule and write it to SQLite.
 *
 *   bun run refresh-db
 *
 * Used by the in-app weekly cron (scheduler.ts); this script exists for
 * manual runs and system crontabs. Safe to run any time — it writes the
 * full rotation in one transaction.
 */
import { refreshQuests } from '../src/lib/server/refresh';

try {
	const result = await refreshQuests('manual-cli');
	console.log(`done: ${result.questCount} quests current as of ${result.ranAt}`);
} catch {
	console.error('refresh failed — see the runs table / log above');
	process.exit(1);
}
