# 下津村史网站：后续 AI 维护与交接说明

本说明用于让未参与此前工作的开发者或 AI 快速理解项目、分辨哪些资料可改、知道如何正确重建和发布。先读仓库根目录 `AGENTS.md`，再按本说明操作。

## 1. 项目是什么

这是《下津村史》的静态手机阅读网站，面向下津村乡亲。原书由潮州市湘桥区下津村委会编，2020年6月出版。当前新版从旧版项目独立重构；旧项目仍保留在用户电脑原目录，不应被新脚本或代理覆盖。

正式网页：<https://shanelau068-a11y.github.io/xiajincunshi-v3/>

正式公开代码和 Pages 部署仓库：<https://github.com/shanelau068-a11y/xiajincunshi-v3>
私人源码备份：<https://github.com/shanelau068-a11y/xiajincunshi-v3-private>

这是纯静态前端，没有服务端、数据库、登录、后台管理、外部 API 或账号同步。源文件、JSON 数据与公开网页媒体都在 Git 仓库。用户书签、字号、夜间模式和阅读进度只写入当前浏览器的 `localStorage`。

**可见性提醒：** 私人仓库是源代码的私人备份。正式站点仍从公开仓库部署，已公开网页内容不会因为另建私人仓库而变为私密。仓库也不为原书文字或图像授予版权。

## 2. 技术栈与本地开发

- Node.js / npm；构建服务器使用 Node.js 22。
- React 18、TypeScript、Vite 6、`lucide-react`。
- TypeScript 使用严格检查，Vite 输出静态文件到 `dist/`。
- hash 路由适配 GitHub Pages 项目子路径，不依赖服务器配置重写。

```powershell
npm ci
npm run dev
```

常用核验和产物：

```powershell
npm run check:data
npm test
npm run build
npm run preview
```

`preview` 预览生产构建；不要用单纯的 Vite 开发服务器判断离线缓存是否正确。正式部署由 GitHub Actions 执行同一资料检查、自动化测试与构建。

## 3. 页面和路由

路由在 `src/App.tsx` 中由 `window.location.hash` 解析；导航使用 hash，不需要后端 rewrite。

| Hash 路径 | 内容 |
| --- | --- |
| `#/` | 首页和继续阅读入口 |
| `#/catalog` | 全书篇章目录 |
| `#/read/d-001` | 指定文档；可加 `?q=词语` 定位搜索词 |
| `#/search?q=词语` | 搜索正文、人物和大事记 |
| `#/photos` | 影像记忆 |
| `#/timeline` | 大事记 |
| `#/people?q=姓名` | 人物资料 |
| `#/genealogy?q=姓名` | 族谱姓名查询 |
| `#/saved` | 当前浏览器的书签 |
| `#/about` | 村史和离线阅读说明 |

首页用 `HomePage`；各页面由 `App` 根据 hash 选择。目录和阅读文档之间使用稳定的文档 ID。添加页面时同步检查页头导航、手机底栏、标题和分享/原文链接。

### 前端核心模块

- `src/App.tsx`：数据加载、hash 路由、共享页头/页脚/手机底栏，以及首页、目录、搜索、照片、人物、大事记、书签、关于页。
- `src/Reader.tsx`：书籍文档渲染、原文中的内部跳转、搜索词定位、阅读进度恢复、目录、字号、夜间模式和书签。
- `src/GenealogyPage.tsx`：人物姓名/别名搜索、同名候选、祖先/后代层级、配偶与证据链接。
- `src/genealogySearch.mjs`：族谱规范姓名/字别名检索，以及没有族谱节点时的人物简介兜底查找；配套声明文件与 Node 单元测试。
- `src/GenerationGuide.tsx`：辈序数字/字过滤、总世和桃坑世次对照、来源解释和牌匾原图。
- `src/timelinePeriod.ts`：年代文字转数值和1949年前/后的筛选逻辑。
- `src/styles.css`、`src/reader.css`、`src/genealogy.css`、`src/generation.css`：全局、阅读器、族谱和辈序样式。
- `src/main.tsx`：React 入口；仅在生产环境注册 `sw.js`。

