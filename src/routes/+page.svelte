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

<svelte:head>
	<title>Better Event Quests | Monster Hunter Wilds</title>
	<meta
		name="description"
		content="A better, filterable view of Monster Hunter Wilds event quests — updated weekly."
	/>
</svelte:head>

<div id="background" class="min-h-screen bg-black">
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<header class="py-8 sm:py-10">
			<div class="flex items-center justify-center gap-4 sm:gap-5">
				<!-- claw mark -->
				<svg viewBox="0 0 64 64" class="h-14 w-14 shrink-0 sm:h-20 sm:w-20" aria-hidden="true">
					<rect width="64" height="64" rx="14" fill="#0a0a0a" />
					<rect
						x="2.5"
						y="2.5"
						width="59"
						height="59"
						rx="12"
						fill="none"
						stroke="#ffffff"
						stroke-opacity="0.9"
						stroke-width="3"
					/>
					<g transform="rotate(-18 32 32)">
						<path d="M17 12 C 22 24, 21 40, 14 52 C 24 42, 27 24, 24 12 Z" fill="#ffffff" />
						<path d="M30 8 C 36 22, 35 42, 27 56 C 38 44, 41 22, 37 8 Z" fill="#ff5a36" />
						<path d="M44 12 C 49 24, 48 40, 41 52 C 51 42, 54 24, 51 12 Z" fill="#ffffff" />
					</g>
				</svg>
				<div>
					<p
						class="font-mono text-[10px] font-bold tracking-[0.35em] text-orange-400 uppercase sm:text-xs"
					>
						Monster Hunter Wilds
					</p>
					<h1
						class="text-3xl font-extrabold tracking-tight text-white italic sm:text-4xl md:text-5xl"
					>
						Better Event Quests
					</h1>
					<p
						class="mt-1 font-mono text-[9px] tracking-[0.25em] text-gray-500 uppercase sm:text-[10px]"
					>
						unofficial · fan-made · updates weekly
					</p>
				</div>
			</div>
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
