import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  List,
  Minus,
  Moon,
  Plus,
  Share2,
  Sun,
  X,
  ZoomIn,
} from "lucide-react";
import "./reader.css";

export type ArchiveDocument = {
  id: string;
  title: string;
  partId: string;
  partTitle: string;
  parentId: string | null;
  file: string;
  html: string;
  text: string;
  order: number;
  kind: "book" | "editorial";
};

type ReaderProps = {
  documents: ArchiveDocument[];
  id: string;
  onNavigate: (id: string) => void;
  onProgress?: (id: string, progress: number) => void;
  query?: string;
};

type ReadingPosition = {
  id: string;
  progress: number;
  scroll: number;
  title: string;
};
const readStored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const store = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Reading still works in private mode. */
  }
};

function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{title}</>;
  const source = title.toLocaleLowerCase();
  const needle = term.toLocaleLowerCase();
  const pieces: (string | JSX.Element)[] = [];
  let cursor = 0;
  let found = source.indexOf(needle);
  while (found >= 0) {
    pieces.push(title.slice(cursor, found));
    pieces.push(
      <mark key={found}>{title.slice(found, found + term.length)}</mark>,
    );
    cursor = found + term.length;
    found = source.indexOf(needle, cursor);
  }
  pieces.push(title.slice(cursor));
  return <>{pieces}</>;
}

function prepareHtml(document: ArchiveDocument, query: string) {
  const parsed = new DOMParser().parseFromString(document.html, "text/html");
  parsed
    .querySelectorAll("script, style, iframe, object, embed, form")
    .forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name) || attribute.name === "srcdoc")
        node.removeAttribute(attribute.name);
    });
  });
  parsed.querySelectorAll("img").forEach((img) => {
    const path =
      img.getAttribute("data-site-src") || img.getAttribute("src") || "";
    if (/^(?:\.\/)?media\//.test(path))
      img.src = `${import.meta.env.BASE_URL}${path.replace(/^\.\//, "")}`;
    img.loading = "lazy";
    if (!img.alt) img.alt = "村史原文插图，点击查看大图";
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `${img.alt}，点击查看大图`);
  });
  parsed.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    if (/^\s*(?:javascript|vbscript|data):/i.test(href))
      anchor.removeAttribute("href");
    if (/^https?:/i.test(href)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  });
  const firstTitle = parsed.querySelector("h1");
  if (
    firstTitle?.textContent?.replace(/\s/g, "") ===
    document.title.replace(/\s/g, "")
  )
    firstTitle.remove();
  const term = query.trim();
  if (term) {
    const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const text = node.textContent || "";
      let cursor = 0;
      let found = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
      if (found < 0) continue;
      const fragment = parsed.createDocumentFragment();
      while (found >= 0) {
        fragment.append(text.slice(cursor, found));
        const mark = parsed.createElement("mark");
        mark.textContent = text.slice(found, found + term.length);
        fragment.append(mark);
        cursor = found + term.length;
        found = text
          .toLocaleLowerCase()
          .indexOf(term.toLocaleLowerCase(), cursor);
      }
      fragment.append(text.slice(cursor));
      node.replaceWith(fragment);
    }
  }
  return parsed.body.innerHTML;
}

