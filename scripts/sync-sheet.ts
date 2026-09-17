/**
 * Sync the live Google Sheet + Google Drive project catalogue into the repo.
 *
 * Writes:
 *   src/projectsFallback.json  – the catalogue the static site (Vercel) is built from
 *   public/sitemap.xml         – one URL per project + blog article
 *   public/llms.txt            – the AI-assistant summary
 *
 * Runs automatically before every `npm run build` (so every push / Vercel deploy carries
 * fresh data) and once a day from .github/workflows/sync-sheet.yml.
 * Never fails the build: on any error the previous files are kept and the script exits 0.
 */
import fs from 'fs';
import path from 'path';

process.env.SYNC_ONLY = '1'; // must be set before server.ts is loaded

const cwd = process.cwd();
const projectsFile = path.join(cwd, 'src', 'projectsFallback.json');
const sitemapFile = path.join(cwd, 'public', 'sitemap.xml');
const llmsFile = path.join(cwd, 'public', 'llms.txt');
const MIN_PROJECTS = 10; // sanity guard: never replace the catalogue with a suspiciously small result

async function main() {
  const server = await import('../server');
  const { BLOG_DATA, FAQ_DATA } = await import('../src/data');

  const previous: any[] = fs.existsSync(projectsFile) ? JSON.parse(fs.readFileSync(projectsFile, 'utf-8')) : [];
  console.log(`sync-sheet: previous catalogue has ${previous.length} projects`);

  const projects: any[] = await server.fetchGoogleSheetsProjects(true);
  if (!Array.isArray(projects) || projects.length < MIN_PROJECTS) {
    throw new Error(`Sheet returned ${Array.isArray(projects) ? projects.length : 'no'} projects (< ${MIN_PROJECTS}); keeping previous files`);
  }

  const prevIds = new Set(previous.map((p) => p.id));
  const newIds = new Set(projects.map((p) => p.id));
  const added = projects.filter((p) => !prevIds.has(p.id)).map((p) => p.name);
  const removed = previous.filter((p) => !newIds.has(p.id)).map((p) => p.name);
  const changed = projects.filter((p) => {
    const q = previous.find((x) => x.id === p.id);
    return q && JSON.stringify({ ...q, syncedAt: 0 }) !== JSON.stringify({ ...p, syncedAt: 0 });
  }).length;

  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(sitemapFile, server.generateSitemapXml(projects, BLOG_DATA), 'utf-8');
  fs.writeFileSync(llmsFile, server.generateLlmsTxt(projects, BLOG_DATA, FAQ_DATA), 'utf-8');

  console.log(`sync-sheet: wrote ${projects.length} projects; added ${added.length}, removed ${removed.length}, changed ${changed}`);
  if (added.length) console.log('  added:   ' + added.join(', '));
  if (removed.length) console.log('  removed: ' + removed.join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.warn('sync-sheet: skipped, keeping previous files. Reason:', err?.message || err);
    process.exit(0);
  });
