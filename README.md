# 下津村史 · 掌上的故乡

《下津村史》的手机阅读与乡土影像网站。原书由潮州市湘桥区下津村委会编，2020年6月出版。这个项目把原有电子版整理为适合手机阅读、全文搜索、查看原书图像和核对人物关系的静态网站。

- **正式网站：** https://shanelau068-a11y.github.io/xiajincunshi-v3/
- **公开部署仓库：** https://github.com/shanelau068-a11y/xiajincunshi-v3
- **私人源码备份：** https://github.com/shanelau068-a11y/xiajincunshi-v3-private

私人备份是额外的代码与资料副本。正式网站仍从公开的 `xiajincunshi-v3` 仓库部署，因此私人仓库不会让已经公开的网站或网站内的村史文字、照片变成私有。

## 网站功能

- **读村史：** 前言和十篇目录，可逐级展开并按原文顺序阅读。
- **全文搜索：** 检索村史正文、人物资料和大事记，显示上下文并跳回原文定位。
- **寻旧影：** 77张图像：75张村史扫描图、1张用户提供的刘氏辈序牌匾照片、1张补充村落旧影。相片说明、标题和类别与图片证据分开记录。
- **查族谱：** 输入姓名或别名，列出当前资料有明确依据的父母、子女、配偶与上下各三代，并可回到原文核对。相同姓名按支系分别列出。
- **刘氏辈序：** 依用户提供的牌匾照片记录66字。牌匾“日—名”为刘氏总世143—208世；结合书中对应关系，桃坑为19—84世。
- **看春秋、访乡贤：** 按类别、年代或关键词浏览，并返回书中出处。
- **阅读器：** 字号、夜间阅读、书签、继续阅读、章节分享。进度、字号和书签存在当前浏览器，不会跨设备同步。
- **手机桌面与离线：** 可由浏览器添加到主屏幕。首次联网打开后，应用壳和文字资料会预缓存；图片浏览时缓存。浏览器仍可能清除离线缓存。

## 技术结构

React 18、TypeScript、Vite 6 和 `lucide-react`。这是一个**纯静态前端**：没有数据库、账号系统、服务器端 API、追踪服务或付费 API。页面以 hash URL 路由，所有运行资料随仓库保存在 `public/data/`，媒体保存在 `public/media/`。

主要目录和文件：

| 路径 | 用途 |
| --- | --- |
| `src/App.tsx`、`src/styles.css` | 页面、导航、首页、搜索、影像、人物和大事记 |
| `src/Reader.tsx`、`src/reader.css` | 村史阅读器、正文定位、书签、字号、阅读进度 |
| `src/GenealogyPage.tsx`、`src/genealogy.css` | 按有来源的关系查询族谱 |
| `src/GenerationGuide.tsx`、`src/generation.css` | 刘氏辈序查询、世次换算与牌匾原图 |
| `src/timelinePeriod.ts` | 大事记年代筛选规则 |
| `public/data/*.json` | 网站实际加载的正文、目录、影像、人物、关系与辈序资料 |
| `public/media/` | 首页图片、村史影像、族谱牌匾照片 |
| `scripts/import-legacy.mjs` | 从原有本地项目重新导入文字和扫描照片 |
| `scripts/content-corrections.mjs`、`scripts/apply-corrections.mjs` | 用户确认的校订和补充资料的可重复应用规则 |
| `scripts/build-genealogy.mjs` | 依据原文明示关系重建族谱关系图 |
| `scripts/check-data.mjs` | 检查资料数量、ID、链接、安全标记和图片文件 |
| `scripts/build-sw.mjs` | 生成按内容哈希版本化的离线 Service Worker |
| `.github/workflows/pages.yml` | 仅在正式公开仓库构建并部署 GitHub Pages |
| `AGENTS.md` | 后续 AI 或开发者必须遵守的项目规则 |
| `docs/AI_MAINTENANCE_GUIDE.md` | 数据结构、修改流程、部署和常见维护步骤详解 |
| `docs/VERIFICATION.md` | 已进行的验证及尚未核实的范围 |

更完整的交接说明见 [`docs/AI_MAINTENANCE_GUIDE.md`](docs/AI_MAINTENANCE_GUIDE.md)。

## 本地运行

需要 Node.js 22 或兼容的当前 LTS 版本与 npm。

```powershell
npm ci
npm run dev
```

打开 Vite 输出的网址。生产路径使用 `/xiajincunshi-v3/`，本地开发、预览和 GitHub Pages 都应带此子路径。生成部署文件前可运行：

```powershell
npm run check:data
npm test
npm run build
npm run preview
```

## 内容准确性边界

目前包含110份阅读文档（109份村史文档和1份后期编辑校对附记）、11个目录根节点、77张影像、268条人物资料、110则大事记，以及210个已整理族谱人物和221条有引文出处的关系（174条亲子关系、47条配偶关系）。268条人物简介与210人族谱图是不同资料集，族谱关系并未覆盖全书每个人；搜不到关系不代表没有亲属。族谱页会在没有关系节点时尝试列出人物简介和全文查找入口。

这不等于全书 OCR、所有历史叙述或全村族谱已经独立核实。扫描识别文字、年代、人物说明和照片拍摄时间仍需对照纸书或原始扫描件。没有明确出处的亲属关系保持缺失；不能按姓氏、排行字、世次相邻或名单顺序推断亲子关系。辈序照片只作为辈字和世次依据。

重要校订：用户明确更正雄明之女为“语彤”；牌匾字序以照片为准，196世“竞”、204世“昭”、206世“奕”。“名”为刘氏总世208／桃坑世84。下津村落照片已按用户后续确认标注为“弯堤脚”。细节和来源见 `docs/genealogy-review.md`、`docs/generation-verification.md` 与 `docs/VERIFICATION.md`。

原书文字、扫描页和用户补充照片的相关权利归原作者、编纂单位或相应权利人。本项目没有另行声明这些内容为开源授权；代码仓库可见性不等于资料授权。
