export const scrape = async (url: string): Promise<{ status: number; html: string }> => {
	const res = await fetch(url, {
		// Some sites block “botty” defaults — send a standard UA/Accept set
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'accept-language': 'en-US,en;q=0.9'
		},
		redirect: 'follow'
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		return {
			status: res.status,
			html: `Request failed: ${res.status} ${res.statusText}\n${body.slice(0, 1000)}`
		};
	}

	const html = await res.text();
	return { status: 200, html };
};
