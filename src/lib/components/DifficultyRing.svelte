<script lang="ts">
	import { maxDifficulty } from '$lib/config/constants';

	// Props
	let {
		value = 1,
		max = maxDifficulty,
		size = 64,
		thickness = 8,
		gapDeg = 6,
		inactiveColor = 'rgba(0,0,0,0.2)',
		textColor = '#FFFFFF'
	} = $props();

	// clamp
	value = Math.max(0, Math.min(value, max));

	const step = 360 / max;
	const r = (size - thickness) / 2;
	const cx = size / 2;
	const cy = size / 2;

	function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
		const rad = ((deg - 90) * Math.PI) / 180;
		return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
	}

	function arcPath(startDeg: number, endDeg: number) {
		const start = polarToCartesian(cx, cy, r, endDeg);
		const end = polarToCartesian(cx, cy, r, startDeg);
		const largeArc = endDeg - startDeg > 180 ? 1 : 0;
		return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
	}

	// ---- NEW: one color for the whole ring based on value/max ----
	// Green (120°) → Yellow (60°) → Red (0°)
	function ringColorFromRatio(ratio: number): string {
		const clamped = Math.max(0, Math.min(1, ratio));
		const hue = 120 * (1 - clamped); // 1 => 0° (red), 0 => 120° (green)
		return `hsl(${hue} 90% 45%)`;
	}

	const ringColor = ringColorFromRatio(value / max);
</script>

<svg
	width={size}
	height={size}
	viewBox={`0 0 ${size} ${size}`}
	aria-label={`Difficulty ${value} of ${max}`}
	role="img"
>
	{#each Array(max) as _, i}
		{@const s = i * step + gapDeg / 2}
		{@const e = (i + 1) * step - gapDeg / 2}
		<path
			d={arcPath(s, e)}
			stroke={i < value ? ringColor : inactiveColor}
			stroke-width={thickness}
			stroke-linecap="round"
			fill="none"
		/>
	{/each}

	<text
		x="50%"
		y="50%"
		text-anchor="middle"
		dominant-baseline="central"
		style={`font: 700 ${Math.floor(size * 0.36)}px/1 system-ui, sans-serif; fill:${textColor}`}
	>
		{value}
	</text>
</svg>
