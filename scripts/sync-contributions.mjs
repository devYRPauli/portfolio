#!/usr/bin/env node
/**
 * Refresh the merged-pull-request counts on /contributions/.
 *
 * Writes only src/data/contributions.generated.json (the numbers).
 * The prose in src/data/contributions.ts is hand-written and never touched,
 * so a sync can correct a count but can never rewrite a description.
 *
 *   node scripts/sync-contributions.mjs          # write if changed
 *   node scripts/sync-contributions.mjs --check  # exit 1 if stale, write nothing
 *
 * Uses GITHUB_TOKEN or GH_TOKEN when present. Unauthenticated works too, but
 * the search endpoint allows only 10 requests a minute.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const USER = 'devYRPauli';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/contributions.generated.json');
const ECOSYSTEM_OWNER = 'steipete';

/** Pre-2022 coursework and Hacktoberfest merges. Real, but not this record. */
const EXCLUDED = /^(vikumkbv|omonimus1|C0D1NG|ankit039|JetBrains)\//i;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

async function search(page) {
  const url =
    'https://api.github.com/search/issues?q=' +
    encodeURIComponent(`author:${USER} type:pr is:merged`) +
    `&per_page=100&page=${page}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `${USER}-portfolio-sync`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function allMergedPrs() {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const { items: batch, total_count } = await search(page);
    items.push(...batch);
    if (items.length >= total_count || batch.length === 0) break;
  }
  return items.map((i) => i.repository_url.split('/').slice(-2).join('/'));
}

const repos = await allMergedPrs();

/** Someone else's repository, and not a student-era merge. */
const external = repos.filter((r) => !r.startsWith(`${USER}/`) && !EXCLUDED.test(r));

const byRepo = {};
for (const r of external) byRepo[r] = (byRepo[r] || 0) + 1;

const ecosystemByRepo = {};
for (const [repo, n] of Object.entries(byRepo)) {
  if (repo.startsWith(`${ECOSYSTEM_OWNER}/`)) ecosystemByRepo[repo.split('/')[1]] = n;
}

const ecosystemCount = Object.values(ecosystemByRepo).reduce((a, b) => a + b, 0);

const next = {
  updated: new Date().toISOString().slice(0, 10),
  merged: external.length,
  projects: Object.keys(byRepo).length,
  byRepo: Object.fromEntries(Object.entries(byRepo).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  ecosystem: {
    owner: ECOSYSTEM_OWNER,
    count: ecosystemCount,
    repos: Object.keys(ecosystemByRepo).length,
    byRepo: Object.fromEntries(
      Object.entries(ecosystemByRepo).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    ),
  },
};

let prev = {};
try {
  prev = JSON.parse(readFileSync(OUT, 'utf8'));
} catch {
  // first run
}

/** `updated` always moves, so compare the figures only. */
const sameNumbers = JSON.stringify({ ...prev, updated: null }) === JSON.stringify({ ...next, updated: null });

if (sameNumbers) {
  console.log(`contributions: unchanged (${next.merged} merged across ${next.projects} projects)`);
  process.exit(0);
}

console.log(`contributions: ${prev.merged ?? 0} -> ${next.merged} merged, ${prev.projects ?? 0} -> ${next.projects} projects`);

// A repo with no description in contributions.ts still counts, but the page can
// only show it under the ecosystem block, so say so rather than losing it.
const described = readFileSync(OUT.replace('.generated.json', '.ts'), 'utf8');
const undescribed = Object.keys(next.byRepo).filter(
  (r) => !described.includes(r) && !r.startsWith(`${ECOSYSTEM_OWNER}/`),
);
if (undescribed.length) {
  console.log('  new projects needing a description in contributions.ts:');
  for (const r of undescribed) console.log(`    ${r} (${next.byRepo[r]})`);
}

if (process.argv.includes('--check')) {
  console.error('contributions: counts are stale. Run: npm run sync:contributions');
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
console.log(`contributions: wrote ${OUT.split('/').slice(-1)[0]}`);
