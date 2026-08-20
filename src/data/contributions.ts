// Merged pull requests to other people's repositories.
// Counts exclude my own repos and pre-2022 student-era merges.
// Verify any number against the live search link on /contributions/.

export const totals = {
  merged: 61,
  projects: 28,
  updated: '2026-08-20',
};

export const searchUrl =
  'https://github.com/search?q=is%3Apr+author%3AdevYRPauli+is%3Amerged&type=pullrequests';

export interface Project {
  repo: string;
  count: number;
  what: string;
  highlights: string[];
}

/** Projects most people will recognize by name. */
export const notable: Project[] = [
  {
    repo: 'ggml-org/llama.cpp',
    count: 3,
    what: 'The C/C++ inference engine most local LLM tooling is built on.',
    highlights: [
      'ggml-cpu: fix rms_norm_back wrong output under in-place aliasing',
      'llama-quant: exclude the i32 ffn_gate_tid2eid routing table from quantization',
      'ggml: require contiguous src for ROLL on CUDA and Metal',
    ],
  },
  {
    repo: 'ml-explore/mlx',
    count: 2,
    what: "Apple's array framework for Apple silicon.",
    highlights: [
      'Fix signed-integer overflow (UB) in roll and tile shape arithmetic',
      'Raise on arange with step == 0 instead of undefined behavior',
    ],
  },
  {
    repo: 'ml-explore/mlx-lm',
    count: 2,
    what: 'The MLX language-model runtime and server.',
    highlights: [
      'Fix mlx_lm.server 404 on short prompts (clamp negative start in think-token search)',
    ],
  },
  {
    repo: 'google-research/tabfm',
    count: 1,
    what: "Google Research's tabular foundation model. Found during my independent evaluation.",
    highlights: ['Fix predict crashing on multi-device hosts (IndivisibleError / device mismatch)'],
  },
  {
    repo: 'infiniflow/ragflow',
    count: 10,
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
    count: 4,
    what: 'A memory layer for AI agents.',
    highlights: [
      'Fix FAISS filtered search dropping over-fetched candidates before filtering',
      'Fix weaviate reset() crashing because embedding dims were not passed',
      'Repair HTTP proxy support for httpx 0.28 and later',
    ],
  },
  {
    repo: 'BerriAI/litellm',
    count: 3,
    what: 'A gateway that calls 100+ LLM APIs in one format. Both fixes are billing correctness.',
    highlights: [
      'Bill perplexity search queries at the per-request price, not 1/1000 of it',
      'Treat an explicit 0.0 dashscope tier cost as a real price, not a missing one',
    ],
  },
  {
    repo: 'agno-agi/agno',
    count: 1,
    what: 'An agent platform framework.',
    highlights: ['Fix the hackernews reader taking the user id from the wrong API field'],
  },
  {
    repo: 'TheTom/turboquant_plus',
    count: 1,
    what: 'A TurboQuant prototype. The fix came out of my KV cache compression study.',
    highlights: ['fix(qjl): use orthogonal projection and sqrt(d) scale factor'],
  },
];

/** A sustained run through one maintainer's developer-tool ecosystem. */
export const ecosystem = {
  owner: 'steipete',
  count: 34,
  repos: 19,
  what: 'Menu-bar apps, CLIs, and agent tooling. Mostly edge-case correctness: malformed input, boundary values, and state that survives a restart.',
  top: [
    { repo: 'CodexBar', count: 8 },
    { repo: 'poltergeist', count: 3 },
    { repo: 'oracle', count: 3 },
    { repo: 'RepoBar', count: 2 },
    { repo: 'tokentally', count: 2 },
    { repo: 'birdclaw', count: 2 },
    { repo: 'bslog', count: 2 },
  ],
  rest: [
    'TauTUI',
    'BlackBar',
    'ReleaseBar',
    'Markdansi',
    'stats-store',
    'osc-progress',
    'sweet-cookie',
    'sweetlink',
    'summarize',
    'macos-automator-mcp',
    'inngest',
    'vox',
  ],
};
