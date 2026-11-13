import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyDocumentCorrections,
  correctionRecords,
  generationData,
  supplementalPhotos,
} from "./content-corrections.mjs";

// Rebuild the public reading data from the user's original, locally preserved book.
// No imports are executed from the old application and no source file is changed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(process.argv[2] || "E:/Shane/下津村史网页版260709");
const bookRoot = path.join(source, "public/book");
const dataRoot = path.join(root, "public/data");
const mediaRoot = path.join(root, "public/media");
fs.mkdirSync(dataRoot, { recursive: true });
fs.mkdirSync(path.join(mediaRoot, "photos"), { recursive: true });

function readArray(file, name) {
  const input = fs.readFileSync(
    path.join(source, "src/data", file + ".ts"),
    "utf8",
  );
  const marker = input.indexOf("export const " + name);
  const start = input.indexOf("[", input.indexOf("=", marker));
  if (marker < 0 || start < 0) throw new Error("Missing data array: " + name);
  let depth = 0,
    quoted = false,
    escaped = false;
  for (let i = start; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "[") depth++;
    else if (char === "]" && --depth === 0)
      return JSON.parse(input.slice(start, i + 1));
  }
  throw new Error("Unterminated data array: " + name);
}

const namedEntities = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ensp: " ",
  emsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
  copy: "©",
};
function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, key) => {
    if (key[0] !== "#") return namedEntities[key.toLowerCase()] ?? all;
    const code =
      key[1].toLowerCase() === "x"
        ? parseInt(key.slice(2), 16)
        : parseInt(key.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}
function plain(html) {
  return decode(
    html
      .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
      .replace(
        /<br\s*\/?\s*>|<\/(?:p|li|h[1-6]|tr|div|section|blockquote)>/gi,
        "\n",
      )
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
function cleanName(value) {
  return value
    .replace(/\s+[a-f0-9]{20,}(?=\.html?$|$)/i, "")
    .replace(/\.html?$/i, "")
    .trim();
}
function chineseNumber(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    零: 0,
    〇: 0,
    两: 2,
  };
  if (value.includes("十")) {
    const [a, b] = value.split("十");
    return (a ? digits[a] : 1) * 10 + (b ? digits[b] : 0);
  }
  return digits[value] ?? 999;
}
function rank(segment) {
  if (segment.startsWith("前言")) return 0;
  const match = segment.match(/^第([一二三四五六七八九十零〇两\d]+)[篇章节]/);
  return match ? chineseNumber(match[1]) : 999;
}
function compareFiles(a, b) {
  const aParts = a.split("/"),
    bParts = b.split("/");
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    if (!aParts[i]) return -1;
    if (!bParts[i]) return 1;
    const aName = cleanName(aParts[i]),
      bName = cleanName(bParts[i]);
    const difference =
      rank(aName) - rank(bName) ||
      aName.localeCompare(bName, "zh-Hans-CN", { numeric: true });
    if (difference) return difference;
  }
  return a.localeCompare(b, "zh-Hans-CN");
}

const chapters = readArray("book", "bookChapters");
const relativeFiles = walk(bookRoot)
  .filter((file) => /\.html?$/i.test(file))
  .map((file) => path.relative(bookRoot, file).replaceAll("\\", "/"))
  .sort(compareFiles);
const fileMap = new Map(
  relativeFiles.map((file, index) => [
    file,
    { id: `d-${String(index + 1).padStart(3, "0")}`, file, order: index },
  ]),
);
const parentByName = new Map(
  relativeFiles.map((file) => [
    path.posix.join(
      path.posix.dirname(file),
      cleanName(path.posix.basename(file)),
    ),
    file,
  ]),
);
const missingLinks = new Set();
let bookImages = 0;

function resolveLocal(value, from) {
  let decoded = decode(value).split("#")[0].split("?")[0];
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* Keep an already-decoded path. */
  }
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(from), decoded),
  );
}
function internalLink(value, from) {
  const href = decode(value).trim();
  if (href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^(?:mailto:|tel:)/i.test(href)) return href;
  const target = fileMap.get(resolveLocal(href, from));
  if (target) return "#/read/" + target.id;
  if (href) missingLinks.add(from + " -> " + href);
  return null;
}
function imageSource(value, from) {
  const relative = resolveLocal(value, from);
  const absolute = path.resolve(bookRoot, relative);
  if (
    !absolute.startsWith(path.resolve(bookRoot) + path.sep) ||
    !fs.existsSync(absolute)
  )
    return null;
  const output = path.join(mediaRoot, "book", relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(absolute, output);
  bookImages++;
  return "media/book/" + relative;
}

const allowedTags = new Set(
  "p h1 h2 h3 h4 h5 h6 a strong b em i u s del mark small sub sup br hr div span section article ul ol li blockquote pre code table caption colgroup col thead tbody tfoot tr th td figure figcaption img details summary".split(
    " ",
  ),
);
const voidTags = new Set(["br", "hr", "img", "col"]);
function sanitize(html, file) {
  let body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? html;
  body = body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|noscript|iframe|object|embed|svg|math|template|form|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    );
  return body
    .replace(
      /<\/?([a-z][a-z0-9:-]*)\b([^>]*)>/gi,
      (all, rawTag, attributeText) => {
        const tag = rawTag.toLowerCase();
        if (!allowedTags.has(tag)) return "";
        if (all.startsWith("</")) return voidTags.has(tag) ? "" : `</${tag}>`;
        const attrs = {};
        for (const item of attributeText.matchAll(
          /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
        ))
          attrs[item[1].toLowerCase()] = item[2] ?? item[3] ?? item[4] ?? "";
        const output = [];
        for (const key of [
          "id",
          "title",
          "colspan",
          "rowspan",
          "scope",
          "start",
        ])
          if (attrs[key] !== undefined)
            output.push(`${key}="${escapeAttr(decode(attrs[key]))}"`);
        if (tag === "a") {
          const href = internalLink(attrs.href ?? "", file);
          if (href) output.push(`href="${escapeAttr(href)}"`);
          if (href && /^https?:/i.test(href))
            output.push('target="_blank" rel="noopener noreferrer"');
        }
        if (tag === "img") {
          const src = imageSource(attrs.src ?? "", file);
          if (!src) return "";
          output.push(
            `src="./${escapeAttr(src)}" data-site-src="${escapeAttr(src)}" alt="${escapeAttr(decode(attrs.alt || "原书图片"))}" loading="lazy"`,
          );
        }
        return `<${tag}${output.length ? " " + output.join(" ") : ""}>`;
      },
    )
    .replace(/<p\b[^>]*>\s*<\/p>/g, "")
    .trim();
}

