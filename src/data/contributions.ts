/**
 * Merged pull requests to other people's repositories.
 *
 * The counts come from contributions.generated.json, refreshed by
 * `npm run sync:contributions` and by a weekly GitHub Action. The descriptions
 * below are hand-written and are never touched by the sync, so a refresh can
 * correct a number but cannot rewrite a sentence.
 *
 * Counts exclude my own repositories and pre-2022 student-era merges.
 */

import generated from './contributions.generated.json';

export const totals = {
  merged: generated.merged,
  projects: generated.projects,
  updated: generated.updated,
};

/** Merged per month, oldest first. The sync runs mid-month, so the last month is partial. */
export const monthly = Object.entries(generated.byMonth).map(([month, merged]) => ({ month, merged }));

/**
 * The three fixes the home page names. Hand-written, and checked against the
 * merged pull requests with `gh pr view`.
 */
export const namedFixes = [
  {
    project: 'llama.cpp',
    repo: 'ggml-org/llama.cpp',
    number: 24305,
    merged: '2026-06-09',
    title: 'Fix wrong RMS norm gradients on the CPU backend',
    what: "On the CPU backend, the RMS norm backward pass returned a wrong gradient when the scheduler reused an input's buffer for the output.",
  },
  {
    project: 'LiteLLM',
    repo: 'BerriAI/litellm',
    number: 30652,
    merged: '2026-06-22',
    title: 'Fix Perplexity searches billed at 1/1000 of the price',
    what: 'When Perplexity did not return its own cost, LiteLLM billed search queries at 1/1000 of the real price.',
  },
  {
    project: 'Google TabFM',
    repo: 'google-research/tabfm',
    number: 42,
    merged: '2026-07-03',
    title: 'Fix predict crashing on machines with two or more GPUs',
    what: 'With default settings, the first predict call crashed on any machine with two or more GPUs unless you pinned it to one device.',
  },
].map((fix) => ({ ...fix, href: `https://github.com/${fix.repo}/pull/${fix.number}` }));

export const searchUrl =
  'https://github.com/search?q=is%3Apr+author%3AdevYRPauli+is%3Amerged&type=pullrequests';

export interface Project {
  repo: string;
  count: number;
  what: string;
  highlights: string[];
}

