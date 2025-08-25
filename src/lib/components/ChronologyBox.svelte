<script lang="ts">
	import type { Quest } from '$lib/types';
	import { parseISOToCurrentTimezone } from '$lib/utils';
	import TimeLeft from './TimeLeft.svelte';

	let {
		quest,
		chronology
	}: { quest: Quest; chronology: 'past' | 'current' | 'future' | 'permanent' } = $props();

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
	class={`w-full rounded-lg border-4 px-2.5 py-1 text-center text-xl font-semibold tracking-wide uppercase ${labelMap[chronology].classes}`}
	aria-live="polite"
>
	<span>
		{labelMap[chronology].text}
	</span>

	<!-- Timer BELOW the label, hidden for permanent -->
	{#if chronology !== 'permanent'}
		<div class="mt-1 font-mono text-lg tabular-nums">
			<TimeLeft
				start={new Date()}
				end={utcAccordingToChronology ? new Date(utcAccordingToChronology) : null}
			/>
		</div>
		<div class="mt-1 font-mono text-xs tabular-nums">
			<span>{parseISOToCurrentTimezone(utcAccordingToChronology)}</span>
		</div>
	{/if}
</div>
