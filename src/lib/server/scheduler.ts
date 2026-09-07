/**
 * Weekly in-app cron.
 *
 * Fires 10 minutes after Capcom's weekly quest rotation goes live
 * (Wednesday 00:00 UTC → we tick at 00:10 UTC), then every 7 days.
 * If the server was down during a slot, the page's `ensureFresh` call
 * self-heals on the next request instead.
 */
import { nextWeeklySlot } from './db';
import { ensureFresh } from './refresh';

const WEEK_MS = 7 * 24 * 3600_000;

export const scheduleWeeklyRefresh = (): void => {
	const g = globalThis as typeof globalThis & { __questCronStarted?: boolean };
	if (g.__questCronStarted) return;
	g.__questCronStarted = true;

	const tick = () => {
		ensureFresh('weekly-cron').catch(() => {
			// failure already recorded in the runs table; the stale check retries later
		});
	};

	const slot = nextWeeklySlot(new Date());
	const delay = Math.max(0, slot.getTime() - Date.now());
	console.log(
		`[quests] weekly refresh scheduled for ${slot.toISOString()} (in ${(delay / 3600_000).toFixed(1)}h)`
	);

	setTimeout(() => {
		tick();
		setInterval(tick, WEEK_MS);
	}, delay);

	// cover the "server just started with an empty/stale DB" case
	tick();
};
