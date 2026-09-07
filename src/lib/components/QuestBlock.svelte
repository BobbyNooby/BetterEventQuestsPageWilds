<script lang="ts">
	import { browser } from '$app/environment';
	import type { Quest } from '$lib/types';
	import { parseISOToCurrentTimezone, questChronology, questDifficulty } from '$lib/utils';
	import ChronologyBox from './ChronologyBox.svelte';
	import DifficultyRing from './DifficultyRing.svelte';

	let { quest }: { quest: Quest } = $props();

	const chronology = $derived(questChronology(quest));
	const diff = $derived(questDifficulty(quest));
	const isCollab = $derived(
		!!quest.collabUrl || (quest.labels ?? []).some((l) => l.toLowerCase().includes('collab'))
	);

	// Pointer-tracking 3D tilt + enlarge. Fine pointers only (no touch), and
	// off entirely when the user prefers reduced motion.
	let tilt = $state({ rx: 0, ry: 0, active: false });
	const canTilt =
		typeof window !== 'undefined' &&
		window.matchMedia('(pointer: fine)').matches &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const onMove = (e: PointerEvent) => {
		if (!canTilt) return;
		const el = e.currentTarget as HTMLElement;
		const r = el.getBoundingClientRect();
		const px = (e.clientX - r.left) / r.width - 0.5;
		const py = (e.clientY - r.top) / r.height - 0.5;
		tilt = { rx: -py * 8, ry: px * 10, active: true };
	};
	const onLeave = () => {
		tilt = { rx: 0, ry: 0, active: false };
	};

	const hrText = $derived((quest.conditions ?? '').match(/HR\s*\d+\s*or higher/i)?.[0] ?? null);
</script>

<div class="group h-full [perspective:1100px]">
	<div
		class={`flex h-full flex-col overflow-hidden rounded-2xl border-2 border-white bg-black shadow-lg transition-[transform,box-shadow] ease-out will-change-transform ${
			tilt.active ? 'duration-75' : 'duration-300'
		} group-hover:shadow-[0_0_35px_rgba(255,255,255,0.28)]`}
		style={`transform: perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
			tilt.active ? 1.04 : 1
		});`}
		onpointermove={onMove}
		onpointerleave={onLeave}
	>
		<!-- Thumbnail -->
		<div class="relative shrink-0 overflow-hidden border-b-2 border-white">
			{#if quest.image}
				<div class="aspect-[16/9] w-full">
					<img
						class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
						src={quest.image}
						alt={quest.title}
						loading="lazy"
						decoding="async"
					/>
				</div>
			{:else}
				<div class="aspect-[16/9] w-full bg-neutral-900"></div>
			{/if}

			<!-- legibility gradient -->
			<div
				class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
			></div>

			<!-- top-left badges -->
			<div class="absolute top-2 left-2 flex flex-wrap gap-1">
				{#if isCollab}
					<span
						class="rounded border-2 border-fuchsia-300 bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
					>
						Collab
					</span>
				{/if}
				{#if quest.onlineOnly}
					<span
						class="rounded border-2 border-sky-300 bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
					>
						Online only
					</span>
				{/if}
				{#if quest.isNew}
					<span
						class="rounded border-2 border-yellow-200 bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-black uppercase"
					>
						New
					</span>
				{/if}
			</div>

			<!-- title + difficulty on the gradient -->
			<div class="absolute bottom-0 left-0 flex w-full items-end gap-2 p-3">
				<h2 class="flex-1 text-lg leading-tight font-bold text-white drop-shadow md:text-xl">
					{quest.title}
				</h2>
				<div class="shrink-0 drop-shadow">
					<DifficultyRing value={diff} size={56} thickness={8} gapDeg={8} />
				</div>
			</div>
		</div>

		<!-- Body -->
		<div class="flex flex-1 flex-col gap-3 p-4">
			{#if quest.summary}
				<p class="line-clamp-3 text-sm leading-relaxed text-gray-300">{quest.summary}</p>
			{/if}

			<div class="flex flex-wrap gap-1.5 text-xs">
				{#if quest.locales}
					<span class="rounded-full border border-white/60 px-2 py-0.5 text-gray-200">
						{quest.locales}
					</span>
				{/if}
				{#if hrText}
					<span class="rounded-full border border-white/60 px-2 py-0.5 text-gray-200">
						{hrText}
					</span>
				{/if}
			</div>

			{#if quest.completionConditions}
				<p class="line-clamp-2 text-xs leading-relaxed text-gray-400">
					<span class="font-semibold text-gray-300">Completion:</span>
					{quest.completionConditions}
				</p>
			{/if}

			<!-- local-TZ date strings: client-only, so SSR never bakes in server-TZ text -->
			{#if browser}
				<p class="text-[11px] text-gray-500">
					{#if quest.startISOUTC}
						From {parseISOToCurrentTimezone(quest.startISOUTC)}
					{/if}
					{#if quest.endISOUTC}
						· until {parseISOToCurrentTimezone(quest.endISOUTC)}
					{/if}
				</p>
			{/if}

			<!-- status/countdown pinned to the bottom -->
			<div class="mt-auto pt-1">
				<ChronologyBox {quest} {chronology} compact />
			</div>
		</div>
	</div>
</div>
