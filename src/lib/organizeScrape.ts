// npm i cheerio
import * as cheerio from 'cheerio';
import type { Quest } from './types';
import { getDateFromString } from './utils';

export type WeekBlock = {
	id: string; // "tab0", "tab1", ...
	rangeText: string; // "08.19.2025 〜 08.26.2025"
	label: string; // "This week" | "Next week" | etc
	quests: Quest[];
};

export type ScrapeResult = {
	timezoneUTCOffset: string | null; // e.g. "-7" from #time_diff
	limitedTime: WeekBlock[];
	permanent: Quest[]; // from "Permanent Quests"
};

// organizeScrape.ts

export const organizeScrape = (rawHTML: string): ScrapeResult => {
	const $ = cheerio.load(rawHTML);

	const timezoneUTCOffset = $('#time_diff').attr('value') ?? null;

	// helpers
	const text = (el: cheerio.Cheerio) => el.text().trim() || null;

	const toISOorNull = (s: string | null): string | null => {
		const d = getDateFromString(s, { tzOffsetHours: 0 }); // assume source is UTC=0
		return isNaN(d.getTime()) ? null : d.toISOString();
	};

	const readQuestRow = (tr: cheerio.Element): Quest => {
		const row = $(tr);
		const img = row.find('td.image img').attr('src') ?? null;
		const difficulty = text(row.find('td.level span')) || null;

		const titleWrap = row.find('td.quest .title');
		const isNew = titleWrap.find('.label_style.label_new').length > 0;
		const title = text(titleWrap.find('> span')) ?? '';

		const eventTimeText =
			text(row.find('td.quest p.terms'))?.replace(/^Event Time\s*/i, '') ?? null;

		const summary = text(row.find('td.quest p.txt')) ?? null;

		const overview = row.find('td.overview');
		const pickExact = (label: string) => {
			// find the .overview_dt whose text equals the label exactly
			const dt = overview
				.find('.overview_dt')
				.filter((_, el) => $(el).text().trim() === label)
				.first();

			if (!dt.length) return null;

			const dd = dt.closest('li').find('.overview_dd').first();
			// normalize whitespace and strip the decorative colon span
			const cleaned =
				dd
					.text()
					.replace(/\s+/g, ' ') // collapse newlines/tabs/spaces
					.replace(/^\s*:\s*/, '') // remove a leading colon from .overview_dd_coron
					.trim() || null;

			return cleaned;
		};

		const locales = pickExact('Locales');
		const conditions = pickExact('Conditions');
		const completionConditions = pickExact('Completion Conditions');
		const startDateTime = pickExact('Start Date and Time');
		const endDateTime = pickExact('End Date and Time');

		// NEW: normalized ISO UTC
		const startISOUTC = toISOorNull(startDateTime);
		const endISOUTC = toISOorNull(endDateTime);

		return {
			title,
			difficulty,
			image: img,
			isNew,
			eventTimeText,
			summary,
			locales,
			conditions,
			completionConditions,
			startDateTime,
			endDateTime,
			startISOUTC,
			endISOUTC
		};
	};

	const readTable = (root: cheerio.Cheerio): Quest[] => {
		const rows = root.find('table.table2 > tbody > tr');
		const quests: Quest[] = [];
		rows.each((_, tr) => quests.push(readQuestRow(tr)));
		return quests;
	};

	// Limited-time tabs (top set)
	const limitedTimeTabsTop = $('ul.tab1').first();
	const limitedTime: WeekBlock[] = [];

	limitedTimeTabsTop.find('li[data-tab]').each((_, li) => {
		const id = $(li).attr('data-tab')!;
		const p = $(li).find('p').first().html() || '';
		const rangeText = p.replace(/<br.*/i, '').trim();
		const label = $(li).find('span').last().text().trim();

		const tableArea = $(`#${id}.tableArea1`);
		const quests = tableArea.length ? readTable(tableArea) : [];

		limitedTime.push({
			id,
			rangeText,
			label,
			quests
		});
	});

	// Permanent
	const permanentRoot = $('section.permanent_box .tableArea2');
	const permanent = permanentRoot.length ? readTable(permanentRoot) : [];

	return {
		timezoneUTCOffset,
		limitedTime,
		permanent
	};
};