阅读器目前把 `xiajin-reading`、`xiajin-bookmarks`、`xiajin-font-size`、`xiajin-reader-night` 存入本机浏览器。改存储键会使旧设备上原来的阅读状态无法按新键读取，应视为兼容性变更。

## 4. 资料文件和格式

网页运行时从 `public/data/` 读取 JSON。不要只在组件中写另一份资料，避免页面与资料库不一致。

| 文件 | 当前内容和主要字段 |
| --- | --- |
| `documents.json` | 110份文档。每条包含 `id`、`file`、`order`、`kind`、`title`、`partId`、`partTitle`、`parentId`、`html`、`text`；原 ID 是阅读链接的稳定目标。109条 `kind: book`，另有一条 `d-110` 编辑校对附记。 |
| `catalog.json` | 11个目录根节点（前言和十篇），`documentId` 指向文档，`children` 递归组成篇—章—节。 |
| `photos.json` | 77条图像元数据：`id`、`title`、`category`、`image`、`sourcePage`、`description`、`year`；部分有人工复核字段。相对路径指向 `public/`。 |
| `people.json` | 268条人物摘要/传记，带 `documentId` 来源。出现年代是“原书记载年代”，不要推算为生卒年。 |
| `timeline.json` | 110条大事记，含 `year`、`title`、`category`、`summary`、`detail`、`documentId`。部分年代是年号或区间，不能只留下可正则识别的阿拉伯数字。 |
| `genealogy.json` | 210个人物节点、221条关系（174亲子、47配偶）。关系携带来源文档和原文引句。 |
| `generation.json` | 牌匾转录的66字序列、逐字双世次、来源图片、解释及复核日期。 |
| `corrections.json` | 用户明确校正的审计记录，包含旧值、新值、原因/依据、日期等。 |
| `manifest.json` | 数据导入计数、生成时间、资料来源与尚未核实范围。 |

当前数量可以由 `npm run check:data` 验证。补充照片当前共2张：

1. `liushi-generation-board-20261112`：用户提供的牌匾原图，类别 `族谱资料`。
2. `xiajin-old-village-20261113`：补充老村影像，当前说明按用户确认标注为弯堤脚，拍摄年代仍未注明。

原有75张扫描图也保留在 `public/media/photos/`。首页图目前是 `public/media/cover/xiajin-dijiao.jpg`，现按用户最近确认称为“弯堤脚”。Web 图片可能是为加载速度制作的压缩版本；若编辑或恢复原片，应从用户保存的原始图片取材，不要把网页衍生压缩图当成唯一原件。

## 5. 原始资料、校订和生成顺序

### 原项目导入

用户电脑上的原项目为 `E:\Shane\下津村史网页版260709`。导入脚本只读取其中 `public/book/` 和 `src/data/*.ts` 的原有资料/图片，不执行旧应用代码，也不修改旧项目。脚本把清理后的静态资料复制到当前项目。

```powershell
node scripts/import-legacy.mjs "E:\Shane\下津村史网页版260709"
npm run data:genealogy
npm run check:data
```

这会重写 `public/data/` 和复制源项目图片。**重新导入前先提交或备份当前版本**，并确认原路径指向正确的旧项目。之后检查 `git diff`，尤其确认用户补充照片、全部确认校订、manifest 数量和旧项目未遭修改。原项目如果不在其他电脑，纯克隆仓库仍可直接运行/构建，但不能从缺失的旧项目重新抽取新的原书内容。

### 用户确认校订和补充照片

`scripts/content-corrections.mjs` 是跨重建保留的来源：它保存经用户确认的 d-007 更正、66字辈序、辈序数据和补充照片。`scripts/apply-corrections.mjs` 将更正重放到生成后的文档、纠错记录、辈序 JSON 和照片清单；补充照片按稳定 ID upsert，避免重跑时重复。

