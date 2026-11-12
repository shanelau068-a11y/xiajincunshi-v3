# 下津村史 · 掌上的故乡

《下津村史》的手机阅读网站。原书由潮州市湘桥区下津村委会编，2020年6月出版。

**手机访问：** https://shanelau068-a11y.github.io/xiajincunshi-v3/

新版重新设计阅读和导航，保留原项目及旧网址，独立发布到 `xiajincunshi-v3`。

## 使用

- **读村史**：前言与十篇目录，可展开章、节，或按标题查找。
- **搜索**：检索正文、人物和大事记；跳回原文并定位高亮词。
- **寻旧影**：75张原村史扫描照片，按类别浏览和放大。
- **看春秋 / 访乡贤**：按类别、年代或关键词查看，均可返回原文出处。
- **阅读器**：字号、夜间阅读、书签、继续阅读和链接分享。记录保存在当前浏览器，不跨设备同步。
- **添加到手机桌面**：Safari 的分享菜单或安卓浏览器的安装/添加到主屏幕功能。首次联网完整加载后，正文可离线阅读；照片按浏览记录缓存。

## 运行与发布

```powershell
npm ci
npm run dev
```

打开终端给出的 `http://127.0.0.1:5173/xiajincunshi-v3/`。

```powershell
npm run check:data
npm run build
npm run preview
```

GitHub Pages 使用 `.github/workflows/pages.yml` 自动构建与发布。`vite.config.ts` 中的 base、仓库名及 Pages 路径须对应；Hash 路由支持直接打开章节和刷新，不依赖服务端重写。

## 资料与维护

- `public/data/documents.json`：109份原有村史文档、1份后期校对附记，原有ID稳定。
- `public/data/catalog.json`：前言与十篇，保留篇—章—节结构。
- `public/data/photos.json` 与 `public/media/photos/`：75张真实存在的扫描照片及原始出处。
- `public/data/people.json`：268条人物记载，保留原文出处；记载年代不直接解释为生卒年。
- `public/data/timeline.json`：110则记事，按原书顺序呈现。
- `public/data/manifest.json`：导入数量和资料边界。
- `scripts/import-legacy.mjs`：从原本地项目重新导入数据，不修改原项目。运行前保留手动校订副本，重新导入会重写新站资料文件。

所有资料直接随源码保存在仓库，重新克隆后即可构建，不再依赖被忽略的本机资料库。导入脚本仅在明确更新原资料时运行，日常构建不会重新抽取或覆盖内容。

```powershell
node scripts/import-legacy.mjs "E:\Shane\下津村史网页版260709"
npm run check:data
npm run build
```

原项目中的示例地图点位和未核实的自动族谱树不用于新版；相关姓氏、创乡和谱牒文字仍保留在原文。扫描错字、照片说明、缺漏和史实须对照原书继续校订。后期《勘误与审校报告》明确标为“校对附记”，其判断不代表已核实结论。

无需付费API、登录或后台服务。离线缓存版本含全部资料及照片的内容哈希，替换同名照片后重新构建也会更新缓存。

原书文字及照片的相关权利归原作者、编纂单位与相应权利人；本仓库未将书籍资料另行声明为开源授权。
