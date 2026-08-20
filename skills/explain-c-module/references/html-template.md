# /explain-c-module HTML 交互阅读版模板（v2.0）

`doc/explain/html/<模块名>.html` 与同名的 `.md` **共用 8 节骨架**，但 HTML 是"学习体验版"——
**内容一致的前提下，必须利用 Web 能力增强**（v2.0 铁律 3）：

## 渲染要点（v2.0）

- **Mermaid 图表是 HTML 的核心增强**：MD 里的 ASCII 图（时序/状态/流程）在 HTML 中
  **至少把 2 张核心图升级为 Mermaid**（`sequenceDiagram` / `stateDiagram-v2` / `flowchart`），
  与原 ASCII 并存或替代。写法：
  ```html
  <div class="mermaid">
  sequenceDiagram
      participant V as 视频线程
      participant S as IOCtrl线程
      V->>S: ...
  </div>
  ```
- **三色语义提示框**：`.warn`（危险坑/事故）、`.info`（背景知识/白话类比）、
  `.ok`（验证通过的判据，如期望日志）。
- **证据框 `.evidence`**：真实日志/崩溃栈用专属样式（等宽+左侧蓝边+来源标注），
  与普通代码块区分，让"实测背书"一眼可辨。
- **`<details>` 折叠深挖面板**：长日志全文、逐行注释版长代码收进折叠区，正文只留结论与精华；
  `summary` 写有吸引力的标题（如"📖 展开:484601ms 崩溃现场完整 dump"）。
- **代码高亮**：C 代码用 highlight.js（CDN，`github-dark`）；日志框内不高亮（保持原色）。
- **目录**：顶部可折叠 TOC（`<details>`），锚点跳节。
- **代码转义**：`<pre><code>` 里 `<`→`&lt;`、`>`→`&gt;`、`&`→`&amp;`，别漏。
- **离线降级**：断网时 highlight.js/Mermaid 加载失败——代码无高亮、Mermaid 退化为文本，
  不影响阅读，放心用 CDN。

## 骨架（复制后填充，删掉没用到的节）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{模块名}} 代码讲解</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/c.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  :root{--bg:#0d1117;--fg:#c9d1d9;--muted:#8b949e;--accent:#58a6ff;--warn-bg:#3b1d1d;--warn-bd:#f85149;--ok-bg:#12261e;--ok-bd:#3fb950;--info-bg:#161b22;--info-bd:#58a6ff;--code-bg:#161b22;--ev-bg:#0d1b2a;--ev-bd:#1f6feb;}
  body{font:15px/1.7 -apple-system,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;background:var(--bg);color:var(--fg);max-width:960px;margin:0 auto;padding:24px 20px 80px;}
  h1{color:#fff;border-bottom:1px solid #30363d;padding-bottom:.3em;}
  h2{color:#fff;border-bottom:1px solid #21262d;padding-bottom:.3em;margin-top:2em;}
  h3{color:var(--accent);}
  a{color:var(--accent);}
  code{font-family:Consolas,"Cascadia Code",monospace;}
  pre{background:var(--code-bg);padding:12px 14px;border-radius:6px;overflow:auto;border:1px solid #30363d;}
  pre code{background:none;padding:0;}
  pre.ascii{color:#adbac7;white-space:pre;}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #30363d;padding:6px 10px;text-align:left;}
  th{background:#161b22;}
  .meta{color:var(--muted);font-size:13px;}
  .badge{display:inline-block;background:#21262d;border:1px solid #30363d;border-radius:10px;padding:0 8px;font-size:12px;color:var(--accent);margin-right:6px;}
  .warn{background:var(--warn-bg);border-left:4px solid var(--warn-bd);padding:8px 12px;margin:10px 0;border-radius:4px;}
  .ok{background:var(--ok-bg);border-left:4px solid var(--ok-bd);padding:8px 12px;margin:10px 0;border-radius:4px;}
  .info{background:var(--info-bg);border-left:4px solid var(--info-bd);padding:8px 12px;margin:10px 0;border-radius:4px;}
  .evidence{background:var(--ev-bg);border-left:4px solid var(--ev-bd);padding:8px 12px;margin:10px 0;border-radius:4px;font-family:Consolas,monospace;font-size:13px;white-space:pre-wrap;}
  .evidence .src{color:var(--muted);font-size:11px;font-style:italic;}
  details{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;margin:10px 0;}
  details.toc{margin:16px 0;}
  summary{cursor:pointer;color:var(--accent);}
  .mermaid{background:#fff;border-radius:6px;padding:8px;margin:12px 0;text-align:center;}
</style>
</head>
<body>

<h1>{{模块名}} 代码讲解</h1>
<div class="meta">
  <span class="badge">初级</span><span class="badge">Mermaid ×{{N}}</span><span class="badge">实测证据 ×{{N}}</span><br>
  <strong>模块路径</strong>：<code>{{相对路径}}</code> |
  <strong>生成时间</strong>：{{YYYY-MM-DD}}<br>
  <strong>一句话</strong>：{{这个模块到底干什么，用人话}}
</div>

<details class="toc"><summary>📚 目录</summary>
  <ul>
    <li><a href="#s1">1. 模块概览</a></li>
    <li><a href="#s2">2. 前置知识</a></li>
    <li><a href="#s25">2.5 基础知识小课堂（生僻语法详解）</a></li>
    <li><a href="#s3">3. 涉及的嵌入式知识点</a></li>
    <li><a href="#s4">4. 逐段讲解</a></li>
    <li><a href="#s5">5. 重点与难点总结</a></li>
    <li><a href="#s6">6. 常见坑与注意事项</a></li>
    <li><a href="#s7">7. 延伸学习</a></li>
    <li><a href="#s8">8. 自测小问题</a></li>
  </ul>
</details>

<section id="s1"><h2>1. 模块概览</h2>
  <!-- 它是什么 / 调用链（ASCII 或 Mermaid flowchart）/ 线程一览表 <table> -->
</section>

<section id="s4"><h2>4. 逐段讲解</h2>
  <!-- 每个函数五件套：
       <h3>函数签名</h3>
       ① <pre><code class="language-c">…</code></pre>
       ② Mermaid 图（sequenceDiagram/stateDiagram/flowchart 选型）
       ③ "为什么这样写"+反事实（<div class="info"> 可用于白话背景）
       ④ <div class="evidence">真实日志<span class="src"> — 来源:session.txt L123</span></div>
       ⑤ <details><summary>📖 深挖:…</summary>长内容</details>
  -->
</section>

<!-- 其余节同 doc-template.md 的 1-8 节对应；.warn/.info/.ok 按语义选框 -->

<section id="s25"><h2>2.5 基础知识小课堂（生僻语法详解）</h2>
  <!-- 每个语法一个 <h3>，四段式：语法拆解 / 为什么发明它 / 本代码用法 / 常见误用。
       HTML 增强：每小节可配 <details> "没有它会怎样" 的替代写法对照，或 Mermaid 图示。 -->
</section>

<script>hljs.highlightAll(); mermaid.initialize({startOnLoad:true, theme:'neutral'});</script>
</body>
</html>
```

## v2.0 自查（发布前）

- [ ] Mermaid 图 ≥2 张，且是核心内容（时序/状态机），不是装饰
- [ ] `.evidence` 证据框 ≥1 处，注明来源文件
- [ ] `<details>` 折叠面板 ≥1 处（收纳长内容）
- [ ] 三色框语义正确（warn≠info≠ok）
- [ ] 与 MD 内容一致（HTML 允许"增强"不允许"矛盾"）
