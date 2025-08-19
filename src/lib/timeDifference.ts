export const timeDifference = (
	start: Date,
	end: Date
): { days: number; hours: number; minutes: number; seconds: number } => {
	let diffMs = end.getTime() - start.getTime();
	const sign = diffMs < 0 ? -1 : 1;
	diffMs = Math.abs(diffMs);

	let totalSeconds = Math.floor(diffMs / 1000);

	const days = Math.floor(totalSeconds / (24 * 3600));
	totalSeconds -= days * 24 * 3600;

	const hours = Math.floor(totalSeconds / 3600);
	totalSeconds -= hours * 3600;

	const minutes = Math.floor(totalSeconds / 60);
	totalSeconds -= minutes * 60;

	const seconds = totalSeconds;

	return {
		days: days * sign,
		hours: hours * sign,
		minutes: minutes * sign,
		seconds: seconds * sign
	};
};
