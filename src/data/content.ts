// Islands + bento content — canonical, verified content (from ~/Downloads/data.jsx).
import type { IconName } from '@/icons';

export type IslandId = 'home' | 'work' | 'about' | 'lab' | 'playbooks' | 'contact';
export type Size = '1x1' | '1x2' | '2x1' | '2x2';
export type ModuleType = 'facets' | 'github' | 'clock' | 'visitor' | 'ticker' | 'manifesto';
export type ToolType = 'token' | 'prompt' | 'json' | 'regex' | 'curl' | 'contrast';
export type Kind =
  | 'hero' | 'aboutHero' | 'pbHero' | 'contactHero'
  | 'header' | 'module' | 'stat' | 'project' | 'playbook'
  | 'tool' | 'link' | 'fact' | 'timeline' | 'labBanner';

export interface Island {
  id: IslandId;
  label: string;
  x: number;
  y: number;
  number: string;
}

export interface Metric { label: string; before: string; after: string; }

export interface CaseStudy {
  problem: string;
  approach: string[];
  stack: string[];
  metrics: Metric[];
  tradeoffs: string;
}

export interface TimelineEntry { year: string; title: string; description?: string; }
export interface Chapter { n: string; heading: string; body: string; code?: string; }
export interface Playbook { title: string; subtitle: string; intro: string; chapters: Chapter[]; }

export interface Item {
  id: string;
  size: Size;
  kind: Kind;
  label?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: IconName;
  href?: string;
  big?: boolean;
  moduleType?: ModuleType;
  toolType?: ToolType;
  playbookId?: string;
  items?: string[];          // ticker stack
  timeline?: TimelineEntry[]; // timeline card
  tags?: string[];
  year?: string;
  role?: string;
  status?: string;
  read?: string;
  caseStudy?: CaseStudy;
}

export const ISLANDS: Island[] = [
  { id: 'home',      label: 'Main',      x: 0,    y: 0,    number: '01' },
  { id: 'work',      label: 'Work',      x: 150,  y: -50,  number: '02' },
  { id: 'about',     label: 'Ethos',     x: -120, y: 120,  number: '03' },
  { id: 'lab',       label: 'Lab',       x: -160, y: -100, number: '04' },
  { id: 'playbooks', label: 'Playbooks', x: 0,    y: -185, number: '05' },
  { id: 'contact',   label: 'Link',      x: 180,  y: 150,  number: '06' },
];

export const ISLAND_BY_ID: Record<string, Island> = Object.fromEntries(
  ISLANDS.map((i) => [i.id, i]),
);

