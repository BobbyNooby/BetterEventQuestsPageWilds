<script lang="ts">
	import type { Quest } from '$lib/types';
	import { parseISOToCurrentTimezone } from '$lib/utils';
	import ChronologyBox from './ChronologyBox.svelte';
	import DifficultyRing from './DifficultyRing.svelte';

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

	const diff = Number((quest.difficulty ?? '').toString().replace(/[^\d]/g, '')) || 0;
</script>

<div
	class="mx-auto w-full max-w-6xl rounded-xl border-4 border-white bg-black shadow-md ring-1 shadow-white"
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
			<ChronologyBox {quest} {chronology} />
			{#if chronology == 'future'}
				<ChronologyBox {quest} chronology={'current'} />
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
				<h1 class="flex-1 text-lg leading-tight font-semibold text-white md:text-xl">
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
