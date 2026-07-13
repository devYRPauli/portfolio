import { access, readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://yashrajpandey.com';

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(path) : path;
    }),
  );
  return files.flat();
}

function pagePath(file) {
  const path = relative(dist, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
}

async function pathExists(pathname) {
  const path = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = pathname.endsWith('/')
    ? [join(dist, path, 'index.html')]
    : [join(dist, path), join(dist, path, 'index.html'), join(dist, `${path}.html`)];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // Try the next static-output shape.
    }
  }
  return false;
}

const files = await collectFiles(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const currentPage = new URL(pagePath(file), origin);
  const attributes = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);

  for (const [, value] of attributes) {
    if (value.startsWith('#')) continue;

    let url;
    try {
      url = new URL(value, currentPage);
    } catch {
      failures.push(`${pagePath(file)} -> invalid URL: ${value}`);
      continue;
    }

    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) continue;
    if (!(await pathExists(url.pathname))) {
      failures.push(`${pagePath(file)} -> ${url.pathname}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Broken internal links found:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Checked internal links across ${htmlFiles.length} HTML files.`);
}
