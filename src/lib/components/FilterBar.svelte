<script lang="ts">
	import type { SortBy, StatusFilter } from '$lib/types';

	let {
		status = $bindable<StatusFilter>('all'),
		minDiff = $bindable(1),
		collabOnly = $bindable(false),
		onlineOnly = $bindable(false),
		sortBy = $bindable<SortBy>('ending'),
		locale = $bindable('all'),
		monster = $bindable('all'),
		counts,
		locales,
		monsters
	}: {
		status: StatusFilter;
		minDiff: number;
		collabOnly: boolean;
		onlineOnly: boolean;
		sortBy: SortBy;
		locale: string;
		monster: string;
		counts: Record<StatusFilter, number>;
		locales: string[];
		monsters: string[];
	} = $props();

	const statusOptions: { value: StatusFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'active', label: 'Active' },
		{ value: 'ending', label: 'Ending soon' },
		{ value: 'upcoming', label: 'Upcoming' },
		{ value: 'permanent', label: 'Permanent' }
	];

	const sortOptions: { value: SortBy; label: string }[] = [
		{ value: 'ending', label: 'Ending soonest' },
		{ value: 'diff-asc', label: 'Difficulty ↑' },
		{ value: 'diff-desc', label: 'Difficulty ↓' },
		{ value: 'newest', label: 'Newest' },
		{ value: 'hr', label: 'HR requirement' }
	];
</script>

<div
	class="sticky top-0 z-10 -mx-4 mb-6 border-b-2 border-white bg-black/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border-2 sm:px-4"
>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-sm">
		<!-- status chips -->
		<div class="flex flex-wrap gap-1.5" role="group" aria-label="Status filter">
			{#each statusOptions as opt (opt.value)}
				<button
					type="button"
					aria-pressed={status === opt.value}
					class={`rounded-full border-2 px-3 py-1 transition-colors ${
						status === opt.value
							? 'border-white bg-white font-bold text-black'
							: 'border-white/50 text-gray-300 hover:border-white hover:text-white'
					}`}
					onclick={() => (status = opt.value)}
				>
					{opt.label}
					<span class="opacity-60">{counts[opt.value]}</span>
				</button>
			{/each}
		</div>

		<!-- difficulty -->
		<label class="flex items-center gap-2 text-gray-300">
			<span>≥ {minDiff}★</span>
			<input
				type="range"
				min="1"
				max="10"
				bind:value={minDiff}
				class="w-28 accent-white"
				aria-label="Minimum difficulty"
			/>
		</label>

		<!-- toggles -->
		<button
			type="button"
			aria-pressed={collabOnly}
			class={`rounded-full border-2 px-3 py-1 transition-colors ${
				collabOnly
					? 'border-fuchsia-400 bg-fuchsia-600 font-bold text-white'
					: 'border-white/50 text-gray-300 hover:border-white hover:text-white'
			}`}
			onclick={() => (collabOnly = !collabOnly)}
		>
			Collab
		</button>
		<button
			type="button"
			aria-pressed={onlineOnly}
			class={`rounded-full border-2 px-3 py-1 transition-colors ${
				onlineOnly
					? 'border-sky-400 bg-sky-600 font-bold text-white'
					: 'border-white/50 text-gray-300 hover:border-white hover:text-white'
			}`}
			onclick={() => (onlineOnly = !onlineOnly)}
		>
			Online
		</button>

		<!-- locale + monster -->
		<label class="flex items-center gap-2 text-gray-300">
			Locale
			<select
				bind:value={locale}
				class="rounded border-2 border-white bg-black px-2 py-1 text-white"
			>
				<option value="all">All</option>
				{#each locales as loc (loc)}
					<option value={loc}>{loc}</option>
				{/each}
			</select>
		</label>
		<label class="flex items-center gap-2 text-gray-300">
			Monster
			<select
				bind:value={monster}
				class="max-w-44 rounded border-2 border-white bg-black px-2 py-1 text-white"
			>
				<option value="all">All</option>
				{#each monsters as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</label>

		<!-- sort -->
		<label class="ml-auto flex items-center gap-2 text-gray-300">
			Sort
			<select
				bind:value={sortBy}
				class="rounded border-2 border-white bg-black px-2 py-1 text-white"
			>
				{#each sortOptions as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</label>
	</div>
</div>
