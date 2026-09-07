<script lang="ts">
	import { browser } from '$app/environment';
	import type { Quest } from '$lib/types';
	import { parseISOToCurrentTimezone } from '$lib/utils';
	import type { Chronology } from '$lib/utils';
	import TimeLeft from './TimeLeft.svelte';

	let {
		quest,
		chronology,
		compact = false
	}: {
		quest: Quest;
		chronology: Chronology;
		compact?: boolean;
	} = $props();

	const labelMap = {
		past: { text: 'Ended', classes: 'bg-purple-600 text-white border-purple-800' },
		current: { text: 'Ends In', classes: 'bg-red-600 text-white border-red-700' },
		future: { text: 'Starts In', classes: 'bg-yellow-400 text-black border-yellow-500' },
		permanent: { text: 'Permanent', classes: 'bg-green-600 text-white border-green-800' }
	} as const;

	const utcAccordingToChronology =
		chronology === 'past' || chronology === 'current'
			? quest.endISOUTC
			: chronology === 'future'
				? quest.startISOUTC
				: null;
</script>

<!-- Colored  box -->
<div
	class={`w-full rounded-lg border px-2.5 text-center font-semibold tracking-wide uppercase ${
		compact ? 'border-2 py-1 text-xs' : 'border-4 py-1 text-xl'
	} ${labelMap[chronology].classes}`}
	aria-live="polite"
>
	<span>
		{labelMap[chronology].text}
	</span>

	<!-- Timer BELOW the label, hidden for permanent -->
	{#if chronology !== 'permanent'}
		<div class={`mt-1 font-mono tabular-nums ${compact ? 'text-sm' : 'text-lg'}`}>
			<TimeLeft
				start={new Date()}
				end={utcAccordingToChronology ? new Date(utcAccordingToChronology) : null}
			/>
		</div>
		<!-- local-TZ date string: client-only, so SSR never bakes in server-TZ text -->
		{#if browser && utcAccordingToChronology}
			<div class={`mt-1 font-mono tabular-nums ${compact ? 'text-[10px]' : 'text-xs'}`}>
				<span>{parseISOToCurrentTimezone(utcAccordingToChronology)}</span>
			</div>
		{/if}
	{/if}
</div>