const documents = relativeFiles
  .map((file) => {
    const item = fileMap.get(file),
      raw = fs.readFileSync(path.join(bookRoot, file), "utf8");
    const heading =
      raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
      raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ??
      cleanName(path.posix.basename(file));
    const topName = cleanName(file.split("/")[0]);
    const chapter =
      chapters.find(
        (entry) => entry.file === file || cleanName(entry.file) === topName,
      ) ?? chapters.find((entry) => file.startsWith(entry.part + " "));
    const parentDirectory = path.posix.dirname(file);
    const parentFile =
      parentDirectory === "." ? null : parentByName.get(parentDirectory);
    const html = sanitize(raw, file);
    const kind = /勘误与审校报告/.test(file) ? "editorial" : "book";
    return {
      ...item,
      kind,
      title: plain(heading),
      partId: chapter?.id ?? "chronicle",
      partTitle: chapter
        ? chapter.part +
          (chapter.part === chapter.title ? "" : " " + chapter.title)
        : "第十篇 大事记",
      parentId: parentFile ? fileMap.get(parentFile).id : null,
      html,
      text: plain(html),
    };
  })
  .map(applyDocumentCorrections);
const byId = new Map(documents.map((doc) => [doc.id, doc]));
function childrenOf(id, ancestry = new Set()) {
  if (ancestry.has(id)) throw new Error("Circular catalog hierarchy");
  const ancestors = new Set([...ancestry, id]);
  return documents
    .filter((doc) => doc.parentId === id)
    .map((doc) => ({
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      documentId: doc.id,
      children: childrenOf(doc.id, ancestors),
    }));
}
const catalog = chapters.map((chapter) => {
  const documentId = fileMap.get(chapter.file)?.id;
  if (!documentId) throw new Error("Missing root chapter: " + chapter.file);
  return {
    id: chapter.id,
    kind: byId.get(documentId).kind,
    part: chapter.part,
    title: chapter.title,
    description: chapter.description,
    documentId,
    children: childrenOf(documentId),
  };
});