/** Hand-written context, keyed by repository. Counts are filled in from the sync. */
const described: Omit<Project, 'count'>[] = [
  {
    repo: 'ggml-org/llama.cpp',
    what: 'The C/C++ inference engine most local LLM tooling is built on.',
    highlights: [
      'ggml-cpu: fix rms_norm_back wrong output under in-place aliasing',
      'llama-quant: exclude the i32 ffn_gate_tid2eid routing table from quantization',
      'ggml: require contiguous src for ROLL on CUDA and Metal',
    ],
  },
  {
    repo: 'ml-explore/mlx',
    what: "Apple's array framework for Apple silicon.",
    highlights: [
      'Fix signed-integer overflow (UB) in roll and tile shape arithmetic',
      'Raise on arange with step == 0 instead of undefined behavior',
    ],
  },
  {
    repo: 'ml-explore/mlx-lm',
    what: 'The MLX language-model runtime and server.',
    highlights: [
      'Fix mlx_lm.server 404 on short prompts (clamp negative start in think-token search)',
    ],
  },
  {
    repo: 'google-research/tabfm',
    what: "Google Research's tabular foundation model. Found during my independent evaluation.",
    highlights: ['Fix predict crashing on multi-device hosts (IndivisibleError / device mismatch)'],
  },
  {
    repo: 'infiniflow/ragflow',
    what: 'A retrieval-augmented generation engine. Most of my fixes there are in its document parsers.',
    highlights: [
      'Fix QA DOCX table parser dropping cells between repeated text',
      'Fix tag CSV parser splicing wrong text after a multi-line quoted field',
      'Fix RAGFlowJsonParser crashing with IndexError on top-level JSON scalars',
      'Fix is_english() returning False for any list argument',
    ],
  },
  {
    repo: 'mem0ai/mem0',
    what: 'A memory layer for AI agents.',
    highlights: [
      'Fix FAISS filtered search dropping over-fetched candidates before filtering',
      'Fix Weaviate reset() crashing because embedding dims were not passed',
      'Repair HTTP proxy support for httpx 0.28 and later',
    ],
  },
  {
    repo: 'BerriAI/litellm',
    what: 'A gateway that calls 100+ LLM APIs in one format. My fixes there are in its cost calculation.',
    highlights: [
      'Bill Perplexity search queries at the per-request price, not 1/1000 of it',
      'Treat an explicit 0.0 DashScope tier cost as a real price, not a missing one',
    ],
  },
  {
    repo: 'agno-agi/agno',
    what: 'An agent platform framework.',
    highlights: ['Fix the Hacker News reader taking the user id from the wrong API field'],
  },
  {
    repo: 'TheTom/turboquant_plus',
    what: 'A TurboQuant prototype. The fix came out of my KV cache compression study.',
    highlights: ['fix(qjl): use orthogonal projection and sqrt(d) scale factor'],
  },
  {
    repo: 'neuml/txtai',
    what: 'An embeddings database for semantic search and LLM workflows.',
    highlights: [
      'Index zero and False values in the tabular pipeline instead of dropping them',
    ],
  },
  {
    repo: 'py-pdf/pypdf',
    what: 'The pure-Python PDF library a large share of ingestion pipelines sit on.',
    highlights: [
      'Detect a duplicate dictionary key whose first value is falsy',
    ],
  },
  {
    repo: 'sqlfluff/sqlfluff',
    what: 'A SQL linter and formatter for many dialects and for templated SQL.',
    highlights: [
      'Fix RF05 crash and false positive on an all-underscore identifier',
      'LT05: do not move a trailing comment that contains a template tag',
      'Apply an inner .sqlfluffignore below its own directory on a relative path',
      'DuckDB: parse INSTALL and LOAD extension statements',
    ],
  },
  {
    repo: 'webpro-nl/knip',
    what: 'Finds unused files, dependencies, and exports in JavaScript and TypeScript projects.',
    highlights: [
      'Validate numeric CLI options instead of passing NaN through',
      'Honor an excluded tag on an entry re-export',
      'Resolve Jest module names without the jest-* prefix',
    ],
  },
  {
    repo: 'charmbracelet/crush',
    what: 'A coding agent that runs in the terminal.',
    highlights: [
      'Map the cache-create and cache-hit price flags to the right config keys',
      'Make session and stats read the project database from a subdirectory',
    ],
  },
  {
    repo: 'docling-project/docling',
    what: 'Converts PDFs, Office files, and other documents into structured data for AI pipelines.',
    highlights: ['Keep every message of a threaded comment in XLSX files'],
  },
];

/** Projects most people will recognize by name, with live counts attached. */
export const notable: Project[] = described
  .map((p) => ({ ...p, count: generated.byRepo[p.repo as keyof typeof generated.byRepo] ?? 0 }))
  .filter((p) => p.count > 0)
  .sort((a, b) => b.count - a.count || a.repo.localeCompare(b.repo));

const isDescribed = new Set(described.map((p) => p.repo));

/** Merged but not described above yet. Listed by count so a sync never hides a repo. */
export const others = Object.entries(generated.byRepo)
  .filter(([repo]) => !isDescribed.has(repo) && !repo.startsWith(`${generated.ecosystem.owner}/`))
  .map(([repo, count]) => ({ repo, count }));

const ecoEntries = Object.entries(generated.ecosystem.byRepo).sort(
  (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
);

/** A sustained run through one maintainer's developer-tool ecosystem. */
export const ecosystem = {
  owner: generated.ecosystem.owner,
  count: generated.ecosystem.count,
  repos: generated.ecosystem.repos,
  what: 'Menu-bar apps and command-line tools. Most of my fixes there handle edge cases like malformed input and boundary values.',
  top: ecoEntries.filter(([, n]) => n > 1).map(([repo, count]) => ({ repo, count })),
  rest: ecoEntries.filter(([, n]) => n === 1).map(([repo]) => repo),
};
