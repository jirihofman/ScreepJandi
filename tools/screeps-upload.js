#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { ScreepsAPI } = require('screeps-api');

const DEFAULT_HOST = 'screeps.com';
const DEFAULT_BRANCH = 'ScreepJandi';
const DEFAULT_TIMEOUT = 30000;

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function usage(exitCode = 0) {
  const text = `
Usage:
  npm run screeps:upload
  npm run screeps:upload -- --dry-run
  npm run screeps:upload -- --allow-dirty

Options:
  --branch <name>      Screeps branch. Defaults to ${DEFAULT_BRANCH}.
  --timeout <ms>       API request timeout. Defaults to ${DEFAULT_TIMEOUT}.
  --dry-run            Compare local tracked modules with live branch without uploading.
  --allow-dirty        Allow uploading uncommitted root JavaScript changes.
  --keep-live-extra    Preserve live modules that are not tracked root JavaScript files.

Environment:
  SCREEPS_TOKEN        Required auth token.
  SCREEPS_HOST         Optional host. Defaults to ${DEFAULT_HOST}.
  SCREEPS_BRANCH       Optional branch default.
`;

  console.log(text.trim());
  process.exit(exitCode);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function trackedRootJavaScriptFiles() {
  const output = execFileSync('git', ['ls-files', '-z', '--', '*.js']);
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter(file => !file.includes('/'))
    .sort();
}

function moduleNameForFile(file) {
  return path.basename(file, '.js');
}

function buildModules(files) {
  const modules = {};
  for (const file of files) {
    modules[moduleNameForFile(file)] = fs.readFileSync(file, 'utf8');
  }
  return modules;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function changedRootJavaScriptFiles() {
  const status = git(['status', '--porcelain=v1', '--', '*.js'])
    .split('\n')
    .filter(Boolean);

  return status
    .map(line => line.slice(3).trim())
    .filter(file => file && !file.includes('/'));
}

function compareModules(localModules, liveModules) {
  const names = Array.from(new Set([
    ...Object.keys(localModules),
    ...Object.keys(liveModules),
  ])).sort();

  return names.reduce((out, name) => {
    const hasLocal = Object.prototype.hasOwnProperty.call(localModules, name);
    const hasLive = Object.prototype.hasOwnProperty.call(liveModules, name);
    if (!hasLocal) {
      out.liveOnly.push(name);
    } else if (!hasLive) {
      out.localOnly.push(name);
    } else if (hash(localModules[name]) !== hash(liveModules[name])) {
      out.changed.push(name);
    } else {
      out.same.push(name);
    }
    return out;
  }, { same: [], changed: [], localOnly: [], liveOnly: [] });
}

function withTimeout(promise, timeout, label) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout}ms`)), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function main() {
  if (hasFlag('help')) {
    usage();
  }

  const token = process.env.SCREEPS_TOKEN;
  if (!token) {
    throw new Error('SCREEPS_TOKEN is required. Put it in your shell env or a local .env file.');
  }

  const branch = readArg('branch', process.env.SCREEPS_BRANCH || DEFAULT_BRANCH);
  const timeout = Number(readArg('timeout', process.env.SCREEPS_TIMEOUT || DEFAULT_TIMEOUT));
  const files = trackedRootJavaScriptFiles();
  const localModules = buildModules(files);
  const dirtyFiles = changedRootJavaScriptFiles();
  const dryRun = hasFlag('dry-run');
  const allowDirty = hasFlag('allow-dirty');
  const keepLiveExtra = hasFlag('keep-live-extra');

  if (!dryRun && dirtyFiles.length > 0 && !allowDirty) {
    throw new Error(
      `Refusing to upload uncommitted root JavaScript changes: ${dirtyFiles.join(', ')}. ` +
      'Commit them first or pass --allow-dirty.'
    );
  }

  const api = new ScreepsAPI({
    token,
    protocol: 'https',
    hostname: process.env.SCREEPS_HOST || DEFAULT_HOST,
    port: 443,
    path: '/',
  });
  api.token = token;

  const live = await withTimeout(api.code.get(branch), timeout, `Fetching ${branch}`);
  const liveModules = live.modules || {};
  const before = compareModules(localModules, liveModules);

  console.log(`Branch: ${branch}`);
  console.log(`Tracked root modules: ${files.length}`);
  console.log(`Same: ${before.same.length}`);
  console.log(`Changed: ${before.changed.join(', ') || '-'}`);
  console.log(`Local only: ${before.localOnly.join(', ') || '-'}`);
  console.log(`Live only: ${before.liveOnly.join(', ') || '-'}`);

  if (dryRun) {
    return;
  }

  const modulesToUpload = keepLiveExtra
    ? Object.assign({}, liveModules, localModules)
    : localModules;

  if (before.liveOnly.length > 0 && !keepLiveExtra) {
    console.log(`Removing unmanaged live modules: ${before.liveOnly.join(', ')}`);
  }

  const result = await withTimeout(api.code.set(branch, modulesToUpload), timeout, `Uploading ${branch}`);
  console.log(JSON.stringify(result));

  const updated = await withTimeout(api.code.get(branch), timeout, `Verifying ${branch}`);
  const after = compareModules(modulesToUpload, updated.modules || {});
  if (after.changed.length || after.localOnly.length || after.liveOnly.length) {
    throw new Error(`Upload verification failed: ${JSON.stringify(after)}`);
  }

  console.log(`Verified ${Object.keys(modulesToUpload).length} live modules.`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
