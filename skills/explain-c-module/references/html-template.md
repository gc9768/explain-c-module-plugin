# /explain-c-module HTML 阅读版模板

`doc/explain/html/<模块名>.html` 与同名的 `.md` **共用 `doc-template.md` 的 8 节结构**，
只是渲染成图文并茂、可独立打开的网页。**内容必须与 MD 一致**（章节、代码、⚠️ 标注对齐）；
MD 是源，HTML 是阅读版。

## 渲染要点

- **代码高亮**：所有 C 代码块用 highlight.js（CDN，`github-dark` 主题）。
- **⚠️ 危险标注**：用 `<div class="warn">` 提示框（骨架里有样式），对应 MD 第 6 节的 ⚠️ 条目。
- **目录**：顶部一个可折叠 TOC（`<details>`），锚点跳到各节。
- **图**：MD 里的 ASCII 图照搬进 `<pre class="ascii">`；HTML 里若觉得必要，可用 Mermaid
  （CDN）画更漂亮的流程/时序图，与 ASCII 并存或替代。
- **代码转义**：`<pre><code>` 里的代码，`<`→`&lt;`、`>`→`&gt;`、`&`→`&amp;`，别漏。
- **离线降级**：没联网时 highlight.js / Mermaid 加载不了，代码只是没高亮、Mermaid 图退化为
  代码块 —— 不影响内容阅读，所以放心用 CDN。

## 骨架（复制后填充，删掉没用到的节）

把下面整段存为 `doc/explain/html/<模块名>.html`，替换 `{{...}}` 占位与各节注释处的内容。

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
<style>
  :root{--bg:#0d1117;--fg:#c9d1d9;--muted:#8b949e;--accent:#58a6ff;--warn-bg:#3b1d1d;--warn-bd:#f85149;--code-bg:#161b22;}
  body{font:15px/1.7 -apple-system,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;background:var(--bg);color:var(--fg);max-width:900px;margin:0 auto;padding:24px 20px 80px;}
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
  .warn{background:var(--warn-bg);border-left:4px solid var(--warn-bd);padding:8px 12px;margin:10px 0;border-radius:4px;}
  details.toc{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;margin:16px 0;}
  summary{cursor:pointer;color:var(--accent);}
</style>
</head>
<body>

<h1>{{模块名}} 代码讲解</h1>
<div class="meta">
  <strong>模块路径</strong>：<code>{{相对路径}}</code>　|
  <strong>生成时间</strong>：{{YYYY-MM-DD}}　|
  <strong>讲解深度</strong>：初级<br>
  <strong>一句话</strong>：{{这个模块到底干什么，用人话}}
</div>

<details class="toc"><summary>📚 目录</summary>
  <ul>
    <li><a href="#s1">1. 模块概览</a></li>
    <li><a href="#s2">2. 前置知识</a></li>
    <li><a href="#s3">3. 涉及的嵌入式知识点</a></li>
    <li><a href="#s4">4. 逐段讲解</a></li>
    <li><a href="#s5">5. 重点与难点总结</a></li>
    <li><a href="#s6">6. 常见坑与注意事项</a></li>
    <li><a href="#s7">7. 延伸学习</a></li>
    <li><a href="#s8">8. 自测小问题</a></li>
  </ul>
</details>

<!-- 每节：<section id="sN"> ... </section>。没内容的节删掉，但 1/3/4/6/8 通常都要有。 -->

<section id="s1"><h2>1. 模块概览</h2>
  <!-- 它是什么 / 谁调用谁 / 系统中的位置（必要时 ASCII 框图，放 <pre class="ascii">） -->
</section>

<section id="s2"><h2>2. 前置知识</h2>
  <!-- 1-3 条，每条一句白话 +（可选）类比 -->
</section>

<section id="s3"><h2>3. 涉及的嵌入式知识点</h2>
  <!-- 只写命中的维度，三段式：是什么 / 为什么用 / 这段代码怎么用（代码带行号）。
       命中生僻语法时，节末加 <h3>C 语法聚焦</h3> 集中讲 2-4 处。 -->
</section>

<section id="s4"><h2>4. 逐段讲解</h2>
  <!-- 每个函数：<h3>`函数签名`</h3> + <pre><code class="language-c">...</code></pre> + "为什么这样写"。
       遇到生僻语法顺手一句白话。代码记得 HTML 转义 < > &。 -->
</section>

<section id="s5"><h2>5. 重点与难点总结</h2>
  <!-- 3-6 条 bullet（<ul><li>） -->
</section>

<section id="s6"><h2>6. 常见坑与注意事项</h2>
  <!-- ⚠️ 条目，每条：<div class="warn">⚠️ <code>文件:行号</code>：发生了什么 / 为什么容易错</div> -->
</section>

<section id="s7"><h2>7. 延伸学习</h2>
  <!-- 本模块没展开但长期受益的概念清单（<ul><li>） -->
</section>

<section id="s8"><h2>8. 自测小问题</h2>
  <!-- 3-5 个问题（<ol><li>） -->
</section>

<script>hljs.highlightAll();</script>
<!-- 可选 Mermaid：在 <head> 加 <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>，
     再把 <div class="mermaid">graph LR; A-->B</div> 放进正文，最后加 <script>mermaid.initialize({startOnLoad:true});</script> -->
</body>
</html>
```