export const CONTENT: Record<IslandId, Item[]> = {
  home: [
    { id: 'home-hero', size: '2x2', kind: 'hero', label: 'Profile // 01' },
    { id: 'home-facets', size: '1x2', kind: 'module', moduleType: 'facets' },
    { id: 'home-github', size: '1x1', kind: 'module', moduleType: 'github' },
    { id: 'home-visitor', size: '1x1', kind: 'module', moduleType: 'visitor' },
    { id: 'home-clock', size: '2x1', kind: 'module', moduleType: 'clock' },
    { id: 'home-email', size: '2x1', kind: 'link', title: 'Mail', subtitle: 'yashpn62@gmail.com', icon: 'Mail', href: 'mailto:yashpn62@gmail.com' },
  ],

  work: [
    { id: 'work-header', size: '2x1', kind: 'header', label: 'Work // 02', title: 'Selected Works', subtitle: 'Production systems and open-source work. Click any card to open the case study.' },
    { id: 'work-stack', size: '2x1', kind: 'module', moduleType: 'ticker', items: ['Python', 'Django', 'React', 'TypeScript', 'PostgreSQL', 'RAG', 'Qdrant', 'vLLM', 'Ollama', 'Docker', 'Kubernetes', 'Terraform'] },
    {
      id: 'work-blue-omics', size: '2x2', kind: 'project',
      title: 'Blue Omics', subtitle: 'Full-stack research data platform',
      description: 'A Django, React, and PostgreSQL platform that grew from zero to 5M+ live records and became the primary system for an entire research lab.',
      icon: 'DB', tags: ['Django', 'React', 'PostgreSQL', 'GCP'], year: '2025', role: 'Software Engineer to Lead', status: 'Live',
      caseStudy: {
        problem: 'A research lab ran its data on a sprawl of spreadsheets and manual workflows. Submitting, searching, and cross-referencing records was slow, error-prone, and impossible to scale across 30+ researchers and 5 labs.',
        approach: [
          'Designed and built Blue Omics from scratch: a React frontend on a Django REST backend with PostgreSQL, structured across 32 data models and 58 API endpoints.',
          'Built 7 ingestion pipelines for heterogeneous formats (PDF, Excel, CSV, Word, PowerPoint), cutting manual data prep from hours to minutes.',
          'Tuned PostgreSQL with 35 explicit indexes and caching to hold low-millisecond latency under concurrent access by 30+ users.',
          'Deployed on GCP with Kubernetes and Terraform, Docker multi-stage builds, and CI/CD. Optimized the frontend from 8s to 3s load time.',
        ],
        stack: ['Django REST', 'React', 'TypeScript', 'PostgreSQL', 'GCP + Kubernetes', 'Terraform', 'Docker'],
        metrics: [
          { label: 'Live records', before: '0', after: '5M+' },
          { label: 'Trait-lookup latency', before: 'spreadsheet', after: '~25 ms' },
          { label: 'Frontend load time', before: '8 s', after: '3 s' },
          { label: 'Daily active users', before: 'baseline', after: '+40%' },
        ],
        tradeoffs: 'Chose a well-indexed PostgreSQL core over premature service-splitting to keep one clear backup and monitoring story. The platform replaced manual workflows entirely and became the system of record, which is what earned the promotion path from Software Engineer to Lead.',
      },
    },
    {
      id: 'work-turboquant', size: '1x2', kind: 'project',
      title: 'TurboQuant on Apple Silicon', subtitle: 'CPU-only LLM quantization study',
      description: 'Independent evaluation of TurboQuant (arXiv 2504.19874) ported to run on Apple Silicon. Open source and reproducible.',
      icon: 'Cpu', tags: ['LLM', 'Quantization', 'MLX', 'llama.cpp'], year: '2026', role: 'Solo · Open source', status: 'Public',
      href: 'https://github.com/devYRPauli/turboquant-m1pro-evaluation',
      caseStudy: {
        problem: 'TurboQuant is a near-optimal LLM weight and activation quantization method, but the reference path assumed dedicated GPU hardware. The open question: can it run, and hold long-context accuracy, on consumer Apple Silicon with no GPU?',
        approach: [
          'Worked from a CPU-only fork on an M1 Pro (16GB) and fixed five implementation bugs that were blocking correct inference.',
          'Ran a two-round study: an MLX path and a separate llama.cpp Metal path, each benchmarked on long-context needle-in-a-haystack retrieval.',
          'Published the full evaluation, the bug fixes, and reproducible results as an open-source repository, with writeups on LinkedIn and X.',
        ],
        stack: ['MLX', 'llama.cpp (Metal)', 'Apple Silicon (M1 Pro)', 'Python'],
        metrics: [
          { label: 'Needle retrieval @ 16K', before: '0%', after: '100%' },
          { label: 'KV cache memory', before: 'baseline', after: 'significantly reduced' },
          { label: 'Bugs fixed in fork', before: '5 blocking', after: '0' },
        ],
        tradeoffs: 'A CPU-only target trades raw throughput for accessibility: the point was proving strong quantization and long-context accuracy are reachable on hardware anyone has on their desk, not winning a latency benchmark. Reflects how I approach AI infrastructure: take a research-grade method, get it actually running on accessible hardware, measure it honestly, and share it.',
      },
    },
    {
      id: 'work-applyscore', size: '1x2', kind: 'project',
      title: 'ApplyScore', subtitle: 'AI resume gap-analysis extension',
      description: 'A published Chrome extension that scores how well a resume matches any job posting on the web, with evidence-linked gaps and no fluff.',
      icon: 'Search', tags: ['Chrome Extension', 'LLM', 'Shadow DOM', 'BYO-key'], year: '2026', role: 'Solo · Shipped', status: 'Live',
      href: 'https://chromewebstore.google.com/detail/applyscore/ibecekikdjelajpnjnmapejhahgcplim',
      caseStudy: {
        problem: 'Most AI resume tools hallucinate skills and rewrite bullets with confident fluff that recruiters see through instantly. The honest question, how well does this resume actually match this job, went unanswered.',
        approach: [
          'Built a universal scraper that reads job postings across LinkedIn, Greenhouse, Ashby, Lever, Workday and more, piercing Shadow DOM to work on virtually any board.',
          'Runs a strict, evidence-based gap analysis: a confidence-weighted 0-100 fit score, requirement-by-requirement matches linked to the exact resume bullets that prove them, and a prioritized list of what is missing.',
          'Privacy-first by design: the resume is cached locally and the user brings their own API key (OpenAI, Anthropic, or Google), so data and model choice stay fully in their control.',
        ],
        stack: ['JavaScript', 'Chrome Extension APIs', 'Shadow DOM scraping', 'LLM APIs (BYO-key)'],
        metrics: [],
        tradeoffs: 'Deliberately a gap analyzer, not a rewriter. Suggesting only 1-2 targeted, non-hallucinated bullets keeps it honest; the BYO-key model trades one-click convenience for the user keeping full control of their data and cost.',
      },
    },
  ],

  about: [
    { id: 'about-hero', size: '2x2', kind: 'aboutHero', label: 'About // 03' },
    { id: 'about-manifesto', size: '1x2', kind: 'module', moduleType: 'manifesto' },
    { id: 'about-records', size: '1x1', kind: 'stat', title: '5M+', subtitle: 'Records in production' },
    { id: 'about-promotions', size: '1x1', kind: 'stat', title: '3', subtitle: 'Roles in 14 months' },
    {
      id: 'about-timeline', size: '2x1', kind: 'timeline', title: 'The Journey',
      timeline: [
        { year: '2019', title: 'BTech begins', description: 'Computer Science at Jaypee University of Engineering and Technology.' },
        { year: '2022', title: 'First production app', description: 'SWE intern at Hackdev: shipped a Flutter legal-tech app to production.' },
        { year: '2023', title: 'Exchange to UF', description: 'Final undergrad semester at UF as an exchange student, which led to MS admission.' },
        { year: '2025', title: 'Blue Omics', description: 'Joined UF IFAS, built a 5M+ record platform, promoted to Lead.' },
        { year: '2026', title: 'AI Agents Architect', description: 'Proposed and now lead a local-first AI systems function.' },
      ],
    },
    {
      id: 'about-football', size: '2x1', kind: 'fact',
      title: 'Off the clock', subtitle: 'Football Hub',
      description: 'A live football stats app I built for myself because I love the game.',
      icon: 'Zap', href: 'https://football-hub-six.vercel.app/',
    },
  ],

  lab: [
    { id: 'lab-header', size: '2x1', kind: 'header', label: 'Lab // 04', title: 'Builder Tools', subtitle: 'Free, client-side. Your data never leaves the browser.' },
    { id: 'lab-tagline', size: '2x1', kind: 'labBanner' },
    { id: 'lab-token', size: '2x2', kind: 'tool', toolType: 'token', label: 'Tool 01', title: 'Token Counter', subtitle: 'Cost across frontier models, side-by-side', icon: 'Cpu' },
    { id: 'lab-prompt', size: '2x2', kind: 'tool', toolType: 'prompt', label: 'Tool 02', title: 'Prompt Formatter', subtitle: 'Restructure raw prompts into blocks', icon: 'Sparkle' },
    { id: 'lab-json', size: '2x2', kind: 'tool', toolType: 'json', label: 'Tool 03', title: 'JSON to Schema', subtitle: 'Generate Pydantic / Zod / TypeScript', icon: 'Code' },
    { id: 'lab-regex', size: '2x2', kind: 'tool', toolType: 'regex', label: 'Tool 04', title: 'Regex Playground', subtitle: 'Test, explain, match in real-time', icon: 'Search' },
    { id: 'lab-curl', size: '2x2', kind: 'tool', toolType: 'curl', label: 'Tool 05', title: 'cURL Converter', subtitle: 'cURL to fetch / Python requests / httpx', icon: 'Terminal' },
    { id: 'lab-contrast', size: '2x2', kind: 'tool', toolType: 'contrast', label: 'Tool 06', title: 'Contrast Checker', subtitle: 'WCAG AA/AAA with live preview', icon: 'Eye' },
  ],

  playbooks: [
    { id: 'pb-header', size: '2x2', kind: 'pbHero', label: 'Playbooks // 05' },
    { id: 'pb-count', size: '2x1', kind: 'stat', title: '3', subtitle: 'Battle-tested plays' },
    { id: 'pb-local-llm', size: '1x2', kind: 'playbook', playbookId: 'local-llm', label: 'Play 01', title: 'Self-Hosting\nOpen-Weight LLMs', subtitle: 'Run capable models locally without sending data to a cloud API', icon: 'Cpu', read: '8 min' },
    { id: 'pb-rag', size: '1x2', kind: 'playbook', playbookId: 'rag-quality', label: 'Play 02', title: 'RAG That Holds Up\nin Production', subtitle: 'Retrieval, reranking, and the evals that keep it honest', icon: 'Layers', read: '10 min' },
    { id: 'pb-eval', size: '2x1', kind: 'playbook', playbookId: 'eval-gated', label: 'Play 03', title: 'Evaluation-Gated Releases for LLM Systems', subtitle: 'Stop shipping regressions you cannot see', icon: 'DB', read: '9 min' },
  ],

  contact: [
    { id: 'contact-hero', size: '2x2', kind: 'contactHero', label: 'Contact // 06' },
    { id: 'contact-linkedin', size: '1x2', kind: 'link', title: 'LinkedIn', subtitle: '/in/yashrajpandeyy', icon: 'Linked', href: 'https://www.linkedin.com/in/yashrajpandeyy', big: true },
    { id: 'contact-github', size: '1x2', kind: 'link', title: 'GitHub', subtitle: 'devYRPauli', icon: 'Git', href: 'https://github.com/devYRPauli', big: true },
    { id: 'contact-location', size: '2x1', kind: 'fact', title: 'Gainesville, FL', subtitle: 'Eastern Time / UTC-5', description: 'University of Florida / IFAS.', icon: 'Map' },
    { id: 'contact-avail', size: '2x1', kind: 'fact', title: 'Open to Conversations', subtitle: 'AI infrastructure / Local-first LLMs', description: 'Always up for a good conversation on building AI that runs in production.', icon: 'Zap', status: 'live' },
  ],
};

