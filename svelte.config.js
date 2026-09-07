import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Long-lived Node server: persistent process for SQLite + the weekly cron.
		// `bun run build` → `build/index.js`, started with `node build/index.js`.
		adapter: adapter()
	}
};

export default config;
