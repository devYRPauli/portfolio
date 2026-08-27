# yashrajpandey.com

Source for my personal site. It is a text-first portfolio for selected work,
technical writing, and short case studies.

The site uses Astro with no client framework. Work and writing live in Markdown
content collections. Shared layouts handle metadata, structured data,
navigation, and generated social cards.

## Local development

```sh
npm ci
npm run dev
```

The local site runs at `http://localhost:4321/` by default.

```sh
npm run check                 # Validate Astro, TypeScript, and content schemas
npm run build                 # Validate, build to dist/, and check internal links
npm run preview               # Serve the production build locally
npm run sync:contributions    # Refresh merged pull request counts from the GitHub API
```

Astro runs the dev server as a background daemon, so `npm run dev` returns immediately. Use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage it.

## Content

Writing lives in `src/content/writing/`. Each Markdown file requires:

- `title`
- `description`
- `pubDate`
- Optional `updatedDate`, `tags`, and `draft`
- Optional `verdict`, described below
- Optional `project`, described below

Work lives in `src/content/work/`. Each Markdown file requires:

- `title`, `summary`, `role`, `kind`, and `year`
- `stack`
- `order`, which controls the full work index
- Optional `links`
- Optional `featuredOrder`, which selects and orders up to three homepage projects
- Optional `verdict`, described below

Collection schemas are defined in `src/content.config.ts`. Invalid or incomplete frontmatter fails the Astro check and production build.

### Verdict lines

An entry can end with a verdict: what was tried, then what came of it.

```yaml
verdict:
  tried: "8 submitted"
  result: "0 promoted"
```

`EntryList` puts an arrow between the two parts and gives the result the `--flag` colour. The line then appears under that entry on the home page and on the section index.

The field is optional on purpose. An entry with no honest outcome renders bare, which is better than a forced line. Negative results belong here on the same terms as wins.

Keep both parts short. A verdict over about 56 characters wraps onto a second row.

### Linking a post to its project

Four posts are the long-form writeup of a project that also has a short case study. The post declares that relationship once, with a reference to the work entry:

```yaml
project: willitcall
```

Everything else derives from it. The case study renders a "Writeup" link back to the post. The post renders a "Project" link to the case study. The home page skips a post whose project is already featured, so one subject never takes two of the six home entries.

Do not hand-write a "Writeup" entry in a work file's `links:`. That was the old approach, it only pointed one way, and nothing in the code knew a pair was a pair.

The section indexes are unaffected. `/work/` lists every project and `/writing/` lists every post, whether or not they are paired.

## Generated pages and feeds

- `/work/` and `/writing/` provide the complete indexes.
- `/about/` covers background, role history, and contact.
- `/contributions/` lists merged pull requests to projects I do not own.
- `/rss.xml` publishes writing as an RSS feed.
- `/sitemap-index.xml` is generated during the production build.
- `/llms.txt` provides a plain-text site summary.
- `/og/default.png`, `/og/page/[slug].png`, `/og/work/[slug].png`, and `/og/writing/[slug].png` generate social cards at build time.

## Contribution counts

The figures on `/contributions/` come from `src/data/contributions.generated.json`, written by `scripts/sync-contributions.mjs` and refreshed by a weekly GitHub Action. That file is generated and should not be edited by hand.

Project descriptions in `src/data/contributions.ts` are hand-written, and the sync never touches them. Every surface that states a count derives it from `totals`, so a refreshed number updates the page, the home record row, `llms.txt`, and the social card together.

Static files that must retain stable public URLs, including the resume, favicons, manifest, robots file, and custom domain file, live in `public/`. Transformable page images live in `src/assets/` and use Astro's image pipeline.

## Deployment

Push to `main`. GitHub Actions runs the production build and deploys the result to GitHub Pages. The custom domain is configured through `public/CNAME`.
