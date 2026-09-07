// types.ts
export type Quest = {
	title: string;
	difficulty: string | null;
	image: string | null;
	isNew: boolean;
	eventTimeText: string | null;
	summary: string | null;
	locales?: string | null;
	conditions?: string | null;
	completionConditions?: string | null;
	startDateTime?: string | null; // e.g. "08.19.2025 17:00"
	endDateTime?: string | null; // e.g. "08.26.2025 16:59"

	//normalized to UTC (Z)
	startISOUTC?: string | null; // e.g. "2025-08-19T17:00:00.000Z"
	endISOUTC?: string | null; // e.g. "2025-08-26T16:59:00.000Z"

	// page markers beyond the original scrape
	labels?: string[]; // e.g. "Collaborations"
	collabUrl?: string | null; // collab info link, partner slug recoverable from path
	onlineOnly?: boolean; // icon_online badge present
	monsters?: string[]; // parsed out of completionConditions, e.g. ["Gravios"]
};

export type StatusFilter = 'all' | 'active' | 'ending' | 'upcoming' | 'permanent' | 'past';
export type SortBy = 'ending' | 'diff-asc' | 'diff-desc' | 'newest' | 'hr';
