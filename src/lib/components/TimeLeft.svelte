<script lang="ts">
	import { timeDifference } from '$lib/timeDifference';

	let { start, end }: { start: Date | null; end: Date | null } = $props();

	// Format {days,hours,minutes,seconds} into a string
	const formatDiff = (timeDiff: {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	}) => {
		if (!timeDiff) return 'N/A';
		const { days, hours, minutes, seconds } = timeDiff;

		if (days > 0) return `${days} Day${days > 1 ? 's' : ''}`;

		// clock-style 2-digit
		const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	};

	const compute = (start: Date | null, end: Date | null): string => {
		const now = new Date();

		if (!start || !end) return 'Permanent';

		if (now < start) return formatDiff(timeDifference(now, start)); // until it starts
		if (now <= end) return formatDiff(timeDifference(now, end)); // until it ends

		return `${formatDiff(timeDifference(end, now))} ago`; // since ended
	};

	let timeDiffString = $state(compute(start, end));
	let timer: ReturnType<typeof setInterval> | null = null;

	// Recompute and (re)start interval whenever start/end change.
	$effect(() => {
		// clear any previous timer
		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		// If either is null, show Permanent and stop here
		if (!start || !end) {
			timeDiffString = 'Permanent';
			return;
		}

		// Initial compute + ticking clock
		timeDiffString = compute(start, end);
		timer = setInterval(() => {
			timeDiffString = compute(start, end);
		}, 1000);

		// cleanup if start/end change or component unmounts
		return () => {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		};
	});
</script>

<p>{timeDiffString}</p>