export default function Reader({
  documents,
  id,
  onNavigate,
  onProgress,
  query = "",
}: ReaderProps) {
  const current = documents.find((document) => document.id === id);
  const editorial = current?.kind === "editorial";
  const currentPartId = editorial ? "editorial" : current?.partId;
  const currentPartTitle = editorial ? "校对附记" : current?.partTitle;
  const [fontSize, setFontSize] = useState(() =>
    Math.max(16, Math.min(28, readStored("xiajin-font-size", 20))),
  );
  const [night, setNight] = useState(() =>
    readStored("xiajin-reader-night", false),
  );
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = readStored<unknown>("xiajin-bookmarks", []);
    return Array.isArray(saved)
      ? saved.filter((item) => typeof item === "string")
      : [];
  });
  const [contentsOpen, setContentsOpen] = useState(false);
  const [expandedPart, setExpandedPart] = useState(currentPartId || "");
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  const [shareState, setShareState] = useState("");
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(onProgress);
  const articleRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const imageDialogRef = useRef<HTMLDivElement>(null);
  progressRef.current = onProgress;

  const parts = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        editorial: boolean;
        documents: ArchiveDocument[];
      }
    >();
    for (const document of documents) {
      const groupId =
        document.kind === "editorial" ? "editorial" : document.partId;
      if (!groups.has(groupId))
        groups.set(groupId, {
          id: groupId,
          title:
            document.kind === "editorial" ? "校对附记" : document.partTitle,
          editorial: document.kind === "editorial",
          documents: [],
        });
      groups.get(groupId)!.documents.push(document);
    }
    return [...groups.values()];
  }, [documents]);
  const html = useMemo(
    () => (current ? prepareHtml(current, query) : ""),
    [current, query],
  );
  const index = documents.findIndex((document) => document.id === id);
  const previous = documents[index - 1];
  const next = documents[index + 1];

  useEffect(() => {
    store("xiajin-font-size", fontSize);
  }, [fontSize]);
  useEffect(() => {
    store("xiajin-reader-night", night);
  }, [night]);
  useEffect(() => {
    if (current) setExpandedPart(currentPartId || "");
    setContentsOpen(false);
    setShareState("");
  }, [current?.id]);

  useLayoutEffect(() => {
    if (!current) return;
    let timer = 0;
    let ready = false;
    const saved = readStored<ReadingPosition | null>("xiajin-reading", null);
    const article = articleRef.current;
    let position: ReadingPosition =
      saved?.id === current.id
        ? saved
        : { id: current.id, title: current.title, scroll: 0, progress: 0 };
    const capture = () => {
      if (!ready || !article) return;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const length = Math.max(
        1,
        article.offsetHeight - window.innerHeight + 120,
      );
      const percentage = Math.min(
        100,
        Math.max(0, Math.round(((window.scrollY - top + 120) / length) * 100)),
      );
      position = {
        id: current.id,
        title: current.title,
        scroll: window.scrollY,
        progress: percentage,
      };
    };
    const persist = () => {
      if (!ready) return;
      setProgress(position.progress);
      store("xiajin-reading", position);
      progressRef.current?.(current.id, position.progress);
    };
    const schedule = () => {
      capture();
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        persist();
      }, 350);
    };
    const pagehide = () => {
      capture();
      persist();
    };
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const frame = requestAnimationFrame(() => {
      if (query.trim()) {
        const mark = article?.querySelector("mark");
        if (mark)
          mark.scrollIntoView({
            block: "center",
            behavior: "instant" as ScrollBehavior,
          });
        else window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      } else {
        const target =
          saved?.id === current.id && Number.isFinite(saved.scroll)
            ? Math.max(0, saved.scroll)
            : 0;
        window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      }
      ready = true;
      capture();
      persist();
    });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pagehide", pagehide);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      // The DOM may already show the next chapter here. Save the last sampled
      // position instead of measuring a new chapter against the previous ID.
      if (ready) store("xiajin-reading", position);
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [current?.id, query]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = image
      ? imageDialogRef.current
      : contentsOpen
        ? sheetRef.current
        : null;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContentsOpen(false);
        setImage(null);
      }
      if (event.key === "Tab" && dialog) {
        const focusable = [
          ...dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]',
          ),
        ];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", escape);
    const previousOverflow = document.body.style.overflow;
    if (image || contentsOpen) document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      dialog?.querySelector<HTMLElement>("button")?.focus(),
    );
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = previousOverflow;
      if (dialog && previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [image, contentsOpen]);

  const toggleBookmark = () => {
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((item) => item !== id)
      : [...bookmarks, id];
    setBookmarks(updated);
    store("xiajin-bookmarks", updated);
    window.dispatchEvent(new Event("xiajin-bookmarks-change"));
  };
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `${current?.title} · 下津村史`,
          url: location.href,
        });
      else {
        await navigator.clipboard.writeText(location.href);
        setShareState("链接已复制");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareState("可复制浏览器地址分享");
    }
  };
  const navigate = (documentId: string) => {
    setContentsOpen(false);
    if (documentId === id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onNavigate(documentId);
  };

  if (!current)
    return (
      <div className="reader-missing">
        <BookMissing /> <h1>没有找到这一篇</h1>
        <p>可以从目录重新选择要读的内容。</p>
        <button onClick={() => documents[0] && onNavigate(documents[0].id)}>
          从前言开始
        </button>
      </div>
    );

  const contents = (
    <>
      <div className="reader-contents-heading">
        <div>
          <span className="reader-eyebrow">CONTENTS</span>
          <h2>全书目录</h2>
        </div>
        <button
          className="reader-sheet-close reader-icon-button"
          aria-label="关闭目录"
          onClick={() => setContentsOpen(false)}
        >
          <X size={21} />
        </button>
      </div>
      <p className="reader-contents-intro">一方水土，一部乡土记忆。</p>
      <nav aria-label="村史章节">
        {parts.map((part, partIndex) => (
          <div className="reader-part" key={part.id}>
            <button
              className={`reader-part-toggle ${currentPartId === part.id ? "reader-part-active" : ""}`}
              onClick={() =>
                setExpandedPart(expandedPart === part.id ? "" : part.id)
              }
              aria-expanded={expandedPart === part.id}
            >
              <span className="reader-part-number">
                {part.editorial
                  ? "附"
                  : partIndex === 0
                    ? "序"
                    : String(partIndex).padStart(2, "0")}
              </span>
              <span>{part.title}</span>
              <ChevronDown
                size={15}
                className={
                  expandedPart === part.id ? "reader-chevron-open" : ""
                }
              />
            </button>
            {expandedPart === part.id && (
              <div className="reader-part-documents">
                {part.documents.map((document) => (
                  <button
                    key={document.id}
                    className={`${document.id === id ? "reader-document-active" : ""} ${document.parentId ? "reader-child-document" : ""}`}
                    onClick={() => navigate(document.id)}
                    aria-current={document.id === id ? "page" : undefined}
                  >
                    {document.title}
                    {bookmarks.includes(document.id) && (
                      <Bookmark size={12} fill="currentColor" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <a className="reader-back-catalog" href="#/catalog">
        查看完整目录 <ArrowRight size={15} />
      </a>
    </>
  );

  return (
    <div className={`reader-layout ${night ? "reader-night" : ""}`}>
      <aside className="reader-sidebar">{contents}</aside>
      {contentsOpen && (
        <div
          className="reader-sheet-backdrop"
          onClick={() => setContentsOpen(false)}
        >
          <aside
            ref={sheetRef}
            className="reader-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="全书目录"
            onClick={(event) => event.stopPropagation()}
          >
            {contents}
          </aside>
        </div>
      )}
      <div className="reader-main">
        <div className="reader-breadcrumb">
          <a href="#/catalog">村史阅读</a>
          <ChevronRight size={13} />
          <span>{currentPartTitle}</span>
        </div>
        <div className="reader-toolbar" role="group" aria-label="阅读设置">
          <button
            className="reader-mobile-contents"
            onClick={() => setContentsOpen(true)}
            aria-label="打开全书目录"
          >
            <List size={18} />
            <span>目录</span>
          </button>
          <div className="reader-font-control">
            <button
              className="reader-icon-button"
              disabled={fontSize <= 16}
              onClick={() => setFontSize((size) => Math.max(16, size - 2))}
              aria-label="减小字号"
            >
              <Minus size={16} />
            </button>
            <span aria-label={`当前字号 ${fontSize}`}>Aa</span>
            <button
              className="reader-icon-button"
              disabled={fontSize >= 28}
              onClick={() => setFontSize((size) => Math.min(28, size + 2))}
              aria-label="增大字号"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="reader-toolbar-divider" />
          <button
            className="reader-icon-button"
            onClick={() => setNight((value) => !value)}
            aria-label={night ? "切换纸色阅读" : "切换夜间阅读"}
            title={night ? "纸色阅读" : "夜间阅读"}
          >
            {night ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className={`reader-icon-button ${bookmarks.includes(id) ? "reader-is-bookmarked" : ""}`}
            onClick={toggleBookmark}
            aria-label={bookmarks.includes(id) ? "取消书签" : "添加书签"}
            aria-pressed={bookmarks.includes(id)}
            title={bookmarks.includes(id) ? "取消书签" : "添加书签"}
          >
            <Bookmark
              size={18}
              fill={bookmarks.includes(id) ? "currentColor" : "none"}
            />
          </button>
          <button
            className="reader-icon-button"
            onClick={share}
            aria-label="分享本篇"
            title="分享本篇"
          >
            {shareState === "链接已复制" ? (
              <Check size={18} />
            ) : (
              <Share2 size={18} />
            )}
          </button>
          <span className="reader-share-state" role="status">
            {shareState}
          </span>
        </div>
        <article className="reader-article" ref={articleRef}>
          <header className="reader-article-heading">
            <p className="reader-eyebrow">{currentPartTitle}</p>
            <h1>
              <HighlightedTitle title={current.title} query={query} />
            </h1>
            <div className="reader-article-meta">
              <span>
                约 {current.text.replace(/\s/g, "").length.toLocaleString()} 字
              </span>
              <span>
                阅读约{" "}
                {Math.max(
                  1,
                  Math.ceil(current.text.replace(/\s/g, "").length / 450),
                )}{" "}
                分钟
              </span>
              <span>
                {editorial ? "后期整理 · 校对附记" : "《下津村史》原文"}
              </span>
            </div>
          </header>
          {editorial && (
            <div className="reader-editorial-note">
              <strong>校对附记</strong>
              <p>
                这是电子资料整理阶段的勘误与审校报告，供核对参考。所列意见与结论仍需结合原书及相关资料校核。
              </p>
            </div>
          )}
          {query.trim() && (
            <div className="reader-search-note">
              正在标记“{query}” <a href={`#/read/${id}`}>清除标记</a>
            </div>
          )}
          <div
            className="reader-prose"
            style={{ fontSize }}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target instanceof HTMLImageElement)
                setImage({ src: target.src, alt: target.alt });
              const anchor = target.closest("a");
              if (anchor) {
                const href = anchor.getAttribute("href") || "";
                const match = href.match(/^#\/read\/([^?#]+)/);
                if (match) {
                  event.preventDefault();
                  navigate(decodeURIComponent(match[1]));
                }
              }
            }}
            onKeyDown={(event) => {
              if (
                event.target instanceof HTMLImageElement &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                setImage({ src: event.target.src, alt: event.target.alt });
              }
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <p className="reader-source-note">
            {editorial
              ? "来源：现有电子资料中的后期审校附记。此页不属于原书正文，校对意见请对照原书核实。"
              : "本文由《下津村史》扫描文字整理。遇到错字、年份或人名疑问，请以原书为准。"}
          </p>
          <div className="reader-end-mark">
            <span />
            本篇完
            <span />
          </div>
          <div className="reader-pagination">
            {previous ? (
              <button onClick={() => navigate(previous.id)}>
                <span>
                  <ArrowLeft size={16} />
                  上一篇
                </span>
                <strong>{previous.title}</strong>
              </button>
            ) : (
              <a href="#/catalog">
                <span>
                  <ArrowLeft size={16} />
                  返回
                </span>
                <strong>全书目录</strong>
              </a>
            )}
            {next ? (
              <button onClick={() => navigate(next.id)}>
                <span>
                  {next.kind === "editorial" ? "阅读校对附记" : "下一篇"}
                  <ArrowRight size={16} />
                </span>
                <strong>{next.title}</strong>
              </button>
            ) : (
              <a href="#/catalog">
                <span>
                  已读至末篇
                  <Check size={16} />
                </span>
                <strong>回到目录</strong>
              </a>
            )}
          </div>
        </article>
        <div
          className="reader-progress-track"
          aria-label={`本篇已读 ${progress}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      {image && (
        <div
          ref={imageDialogRef}
          className="reader-image-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="原文插图预览"
          onClick={() => setImage(null)}
        >
          <button
            className="reader-image-close"
            onClick={() => setImage(null)}
            aria-label="关闭图片"
          >
            <X size={24} />
          </button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={image.src} alt={image.alt} />
            <figcaption>{image.alt}</figcaption>
          </figure>
          <span className="reader-image-hint">
            <ZoomIn size={15} /> 可使用双指放大查看
          </span>
        </div>
      )}
    </div>
  );
}

function BookMissing() {
  return <List size={36} strokeWidth={1.3} />;
}
