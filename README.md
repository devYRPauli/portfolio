# yashrajpandey.com

The source for my personal site. It holds my projects and my writing, and it lists my open source work.

The site is static. It uses Astro with no client framework. Projects and posts are Markdown files in content collections.

## Run it locally

```sh
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321/`. Astro runs it as a background daemon, so `npm run dev` returns at once. Use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage it.

```sh
npm run check                 # Check Astro, TypeScript, and the content schemas
npm run build                 # Check, build to dist/, and check internal links
npm run preview               # Serve the production build
npm run sync:contributions    # Refresh merged pull request counts from the GitHub API
```

The build must finish with 0 errors, 0 warnings, and 0 hints.

## Content

The schemas are in `src/content.config.ts`. Bad or missing frontmatter fails the check and the build.

Posts are in `src/content/writing/`. Each post needs `title`, `description`, and `pubDate`. The optional fields are `updatedDate`, `tags`, `draft`, `verdict`, `project`, and `featuredOrder`. A post with `featuredOrder` shows in the Writing section of the home page, in that order.

Projects are in `src/content/work/`. Each project needs `title`, `summary`, `role`, `kind`, `year`, `stack`, `mode`, and `order`. The optional fields are `links`, `verdict`, `supersededBy`, and `featured`.

- `mode` is `build`, `evaluate`, or `football`. It sets the group on the home page and on `/work/`.
- `order` sorts the projects in a group. The home page and `/work/` use the same order.
- `featured: true` puts the project on the home page.
- `supersededBy` names the project that replaced this one. A superseded project sorts last in its group.

### Verdict lines

A post or a project can end with a verdict: what I tried, then what came of it.

```yaml
verdict:
  tried: "8 submitted"
  result: "0 promoted"
```

The result shows after an arrow, in the flag color. The field is optional. An entry with no honest outcome has no verdict. Negative results go here on the same terms as wins. Keep the line to about 56 characters.

### A post about a project

When a post is the long writeup of a project, the post says so once:

```yaml
project: willitcall
```

The code reads the pair from this field only. The project then has no page of its own. Every link to the project goes to the post, and `/work/willitcall/` redirects to the post. The post shows the project's role, kind, stack, and links beside the text. The home page does not list the post when the project is already featured.

Do not write a link between a post and its project by hand.

## Pages and feeds

- `/work/` and `/writing/` list every project and every post.
- `/about/` has my background, my roles, and my contact links.
- `/contributions/` lists my merged pull requests to projects that I do not own.
- `/rss.xml` is the RSS feed for the posts.
- `/sitemap-index.xml` comes from the build. It leaves out the redirect pages.
- `/llms.txt` is a plain text summary of the site.
- `/og/` holds the social cards. The build makes them with Satori.

## Contribution counts

The counts come from `src/data/contributions.generated.json`. `scripts/sync-contributions.mjs` writes this file, and a GitHub Action runs the script every week. Do not edit the file by hand.

The project descriptions in `src/data/contributions.ts` are hand-written. The sync does not change them. Every page that shows a count reads it from `totals`, so a new count updates all of them.

## Files

`public/` holds the files that need a fixed URL: the resume, the icons, the manifest, `robots.txt`, and `CNAME`. Images that Astro processes are in `src/assets/`.

## Deploy

Push to `main`. A GitHub Action builds the site and deploys it to GitHub Pages. `public/CNAME` sets the custom domain.