只更新当前资料的标准流程：

```powershell
npm run data:correct
npm run data:genealogy
npm run check:data
npm test
```

`npm run data:refresh` 是上述校订与族谱重建的快捷命令。重新运行后逐项检查正文差异，不要因文件是 JSON 就直接大范围重排或改写。

### 族谱关系图

`scripts/build-genealogy.mjs` 使用人工定义的节点、别名、支系、世次和关系。`edge("parent", 父母, 子女, source)` 的方向是 `from` 父母到 `to` 子女；`spouse` 是双向配偶。每个关系来源必须匹配当前文档中的引文，脚本会验证来源存在。

新增节点先确认是否与已有别名/同名节点相同；不同支系的同名者不能合并。缺失性别保留空值，界面会显示“父母之一/子女”等中性称呼。多配偶情况下，只有原文明确对应的生母才连接母子边。族谱测试还防止不同家支混连、无来源边、重复边和把未知父母误设性别。

当前关系图有210个人物节点、221条关系边，来源涉及15份文档，已按103段引文人工复核。268条人物简介与210人关系图是两套不同数据；关系图并未覆盖全书每个人。查询不在关系图中的名字时，界面会提供已有人物简介和全文搜索入口，但不会把人物简介误当作家谱关系。复核只表示当前关系忠于已有电子文字和用户确认更正，不代表纸书全部史实已独立核实，也不代表本项目拥有完整全村族谱。审核边界见 [`genealogy-review.md`](genealogy-review.md)。

原文以“刘益承字我任”记载的 `刘益承`，搜索别名同时收录“益承”和“我任”。检索会把已核实的别名与人物姓氏组合，因此输入“我任”或“刘我任”都能定位到刘益承；页面仍显示原文姓名，不把字改成姓名。

### 辈序照片和双世次

以用户提供的牌匾照片为准。66字从“日”到“名”：刘氏总世次143—208；原文把“日”对应到桃坑19世，故同一套换算为桃坑19—84世（总世次减124）。不要把“名”称为桃坑第208世。牌匾字形的“竞、昭、奕”等疑难字已有逐字核对记录；除非有新图像证据和用户确认，不要改动。详细转录与逐世次表见 [`generation-verification.md`](generation-verification.md)。

## 6. 图片和村史内容注意事项

- 图像元数据由 `photos.json` 描述；图像文件需同时存在于相应 `public/media/...` 路径。
- 已知照片年代未知时填“拍摄年代未注明”，不要依据画面风格猜测年代。
- 只能从照片可见内容写图注；地点如果未经用户或可靠来源确认，标成待核。
- 首页现场图和图库原书扫描图不是同一条资料。首页照片当前地点名为弯堤脚；原书图库中的“洗马桥全景”标题按其原书图注保留，不能为统一名称而覆盖扫描页来源。
- 原书扫描/OCR仍有未校核错字和缺页可能。编辑后期《勘误与审校报告》时应继续标明它是编辑附记。
- 页面已提供原书资料的读取和搜索，新增原文时保留原始上下文、层级、页码/文档链接和不确定性。

## 7. 离线缓存与 GitHub Pages

`vite.config.ts` 的 `base` 是 `/xiajincunshi-v3/`。正式地址使用 GitHub Pages 项目子路径。HTML、JS/CSS、JSON 与媒体链接都通过 `import.meta.env.BASE_URL` 构造；不要在组件里写根路径 `/media/...`，否则子路径部署会破图。

生产构建后 `scripts/build-sw.mjs` 为网页壳、全部 JSON 和全部媒体内容计算版本哈希，输出 `dist/sw.js`。安装时预缓存网页壳、资源清单和 JSON；照片/媒体在访问时缓存。新版本激活会移除旧 `xiajin-v3-*` 缓存。若照片替换了同名文件，重新构建会因媒体哈希变化生成新缓存版本。

