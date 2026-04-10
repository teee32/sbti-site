# SBTi 答题助手

一个纯静态的 SBTi 人格答案查询页。

输入人格代码或中文名，即可查看对应的人格答题路径、特殊题触发条件、维度等级、校验结果，并支持复制清单、复制 value 映射、下载 JSON。

## 在线访问

- GitHub 仓库：<https://github.com/teee32/sbti-site>
- GitHub Pages：<https://teee32.github.io/sbti-site/>

支持 hash 直达，例如：

- <https://teee32.github.io/sbti-site/#CTRL>
- <https://teee32.github.io/sbti-site/#DRUNK>

## 功能

- 按人格代码 / 中文名搜索
- 查看完整 30 题答题路径
- 查看隐藏题条件与特殊覆盖
- 查看 15 个维度等级与说明
- 查看校验结果与 Top 3 匹配
- 一键复制完整清单
- 一键复制 value 映射
- 一键复制 / 下载当前人格 JSON
- 支持题库搜索与 hash 深链接

## 数据概览

当前仓库内置的数据快照：

- 人格数量：27
- 正式题数量：30
- 特殊题数量：2
- 维度数量：15
- 数据生成时间：`2026-04-10T05:05:04.447Z`
- 来源：<https://www.bilibili.com/blackboard/era/VxiCX2CRqcqzPK9F.html>

## 项目结构

```text
.
├── index.html          # 页面结构
├── styles.css          # 页面样式
├── app.js              # 页面交互逻辑
└── data/
    ├── site-data.json  # 数据快照
    └── site-data.js    # 预加载数据
```

## 本地运行

这是一个纯静态项目，不需要构建。

### 方式 1：直接打开

直接双击 `index.html` 即可查看。

### 方式 2：启动本地静态服务器

```bash
python3 -m http.server 8080
```

然后访问：<http://localhost:8080/>

## 部署

本仓库使用 GitHub Pages，从 `main` 分支根目录发布。

如果你后续要重新部署，只需要推送到 `main`：

```bash
git push origin main
```

## 说明

- 项目为纯前端静态页面，不依赖打包工具。
- 页面默认会优先读取 `window.SBTI_SITE_DATA`，否则回退到 `./data/site-data.json`。
- 若更新数据，建议同时更新 `data/site-data.json` 与 `data/site-data.js`。
