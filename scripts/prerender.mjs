// Build-time prerender: generate complete static HTML from the canonical content
// (content.ts) and inject it into dist/index.html's #root. React replaces it on
// mount, so this is purely for crawlers / AI fetchers / no-JS readers - it ships the
// real, full content (every island, case study, and playbook) in the raw HTML.
//
// Runs after `vite build`. Resilient by design: any failure leaves the built
// index.html untouched (the <noscript> fallback stays) and exits 0 so deploys never break.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'dist', 'index.html');

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const oneLine = (s = '') => esc(String(s).replace(/\n/g, ' '));

const SECTION_TITLES = {
  home: 'Profile',
  work: 'Selected Work',
  about: 'About',
  lab: 'Builder Tools (free, client-side)',
  playbooks: 'Playbooks',
  contact: 'Contact',
};

try {
  // Transpile + bundle content.ts to plain ESM (the only import is a type, which is erased).
  const tmp = join(tmpdir(), `content-${Date.now()}.mjs`);
  await build({
    entryPoints: [join(ROOT, 'src', 'data', 'content.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: tmp,
    logLevel: 'silent',
  });
  const { ISLANDS, CONTENT, PLAYBOOKS } = await import(`file://${tmp}`);
  rmSync(tmp, { force: true });

  const out = [];
  out.push('<header>');
  out.push('<h1>Yash Raj Pandey - AI Agents Architect</h1>');
  out.push(
    '<p>AI Agents Architect at the University of Florida (IFAS), building local-first AI infrastructure: self-hosted open-weight LLMs, retrieval-augmented generation (RAG), vector search, and AI agents running in production. Joined UF as a Software Engineer (Mar 2025), promoted to Lead (Oct 2025), then Architect (Apr 2026).</p>',
  );
  out.push('</header>');

  for (const island of ISLANDS) {
    const items = CONTENT[island.id] || [];
    const parts = [];

    for (const it of items) {
      switch (it.kind) {
        case 'header':
          if (it.title) parts.push(`<p><strong>${oneLine(it.title)}</strong>${it.subtitle ? ` - ${oneLine(it.subtitle)}` : ''}</p>`);
          break;
        case 'stat':
          parts.push(`<p><strong>${oneLine(it.title)}</strong> - ${oneLine(it.subtitle)}</p>`);
          break;
        case 'module':
          if (it.moduleType === 'ticker' && it.items?.length) parts.push(`<p><strong>Stack:</strong> ${esc(it.items.join(', '))}</p>`);
          break;
        case 'project': {
          parts.push(`<article><h3>${oneLine(it.title)}${it.subtitle ? ` - ${oneLine(it.subtitle)}` : ''}</h3>`);
          if (it.description) parts.push(`<p>${oneLine(it.description)}</p>`);
          const cs = it.caseStudy;
          if (cs) {
            if (cs.problem) parts.push(`<p><strong>Problem:</strong> ${oneLine(cs.problem)}</p>`);
            if (cs.approach?.length) parts.push(`<p><strong>Approach:</strong></p><ul>${cs.approach.map((a) => `<li>${oneLine(a)}</li>`).join('')}</ul>`);
            if (cs.stack?.length) parts.push(`<p><strong>Stack:</strong> ${esc(cs.stack.join(', '))}</p>`);
            if (cs.metrics?.length) parts.push(`<p><strong>Impact:</strong> ${cs.metrics.map((m) => `${oneLine(m.label)}: ${oneLine(m.before)} → ${oneLine(m.after)}`).join('; ')}</p>`);
            if (cs.tradeoffs) parts.push(`<p><strong>Trade-offs:</strong> ${oneLine(cs.tradeoffs)}</p>`);
          }
          if (it.href) parts.push(`<p><a href="${esc(it.href)}">${esc(it.href)}</a></p>`);
          parts.push('</article>');
          break;
        }
        case 'playbook': {
          const pb = it.playbookId ? PLAYBOOKS[it.playbookId] : null;
          parts.push(`<article><h3>${oneLine(it.title)}${it.subtitle ? ` - ${oneLine(it.subtitle)}` : ''}</h3>`);
          if (pb?.intro) parts.push(`<p>${oneLine(pb.intro)}</p>`);
          if (pb?.chapters?.length) parts.push(`<ul>${pb.chapters.map((c) => `<li>${oneLine(c.heading)}</li>`).join('')}</ul>`);
          parts.push('</article>');
          break;
        }
        case 'tool':
          parts.push(`<p><strong>${oneLine(it.title)}</strong> - ${oneLine(it.subtitle)} (runs entirely in your browser, no signup)</p>`);
          break;
        case 'timeline':
          if (it.timeline?.length) parts.push(`<p><strong>${oneLine(it.title)}</strong></p><ul>${it.timeline.map((t) => `<li>${oneLine(t.year)} - ${oneLine(t.title)}: ${oneLine(t.description)}</li>`).join('')}</ul>`);
          break;
        case 'fact':
          parts.push(`<p><strong>${oneLine(it.title)}</strong> - ${oneLine(it.subtitle)}${it.description ? `. ${oneLine(it.description)}` : ''}${it.href ? ` (<a href="${esc(it.href)}">${esc(it.href)}</a>)` : ''}</p>`);
          break;
        case 'link':
          if (it.href) parts.push(`<p><a href="${esc(it.href)}">${oneLine(it.title)}</a>${it.subtitle ? ` - ${oneLine(it.subtitle)}` : ''}</p>`);
          break;
        default:
          break;
      }
    }

    if (parts.length) {
      out.push(`<section><h2>${esc(SECTION_TITLES[island.id] || island.label)}</h2>${parts.join('')}</section>`);
    }
  }

  const content = `<div id="prerender" style="max-width:820px;margin:0 auto;padding:64px 24px;font-family:'Space Grotesk',system-ui,-apple-system,sans-serif;color:#ededec;line-height:1.6;max-height:100vh;overflow:hidden">${out.join('')}</div>`;

  let html = readFileSync(INDEX, 'utf8');
  if (!html.includes('<div id="root"></div>')) throw new Error('#root placeholder not found');
  html = html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  // The static content now serves no-JS readers too, so drop the redundant noscript block.
  html = html.replace(/\n?\s*<noscript>[\s\S]*?<\/noscript>/, '');
  writeFileSync(INDEX, html);
  console.log(`prerender: injected ${out.length} static content blocks into dist/index.html`);
} catch (err) {
  console.warn(`prerender: skipped (${err.message}); <noscript> fallback retained`);
  process.exit(0);
}
