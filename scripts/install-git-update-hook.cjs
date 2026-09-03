#!/usr/bin/env node
/* Install post-merge/post-rebase hooks without overwriting existing hooks. */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const START = '# >>> explain-c-module git-update >>>';
const END = '# <<< explain-c-module git-update <<<';

function root(cwd) {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();
}

function install(repo, hookName) {
  const hook = path.join(repo, '.git', 'hooks', hookName);
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  const existing = fs.existsSync(hook) ? fs.readFileSync(hook, 'utf8') : '#!/bin/sh\n';
  if (existing.includes(START)) return;
  const script = path.resolve(__dirname, 'explain-update.cjs');
  const block = `\n${START}\nnode "${script}"\nstatus=$?\nif [ $status -ne 0 ]; then echo "explain-c-module update failed" >&2; fi\n${END}\n`;
  fs.writeFileSync(hook, existing.replace(/\s*$/, '') + block, { encoding: 'utf8', mode: 0o755 });
  try { fs.chmodSync(hook, 0o755); } catch (_) { /* Windows may ignore chmod */ }
  console.log(`installed ${hook}`);
}

try {
  const repo = root(process.cwd());
  install(repo, 'post-merge');
  install(repo, 'post-rebase');
  console.log('Git update hooks installed (post-merge, post-rebase).');
  console.log('Trial run: set EXPLAIN_C_MODULE_UPDATE_DRY_RUN=1 before running the hook.');
} catch (error) {
  console.error(`hook installation failed: ${error.message}`);
  process.exitCode = 1;
}
