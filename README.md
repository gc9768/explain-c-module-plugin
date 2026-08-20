# explain-c-module — Claude Code 嵌入式代码讲解 Skill + Hook 分享包

> 让 Claude Code 在你每次 `git commit` 含 C 源码后,自动生成一份**面向初级嵌入式工程师的深度学习文档**(MD 源 + HTML 交互阅读版)——不止"做了什么",更讲清**为什么这样写**,引用**真实工程证据**,配 **Mermaid 图表**,附**生僻语法小课堂**。

## 这是什么

一个由两部分组成的 Claude Code 扩展体系:

```
skills/explain-c-module/     ← 讲解技能(手动 /explain-c-module <文件> 触发,或被 hook 自动调用)
├── SKILL.md                 ← 技能主指令(含 v2.1 五条质量铁律)
└── references/
    ├── doc-template.md      ← MD 输出的 8+1 节结构模板
    ├── html-template.md     ← HTML 交互阅读版骨架(Mermaid/证据框/折叠面板)
    └── knowledge-checklist.md ← 9 个嵌入式知识"镜头"扫描清单

hooks/explain-commit/
└── explain-commit.cjs       ← PostToolUse 钩子:检测到 commit 含 C 源码时,
                                自动提示 Claude 调用讲解技能
```

## v2.1 质量铁律(为什么生成的文档值得读)

1. **实例优先,三级递降**:工程真实日志证据 → 行业经典案例 → 构造最小示例;禁止只讲抽象结论
2. **每函数至少一图或一表**:时序图/状态图/流程图按内容选型;MD 用 ASCII,HTML 用 Mermaid 交互版
3. **HTML 发挥 Web 优势**:Mermaid 可缩放图表、`<details>` 折叠深挖面板、三色语义提示框、证据框——禁止做成 MD 的换肤
4. **反事实讲法**:每个关键设计补"如果不这样写会怎样",工程历史 bug 是现成教材
5. **生僻语法进小课堂**:函数指针/`container_of`/`__attribute__` 等逐个四段式详解(语法拆解→发明动机→本代码用法→常见误用),禁止一句白话带过

## 安装

### 1. 安装 Skill

```bash
# 全局安装(所有项目可用)
mkdir -p ~/.claude/skills
cp -r skills/explain-c-module ~/.claude/skills/

# 或项目级安装(仅当前项目)
mkdir -p .claude/skills
cp -r skills/explain-c-module .claude/skills/
```

### 2. 安装 Hook(可选,自动触发讲解)

编辑 `~/.claude/settings.json`,在 `hooks.PostToolUse` 数组中追加:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "node \"C:/Users/<你>/​.claude/hooks/explain-commit/explain-commit.cjs\"",
      "statusMessage": "Checking commit for C sources to explain...",
      "timeout": 15
    }
  ]
}
```

并将 `hooks/explain-commit/explain-commit.cjs` 复制到 `~/.claude/hooks/explain-commit/`。

### 3. 使用

```
# 手动触发
/explain-c-module src/drivers/uart.c     # 讲解单文件
/explain-c-module src/drivers/           # 讲解目录

# 自动触发(装了 hook 后)
git commit ...                            # commit 含 .c 文件时,hook 提示 Claude 自动讲解
```

输出位置:`doc/explain/md/<模块名>.md`(源)+ `doc/explain/html/<模块名>.html`(交互阅读版,浏览器打开)。

## 生成效果示例

以一个 IPC 摄像头工程的 `ipc_record.c`(录像/回放模块)为例,v2.1 生成的文档包含:

- **5 段真实工程证据**(带来源标注的崩溃断言、心跳日志、时间线)
- **4 张 Mermaid 图**(数据流/竞态崩溃时序/录像状态机/回放切换时序)
- **2.5 节语法小课堂**(函数指针四段式详解等)
- **9 处反事实**(每个设计决策的"不这样会怎样",均有实测事故背书)

## 适用场景

- 团队里有新人接手大型嵌入式 C 代码库(SDK/RTOS/驱动)
- 想把"只有老员工脑子里的为什么"沉淀成文档
- 代码审查/交接时快速生成某个模块的深度导读

## 环境要求

- Claude Code CLI(claude.ai/code)
- (HTML 阅读版)浏览器联网加载 highlight.js/Mermaid CDN;离线时仅无高亮,内容完整

## License

MIT — 随便用,改了更好欢迎 PR。