const photos = readArray("gallery", "galleryPhotos")
  .filter((photo) =>
    fs.existsSync(path.join(source, "public", photo.image.replace(/^\//, ""))),
  )
  .map((photo) => {
    const file = path.basename(photo.image);
    const scanPage = Number(file.match(/下津村史_\((\d+)\)_photo_/u)?.[1]);
    const reviewed = {};
    if ([188, 189, 190].includes(scanPage)) {
      reviewed.category = "墓园碑刻";
      reviewed.reviewNote = `经目视核对扫描页${scanPage}的照片，内容为墓园或碑刻，修正原按页码自动归为“教育影像”的分类。`;
    } else if (scanPage === 193) {
      reviewed.category = "文体活动";
      reviewed.reviewNote =
        "经目视核对扫描页193的照片，内容为文体活动，修正原按页码自动归为“教育影像”的分类。";
    } else if (scanPage === 2) {
      reviewed.category = "村域示意";
      reviewed.reviewNote =
        "经目视核对，扫描页2为“下津村在桥东街道的位置示意图”，将原“村貌风物”细分为“村域示意”。";
    }
    if (/^下津村史_\(52\)_photo_01\.jpg$/u.test(file)) {
      reviewed.title = "洗马桥全景";
      reviewed.reviewNote =
        "经目视核对扫描照片下方文字为“洗马桥全景”，以原书图注替换自动生成的扫描页标题。";
    }
    if (reviewed.reviewNote) {
      reviewed.originalCategory = photo.category;
      reviewed.originalTitle = photo.title;
    }
    fs.copyFileSync(
      path.join(source, "public", photo.image.replace(/^\//, "")),
      path.join(mediaRoot, "photos", file),
    );
    return {
      id: photo.id,
      title: photo.title,
      category: photo.category,
      image: "media/photos/" + file,
      sourcePage: photo.sourcePage ?? "",
      description: photo.description,
      year: photo.year,
      ...reviewed,
    };
  });
photos.push(...supplementalPhotos);
const people = readArray("people", "people").map((person) => {
  const match = person.biography.match(/\n\n来源：([^（]+)（([^）]+)）\s*$/);
  const sourceFile = match?.[2];
  return {
    ...person,
    yearsLabel: "原书记载年代",
    sourceTitle: match?.[1]?.trim() ?? "",
    sourceFile: sourceFile ?? "",
    documentId: sourceFile ? (fileMap.get(sourceFile)?.id ?? null) : null,
  };
});
const timeline = readArray("timeline", "timelineEvents").map((event) => ({
  ...event,
  documentId: fileMap.get(
    chapters.find((chapter) => chapter.id === "chronicle").file,
  ).id,
}));
const manifest = {
  generatedAt: new Date().toISOString(),
  source: "《下津村史》本地电子版，原书二〇二〇年六月出版",
  chapters: catalog.length,
  documents: documents.length,
  bookDocuments: documents.filter((doc) => doc.kind === "book").length,
  editorialDocuments: documents.filter((doc) => doc.kind === "editorial")
    .length,
  photos: photos.length,
  people: people.length,
  timeline: timeline.length,
  characters: documents.reduce((total, doc) => total + doc.text.length, 0),
  bookImages,
  corrections: correctionRecords.length,
  missingLinks: [...missingLinks],
  reviewNote:
    "保留原书与原有人工整理内容；扫描识别文字、照片说明、人物年代及史实仍需与原书核对。未迁入示例地图坐标及推测世系。勘误与审校报告为后期编辑附记，不属于原书内容，其判断仍需核验。",
};
for (const [name, value] of Object.entries({
  documents,
  catalog,
  photos,
  people,
  timeline,
  manifest,
  corrections: correctionRecords,
  generation: generationData,
}))
  fs.writeFileSync(
    path.join(dataRoot, name + ".json"),
    JSON.stringify(value, null, 2) + "\n",
    "utf8",
  );

const catalogIds = new Set();
function collect(nodes) {
  for (const node of nodes) {
    catalogIds.add(node.documentId);
    collect(node.children);
  }
}
collect(catalog);
const orphans = documents.filter((doc) => !catalogIds.has(doc.id));
if (orphans.length)
  throw new Error(
    "Documents absent from catalog: " +
      orphans.map((doc) => doc.file).join(", "),
  );
for (const doc of documents) {
  if (doc.parentId && !byId.has(doc.parentId))
    throw new Error("Invalid parent: " + doc.file);
  if (/<(?:script|style|iframe)\b|\son\w+\s*=|javascript\s*:/i.test(doc.html))
    throw new Error("Unsafe output: " + doc.file);
}
console.log(
  JSON.stringify(
    {
      chapters: manifest.chapters,
      documents: manifest.documents,
      photos: manifest.photos,
      people: manifest.people,
      timeline: manifest.timeline,
      characters: manifest.characters,
      bookImages,
      unresolvedLinks: missingLinks.size,
    },
    null,
    2,
  ),
);
