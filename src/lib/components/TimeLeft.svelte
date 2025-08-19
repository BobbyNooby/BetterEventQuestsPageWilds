<script lang="ts">
	import { timeDifference } from '$lib/timeDifference';
	import type { Quest } from '$lib/types';
	import { onMount } from 'svelte';

	let { quest }: { quest: Quest } = $props();

	// turn the {days,hours,minutes,seconds} into a string
	const parseTimeDiffToString = (timeDiff: {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	}) => {
		if (!timeDiff) return 'N/A';
		const { days, hours, minutes, seconds } = timeDiff;

		if (days > 0) return `${days} Day${days > 1 ? 's' : ''}`;

		// pad to 2-digit for clock-style
		const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	};

	// compute only formatted diff string
	const computeTimeDiffString = (start: Date | null, end: Date | null): string => {
		const now = new Date();

		if (!start || !end) {
			return 'Permanent';
		}

		if (now < start) {
			return parseTimeDiffToString(timeDifference(now, start)); // until it starts
		}

		if (now >= start && now <= end) {
			return parseTimeDiffToString(timeDifference(now, end)); // until it ends
		}

		return `${parseTimeDiffToString(timeDifference(end, now))} ago`; // time since ended
	};

	const startTime = typeof quest.startISOUTC === 'string' ? new Date(quest.startISOUTC) : null;
	const endTime = typeof quest.endISOUTC === 'string' ? new Date(quest.endISOUTC) : null;

	let timeDiffString = $state(computeTimeDiffString(startTime, endTime));

	onMount(() => {
		if (startTime && endTime) {
			const interval = setInterval(() => {
				timeDiffString = computeTimeDiffString(startTime, endTime);
			}, 1000);
			return () => clearInterval(interval);
		}
	});
</script>

<p class="">{timeDiffString}</p>
