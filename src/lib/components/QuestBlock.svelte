<script lang="ts">
	import { theme } from '$lib/config/colors';
	import type { Quest } from '$lib/types';
	import { parseISOToCurrentTimezone } from '$lib/utils';
	import DifficultyRing from './DifficultyRing.svelte';
	import TimeLeft from './TimeLeft.svelte';

	let { quest }: { quest: Quest } = $props();

	const chronology: 'past' | 'current' | 'future' | 'permanent' = (() => {
		const s = quest.startISOUTC ? new Date(quest.startISOUTC) : null;
		const e = quest.endISOUTC ? new Date(quest.endISOUTC) : null;
		const now = new Date();
		if (!s || !e) return 'permanent';
		if (now < s) return 'future';
		if (now > e) return 'past';
		return 'current';
	})();

	const labelMap = {
		past: { text: 'Ended', classes: 'bg-purple-600 text-white border-purple-800' },
		current: { text: 'Ends In', classes: 'bg-red-600 text-white border-red-700' },
		future: { text: 'Starts In', classes: 'bg-yellow-400 text-black border-yellow-500' },
		permanent: { text: 'Permanent', classes: 'bg-green-600 text-white border-green-800' }
	} as const;

	const diff = Number((quest.difficulty ?? '').toString().replace(/[^\d]/g, '')) || 0;
</script>

<div
	class="mx-auto w-full max-w-6xl rounded-xl border-4 border-white bg-black shadow-md shadow-white ring-1"
>
	<!-- Grid:
	     mobile: 1 col
	     md+:   12 cols
	     time rail (md: col-span-2), image (md: 5), summary (md: 5), details wraps under summary on small -->
	<div class="grid grid-cols-1 gap-4 p-3 md:grid-cols-12 md:gap-6 md:p-6">
		<!-- Time rail (mobile: top full width; desktop: left column) -->
		<div
			class="order-1 flex h-fit w-full flex-col items-start gap-1 md:order-1 md:col-span-2 md:items-center"
		>
			<!-- Colored label box -->
			<span
				class={`w-full rounded-lg border-4 px-2.5 py-1 text-center text-lg font-semibold uppercase tracking-wide ${labelMap[chronology].classes}`}
				aria-live="polite"
			>
				{labelMap[chronology].text}
			</span>

			<!-- Timer BELOW the label, hidden for permanent -->
			{#if chronology !== 'permanent'}
				<div class="mt-1 font-mono text-xl tabular-nums text-gray-200">
					<TimeLeft {quest} />
				</div>
			{/if}
		</div>

		<!-- Image -->
		<div
			class="order-2 overflow-hidden rounded-lg border-2 border-gray-300 shadow md:order-2 md:col-span-5"
		>
			{#if quest.image}
				<div class="aspect-[16/9] w-full">
					<img
						class="h-full w-full object-cover"
						src={quest.image}
						alt={quest.title}
						loading="lazy"
						decoding="async"
					/>
				</div>
			{/if}
		</div>

		<!-- Summary + title + ring -->
		<section class="order-3 md:order-2 md:col-span-5">
			<header class="mb-3 flex items-center gap-3">
				<h1 class="flex-1 text-lg font-semibold leading-tight text-white md:text-xl">
					{quest.title}
				</h1>

				<!-- Difficulty ring: scale down on small screens -->
				<div class="shrink-0 origin-center scale-90 md:scale-100">
					<DifficultyRing value={diff} size={72} thickness={10} gapDeg={8} />
				</div>
			</header>

			{#if quest.summary}
				<p class="text-sm leading-relaxed text-gray-300 md:text-base">
					{quest.summary}
				</p>
			{/if}
		</section>

		<!-- Details: on mobile it spans full width below; on desktop align right -->
		<aside class="order-4 md:order-3 md:col-span-12">
			<div
				class="mt-2 grid grid-cols-1 gap-y-1 rounded-lg border border-gray-200 p-3 text-sm text-gray-300 sm:grid-cols-2 md:grid-cols-4"
			>
				{#if quest.locales}
					<p><span class="font-semibold">Locale</span> : {quest.locales}</p>
				{/if}
				{#if quest.conditions}
					<p><span class="font-semibold">Conditions</span> : {quest.conditions}</p>
				{/if}
				{#if quest.completionConditions}
					<p>
						<span class="font-semibold">Completion</span> : {quest.completionConditions}
					</p>
				{/if}
				{#if quest.startISOUTC}
					<p>
						<span class="font-semibold">Start</span> : {parseISOToCurrentTimezone(
							quest.startISOUTC
						)}
					</p>
				{/if}
				{#if quest.endISOUTC}
					<p>
						<span class="font-semibold">End</span> : {parseISOToCurrentTimezone(quest.endISOUTC)}
					</p>
				{/if}
			</div>
		</aside>
	</div>
</div>
