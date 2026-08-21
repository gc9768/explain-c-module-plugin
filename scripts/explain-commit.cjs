#!/usr/bin/env node
/*
 * PostToolUse(Bash|PowerShell) hook — "git commit → auto explain-c-module"
 *
 * Bundled with the explain-c-module plugin. Fires after every Bash/PowerShell
 * tool call. When the command was a real `git commit` AND the new HEAD touched
 * C/H source files, it injects an instruction back to Claude to run the
 * `explain-c-module` skill on those files.
 *
 * Guards:
 *   - Large-commit guard: commits touching > MAX_C_FILES C/H files are treated
 *     as bulk imports (e.g. `git init && git add . && git commit` on an
 *     existing codebase) and are silently skipped — the skill is meant for
 *     newly written code, not legacy imports.
 *   - Dedup guard: the HEAD sha that was already explained is recorded in
 *     <repo>/.claude/explain-commit.state; re-detections of the same HEAD
 *     (echo/git log/teaching examples that merely CONTAIN the words
 *     "git commit") inject nothing.
 *
 * Stays silent (no stdout) when:
 *   - the command was not a `git commit`
 *   - the commit touched no .c/.h files (docs, configs, scripts…)
 *   - the commit is a bulk import (guard above)
 *   - the HEAD was already explained (dedup guard above)
 *   - we're not in a git repo / HEAD can't be read
 *
 * Never throws — a hook must not break the tool flow.
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Matches a REAL `git commit` invocation (a command segment, not quoted text):
//   - `git` then ONLY global options (-C <path>, -c k=v, --no-pager, --git-dir=…)
//     then `commit` — so `git -C /repo commit -m x` matches;
//   - "commit" NOT preceded by "--" (rejects `git merge --no-commit`,
//     `git cherry-pick -n` style);
//   - "commit" followed by end-of-string or a non-word, non-hyphen char
//     (so `git commit-tree`, `git commits`, `git log … commit` never match).
// This still cannot distinguish `echo "…git commit…"` from a real commit —
// that's what the sha-dedup guard below is for (same HEAD explained once).
const COMMIT_RE = /(?:^|[;&|]\s*|\$\(\s*)git\s+(?:-C\s+(?:"[^"]*"|'[^']*'|[^\s]+)\s+|-c\s+\S+=\S+\s+|--[a-z-]+(?:=\S+)?\s+)*commit(?![\w-])(?<!--commit)/;

const C_SOURCE_RE = /\.(c|h|cc|cpp|cxx|hpp|hh)$/i;

// 大提交守卫阈值：单次 commit 触碰的 C/H 文件数超过此值即视为批量导入，跳过讲解。
// 小型脚手架首提交(几个文件)仍是"新代码"，照常讲解。
const MAX_C_FILES = 30;

// sha 去重状态文件：<repo>/.claude/explain-commit.state，内容是已讲解的 HEAD sha。
// 放在仓库内(而非用户目录)：同一 HEAD 在不同 clone 里理应可各自讲解一次；但为避免
// 污染用户工程，路径以 .claude/ 约定目录落地，加入 .gitignore 即可完全私有。
function stateFileFor(repoArgs) {
  try {
    const top = execFileSync('git', [...repoArgs, 'rev-parse', '--show-toplevel'],
      { encoding: 'utf8' }).trim();
    return top ? path.join(top, '.claude', 'explain-commit.state') : null;
  } catch (_) {
    return null;
  }
}

function alreadyExplained(stateFile) {
  try {
    return fs.readFileSync(stateFile, 'utf8').trim() === currentSha;
  } catch (_) {
    return false;
  }
}

function markExplained(stateFile) {
  try {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, currentSha + '\n');
  } catch (_) {
    /* best-effort: dedup is an optimization, not a guarantee */
  }
}

let currentSha = '';

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
  let sha = '';
  try {
    sha = execFileSync('git', [...repoArgs, 'rev-parse', 'HEAD'],
      { encoding: 'utf8' }).trim();
    const out = execFileSync(
      'git',
      [...repoArgs, 'diff-tree', '--no-commit-id', '--name-only', '-r', '--root', 'HEAD'],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
    );
    files = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (_) {
    return; // not a repo, or no HEAD yet
  }

  // sha 去重：同一 HEAD 只讲解一次。防 echo/grep/cat 等命令文本里恰好含
  // "git commit" 字样时的误触发反复注入（此时 HEAD 并未变化，diff-tree 拿到的
  // 还是上一次已讲解过的提交清单）。
  currentSha = sha;
  const stateFile = stateFileFor(repoArgs);
  if (stateFile && alreadyExplained(stateFile)) return;

  const cFiles = files.filter((f) => C_SOURCE_RE.test(f));
  if (cFiles.length === 0) return; // nothing explainable
  if (cFiles.length > MAX_C_FILES) return; // bulk import (init/mass vendor-drop), skip

  const list = cFiles.map((f) => `- ${f}`).join('\n');

  const ctx =
    '[git-commit → explain-c-module 自动触发] 刚检测到一次 git commit，本次提交修改了以下 C 源文件：\n' +
    list +
    '\n\n请立即调用 explain-c-module skill 为这些文件生成中文讲解文档（输出到 doc/explain/）。' +
    '建议按所在目录聚合讲解（explain-c-module 会自动读取同目录构建脚本 CMakeLists.txt/Makefile/IDE 工程作为上下文，避免重复）；' +
    '若文件分散在不同目录则逐个讲解。完成后按 explain-c-module 的 Step 6 给出简短摘要与文档路径。' +
    '若个别文件只是 trivial 改动（如仅改注释 / 宏值 / 空行），可跳过它并在回复中说明。';

  emit({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: ctx,
    },
  });

  if (stateFile) markExplained(stateFile); // 只在确实注入了指令后才记账
}

try {
  main();
} catch (_) {
  /* swallow — never block the tool */
}
