// sortScrape.ts
import type { ScrapeResult } from './organizeScrape';
import type { Quest } from './types';
import { getDateFromString } from './utils';

export function sortScrape(data: ScrapeResult): Quest[] {
	const all: Quest[] = [...data.permanent, ...data.limitedTime.flatMap((b) => b.quests)];

	const parse = (q: Quest) => {
		if (q.endISOUTC) {
			const d = new Date(q.endISOUTC);
			return isNaN(d.getTime()) ? null : d;
		}
		const d = getDateFromString(q.endDateTime ?? null, { tzOffsetHours: 0 });
		return isNaN(d.getTime()) ? null : d;
	};

	return all.sort((a, b) => {
		const ad = parse(a);
		const bd = parse(b);
		if (ad && bd) return ad.getTime() - bd.getTime();
		if (ad && !bd) return -1;
		if (!ad && bd) return 1;
		return a.title.localeCompare(b.title);
	});
}
