<script lang="ts">
	import QuestBlock from '$lib/components/QuestBlock.svelte';
	import { organizeScrape } from '$lib/organizeScrape';
	import { sortScrape } from '$lib/sortScrape';
	import { sortedData } from '$lib/tempData.js';
	import { onMount } from 'svelte';

	let { data } = $props();
	// const sortedData = sortScrape(organizeScrape(data.html.toString()));
	// onMount(() => {
	// 	navigator.clipboard.writeText(JSON.stringify(sortedData));
	// });
	// const data = sortedData;
</script>

<!-- Full‑viewport black background -->
<div id="background" class="min-h-screen bg-black">
	<!-- Page container with safe horizontal padding -->
	<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Centered title only; styles don't bleed to children -->
		<header class="py-8 sm:py-10">
			<h1
				class="text-center text-3xl font-extrabold tracking-tight
                 text-white sm:text-4xl md:text-5xl"
			>
				Better Event Quests Page
			</h1>
		</header>

		<!-- Content area: isolate prevents ancestor effects on children -->
		<main class="isolate">
			<!-- Vertical stack; no flex wrapping that could affect children -->
			<div
				class="space-y-8 sm:space-y-10 md:space-y-12"
				style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;"
			>
				{#each sortedData as quest}
					<QuestBlock {quest} />
				{/each}
			</div>
		</main>
	</div>
</div>
