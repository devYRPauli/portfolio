# yashrajpandey.com

Personal portfolio and free toolbox for builders. Live at [yashrajpandey.com](https://yashrajpandey.com).

## What it is

A spatial portfolio built on an infinite canvas. Instead of traditional page navigation, the interface is a 2D virtual world — clicking a nav item moves the camera to that island of content. Six islands: Home, Work, About, Lab, Playbooks, Contact.

On mobile the canvas collapses to a standard vertical scroll layout.

## Free tools (no signup)

Everything runs client-side. Nothing leaves the browser.

**Token Counter** — Paste any prompt or text and get an instant token estimate with cost breakdown across frontier models (Gemini 3.1 Pro, GPT-5.4, Claude Sonnet 4.6, Claude Opus 4.6).

**Prompt Formatter** — Paste a raw prompt in any format and get it restructured into `[SYSTEM] [TASK] [CONSTRAINTS] [OUTPUT FORMAT]` blocks, ready to copy.

## Playbooks

Three production-sourced LLM engineering guides:

1. **Prompt Debugging Checklist** — 8 reasons why LLM output keeps breaking
2. **FastAPI + LLM Service Pattern** — Streaming, retries, structured outputs, Pydantic validation
3. **Designing Reliable Multi-Step LLM Workflows** — Contracts between pipeline steps, validation, observability

## Tech stack

- React 18 + TypeScript
- Vite 5
- Framer Motion (canvas panning, card animations)
- Zustand (global state)
- Tailwind CSS + CSS custom properties
- GitHub Pages (static hosting)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build    # type-check + bundle → dist/
npm run preview  # serve production build locally
npm run lint     # ESLint, zero warnings
```

## Deployment

Deployed to GitHub Pages. The `public/CNAME` file sets the custom domain — do not delete it.

To deploy manually:

```bash
npm run build
```

Then push `dist/` to the `gh-pages` branch, or use a GitHub Actions workflow that runs `npm ci && npm run build` and uploads `dist/` as a Pages artifact.

## Contact

[yashpn62@gmail.com](mailto:yashpn62@gmail.com) · [LinkedIn](https://www.linkedin.com/in/yashrajpandeyy) · [GitHub](https://github.com/devYRPauli)