`.github/workflows/pages.yml` 只应为 `shanelau068-a11y/xiajincunshi-v3` 正式仓库运行 Pages build/deploy。私人备份的 push 不部署。工作流顺序：检出、Node 22、`npm ci`、`check:data`、测试、生产构建、上传 Pages artifact、deploy。

改仓库名或部署路径时必须同改 `vite.config.ts` 中的 `base` 和本 README/manifest 中的正式链接，并实际检查根页、章节 hash 直达、刷新、图像、PWA scope 和离线缓存。

## 8. Git 分支和双仓库同步

在当前工作副本内，远端名称如下：

| 远端名 | 用途 |
| --- | --- |
| `origin` | 公开正式网站仓库 `xiajincunshi-v3`，`main` 上的 push 会发布网站 |
| `private` | 私人备份 `xiajincunshi-v3-private`，只作代码/资料副本，不部署 |

每次改动先看 `git status -sb` 和 `git remote -v`。发布前更新并核对远端：

```powershell
git fetch origin
git status -sb
git log --oneline --decorate --graph -10
npm run check:data
npm test
npm run build
git diff --check
git status --short
```

只暂存审查过的文件，用清晰的提交说明；禁止 `git push --force`。然后同步同一提交到两处：

```powershell
git push origin main
git push private main
git ls-remote origin refs/heads/main
git ls-remote private refs/heads/main
```

两次 push 不是一个原子事务。若第一条成功而第二条失败，正式站点已更新、私人备份落后；记录 SHA 并稍后重试第二条。两处 `main` SHA 相同才算完全同步。公共仓库 Actions 成功、网页打开正确，才算部署完成；private push 成功只表示备份已接收。

从私人仓库新克隆后，可以保留 clone 默认的 `origin` 为私人仓库，并添加公开站点为另一个远端：

```powershell
git clone https://github.com/shanelau068-a11y/xiajincunshi-v3-private.git
cd xiajincunshi-v3-private
git remote add site https://github.com/shanelau068-a11y/xiajincunshi-v3.git
```

在这种克隆中，`git push origin main` 更新私人备份，`git push site main` 更新正式网站。先确认 `git remote -v` 再 push，以免推错地方。

## 9. 测试和故障定位

- `npm run check:data`：资料数量、文档 ID、目录覆盖、文档内部 hash 链接、照片文件、出处链接和 editorial 边界。
- `npm test`：姓名/字序更正规则、原文基线、族谱来源与关系语义断言、时间段逻辑。
- `npm run build`：TypeScript 严格检查、Vite 生产包及 SW 生成。
- 手机布局改动：至少实际查看 320–414px 手机宽度与短屏；桌面检查无横向溢出。模拟尺寸不等于实体设备安装验收。
- Pages 部署：在 GitHub Actions 看对应 commit 的 build/deploy，随后打开正式 URL 验证。不要仅凭本地构建或 push 成功声称网站更新完成。
- 图片不更新：检查 `photos.json` 路径、仓库是否含该图片、Pages build SHA 和 Service Worker 新版本；已有浏览器可在 SW 控制后需要刷新以加载新资源。
- 章节链接失效：检查 `documents.json` 中稳定 ID 与 `catalog.json` 的 `documentId`，避免在浏览器里直接使用旧文件名路由。
- `import:legacy` 后资料减少：先不要提交。检查输入旧项目路径、对应扫描文件是否存在、脚本输出，再从前一提交恢复数据并修正导入源。

## 10. 版权和维护范围

仓库含村史电子文字、原书影像和用户提供的补充照片。这些内容的权利归原作者、编纂单位和相应权利人。没有得到权利人的授权之前不要添加 MIT、CC 等许可证，也不要把私人源代码备份宣传成已授权公开再利用的资料库。

不应把历史人物资料用于没有来源的现实身份判断。公开族谱只显示当前资料明确支持的内容；对于缺失关系，说明“资料未载”而非断言“没有亲属”。
