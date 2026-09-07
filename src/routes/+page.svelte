<script lang="ts">
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import QuestBlock from '$lib/components/QuestBlock.svelte';
	import type { Quest, SortBy, StatusFilter } from '$lib/types';
	import { questChronology, questDifficulty, questHr } from '$lib/utils';

	let { data } = $props();

	const quests: Quest[] = $derived(data.quests ?? []);

	// ---- filter / sort state (owned here, edited via FilterBar) ----
	const ENDING_SOON_MS = 48 * 3600_000;

	// 'past' has no chip — expired quests only show under "All"
	const statusOf = (q: Quest): Exclude<StatusFilter, 'all'> => {
		const c = questChronology(q);
		if (
			c === 'current' &&
			q.endISOUTC &&
			new Date(q.endISOUTC).getTime() - Date.now() < ENDING_SOON_MS
		)
			return 'ending';
		return c === 'current' ? 'active' : c === 'future' ? 'upcoming' : c;
	};

	let status = $state<StatusFilter>('all');
	let minDiff = $state(1);
	let collabOnly = $state(false);
	let onlineOnly = $state(false);
	let sortBy = $state<SortBy>('ending');
	let locale = $state('all');
	let monster = $state('all');

	const counts = $derived.by(() => {
		const c: Record<StatusFilter, number> = {
			all: quests.length,
			active: 0,
			ending: 0,
			upcoming: 0,
			permanent: 0,
			past: 0
		};
		for (const q of quests) c[statusOf(q)]++;
		return c;
	});

	const localeOptions = $derived(
		[...new Set(quests.map((q) => q.locales).filter((l): l is string => !!l))].sort()
	);
	const monsterOptions = $derived(
		[...new Set(quests.flatMap((q) => q.monsters ?? []))].sort((a, b) => a.localeCompare(b))
	);

	const visible = $derived.by(() => {
		const xs = quests.filter((q) => {
			if (status !== 'all') {
				const s = statusOf(q);
				if (s !== status && !(status === 'active' && s === 'ending')) return false;
			}
			if (questDifficulty(q) < minDiff) return false;
			if (
				collabOnly &&
				!q.collabUrl &&
				!(q.labels ?? []).some((l) => l.toLowerCase().includes('collab'))
			)
				return false;
			if (onlineOnly && !q.onlineOnly) return false;
			if (locale !== 'all' && q.locales !== locale) return false;
			if (monster !== 'all' && !(q.monsters ?? []).includes(monster)) return false;
			return true;
		});

		const endMs = (q: Quest) => (q.endISOUTC ? new Date(q.endISOUTC).getTime() : Infinity);
		const startMs = (q: Quest) => (q.startISOUTC ? new Date(q.startISOUTC).getTime() : 0);

		return [...xs].sort((a, b) => {
			switch (sortBy) {
				case 'ending':
					return endMs(a) - endMs(b);
				case 'diff-asc':
					return questDifficulty(a) - questDifficulty(b);
				case 'diff-desc':
					return questDifficulty(b) - questDifficulty(a);
				case 'newest':
					return startMs(b) - startMs(a);
				case 'hr': {
					const ha = questHr(a) ?? Infinity;
					const hb = questHr(b) ?? Infinity;
					return ha - hb;
				}
			}
		});
	});
</script>

<div id="background" class="min-h-screen bg-black">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<header class="py-8 sm:py-10">
			<h1
				class="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl"
			>
				Better Event Quests Page
			</h1>
		</header>

		<FilterBar
			bind:status
			bind:minDiff
			bind:collabOnly
			bind:onlineOnly
			bind:sortBy
			bind:locale
			bind:monster
			{counts}
			locales={localeOptions}
			monsters={monsterOptions}
		/>

		<main class="isolate pb-16">
			<p class="mb-4 font-mono text-xs tracking-widest text-gray-500 uppercase">
				{visible.length} quest{visible.length === 1 ? '' : 's'}
			</p>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{#each visible as quest (quest.title)}
					<div
						animate:flip={{ duration: 350 }}
						in:scale={{ duration: 200, start: 0.96 }}
						out:scale={{ duration: 150, start: 0.96 }}
					>
						<QuestBlock {quest} />
					</div>
				{/each}
			</div>

			{#if visible.length === 0}
				<p class="py-20 text-center font-mono text-gray-500">No quests match these filters.</p>
			{/if}
		</main>
	</div>
</div>
