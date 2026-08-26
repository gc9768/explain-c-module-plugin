#!/usr/bin/env node
/* Codex PostToolUse adapter: git commit touching C/C++ files -> context injection. */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMIT_RE = /(?:^|[;&|]\s*|\$\(\s*)git\s+(?:-C\s+(?:"[^"]*"|'[^']*'|[^\s]+)\s+|-c\s+\S+=\S+\s+|--[a-z-]+(?:=\S+)?\s+)*commit(?![\w-])(?<!--commit)/;
const C_SOURCE_RE = /\.(c|h|cc|cpp|cxx|hpp|hh)$/i;
const MAX_C_FILES = 30;

function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8')); } catch (_) { return {}; }
}

function emit(message) {
  // Codex and Claude both consume this hookSpecificOutput shape for context.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message },
  }));
}

function main() {
  const input = readInput();
  if ((input.hook_event_name || '') !== 'PostToolUse') return;
  if ((input.tool_name || '') !== 'Bash') return;
  const command = (input.tool_input || {}).command || '';
  if (!COMMIT_RE.test(command)) return;
  const output = input.tool_output || {};
  if (output.exit_code !== undefined && output.exit_code !== 0) return;

  const cwd = input.cwd || process.cwd();
  const cMatch = command.match(/(?:^|\s)-C\s+("([^"]*)"|'([^']*)'|(\S+))/);
  const cPath = cMatch && (cMatch[2] || cMatch[3] || cMatch[4]);
  const repoArgs = cPath && !/\$/.test(cPath) ? ['-C', cPath] : [];
  const gitOpts = { encoding: 'utf8', cwd };
  let sha, files;
  try {
    sha = execFileSync('git', [...repoArgs, 'rev-parse', 'HEAD'], gitOpts).trim();
    files = execFileSync('git', [...repoArgs, 'diff-tree', '--no-commit-id', '--name-only', '-r', '--root', 'HEAD'],
      { ...gitOpts, maxBuffer: 4 * 1024 * 1024 }).split('\n').map(s => s.trim()).filter(Boolean);
  } catch (_) { return; }

  let root;
  try { root = execFileSync('git', [...repoArgs, 'rev-parse', '--show-toplevel'], gitOpts).trim(); } catch (_) { return; }
  const stateFile = path.join(root, '.codex', 'explain-commit.state');
  try { if (fs.readFileSync(stateFile, 'utf8').trim() === sha) return; } catch (_) { /* first run */ }
  const cFiles = files.filter(f => C_SOURCE_RE.test(f));
  if (!cFiles.length || cFiles.length > MAX_C_FILES) return;

  const list = cFiles.map(f => `- ${f}`).join('\n');
  emit('[git-commit → explain-c-module 自动触发] 检测到一次成功的 git commit，本次提交修改了以下 C/C++ 源文件：\n' +
    list + '\n\n请立即调用 explain-c-module skill，为这些文件生成中文 Markdown 与 HTML 讲解文档（输出到 doc/explain/）。' +
    '生成后调用 review-explain-doc skill 或只读审核子 agent 做一次质量审核，最多修订 2 轮；' +
    '按 explain-c-module 的 Step 7 汇报摘要、审核状态与文档路径；仅注释、宏值或空行等 trivial 改动可跳过并说明。');
  try { fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, sha + '\n'); } catch (_) { /* best effort */ }
}

try { main(); } catch (_) { /* hooks must never break the tool flow */ }
