#!/usr/bin/env node
/*
 * Git post-merge/post-rebase adapter.
 * Detect relevant source changes, then run Codex to generate and review docs.
 * The agent is explicitly instructed not to edit source code or commit.
 */
'use strict';

const { execFileSync, spawnSync } = require('child_process');

const SOURCE_RE = /\.(c|h|cc|cpp|cxx|hpp|hh)$/i;
const MAX_C_FILES = 30;

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function changedFiles(repo) {
  for (const revs of [['ORIG_HEAD', 'HEAD'], ['HEAD~1', 'HEAD']]) {
    try {
      const out = git(['diff', '--name-only', ...revs], repo);
      if (out) return out.split(/\r?\n/).filter(Boolean);
    } catch (_) { /* try the fallback revision pair */ }
  }
  return [];
}

function relevant(file) {
  return SOURCE_RE.test(file);
}

function main() {
  if (process.env.EXPLAIN_C_MODULE_UPDATE_ENABLED === '0') return;
  const repo = git(['rev-parse', '--show-toplevel'], process.cwd());
  const files = changedFiles(repo).filter(relevant);
  if (!files.length) {
    console.log('[explain-update] no relevant C/C++ changes; skipped');
    return;
  }
  if (files.length > MAX_C_FILES) {
    console.log(`[explain-update] ${files.length} C/C++ files exceed MAX_C_FILES=${MAX_C_FILES}; skipped batch import`);
    return;
  }
  console.log(`[explain-update] ${files.length} relevant file(s):\n${files.map(f => `  - ${f}`).join('\n')}`);
  if (process.env.EXPLAIN_C_MODULE_UPDATE_DRY_RUN === '1') return;

  const prompt = [
    `仓库：${repo}`,
    `Git 更新后检测到以下 C/C++ 源码变化：\n${files.map(f => `- ${f}`).join('\n')}`,
    '',
    '请执行完整文档闭环：',
    '1. 使用 explain-c-module 对受影响模块增量更新 doc/explain/md 与 doc/explain/html；',
    '2. 使用 review-explain-doc 审查源码证据、调用链、图表、行号和 MD/HTML 一致性；',
    '3. 发现问题时只修正文档并最多复审 2 轮；',
    '4. 不修改 C/C++ 源码，不提交 Git，不删除已有文档；',
    '5. 最后报告修改文件、审核状态和未解决问题。',
  ].join('\n');

  const args = ['exec', '-C', repo, '--sandbox', 'workspace-write', '--ask-for-approval', 'never', '--ephemeral'];
  if (process.env.EXPLAIN_C_MODULE_UPDATE_MODEL) args.push('--model', process.env.EXPLAIN_C_MODULE_UPDATE_MODEL);
  args.push(prompt);
  const result = spawnSync('codex', args, { cwd: repo, stdio: 'inherit' });
  if (result.error) {
    console.error(`[explain-update] unable to start codex: ${result.error.message}`);
    process.exitCode = 1;
  } else if (result.status !== 0) {
    console.error(`[explain-update] codex exited with ${result.status}`);
    process.exitCode = result.status || 1;
  }
}

try { main(); } catch (error) {
  console.error(`[explain-update] ${error.message}`);
  process.exitCode = 1;
}
