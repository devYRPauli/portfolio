// Lab tools — client-side only. Lazy-loaded via DetailView.
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { I } from '@/icons';
import type { ToolType } from '@/data/content';

const inputStyle: CSSProperties = {
  flex: 1,
  padding: 14,
  background: '#07070a',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
};

const preStyle: CSSProperties = {
  flex: 1,
  padding: 14,
  background: '#07070a',
  color: '#cbd5e1',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 11.5,
  lineHeight: 1.65,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
};

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: copied ? 'var(--amber)' : 'var(--ink-dim)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--line)',
        borderRadius: 4,
      }}
    >
      {copied ? <I.Check size={12} /> : <I.Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

// ========= TOKEN COUNTER =========
function TokenCounter() {
  const [text, setText] = useState(
    'You are a backend service that returns structured JSON only.\nDo not explain your reasoning.\nIf the input is ambiguous, return {"error": "<reason>"}.',
  );

  const tokens = useMemo(() => {
    if (!text) return 0;
    const chars = text.length;
    const words = text.trim().split(/\s+/).length;
    return Math.max(Math.ceil(chars / 4), Math.ceil(words * 1.3));
  }, [text]);

  const models = [
    { name: 'Claude Sonnet 4.6', inColor: 'var(--amber)', inCost: 3, outCost: 15 },
    { name: 'GPT-5.4', inColor: 'var(--cyan)', inCost: 5, outCost: 20 },
    { name: 'Gemini 3.1 Pro', inColor: '#a78bfa', inCost: 2.5, outCost: 10 },
    { name: 'Claude Haiku 4.5', inColor: '#34d399', inCost: 1, outCost: 5 },
  ];

  const calc = (per: number) => ((tokens / 1_000_000) * per).toFixed(5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">Input</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your prompt..." style={inputStyle} spellCheck={false} />
        <div className="mono" style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-dim)', flexWrap: 'wrap' }}>
          <span>{text.length.toLocaleString()} chars</span>
          <span>·</span>
          <span>{text.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
          <span>·</span>
          <span style={{ color: 'var(--amber)' }}>~{tokens.toLocaleString()} tokens</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">Cost per call (input-only)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {models.map((m) => (
            <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)', borderRadius: 8, gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.inColor }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 2 }}>${m.inCost}/M in · ${m.outCost}/M out</div>
              </div>
              <div className="mono" style={{ fontSize: 18, color: m.inColor, fontVariantNumeric: 'tabular-nums' }}>${calc(m.inCost)}</div>
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.5 }}>Approximation. Real tokenization varies ±15% by model. Prices illustrative.</div>
      </div>
    </div>
  );
}

// ========= PROMPT FORMATTER =========
function PromptFormatter() {
  const [raw, setRaw] = useState(
    'write me a tweet about the new product launch it should be professional and short keep it under 280 chars and include the hashtag #ship. return only the tweet no extra text.',
  );

  const formatted = useMemo(() => {
    const sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const task: string[] = [];
    const constraints: string[] = [];
    const output: string[] = [];
    sentences.forEach((s) => {
      const lo = s.toLowerCase();
      if (/\b(return|output|respond|no extra|only|format|markdown|json)\b/.test(lo)) output.push(s);
      else if (/\b(under|less than|more than|include|exclude|must|should|do not|avoid|keep|professional|tone|within)\b/.test(lo)) constraints.push(s);
      else task.push(s);
    });
    return [
      '[SYSTEM]\nYou are a precise assistant. Follow the TASK, respect all CONSTRAINTS, return in the specified OUTPUT FORMAT.',
      `[TASK]\n${task.join(' ') || '(derive from user input)'}`,
      `[CONSTRAINTS]\n${(constraints.length ? constraints : ['(none specified)']).map((c) => '- ' + c).join('\n')}`,
      `[OUTPUT FORMAT]\n${output.length ? output.join(' ') : 'Return the answer as plain text. No markdown. No code fences.'}`,
    ].join('\n\n');
  }, [raw]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">Raw prompt</div>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} style={inputStyle} spellCheck={false} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow">Structured</div>
          <CopyBtn text={formatted} />
        </div>
        <pre className="mono" style={{ ...preStyle, border: '1px solid var(--amber-soft)' }}>{formatted}</pre>
      </div>
    </div>
  );
}

