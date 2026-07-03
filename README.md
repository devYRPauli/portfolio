# yashrajpandey.com

Personal site of Yash Raj Pandey - AI Agents Architect at UF IFAS.

Built with Astro. Static output, no client framework; content is markdown
in `src/content/` (writing and case studies). Publishing a post is adding
one markdown file and pushing.

## Develop

    npm install
    npm run dev       # dev server
    npm run build     # type-check + static build to dist/
    npm run preview   # serve the production build

## Deploy

Push to `main`. GitHub Actions builds and deploys to GitHub Pages
(custom domain via public/CNAME).