export const PLAYBOOKS: Record<string, Playbook> = {
  'local-llm': {
    title: 'Self-Hosting Open-Weight LLMs',
    subtitle: 'Run capable models locally without sending data to a cloud API',
    intro: 'There is a whole class of work where you cannot send the data to a cloud API: confidential records, regulated environments, anything air-gapped. The good news is that open-weight models have gotten good enough that you do not have to. Here is how I think about running them locally.',
    chapters: [
      { n: '01', heading: 'Pick the model to fit the hardware, not the other way around', body: 'Start from the memory you actually have. A quantized model that fits comfortably in unified memory and runs fast beats a larger one that swaps and crawls. Quantization (Q5/Q6) usually costs little accuracy for a large memory win.' },
      { n: '02', heading: 'Choose a serving layer on purpose', body: 'Ollama is the fastest path to a working local endpoint and great for development. vLLM gives you higher throughput and better batching when you need to serve real concurrent load. They solve different problems; do not default to one out of habit.' },
      { n: '03', heading: 'Watch the context window, it is where performance goes to die', body: 'A model spilling to CPU because the context window default is too large will feel broken even on strong hardware. Set the context length deliberately to what the task needs, and enable flash attention where supported.', code: '# Keep context lean so inference stays on the accelerator\nOLLAMA_CONTEXT_LENGTH=4096\nOLLAMA_FLASH_ATTENTION=1' },
      { n: '04', heading: 'Keep the application layer hardware-agnostic', body: 'Treat the model and the inference backend as swappable. If your app talks to a clean internal interface rather than a specific runtime, you can move from one machine or model to a better one without rewriting everything above it.' },
      { n: '05', heading: 'Measure before you trust', body: 'Local does not mean unverified. Build a small benchmark of real questions with known good answers and run it whenever you change the model, the quantization, or the serving config. Vibes are not a release gate.' },
    ],
  },
  'rag-quality': {
    title: 'RAG That Holds Up in Production',
    subtitle: 'Retrieval, reranking, and the evals that keep it honest',
    intro: 'Most RAG demos look great and most RAG systems quietly disappoint, because the demo never stressed retrieval. The model is rarely the bottleneck. The retrieval and the chunking are.',
    chapters: [
      { n: '01', heading: 'Garbage chunks, garbage answers', body: 'Retrieval quality is capped by chunk quality. Documents that parse badly (watermarked PDFs, image-only pages, broken tables) produce chunks the retriever cannot use. Fix ingestion before you tune anything downstream.' },
      { n: '02', heading: 'Hybrid retrieval beats pure vector', body: 'Dense embeddings miss exact terms; lexical search misses paraphrase. Combining dense and sparse (lexical) retrieval catches both. A good embedding model plus hybrid search is a stronger default than either alone.' },
      { n: '03', heading: 'Rerank, but watch the dilution', body: 'A reranker over a candidate set sharpens results, but feeding it too many low-quality candidates can dilute the good ones and add latency. Tune the candidate ceiling deliberately rather than maximizing it.' },
      { n: '04', heading: 'Cite or it did not happen', body: 'In production RAG, an answer without traceable sources is a liability. Return the supporting passages alongside the answer so a human can verify, and so you can debug what the model actually retrieved.' },
      { n: '05', heading: 'Build the eval before you optimize', body: 'You cannot improve what you cannot measure. A fixed benchmark of questions with expected sources, scored on recall and answer accuracy, turns "I think this is better" into "this is 3 points better or it is not shipping."' },
    ],
  },
  'eval-gated': {
    title: 'Evaluation-Gated Releases for LLM Systems',
    subtitle: 'Stop shipping regressions you cannot see',
    intro: 'LLM systems fail differently from normal software. A change can improve five cases and silently break three, and nothing throws an error. The only defense is a gate: no change ships unless it clears a measured bar.',
    chapters: [
      { n: '01', heading: 'Freeze a benchmark', body: 'Build a fixed set of representative questions with known good answers and expected sources. Freeze it. The moment your benchmark drifts with every change, it stops being a baseline you can trust.' },
      { n: '02', heading: 'Freeze the judge too', body: 'If you use a model to score outputs, pin the judge model and the exact judging prompt. A moving judge makes every comparison meaningless because you cannot tell whether the system changed or the grader did.' },
      { n: '03', heading: 'Know your noise floor', body: 'Run the same config twice and measure the variance. If two identical runs differ by a point, a one-point improvement is noise, not signal. Define the gate above the noise floor.' },
      { n: '04', heading: 'Set tiers before you look at results', body: 'Decide the thresholds in advance: ship above X, hold below Y, re-measure in between. Deciding the bar after seeing the numbers is how regressions talk their way into production.', code: '# Decide BEFORE running\nSHIP    >= 76% recall\nHOLD    <  74% recall\nRE-RUN   74-76%   (within noise, measure again)' },
      { n: '05', heading: 'A regression is a reason to stop', body: 'When a change misses the gate, the answer is not to lower the gate. It is to understand why, fix it, or shelve the change. The discipline is the whole point.' },
    ],
  },
};

export const allItems = (): Item[] => Object.values(CONTENT).flat();
export const getItemById = (id: string): Item | undefined => allItems().find((it) => it.id === id);
