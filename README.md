# explain-c-module 插件

**skill + hook 自动化工作流**：`git commit` 触碰 C 源码 → 自动生成面向初级嵌入式工程师的中文讲解文档。

## 它解决什么问题

AI 时代初级工程师常能“看懂每行代码”，却缺乏“手把手开发”才能积累的底层直觉。这个插件在每次 commit C 代码后，自动让 Claude 讲透新实现的模块——不止"做了什么"，更讲清**为什么这样写**。

## 工作原理

```
git commit（触碰 .c/.h）
  │
  ▼
PostToolUse hook (scripts/explain-commit.cjs)
  ├─ 正则识别真实 commit（排除 commit-tree/commit-graph）
  ├─ git diff-tree --root HEAD 列出本次提交文件
  ├─ 过滤 C 源文件；>30 个视为批量导入，静默跳过（防 init 风暴）
  │
  ▼ 注入 additionalContext 指令文本
Claude 解析指令 → 调用 explain-c-module skill
  │
  ▼
按 SKILL.md 执行：读代码 → 匹配知识清单 → 生成文档
  ├─ doc/explain/md/<模块名>.md      （源文档）
  └─ doc/explain/html/<模块名>.html  （图文阅读版，highlight.js 高亮）
```

**核心设计**：hook 提供“时机 + 事实”（何时 commit、改了哪些文件），skill 提供“方法”（怎么讲），中间靠注入的自然语言指令衔接。hook 无法直接调用 skill——这是 Claude Code 的架构约束，也是职责分离的体现。

## 安装（二选一）

### 方式一：marketplace 安装（推荐，可自动更新）

```bash
# 在目标仓库根目录的 Claude Code 里执行：
/plugin marketplace add gc9768/explain-c-module-plugin
/plugin install explain-c-module@explain-c-module-market
```

> 安装后如未生效，运行 `/reload-plugins`（会话中途安装需重载）。

### 方式二：本地试用

```bash
# 在 Claude Code 里直接添加本地目录为 marketplace：
/plugin marketplace add D:/Work/.../explain-c-module-plugin
/plugin install explain-c-module@explain-c-module-market
```

> 插件被拷贝到 `~/.claude/plugins/cache`，对源目录的后续修改不影响已安装版本，需重装刷新。

### 依赖

- Node.js（hook 脚本运行环境；Claude Code 本身基于 Node，装了 Claude Code 就有）
- 无 npm 依赖，纯 Node 内置模块（fs/child_process）

## 使用

### 自动触发（装完即生效）

正常开发 commit 即可：

```bash
git add project/baidu_interaction/ui/ui_camera.c
git commit -m "feat: 摄像头预览优化"
# → Claude 自动收到指令，讲解 ui_camera.c 并产出文档
```

**大提交守卫**：单次 commit 触碰 >30 个 C/H 文件时静默跳过。这防止 `git init && git add . && git commit` 导入存量大代码库时触发几百份讲解文档——那不是“新写的代码”，不在 skill 服务范围内。阈值在 `scripts/explain-commit.cjs` 顶部 `MAX_C_FILES` 可调。

### 手动触发

```
/explain-c-module              # 讲解当前目录的模块
/explain-c-module src/drivers/uart.c
/explain-c-module src/drivers/
```

> 注意：插件 skill 的调用名带命名空间，可能显示为 `explain-c-module:explain-c-module`，以 `/` 前缀补全列表实际显示为准。

## 产物

| 文件 | 说明 |
|---|---|
| `doc/explain/md/<模块名>.md` | 源文档（进 git 做 diff 评审） |
| `doc/explain/html/<模块名>.html` | 阅读版（highlight.js 高亮、⚠️ 提示框、可折叠目录） |

文档结构（8 节）：模块概述 / 关键数据结构 / 知识点讲解 / 逐段代码讲解 / ASCII 框图与时序 / 常见问题 / 帣习清单 / 延伸阅读。

## 维护契约（改 skill 名必读）

skill 与 hook 是松耦合文本契约，改名需同步 **5 处**：

1. `skills/explain-c-module/` 目录名
2. `SKILL.md` frontmatter `name:`（解析主键）
3. `SKILL.md` 正文标题、description、用法示例
4. `hooks/hooks.json` 的 description（仅注释，但建议同步）
5. `scripts/explain-commit.cjs` 注入文本中的 skill 名引用（**漏掉即静默失效**，commit 后不再自动讲解，无任何报错）

验证：`grep -ri "旧名" 插件目录` 应只剩 `doc/explain/` 输出路径（产物目录不改，改了孤儿化历史文档）。

## 文件清单

```
explain-c-module-plugin/
├── .claude-plugin/
│   ├── plugin.json        # 插件清单
│   └── marketplace.json   # marketplace 目录（单插件仓库专用）
├── skills/
│   └── explain-c-module/  # 讲解方法论（纯指令型 skill）
│       ├── SKILL.md
│       ┑── references/    # 3 个模板/清单
├── hooks/
│   └── hooks.json         # hook 注册（安装后自动合并进 hooks 体系）
└── scripts/
    └── explain-commit.cjs # hook 脚本（commit 检测 + 大提交守卫）
```
