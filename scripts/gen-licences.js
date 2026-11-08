#!/usr/bin/env node
// Writes assets/licences.json for Settings > About (T-154).
//
// The task names `npx license-checker --json`. That tool is not a project dependency, so this
// script produces the same shape ({ "name@version": { licenses, repository, publisher } }) from
// the installed packages: it walks the production dependency tree from package.json through
// node_modules. No network access. Run: npm run gen:licences (also part of prebuild).
/* global __dirname */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'licences.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Resolves a package directory the way Node does: nested node_modules first, then upwards. */
function resolvePackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(candidate)) return path.dirname(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function licenceOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license && typeof pkg.license.type === 'string') return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((l) => (typeof l === 'string' ? l : l.type)).join(' OR ');
  }
  return 'UNKNOWN';
}

function repositoryOf(pkg) {
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  if (!repo) return undefined;
  return repo
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://');
}

function publisherOf(pkg) {
  if (typeof pkg.author === 'string')
    return pkg.author
      .replace(/\s*<[^>]*>/, '')
      .replace(/\s*\([^)]*\)/, '')
      .trim();
  return pkg.author?.name;
}

function collect() {
  const rootPkg = readJson(path.join(ROOT, 'package.json'));
  const result = {};
  const seen = new Set();
  const queue = Object.keys(rootPkg.dependencies ?? {}).map((name) => ({ name, from: ROOT }));
  while (queue.length > 0) {
    const { name, from } = queue.shift();
    const dir = resolvePackageDir(name, from);
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    const pkg = readJson(path.join(dir, 'package.json'));
    if (!pkg.private) {
      const entry = { licenses: licenceOf(pkg) };
      const repository = repositoryOf(pkg);
      const publisher = publisherOf(pkg);
      if (repository) entry.repository = repository;
      if (publisher) entry.publisher = publisher;
      result[`${pkg.name}@${pkg.version}`] = entry;
    }
    for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push({ name: dep, from: dir });
    for (const dep of Object.keys(pkg.optionalDependencies ?? {}))
      queue.push({ name: dep, from: dir });
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

const licences = collect();
fs.writeFileSync(OUT, `${JSON.stringify(licences, null, 2)}\n`);
console.log(
  `gen-licences: ${Object.keys(licences).length} packages -> ${path.relative(ROOT, OUT)}`,
);