// ========= JSON -> SCHEMA =========
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function tsType(v: unknown): string {
  if (v === null) return 'any';
  if (Array.isArray(v)) return `${v.length ? tsType(v[0]) : 'any'}[]`;
  const t = typeof v;
  if (t === 'object') return 'Record<string, any>';
  if (t === 'number') return 'number';
  return t;
}
function pyType(v: unknown): string {
  if (v === null) return 'Optional[Any]';
  if (Array.isArray(v)) return `list[${v.length ? pyType(v[0]) : 'Any'}]`;
  const t = typeof v;
  if (t === 'object') return 'dict';
  if (t === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (t === 'boolean') return 'bool';
  return 'str';
}
function zodType(v: unknown): string {
  if (v === null) return 'z.any()';
  if (Array.isArray(v)) return `z.array(${v.length ? zodType(v[0]) : 'z.any()'})`;
  const t = typeof v;
  if (t === 'object') return 'z.object({})';
  if (t === 'number') return Number.isInteger(v) ? 'z.number().int()' : 'z.number()';
  if (t === 'boolean') return 'z.boolean()';
  return 'z.string()';
}
function toPydantic(name: string, obj: Record<string, unknown>, out: string[] = []): string {
  const fields: string[] = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const n = cap(k);
      toPydantic(n, v as Record<string, unknown>, out);
      fields.push(`    ${k}: ${n}`);
    } else {
      fields.push(`    ${k}: ${pyType(v)}`);
    }
  });
  out.push(`class ${name}(BaseModel):\n${fields.join('\n')}`);
  return 'from pydantic import BaseModel\nfrom typing import Any, Optional\n\n' + out.slice().reverse().join('\n\n');
}
function toTS(name: string, obj: Record<string, unknown>, out: string[] = []): string {
  const fields: string[] = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const n = cap(k);
      const nested = toTS(n, v as Record<string, unknown>, []).split('\n\n').pop();
      if (nested) out.push(nested);
      fields.push(`  ${k}: ${n};`);
    } else {
      fields.push(`  ${k}: ${tsType(v)};`);
    }
  });
  out.push(`interface ${name} {\n${fields.join('\n')}\n}`);
  return out.join('\n\n');
}
function toZod(name: string, obj: Record<string, unknown>): string {
  const fields: string[] = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const inner = Object.entries(v as Record<string, unknown>).map(([k2, v2]) => `    ${k2}: ${zodType(v2)},`).join('\n');
      fields.push(`  ${k}: z.object({\n${inner}\n  }),`);
    } else {
      fields.push(`  ${k}: ${zodType(v)},`);
    }
  });
  return `import { z } from 'zod';\n\nexport const ${name}Schema = z.object({\n${fields.join('\n')}\n});\n\nexport type Root = z.infer<typeof ${name}Schema>;`;
}

