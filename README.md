# yashrajpandey.com

Personal site of Yash Raj Pandey, an AI systems engineer and AI Agents Architect at UF IFAS. The site is intentionally text-first: selected work, technical writing, and concise context about the systems behind them.

Built with Astro as a static site with no client framework. Work and writing live in Markdown content collections, while shared layouts handle metadata, structured data, navigation, and generated social cards.

## Local development

```sh
npm ci
npm run dev
```

The local site runs at `http://localhost:4321/` by default.

```sh
npm run check       # Validate Astro, TypeScript, and content schemas
npm run build       # Validate, build to dist/, and check internal links
npm run preview     # Serve the production build locally
```

## Content

Writing lives in `src/content/writing/`. Each Markdown file requires:

- `title`
- `description`
- `pubDate`
- Optional `updatedDate`, `tags`, and `draft`

Work lives in `src/content/work/`. Each Markdown file requires:

- `title`, `summary`, `role`, `kind`, and `year`
- `stack`
- `order`, which controls the full work index
- Optional `links`
- Optional `featuredOrder`, which selects and orders up to three homepage projects

Collection schemas are defined in `src/content.config.ts`. Invalid or incomplete frontmatter fails the Astro check and production build.

## Generated pages and feeds

- `/work/` and `/writing/` provide the complete indexes.
- `/rss.xml` publishes writing as an RSS feed.
- `/sitemap-index.xml` is generated during the production build.
- `/llms.txt` provides a plain-text site summary.
- `/og/default.png`, `/og/work/[slug].png`, and `/og/writing/[slug].png` generate social cards at build time.

Static files that must retain stable public URLs, including the resume, favicons, manifest, robots file, and custom domain file, live in `public/`. Transformable page images live in `src/assets/` and use Astro's image pipeline.

## Deployment

Push to `main`. GitHub Actions runs the production build and deploys the result to GitHub Pages. The custom domain is configured through `public/CNAME`.
