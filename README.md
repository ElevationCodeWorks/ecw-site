# Elevation Code Works website

The marketing site for Elevation Code Works, a Denver software engineering business for small businesses. It is a fully static [Astro](https://astro.build) site hosted on Netlify. There is no server code: every page is prerendered HTML, and the contact form is handled by Netlify Forms.

Planning lives in [`openspec/`](openspec/). The current change is `openspec/changes/astro-site-foundation/`.

## Setup

Requirements: Node 26 (see `.nvmrc`; Node 24 also works) and npm.

```sh
nvm use        # or install Node 26 another way
npm install
```

## Scripts

| Command             | What it does                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Starts the dev server at http://localhost:4321 with live reload.                                              |
| `npm run build`     | Type-checks with `astro check`, then builds the static site into `dist/`. The build fails if any check fails. |
| `npm run preview`   | Serves the built `dist/` at http://localhost:4321. Run `npm run build` first.                                 |
| `npm test`          | Runs the unit tests (`*.test.ts`) with Node's built-in test runner.                                           |
| `npm run fmt`       | Formats the project with Prettier.                                                                            |
| `npm run fmt:check` | Checks formatting without changing files.                                                                     |

## Project layout

```
astro.config.mjs     Astro config: canonical origin, URL shape, sitemap
src/site.config.ts   Site-wide settings (canonical origin, contact details)
src/pages/           One file per route
```
