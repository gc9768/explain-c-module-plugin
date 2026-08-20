#!/usr/bin/env node
/*
 * PostToolUse(Bash) hook — "git commit → auto explain"
 *
 * Fires after every Bash tool call. When the command was a real `git commit`
 * AND the new HEAD touched C/H source files, it injects an instruction back to
 * Claude to run the `explain-c-module` skill on those files.
 *
 * Stays silent (no stdout) when:
 *   - the command was not a `git commit`
 *   - the commit touched no .c/.h files (docs, configs, scripts…)
 *   - we're not in a git repo / HEAD can't be read
 *
 * Never throws — a hook must not break the tool flow.
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');

// Matches `git commit` but NOT `git commit-tree`, `git commits`, `git log`.
// Requires "commit" to be followed by end-of-string or a non-word, non-hyphen char
// (space, ;, &, | …), so `git commit -m x`, `git commit&&…`, `git commit;` all match.
// 匹配 `git commit` 与 `git -C <path> commit` 等(允许 git 与 commit 间有 -C 等参数)。
const COMMIT_RE = /\bgit\b.*\bcommit(?![\w-])/;

const C_SOURCE_RE = /\.(c|h|cc|cpp|cxx|hpp|hh)$/i;

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8'); // read hook stdin
  } catch (_) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return;
  }

  const cmd = (payload && payload.tool_input && payload.tool_input.command) || '';
  if (!COMMIT_RE.test(cmd)) return;

  // Resolve repo path for `git -C <path> commit` so diff-tree runs in the right
  // repo (not the hook cwd). Literal paths only; variable paths ($F) can't be
  // resolved → fall back to cwd.
  const cMatch = cmd.match(/(?:^|\s)-C\s+("([^"]*)"|'([^']*)'|(\S+))/);
  const cPath = cMatch && (cMatch[2] || cMatch[3] || cMatch[4]);
  const repoArgs = cPath && !/\$/.test(cPath) ? ['-C', cPath] : [];

  // List files changed by the commit at HEAD (handles first commit via --root).
  // execFileSync with an arg array = no shell, no injection surface.
  let files = [];
  try {
    const out = execFileSync(
      'git',
      [...repoArgs, 'diff-tree', '--no-commit-id', '--name-only', '-r', '--root', 'HEAD'],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
    );
    files = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (_) {
    return; // not a repo, or no HEAD yet
  }

  const cFiles = files.filter((f) => C_SOURCE_RE.test(f));
  if (cFiles.length === 0) return; // nothing explainable

  const list = cFiles.map((f) => `- ${f}`).join('\n');

  const ctx =
    '[git-commit → explain-c-module 自动触发] 刚检测到一次 git commit，本次提交修改了以下 C 源文件：\n' +
    list +
    '\n\n请立即调用 explain-c-module skill 为这些文件生成中文讲解文档（输出到 doc/explain/）。' +
    '建议按所在目录聚合讲解（explain-c-module 会自动读取同目录 CMakeLists.txt 作为构建上下文，避免重复）；' +
    '若文件分散在不同目录则逐个讲解。完成后按 explain-c-module 的 Step 6 给出简短摘要与文档路径。' +
    '若个别文件只是 trivial 改动（如仅改注释 / 宏值 / 空行），可跳过它并在回复中说明。';

  emit({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: ctx,
    },
  });
}

try {
  main();
} catch (_) {
  /* swallow — never block the tool */
}
