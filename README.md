# explain-c-module 插件

**skill + hook 自动化工作流**：`git commit` 触碰 C 源码 → 自动生成面向初级嵌入式工程师的中文讲解文档（v2.1）。

不止"做了什么"，更讲清**为什么这样写**——引用**真实工程证据**，配 **Mermaid 图表**，附**生僻语法小课堂**。

## 它解决什么问题

AI 时代初级工程师常能"看懂每行代码"，却缺乏"手把手开发"才能积累的底层直觉。这个插件在每次 commit C 代码后，自动让 Claude 讲透新实现的模块。

## v2.1 质量铁律（为什么生成的文档值得读）

1. **实例优先，三级递降**：工程真实日志证据 → 行业经典案例 → 构造最小示例；禁止只讲抽象结论
2. **每函数至少一图或一表**：时序图/状态图/流程图按内容选型；MD 用 ASCII，HTML 用 Mermaid 交互版
3. **HTML 发挥 Web 优势**：Mermaid 可缩放图表、`<details>` 折叠深挖面板、三色语义提示框、证据框——禁止做成 MD 的换肤
4. **反事实讲法**：每个关键设计补"如果不这样写会怎样"，工程历史 bug 是现成教材
5. **生僻语法进小课堂**：函数指针/`container_of`/`__attribute__` 等逐个四段式详解（语法拆解→发明动机→本代码用法→常见误用），禁止一句白话带过

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
  └─ doc/explain/html/<模块名>.html  （交互阅读版，Mermaid 图表 + highlight.js 高亮）
```

**核心设计**：hook 提供"时机 + 事实"（何时 commit、改了哪些文件），skill 提供"方法"（怎么讲），中间靠注入的自然语言指令衔接。hook 无法直接调用 skill——这是 Claude Code 的架构约束，也是职责分离的体现。

## 安装（三选一）

### 方式一：marketplace 安装（推荐，可自动更新）

```bash
# 在目标仓库根目录的 Claude Code 里执行（GitHub，国际用户）：
/plugin marketplace add gc9768/explain-c-module-plugin
/plugin install explain-c-module@explain-c-module-market

# 或 Gitee 镜像（国内用户，直连快）：
/plugin marketplace add https://gitee.com/gc9768/explain-c-module-plugin
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

### 方式三：其他 agent（Codex / Cursor / OpenCode 等）

本 skill 符合 [agentskills.io](https://agentskills.io) 开放标准（SKILL.md 格式），可跨工具使用，但**自动触发 hook 是 Claude Code 独有机制**——其他 agent 只有手动触发。

```bash
# Codex：拷贝 skill 到其加载目录，新开会话自动加载
git clone https://gitee.com/gc9768/explain-c-module-plugin
mkdir -p ~/.codex/skills
cp -r explain-c-module-plugin/skills/explain-c-module ~/.codex/skills/

# 之后在对话中直接说："用 explain-c-module 讲解 xxx 目录"
```

| 能力 | Claude Code（插件） | 其他 agent（纯 skill） |
|---|---|---|
| 手动触发讲解 | ✅ `/explain-c-module` | ✅ 对话中说 skill 名 |
| commit 自动触发 | ✅ hook 注入 | ❌ hook 机制各异，未内置 |
| 大提交守卫 | ✅ MAX_C_FILES=30 | —（无自动触发即无此问题） |

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

**大提交守卫**：单次 commit 触碰 >30 个 C/H 文件时静默跳过。这防止 `git init && git add . && git commit` 导入存量大代码库时触发几百份讲解文档——那不是"新写的代码"，不在 skill 服务范围内。阈值在 `scripts/explain-commit.cjs` 顶部 `MAX_C_FILES` 可调。

### 手动触发

```
/explain-c-module              # 讲解当前目录的模块
/explain-c-module src/drivers/uart.c
/explain-c-module src/drivers/
```

> 注意：插件 skill 的调用名带命名空间，可能显示为 `explain-c-module:explain-c-module`，以 `/` 前缀补全列表实际显示为准。

## 产物

| 文件 | README 说明（详见模板） |
|---|---|
| `doc/explain/md/<模块名>.md` | 源文档（进 git 做 diff 评审；8+1 节结构） |
| `doc/explain/html/<模块名>.html` | 交互阅读版（Mermaid 可缩放图表、`<details>` 折叠深挖面板、三色语义提示框、证据框、highlight.js 高亮） |

### 生成效果示例

以一个 IPC 摄像头工程的 `ipc_record.c`（录像/回放模块）为例，v2.1 生成的文档包含：

- **5 段真实工程证据**（带来源标注的崩溃断言、心跳日志、时间线）
- **4 张 Mermaid 图**（数据流/竞态崩溃时序/录像状态机/回放切换时序）
- **2.5 节语法小课堂**（函数指针四段式详解等）
- **9 处反事实**（每个设计决策的"不这样会怎样"，均有实测事故背书）

## 适用场景

- 团队里有新人接手大型嵌入式 C 代码库（SDK/RTOS/驱动）
- 想把"只有老员工脑子里的为什么"沉淀成文档
- 代码审查/交接时快速生成某个模块的深度导读

## 环境要求

- Claude Code CLI（claude.ai/code）
- （HTML 阅读版）浏览器联网加载 highlight.js/Mermaid CDN；离线时仅无高亮，内容完整

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
│   └── explain-c-module/  # 讲解方法论（纯指令型 skill，v2.1）
│       ├── SKILL.md
│       └── references/    # 3 个模板/清单
├── hooks/
│   └── hooks.json         # hook 注册（安装后自动合并进 hooks 体系）
└── scripts/
    └── explain-commit.cjs # hook 脚本（commit 滀测 + 大提交守卫）
```

## License

MIT — 随便用，改了更好欢迎 PR。