function JsonSchema() {
  const [src, setSrc] = useState('{\n  "id": "usr_42",\n  "name": "Ada",\n  "email": "ada@example.com",\n  "age": 36,\n  "active": true,\n  "roles": ["admin", "editor"],\n  "profile": { "city": "London", "joined": "2024-01-15" }\n}');
  const [target, setTarget] = useState<'pydantic' | 'zod' | 'ts'>('pydantic');

  const { out, err } = useMemo(() => {
    try {
      const obj = JSON.parse(src) as Record<string, unknown>;
      const result = target === 'pydantic' ? toPydantic('Root', obj) : target === 'zod' ? toZod('root', obj) : toTS('Root', obj);
      return { out: result, err: null as string | null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [src, target]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">JSON input</div>
        <textarea value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} style={{ ...inputStyle, color: err ? '#f87171' : 'var(--ink)', border: `1px solid ${err ? '#f87171' : 'var(--line)'}` }} />
        {err && <div className="mono" style={{ fontSize: 10, color: '#f87171' }}>PARSE ERROR: {err}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: 6 }}>
            {(['pydantic', 'zod', 'ts'] as const).map((tk) => (
              <button key={tk} type="button" onClick={() => setTarget(tk)} className="mono" style={{ padding: '5px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: target === tk ? '#0a0a0b' : 'var(--ink-dim)', background: target === tk ? 'var(--amber)' : 'transparent', borderRadius: 4 }}>{tk}</button>
            ))}
          </div>
          <CopyBtn text={out} />
        </div>
        <pre className="mono" style={{ ...preStyle, whiteSpace: 'pre' }}>{out}</pre>
      </div>
    </div>
  );
}

// ========= REGEX PLAYGROUND =========
interface ExplainToken { token: string; desc: string; }
function explainRegex(p: string): ExplainToken[] {
  const tokens: ExplainToken[] = [];
  const rules: [RegExp, string | null, string][] = [
    [/^\\b/, '\\b', 'word boundary'],
    [/^\\B/, '\\B', 'non-word boundary'],
    [/^\\d/, '\\d', 'any digit'],
    [/^\\D/, '\\D', 'non-digit'],
    [/^\\w/, '\\w', 'word char'],
    [/^\\W/, '\\W', 'non-word char'],
    [/^\\s/, '\\s', 'whitespace'],
    [/^\\S/, '\\S', 'non-whitespace'],
    [/^\\./, '\\.', 'literal dot'],
    [/^\./, '.', 'any char except newline'],
    [/^\^/, '^', 'start anchor'],
    [/^\$/, '$', 'end anchor'],
    [/^\(\?:/, '(?:', 'non-capturing group open'],
    [/^\(\?=/, '(?=', 'lookahead'],
    [/^\(/, '(', 'capture group open'],
    [/^\)/, ')', 'group close'],
    [/^\[[^\]]+\]/, null, 'character class'],
    [/^\{\d+(?:,\d*)?\}/, null, 'quantifier'],
    [/^\+\?/, '+?', '1+ (lazy)'],
    [/^\*\?/, '*?', '0+ (lazy)'],
    [/^\+/, '+', '1 or more'],
    [/^\*/, '*', '0 or more'],
    [/^\?/, '?', '0 or 1'],
    [/^\|/, '|', 'alternation'],
  ];
  let s = p;
  let guard = 0;
  while (s.length && guard++ < 200) {
    let matched = false;
    for (const [re, tok, desc] of rules) {
      const m = s.match(re);
      if (m) {
        tokens.push({ token: tok || m[0], desc });
        s = s.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ token: s[0], desc: 'literal' });
      s = s.slice(1);
    }
  }
  return tokens;
}

function RegexPlayground() {
  const [pattern, setPattern] = useState('\\b([A-Z][a-z]+)\\s+([A-Z][a-z]+)\\b');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Meet Ada Lovelace and Alan Turing at Bletchley Park.\nContact grace hopper or send mail to rear admiral Grace Hopper.');

  const { matches, error, explain } = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const m = [...text.matchAll(re)];
      return { matches: m, error: null as string | null, explain: explainRegex(pattern) };
    } catch (e) {
      return { matches: [] as RegExpMatchArray[], error: (e as Error).message, explain: [] as ExplainToken[] };
    }
  }, [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (error || !matches.length) return [{ text, hit: false }];
    const parts: { text: string; hit: boolean }[] = [];
    let last = 0;
    matches.forEach((m) => {
      const idx = m.index ?? 0;
      if (idx > last) parts.push({ text: text.slice(last, idx), hit: false });
      parts.push({ text: m[0], hit: true });
      last = idx + m[0].length;
    });
    if (last < text.length) parts.push({ text: text.slice(last), hit: false });
    return parts;
  }, [matches, text, error]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="mono" style={{ color: 'var(--ink-dim)', fontSize: 14 }}>/</span>
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} style={{ flex: 1, padding: '8px 12px', background: '#07070a', color: 'var(--amber)', border: `1px solid ${error ? '#f87171' : 'var(--line)'}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
        <span className="mono" style={{ color: 'var(--ink-dim)', fontSize: 14 }}>/</span>
        <input value={flags} onChange={(e) => setFlags(e.target.value)} spellCheck={false} style={{ width: 80, padding: '8px 12px', background: '#07070a', color: 'var(--cyan)', border: '1px solid var(--line)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', textAlign: 'center' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          <div className="eyebrow">Test string</div>
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ width: '100%', height: '100%', padding: 14, background: '#07070a', color: 'transparent', caretColor: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, resize: 'none', outline: 'none' }} />
            <div aria-hidden className="mono" style={{ position: 'absolute', inset: 0, padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink)', pointerEvents: 'none', whiteSpace: 'pre-wrap', overflow: 'hidden' }}>
              {highlighted.map((p, i) => p.hit
                ? <mark key={i} style={{ background: 'var(--amber-soft)', color: 'var(--amber)', borderRadius: 2 }}>{p.text}</mark>
                : <span key={i}>{p.text}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          <div className="eyebrow">Breakdown</div>
          <div style={{ flex: 1, padding: 12, background: '#07070a', border: '1px solid var(--line)', borderRadius: 8, overflow: 'auto' }}>
            {error
              ? <div className="mono" style={{ color: '#f87171', fontSize: 12 }}>INVALID: {error}</div>
              : explain.length ? explain.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < explain.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                  <span className="mono" style={{ color: 'var(--amber)', minWidth: 60, fontSize: 12 }}>{e.token}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.4 }}>{e.desc}</span>
                </div>
              )) : <div className="mono" style={{ color: 'var(--ink-dim)', fontSize: 12 }}>(empty pattern)</div>}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <div className="eyebrow">Matches</div>
              <div className="mono" style={{ fontSize: 20, color: matches.length ? 'var(--amber)' : 'var(--ink-dim)', marginTop: 4 }}>{matches.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>FLAGS: g=global · i=case-insens · m=multiline · s=dotall · u=unicode</div>
    </div>
  );
}

// ========= CURL CONVERTER =========
interface CurlParsed { method: string; url: string; headers: Record<string, string>; body: string | null; }
function parseCurl(s: string): CurlParsed | null {
  const clean = s.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean.startsWith('curl')) return null;
  const rest = clean.slice(4).trim();
  const result: CurlParsed = { method: 'GET', url: '', headers: {}, body: null };
  const tokens: string[] = [];
  let r = rest;
  while (r.length) {
    r = r.trim();
    if (!r) break;
    if (r.startsWith('"') || r.startsWith("'")) {
      const q = r[0];
      const end = r.indexOf(q, 1);
      if (end === -1) break;
      tokens.push(r.slice(1, end));
      r = r.slice(end + 1);
    } else {
      const sp = r.indexOf(' ');
      if (sp === -1) { tokens.push(r); break; }
      tokens.push(r.slice(0, sp));
      r = r.slice(sp + 1);
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '-X' || t === '--request') result.method = tokens[++i];
    else if (t === '-H' || t === '--header') {
      const h = tokens[++i];
      const idx = h.indexOf(':');
      if (idx > 0) result.headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === '-d' || t === '--data' || t === '--data-raw') {
      result.body = tokens[++i];
      if (result.method === 'GET') result.method = 'POST';
    } else if (!result.url && (t.startsWith('http://') || t.startsWith('https://'))) {
      result.url = t;
    }
  }
  return result;
}
function toFetch(p: CurlParsed): string {
  const init: Record<string, unknown> = { method: p.method };
  if (Object.keys(p.headers).length) init.headers = p.headers;
  if (p.body) init.body = p.body;
  return `const res = await fetch("${p.url}", ${JSON.stringify(init, null, 2)});\nconst data = await res.json();`;
}
function toRequests(p: CurlParsed): string {
  const lines = ['import requests', ''];
  if (Object.keys(p.headers).length) lines.push(`headers = ${JSON.stringify(p.headers, null, 4).replace(/"/g, "'")}`);
  if (p.body) lines.push(`data = ${JSON.stringify(p.body)}`);
  lines.push('');
  const args = [`"${p.url}"`];
  if (Object.keys(p.headers).length) args.push('headers=headers');
  if (p.body) args.push('data=data');
  lines.push(`res = requests.${p.method.toLowerCase()}(${args.join(', ')})`);
  lines.push('data = res.json()');
  return lines.join('\n');
}
function toHttpx(p: CurlParsed): string {
  const lines = ['import httpx', ''];
  if (Object.keys(p.headers).length) lines.push(`headers = ${JSON.stringify(p.headers, null, 4).replace(/"/g, "'")}`);
  if (p.body) lines.push(`data = ${JSON.stringify(p.body)}`);
  lines.push('');
  lines.push('async with httpx.AsyncClient() as client:');
  const args = [`"${p.url}"`];
  if (Object.keys(p.headers).length) args.push('headers=headers');
  if (p.body) args.push('content=data');
  lines.push(`    res = await client.${p.method.toLowerCase()}(${args.join(', ')})`);
  lines.push('    data = res.json()');
  return lines.join('\n');
}

function CurlConverter() {
  const [curl, setCurl] = useState('curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -d \'{"name": "Ada", "role": "admin"}\'');
  const [target, setTarget] = useState<'fetch' | 'requests' | 'httpx'>('fetch');

  const out = useMemo(() => {
    const parsed = parseCurl(curl);
    if (!parsed) return '';
    if (target === 'fetch') return toFetch(parsed);
    if (target === 'requests') return toRequests(parsed);
    return toHttpx(parsed);
  }, [curl, target]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">cURL command</div>
        <textarea value={curl} onChange={(e) => setCurl(e.target.value)} spellCheck={false} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: 6 }}>
            {([['fetch', 'JS fetch'], ['requests', 'py requests'], ['httpx', 'py httpx']] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setTarget(v)} className="mono" style={{ padding: '5px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: target === v ? '#0a0a0b' : 'var(--ink-dim)', background: target === v ? 'var(--amber)' : 'transparent', borderRadius: 4 }}>{l}</button>
            ))}
          </div>
          <CopyBtn text={out} />
        </div>
        <pre className="mono" style={preStyle}>{out}</pre>
      </div>
    </div>
  );
}

// ========= CONTRAST CHECKER =========
function hex2rgb(h: string): [number, number, number] {
  const m = h.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function lum([r, g, b]: [number, number, number]): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrast(a: string, b: string): number {
  try {
    const la = lum(hex2rgb(a));
    const lb = lum(hex2rgb(b));
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  } catch {
    return 1;
  }
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ width: 44, height: 44, background: value, border: '1px solid var(--line-2)', borderRadius: 6 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="mono" style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: 16, outline: 'none' }} />
      </div>
    </label>
  );
}

