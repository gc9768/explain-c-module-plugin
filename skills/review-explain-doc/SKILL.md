---
name: review-explain-doc
description: "审核 explain-c-module 生成的 Markdown/HTML 嵌入式代码讲解文档，检查事实证据、调用链、图表、MD/HTML 一致性和初学者可读性，并给出可执行的修订清单。适用于生成文档后的质量审核；不修改源代码。"
allowed-tools: Read, Grep, Glob, Bash
metadata:
  version: "2.3.0"
  user-invocable: "true"
---

# review-explain-doc — 讲解文档质量审核

审核 `explain-c-module` 生成的 Markdown 与 HTML 文档，发现事实错误、证据不足、图文不一致和不适合初学者的问题。审核只读源代码和文档，不修改源代码；主 agent 根据审核结果修正文档。

## 使用方式

1. 读取目标模块的 `doc/explain/md/<模块名>.md` 与 `doc/explain/html/<模块名>.html`。
2. 读取文档引用的 C/C++ 文件、构建脚本和必要的日志证据，核对关键结论。
3. 读取本 skill 同目录 `references/review-checklist.md`。
4. 按清单审核，给每个维度 0～5 分，并列出问题的文件、章节和严重级别。
5. 输出 `PASS` 或 `NEEDS_REVISION`。只有没有高风险事实错误、结构错误和无法渲染的图表时才允许 `PASS`。
6. 给出最多 2 轮修订建议；不要因为措辞偏好要求无关重写。

## 审核边界

- 工程事实必须能在源码、构建脚本、日志或芯片手册引用中找到；推测必须明确标注。
- 不把“建议设计”写成“当前工程行为”。
- 核对 Markdown 与 HTML 的章节、代码、结论和警告是否对应；HTML 可以增加交互展示，但不能改变结论。
- Mermaid 图必须语法合理，节点、箭头和文字必须与正文一致。
- 检查函数名、路径、行号和输出文件是否仍然有效。
- 涉及寄存器、电源域、时钟、睡眠深度和功耗数值的结论，缺少 RM 或实测证据时必须标注不确定性。
- 审核子 agent 不得修改源代码、提交 Git 或删除已有文档。

## 输出格式

```text
审核状态：PASS / NEEDS_REVISION
总评：一句话说明文档是否可交付
评分：事实准确性 X/5；结构完整性 X/5；图表一致性 X/5；初学者可读性 X/5；可维护性 X/5

问题清单：
- [P1/P2/P3] 文件:章节：问题、证据、建议修订

通过项：
- ...

下一步：PASS=可交付；NEEDS_REVISION=主 agent 修订后最多再审核 1 次
```
