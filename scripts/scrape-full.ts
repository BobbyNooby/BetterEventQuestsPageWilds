/**
 * Full structural scrape of the MH Wilds event-quest schedule page.
 * Captures EVERYTHING the page encodes (not just what the app uses):
 * labels, online badge, platform tokens, collab links, per-tab layout.
 *
 * Run: bun scripts/scrape-full.ts [path-to-html]   (default: fetches live)
 * Writes: data/quests-full.json
 */
import * as cheerio from 'cheerio';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const URL = 'https://info.monsterhunter.com/wilds/event-quest/en-us/schedule?utc=0';

const fetchHTML = async (): Promise<string> => {
	if (process.argv[2]) return readFile(process.argv[2], 'utf8');
	const res = await fetch(URL, {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
		}
	});
	if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
	return res.text();
};

type RawQuest = Record<string, unknown>;

const extract = (html: string) => {
	const $ = cheerio.load(html);

	const timeDiff = $('input[name="time_diff"]').attr('value') ?? null;

	const readRow = (tr: cheerio.Element): RawQuest => {
		const row = $(tr);
		const titleWrap = row.find('td.quest .title');
		const labels = titleWrap
			.find('.label_style')
			.map((_, el) => $(el).text().trim())
			.get();

		const colabLink = row.find('li.btn.colab a').attr('href') ?? null;
		const eventBtn = row
			.find('li.btn.event')
			.map((_, el) => ({
				text: $(el).find('span').first().text().trim(),
				href: $(el).find('a').attr('href') ?? null,
				commentedOut: false
			}))
			.get();

		const overview: Record<string, string | null> = {};
		row.find('td.overview li').each((_, li) => {
			const dt = $(li).find('.overview_dt').text().trim();
			const dd = $(li)
				.find('.overview_dd')
				.text()
				.replace(/\s+/g, ' ')
				.replace(/^\s*:\s*/, '')
				.trim();
			overview[dt] = dd || null;
		});

		return {
			rowClasses: (row.attr('class') ?? '').split(/\s+/).filter(Boolean),
			image: row.find('td.image img').attr('src') ?? null,
			difficulty: row.find('td.level span').first().text().trim() || null,
			onlineBadge: row.find('.online_offline__icon img').length > 0 ? 'online' : null,
			labels,
			title: titleWrap.find('> span').text().trim(),
			eventTimeText:
				row
					.find('td.quest p.terms')
					.text()
					.replace(/\s+/g, ' ')
					.replace(/^Event Time\s*/i, '')
					.trim() || null,
			summary: row.find('td.quest p.txt').text().replace(/\s+/g, ' ').trim() || null,
			buttons: [...eventBtn],
			colabLink,
			overview
		};
	};

	const readArea = (root: cheerio.Cheerio<cheerio.Element>) =>
		root
			.find('table.table2 > tbody > tr')
			.map((_, tr) => readRow(tr))
			.get();

	// limited-time: tabbed section (schedule NOT permanent_box).
	// The widget is rendered 3x (desktop/tablet/mobile) — take the first copy only.
	const limitedSection = $('section#schedule:not(.permanent_box)');
	const tabs = limitedSection
		.find('ul.tab1')
		.first()
		.find('li[data-tab]')
		.map((_, li) => {
			const id = $(li).attr('data-tab')!;
			const area = $(`#${id}.tableArea1`).first();
			return {
				id,
				rangeText:
					$(li)
						.find('p')
						.first()
						.html()
						?.replace(/<span.*/i, '')
						.trim() ?? null,
				label: $(li).find('span').last().text().trim() || null,
				questCount: area.length ? area.find('table.table2 > tbody > tr').length : 0,
				quests: area.length ? readArea(area) : []
			};
		})
		.get();

	const permanentSection = $('section#schedule.permanent_box');
	const permanent = permanentSection.length ? readArea(permanentSection.find('.tableArea2')) : [];

	return { timeDiff, tabs, permanent };
};

const html = await fetchHTML();
const data = extract(html);

await mkdir('data', { recursive: true });
await writeFile('data/quests-full.json', JSON.stringify(data, null, 2) + '\n');

// ---- analysis summary ----
const all = [...data.permanent, ...data.tabs.flatMap((t) => t.quests)] as RawQuest[];

const count = <T>(xs: T[]) => xs.length;
const freq = <T>(xs: T[]) =>
	[...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<T, number>())].sort(
		(a, b) => b[1] - a[1]
	);

console.log('=== STRUCTURE ===');
console.log('time_diff:', data.timeDiff);
console.log(
	'tabs:',
	data.tabs.map((t) => `${t.id}(${t.label ?? '?'})=${t.questCount} quests`)
);
console.log('permanent quests:', data.permanent.length);
console.log('TOTAL rows:', count(all));

console.log('\n=== FREQ: difficulty ===');
console.log(freq(all.map((q) => q.difficulty as string)));
console.log('\n=== FREQ: rowClasses ===');
console.log(freq(all.map((q) => (q.rowClasses as string[]).sort().join('+'))));
console.log('\n=== FREQ: labels ===');
console.log(freq(all.flatMap((q) => q.labels as string[])));
console.log('\n=== online badge rows ===');
all.filter((q) => q.onlineBadge).forEach((q) => console.log(' -', q.title));
console.log('\n=== single-platform rows ===');
all
	.filter((q) => (q.rowClasses as string[]).length <= 1 && (q.rowClasses as string[]).length > 0)
	.forEach((q) => console.log(' -', (q.rowClasses as string[])[0], '→', q.title));
console.log('\n=== collab rows ===');
all.filter((q) => q.colabLink).forEach((q) => console.log(' -', q.title, '→', q.colabLink));
console.log('\n=== event buttons with real hrefs ===');
const hrefs = all.flatMap((q) => q.buttons as { href: string | null }[]);
console.log('total buttons:', hrefs.length, '| with href:', hrefs.filter((b) => b.href).length);
console.log('\n=== overview keys across all rows ===');
console.log(freq(all.flatMap((q) => Object.keys(q.overview as Record<string, unknown>))));
