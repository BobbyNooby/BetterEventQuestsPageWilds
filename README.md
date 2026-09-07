# Better Monster Hunter Wilds Event Quests Page

The official site's event quests page kinda sucks so i made a better, simpler one.

## How it works

- On boot (and on every page load), the server checks its SQLite DB (`data/quests.db`, [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), path overridable with `QUESTS_DB_PATH`). If it's empty or older than the current weekly slot, it scrapes Capcom's schedule page once and stores the full rotation.
- A weekly in-app cron fires at **Wednesday 00:10 UTC** — 10 minutes after Capcom's quest rotation goes live (Tuesday 17:00 PT) — so new weeks are picked up right after release. If the server happens to be down during a slot, the next page load self-heals the same way.
- The page itself never hits Capcom per-request; it reads from SQLite, so no rate-limit worries.

Manual refresh: `bun run refresh-db`.

## Develop

```sh
bun install
bun run dev
```

## Deploy (Coolify / Docker)

The build uses `@sveltejs/adapter-node` — a long-lived Node server, which is what makes the SQLite file and the in-app cron possible.

```sh
docker build -t better-event-quests .
docker run -p 3000:3000 -v quests-data:/app/data better-event-quests
```

In Coolify: use the Dockerfile, expose port `3000`, and mount a persistent volume at `/app/data` so the quest DB (and its weekly history) survives deploys. `PORT` is respected if you need to change it.
