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
    what: 'A retrieval-augmented generation engine. Every fix is a document parser correctness bug.',
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
      'Fix weaviate reset() crashing because embedding dims were not passed',
      'Repair HTTP proxy support for httpx 0.28 and later',
    ],
  },
  {
    repo: 'BerriAI/litellm',
    what: 'A gateway that calls 100+ LLM APIs in one format. Both fixes are billing correctness.',
    highlights: [
      'Bill perplexity search queries at the per-request price, not 1/1000 of it',
      'Treat an explicit 0.0 dashscope tier cost as a real price, not a missing one',
    ],
  },
  {
    repo: 'agno-agi/agno',
    what: 'An agent platform framework.',
    highlights: ['Fix the hackernews reader taking the user id from the wrong API field'],
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
  },];

/** Projects most people will recognize by name, with live counts attached. */
export const notable: Project[] = described
  .map((p) => ({ ...p, count: generated.byRepo[p.repo as keyof typeof generated.byRepo] ?? 0 }))
  .filter((p) => p.count > 0)
  .sort((a, b) => b.count - a.count || a.repo.localeCompare(b.repo));

const ecoEntries = Object.entries(generated.ecosystem.byRepo).sort(
  (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
);

/** A sustained run through one maintainer's developer-tool ecosystem. */
export const ecosystem = {
  owner: generated.ecosystem.owner,
  count: generated.ecosystem.count,
  repos: generated.ecosystem.repos,
  what: 'Menu-bar apps, CLIs, and agent tooling. Mostly edge-case correctness: malformed input, boundary values, and state that survives a restart.',
  top: ecoEntries.filter(([, n]) => n > 1).map(([repo, count]) => ({ repo, count })),
  rest: ecoEntries.filter(([, n]) => n === 1).map(([repo]) => repo),
};