function ContrastChecker() {
  const [fg, setFg] = useState('#fbbf24');
  const [bg, setBg] = useState('#0a0a0b');
  const ratio = useMemo(() => contrast(fg, bg), [fg, bg]);
  const aa = ratio >= 4.5;
  const aaa = ratio >= 7;
  const aaLg = ratio >= 3;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
        <div className="eyebrow">Colors</div>
        <ColorField label="Foreground" value={fg} onChange={setFg} />
        <ColorField label="Background" value={bg} onChange={setBg} />
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Ratio</div>
          <div className="mono" style={{ fontSize: 48, color: aa ? 'var(--amber)' : '#f87171', lineHeight: 1 }}>
            {ratio.toFixed(2)}<span style={{ fontSize: 20, color: 'var(--ink-dim)' }}> : 1</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([['AA · normal', aa], ['AAA · normal', aaa], ['AA · large', aaLg]] as const).map(([l, pass]) => (
            <div key={l} style={{ padding: 10, textAlign: 'center', background: pass ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${pass ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 6 }}>
              <div className="mono" style={{ fontSize: 16, color: pass ? '#34d399' : '#f87171' }}>{pass ? 'PASS' : 'FAIL'}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div className="eyebrow">Live preview</div>
        <div style={{ flex: 1, padding: 28, background: bg, color: fg, border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1 }}>Headline 36px</div>
          <div style={{ fontSize: 18 }}>Large body 18px — still easy to read?</div>
          <div style={{ fontSize: 14 }}>Normal body 14px — the acid test for AA compliance.</div>
          <div style={{ fontSize: 11, opacity: 0.8 }} className="mono">SMALL MONO 11PX · THE WORST CASE</div>
        </div>
      </div>
    </div>
  );
}

export default function ToolRenderer({ type }: { type: ToolType }) {
  switch (type) {
    case 'token': return <TokenCounter />;
    case 'prompt': return <PromptFormatter />;
    case 'json': return <JsonSchema />;
    case 'regex': return <RegexPlayground />;
    case 'curl': return <CurlConverter />;
    case 'contrast': return <ContrastChecker />;
    default: return null;
  }
}
