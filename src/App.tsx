import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Home,
  Info,
  MapPin,
  Search,
  Share2,
  UsersRound,
  X,
} from "lucide-react";
import Reader, { type ArchiveDocument } from "./Reader";

type CatalogItem = {
  id: string;
  title: string;
  part?: string;
  description?: string;
  documentId: string;
  children: CatalogItem[];
  kind?: string;
};
type Photo = {
  id: string;
  title: string;
  category: string;
  image: string;
  sourcePage?: string;
  description: string;
};
type Person = {
  id: string;
  name: string;
  category: string;
  summary: string;
  biography: string;
  documentId?: string;
};
type Event = {
  id: string;
  year: string;
  title: string;
  category: string;
  summary: string;
  detail: string;
  documentId?: string;
};
type Manifest = {
  documents: number;
  photos: number;
  people: number;
  timeline: number;
  characters: number;
};
type Archive = {
  documents: ArchiveDocument[];
  catalog: CatalogItem[];
  photos: Photo[];
  people: Person[];
  timeline: Event[];
  manifest: Manifest;
};
const base = import.meta.env.BASE_URL;
const asset = (path: string) =>
  `${base}${path.replace(/^\.\//, "").replace(/^\//, "")}`;
const photoPath = (page: number) =>
  asset(`media/photos/下津村史_(${page})_photo_01.jpg`);
const nav = [
  { to: "/", label: "首页", Icon: Home },
  { to: "/catalog", label: "读村史", Icon: BookOpen },
  { to: "/photos", label: "寻旧影", Icon: Camera },
  { to: "/timeline", label: "看春秋", Icon: Clock3 },
  { to: "/people", label: "访乡贤", Icon: UsersRound },
];
function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function useRoute() {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "/",
  );
  useEffect(() => {
    const update = () => {
      setRoute(window.location.hash.slice(1) || "/");
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
function go(path: string) {
  window.location.hash = path;
}
function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
function PageIntro({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">
        XIÀ JĪN ARCHIVE <i>/</i> {index}
      </span>
      <h1>
        {title}
        <span className="red-dot" />
      </h1>
      <p>{description}</p>
    </div>
  );
}
function SearchForm({
  initial = "",
  compact = false,
}: {
  initial?: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  function submit(e: FormEvent) {
    e.preventDefault();
    go(`/search?q=${encodeURIComponent(value.trim())}`);
  }
  return (
    <form
      role="search"
      onSubmit={submit}
      className={`search-form ${compact ? "compact" : ""}`}
    >
      <Search size={19} />
      <input
        aria-label="搜索村史"
        placeholder="搜一个人、一处地名、一段往事…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" aria-label="提交搜索">
        {compact ? <ArrowRight size={19} /> : "搜索村史"}
      </button>
    </form>
  );
}
function Header({ route }: { route: string }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#/" aria-label="下津村史首页">
          <span className="brand-seal">
            下<br />津
          </span>
          <span>
            <b>下津村史</b>
            <small>一村故事 · 一脉乡情</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="主导航">
          {nav.map(({ to, label }) => (
            <a
              key={to}
              href={`#${to}`}
              aria-current={
                (to === "/" ? route === "/" : route.startsWith(to))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a href="#/search" className="icon-button" aria-label="全文搜索">
            <Search size={21} />
          </a>
          <a
            href="#/saved"
            className={`icon-button ${route === "/saved" ? "selected" : ""}`}
            aria-label="我的书签"
          >
            <Bookmark size={20} />
          </a>
          <a
            href="#/about"
            className="icon-button info-link"
            aria-label="关于村史"
          >
            <Info size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <b>下津村史</b>
        <p>把故乡放在心里，也放在掌心。</p>
      </div>
      <div>
        <span>原书：潮州市湘桥区下津村委会 编</span>
        <span>二〇二〇年六月版 · 电子资料整理</span>
        <a href="#/about">
          关于这本书 <ArrowRight size={13} />
        </a>
      </div>
    </footer>
  );
}
function MobileNav({ route }: { route: string }) {
  const tabs = [
    nav[0],
    nav[1],
    { to: "/search", label: "搜索", Icon: Search },
    nav[2],
    { to: "/saved", label: "书签", Icon: Bookmark },
  ];
  return (
    <nav className="mobile-nav" aria-label="手机导航">
      {tabs.map(({ to, label, Icon }) => (
        <a
          key={to}
          href={`#${to}`}
          className={
            (to === "/" ? route === "/" : route.startsWith(to)) ? "active" : ""
          }
        >
          <Icon size={21} strokeWidth={1.7} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
function HomePage({ data }: { data: Archive }) {
  const reading = readLocal<{ id?: string; title?: string; progress?: number }>(
    "xiajin-reading",
    {},
  );
  const readDoc = data.documents.find((d) => d.id === reading.id);
  const recommendations = ["桃坑乡", "乡村建设", "家谱文化", "小学教育"]
    .map((term) => data.documents.find((d) => d.title.includes(term)))
    .filter(Boolean) as ArchiveDocument[];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" /> 广东潮州 · 下津村
          </p>
          <h1>
            一方水土，
            <br />
            一村<span>春秋。</span>
          </h1>
          <p className="hero-description">
            从先祖创乡，到今日人家。
            <br />
            翻开一本村史，重逢我们的故乡。
          </p>
          <a
            href={`#/read/${data.catalog[0].documentId}`}
            className="button-primary"
          >
            翻开村史 <ArrowRight size={18} />
          </a>
          <div className="hero-meta">
            <span>前言与十篇</span>
            <i />
            <span>2020年6月版</span>
          </div>
        </div>
        <figure className="hero-image">
          <img
            src={photoPath(52)}
            alt="原村史中的洗马桥全景，屋舍、山峦与村庄风貌"
            fetchPriority="high"
          />
          <div className="hero-photo-overlay" />
          <span className="photo-seal">
            故<br />乡
          </span>
          <figcaption>
            <span>
              乡土记忆 <i> / </i> 洗马桥全景
            </span>
            <span>影像选自原村史</span>
          </figcaption>
          <span className="vertical-note">山水有相逢 · 故乡有回声</span>
        </figure>
      </section>
      <div className="home-wrapper">
        <div className="intro-strip">
          <span className="intro-label">
            一本书，
            <br />
            <b>记住一个村庄。</b>
          </span>
          <p>
            土地、先祖、村巷、人家。
            <br className="mobile-only" /> 让散落在纸页里的记忆，在这里相聚。
          </p>
          <a href="#/about">
            关于村史 <ArrowRight size={16} />
          </a>
        </div>
        {readDoc && (
          <a className="continue-card" href={`#/read/${readDoc.id}`}>
            <span className="continue-icon">
              <BookOpen size={22} />
            </span>
            <div>
              <span className="eyebrow">上次读到这里</span>
              <b>{readDoc.title}</b>
            </div>
            <span className="continue-percent">
              {Math.round(reading.progress || 0)}%
            </span>
            <span className="continue-label">
              继续阅读 <ArrowRight size={18} />
            </span>
          </a>
        )}
        <section className="explore-section">
          <SectionTitle eyebrow="OPEN THE ARCHIVE" title="循着记忆，走进下津">
            <span className="section-subtitle">每一种打开方式，都通向故乡</span>
          </SectionTitle>
          <div className="explore-grid">
            {[
              {
                to: "/catalog",
                title: "读村史",
                sub: "前言与十篇 · 逐章细读",
                desc: "从一方水土，读到千家故事",
                Icon: BookOpen,
              },
              {
                to: "/photos",
                title: "寻旧影",
                sub: `${data.manifest.photos} 帧影像 · 重温旧时`,
                desc: "屋脊与街巷，是记忆的模样",
                Icon: Camera,
              },
              {
                to: "/timeline",
                title: "看春秋",
                sub: `${data.manifest.timeline} 则大事 · 沿时而行`,
                desc: "循着时间，回望村庄变迁",
                Icon: Clock3,
              },
              {
                to: "/people",
                title: "访乡贤",
                sub: `${data.manifest.people} 条人物记载`,
                desc: "一笔一画，记下故乡的人",
                Icon: UsersRound,
              },
            ].map(({ to, title, sub, desc, Icon }, i) => (
              <a className="explore-card" href={`#${to}`} key={to}>
                <div className="explore-card-top">
                  <span>0{i + 1}</span>
                  <Icon size={27} strokeWidth={1.3} />
                </div>
                <h3>{title}</h3>
                <p>{sub}</p>
                <span className="explore-description">{desc}</span>
                <ArrowRight className="explore-arrow" size={20} />
              </a>
            ))}
          </div>
        </section>
        <section className="home-reading">
          <SectionTitle eyebrow="BETWEEN THE PAGES" title="从这些篇章开始">
            <a className="text-link" href="#/catalog">
              全部目录 <ArrowRight size={16} />
            </a>
          </SectionTitle>
          <div className="reading-picks">
            {recommendations.map((doc, i) => (
              <a href={`#/read/${doc.id}`} key={doc.id}>
                <span className="pick-number">0{i + 1}</span>
                <div>
                  <span className="eyebrow">{doc.partTitle}</span>
                  <h3>
                    {doc.title.replace(
                      /^第[一二三四五六七八九十]+[章节]\s*/,
                      "",
                    )}
                  </h3>
                  <p>{doc.text.replace(/\s+/g, " ").slice(0, 57)}…</p>
                </div>
                <ArrowRight size={19} />
              </a>
            ))}
          </div>
        </section>
        <section className="memory-section">
          <div className="memory-copy">
            <span className="eyebrow">THE PLACES WE REMEMBER</span>
            <h2>
              旧影里，
              <br />
              有我们熟悉的下津。
            </h2>
            <p>
              一座老厝，一条村巷。
              <br />
              那些时光，留在了书里，也留在心里。
            </p>
            <a href="#/photos" className="text-link">
              翻看影像记忆 <ArrowRight size={18} />
            </a>
          </div>
          <a className="memory-photo first" href="#/photos">
            <img loading="lazy" src={photoPath(37)} alt="原村史所录村居影像" />
            <span>
              村居与街巷 <ArrowRight size={14} />
            </span>
          </a>
          <a className="memory-photo second" href="#/photos">
            <img
              loading="lazy"
              src={photoPath(157)}
              alt="原村史所录传统建筑影像"
            />
            <span>
              祠堂与古建 <ArrowRight size={14} />
            </span>
          </a>
        </section>
        <section className="home-search">
          <span className="eyebrow">FIND YOUR CONNECTION</span>
          <h2>记忆里的名字，还记得吗？</h2>
          <p>输入人名、地名或关键词，在村史中找一找。</p>
          <SearchForm />
          <div className="search-suggestions">
            <span>试着搜</span>
            {["刘氏", "下津小学", "祠堂", "洗马桥"].map((q) => (
              <a key={q} href={`#/search?q=${encodeURIComponent(q)}`}>
                {q}
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
function CatalogBranch({
  items,
  depth = 0,
}: {
  items: CatalogItem[];
  depth?: number;
}) {
  return (
    <div className={`catalog-branches depth-${Math.min(depth, 2)}`}>
      {items.map((item) => (
        <div key={item.id}>
          <a href={`#/read/${item.documentId}`}>
            <span>
              {item.kind === "editorial" && (
                <small className="editorial-tag">校对附记</small>
              )}
              {item.title}
            </span>
            <ChevronRight size={16} />
          </a>
          {item.children.length > 0 && (
            <CatalogBranch items={item.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}
function CatalogPage({ data }: { data: Archive }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const matches = data.documents.filter((d) => d.title.includes(query));
  return (
    <div className="page-width">
      <PageIntro
        index="01 / READING"
        title="村史目录"
        description="一篇一章，慢慢读。将下津的前尘往事，读进今天的生活。"
      />
      <div className="catalog-layout">
        <aside className="book-aside">
          <div className="book-cover">
            <span>潮州市湘桥区下津村委会 编</span>
            <b>下津村史</b>
            <small>
              XIÀ JĪN
              <br />
              VILLAGE CHRONICLE
            </small>
            <span className="cover-year">二〇二〇年六月</span>
          </div>
          <p>
            前言 · 十篇村史
            <br />
            {data.documents.length} 份现有篇章资料
          </p>
          <a
            href={`#/read/${data.catalog[0].documentId}`}
            className="button-primary"
          >
            从头读起 <ArrowRight size={16} />
          </a>
        </aside>
        <section className="catalog-main">
          <div className="catalog-tools">
            <p>
              全书目录 <span>CONTENTS</span>
            </p>
            <button
              className="text-link"
              onClick={() =>
                setExpanded(
                  expanded.length ? [] : data.catalog.map((c) => c.id),
                )
              }
            >
              {expanded.length ? "收起目录" : "展开目录"}{" "}
              <ChevronDown size={15} />
            </button>
          </div>
          <label className="filter-search">
            <Search size={18} />
            <input
              aria-label="查找章节标题"
              placeholder="查找章节标题"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                onClick={() => setQuery("")}
                aria-label="清空章节搜索"
              >
                <X size={16} />
              </button>
            )}
          </label>
          {query ? (
            <>
              <p className="result-count">找到 {matches.length} 份篇章</p>
              {matches.map((d) => (
                <a className="chapter-match" key={d.id} href={`#/read/${d.id}`}>
                  <span>{d.partTitle}</span>
                  <b>{d.title}</b>
                  <ArrowRight size={17} />
                </a>
              ))}
              {matches.length === 0 && (
                <Empty
                  title="没有找到这个章节"
                  text="换一个标题关键词，或使用全文搜索。"
                />
              )}
            </>
          ) : (
            data.catalog.map((part, index) => (
              <article
                className={`catalog-part ${expanded.includes(part.id) ? "expanded" : ""}`}
                key={part.id}
              >
                <div className="catalog-part-heading">
                  <span className="part-number">
                    {String(index).padStart(2, "0")}
                  </span>
                  <a href={`#/read/${part.documentId}`}>
                    <span>{part.part}</span>
                    <h2>{part.title}</h2>
                    <p>{part.description}</p>
                  </a>
                  {part.children.length > 0 ? (
                    <button
                      className="icon-button"
                      aria-label={`${expanded.includes(part.id) ? "收起" : "展开"}${part.title}`}
                      aria-expanded={expanded.includes(part.id)}
                      onClick={() =>
                        setExpanded((v) =>
                          v.includes(part.id)
                            ? v.filter((id) => id !== part.id)
                            : [...v, part.id],
                        )
                      }
                    >
                      <ChevronDown size={21} />
                    </button>
                  ) : (
                    <a
                      href={`#/read/${part.documentId}`}
                      className="icon-button"
                      aria-label={`阅读${part.title}`}
                    >
                      <ArrowRight size={20} />
                    </a>
                  )}
                </div>
                {expanded.includes(part.id) && (
                  <CatalogBranch items={part.children} />
                )}
              </article>
            ))
          )}
          <p className="source-note">
            <Info size={15} />{" "}
            依据现有电子资料整理；原文缺漏、扫描识别问题仍以原书为准。
          </p>
        </section>
      </div>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <BookOpen size={36} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Mark({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(
    new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase() ? <mark key={i}>{p}</mark> : p,
      )}
    </>
  );
}
function snippet(text: string, term: string) {
  const source = text.replace(/\s+/g, " ");
  const pos = source.toLowerCase().indexOf(term.toLowerCase());
  const start = Math.max(0, pos - 40);
  return `${start ? "…" : ""}${source.slice(start, start + 150)}${source.length > start + 150 ? "…" : ""}`;
}
function SearchPage({ data, query }: { data: Archive; query: string }) {
  const [filter, setFilter] = useState("全部");
  const [limit, setLimit] = useState(30);
  useEffect(() => {
    setFilter("全部");
    setLimit(30);
  }, [query]);
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.trim().toLowerCase();
    return [
      ...data.documents.map((d) => ({
        id: d.id,
        title: d.title,
        text: d.text,
        kind: d.kind === "editorial" ? "校对附记" : "村史",
        sub: d.kind === "editorial" ? "后期整理，供核对参考" : d.partTitle,
        to: `/read/${d.id}?q=${encodeURIComponent(query)}`,
      })),
      ...data.people.map((p) => ({
        id: p.id,
        title: p.name,
        text: p.biography,
        kind: "人物",
        sub: p.category,
        to: `/people?q=${encodeURIComponent(p.name)}`,
      })),
      ...data.timeline.map((e) => ({
        id: e.id,
        title: e.title,
        text: e.detail,
        kind: "大事记",
        sub: e.year,
        to: `/read/${e.documentId}?q=${encodeURIComponent(query)}`,
      })),
    ]
      .filter((r) => `${r.title} ${r.text}`.toLowerCase().includes(term))
      .sort(
        (a, b) =>
          Number(b.title.includes(query)) - Number(a.title.includes(query)),
      );
  }, [data, query]);
  const shown = results.filter((r) => filter === "全部" || r.kind === filter);
  return (
    <div className="page-width search-page">
      <PageIntro
        index="SEARCH THE ARCHIVE"
        title="在村史里找一找"
        description="人名、乡名、老厝、旧事。你想念的，或许就在字里行间。"
      />
      <SearchForm initial={query} />
      {!query ? (
        <>
          <div className="search-suggestions">
            <span>试着搜</span>
            {["刘氏", "下津小学", "祠堂", "洗马桥", "民俗"].map((q) => (
              <a href={`#/search?q=${encodeURIComponent(q)}`} key={q}>
                {q}
              </a>
            ))}
          </div>
          <Empty
            title="每一个名字，都连着一段记忆"
            text="输入关键词，即可检索现有村史正文、人物记载和大事记。"
          />
        </>
      ) : (
        <>
          <div className="filter-bar">
            {["全部", "村史", "人物", "大事记", "校对附记"].map((t) => (
              <button
                key={t}
                className={filter === t ? "active" : ""}
                onClick={() => {
                  setFilter(t);
                  setLimit(30);
                }}
              >
                {t}{" "}
                <small>
                  {results.filter((r) => t === "全部" || r.kind === t).length}
                </small>
              </button>
            ))}
          </div>
          <p className="result-count">
            关于“{query}”，找到 {shown.length} 条记载
          </p>
          <div className="search-results">
            {shown.slice(0, limit).map((r) => (
              <a
                href={`#${r.to}`}
                key={`${r.kind}-${r.id}`}
                className="search-result"
              >
                <span className="result-meta">
                  {r.kind} <i>/</i> {r.sub}
                </span>
                <h2>
                  <Mark text={r.title} term={query} />
                </h2>
                <p>
                  <Mark text={snippet(r.text, query)} term={query} />
                </p>
                <span className="text-link">
                  {r.kind === "人物" ? "查看人物" : "阅读原文"}{" "}
                  <ArrowRight size={15} />
                </span>
              </a>
            ))}
          </div>
          {shown.length === 0 && (
            <Empty
              title="暂未找到相关记载"
              text="试试更短的人名、地名，或检查是否存在同音字、旧称。"
            />
          )}
          {shown.length > limit && (
            <button
              className="button-outline load-more"
              onClick={() => setLimit((n) => n + 30)}
            >
              再看一些结果 <ArrowDown size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
function FilterBar({
  categories,
  current,
  onChange,
}: {
  categories: string[];
  current: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="filter-bar">
      {["全部", ...categories].map((c) => (
        <button
          key={c}
          className={c === current ? "active" : ""}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal-content button, .modal-content a[href]",
          ),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    document.querySelector<HTMLButtonElement>(".modal-close")?.focus();
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="关闭详情"
        >
          <X size={24} />
        </button>
        {children}
      </section>
    </div>
  );
}
function PhotosPage({ data }: { data: Archive }) {
  const [category, setCategory] = useState("全部");
  const [selected, setSelected] = useState<Photo | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const photos = data.photos.filter(
    (p) => category === "全部" || p.category === category,
  );
  return (
    <div className="page-width">
      <PageIntro
        index="02 / PHOTOGRAPHS"
        title="影像里的故乡"
        description="旧影留住了街巷，也留住了生活。慢慢翻，看见熟悉的地方。"
      />
      <div className="page-summary">
        <span>{data.photos.length} 帧原村史影像</span>
        <p>照片取自村史扫描页，标题、年代及人物说明尚待逐一核对。</p>
      </div>
      <FilterBar
        categories={[...new Set(data.photos.map((p) => p.category))]}
        current={category}
        onChange={setCategory}
      />
      <div className="photo-grid">
        {photos.map((p, i) => (
          <button
            className="photo-card"
            key={p.id}
            onClick={() => setSelected(p)}
          >
            <div>
              <img loading="lazy" src={asset(p.image)} alt={p.title} />
              <span className="photo-open">
                查看大图 <ArrowRight size={16} />
              </span>
            </div>
            <span className="photo-card-category">
              {p.category} <i>{String(i + 1).padStart(2, "0")}</i>
            </span>
            <h2>{p.title}</h2>
            <p>{p.sourcePage || "原村史扫描影像"}</p>
          </button>
        ))}
      </div>
      {selected && (
        <Modal title={selected.title} onClose={close}>
          <img
            className="lightbox-image"
            src={asset(selected.image)}
            alt={selected.title}
          />
          <div className="lightbox-caption">
            <span className="eyebrow">{selected.category}</span>
            <h2>{selected.title}</h2>
            <p>来源：{selected.sourcePage || "《下津村史》扫描页"}</p>
            <p className="muted">{selected.description}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function TimelinePage({ data }: { data: Archive }) {
  const [category, setCategory] = useState("全部");
  const [period, setPeriod] = useState("全部年代");
  const yearNumber = (e: Event) => Number(e.year.match(/\d{3,4}/)?.[0] || 0);
  const events = data.timeline.filter(
    (e) =>
      (category === "全部" || e.category === category) &&
      (period === "全部年代" ||
        (period === "1949年以前"
          ? yearNumber(e) > 0 && yearNumber(e) < 1949
          : yearNumber(e) >= 1949)),
  );
  return (
    <div className="page-width">
      <PageIntro
        index="03 / CHRONICLE"
        title="岁月有迹，村史有记"
        description="沿着村史中的记载，回望下津走过的岁月。"
      />
      <div className="timeline-tools">
        <span>{data.timeline.length} 则原书记事</span>
        <label>
          选择年代{" "}
          <select
            aria-label="选择年代"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {["全部年代", "1949年以前", "1949年及以后"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <FilterBar
        categories={[...new Set(data.timeline.map((e) => e.category))]}
        current={category}
        onChange={setCategory}
      />
      <p className="result-count">
        当前显示 {events.length} 则记载 · 按原书顺序
      </p>
      <div className="timeline-list">
        {events.map((e) => (
          <article className="timeline-item" key={e.id}>
            <div className="timeline-year">
              <span />
              {e.year}
            </div>
            <div className="timeline-entry">
              <span className="eyebrow">{e.category}</span>
              <h2>{e.title}</h2>
              <p>{e.detail}</p>
              <a
                href={`#/read/${e.documentId}?q=${encodeURIComponent(e.title.slice(0, 12))}`}
                className="text-link"
              >
                回到原书 <ArrowRight size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
      {!events.length && (
        <Empty title="这个筛选下没有记载" text="换一个类别或年代再看看。" />
      )}
    </div>
  );
}
function PeoplePage({ data, query = "" }: { data: Archive; query?: string }) {
  const [category, setCategory] = useState("全部");
  const [value, setValue] = useState(query);
  const [selected, setSelected] = useState<Person | null>(null);
  const [limit, setLimit] = useState(36);
  const close = useCallback(() => setSelected(null), []);
  useEffect(() => {
    setValue(query);
    setLimit(36);
  }, [query]);
  const people = data.people.filter(
    (p) =>
      (category === "全部" || p.category === category) &&
      `${p.name}${p.biography}`.includes(value),
  );
  return (
    <div className="page-width">
      <PageIntro
        index="04 / PEOPLE"
        title="故乡的人，书中的名"
        description="村史中的每一段人物记载，都是故乡故事的一部分。"
      />
      <label className="filter-search people-search">
        <Search size={18} />
        <input
          aria-label="搜索人物"
          placeholder="搜索人名或人物事迹"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setLimit(36);
          }}
        />
      </label>
      <FilterBar
        categories={[...new Set(data.people.map((p) => p.category))]}
        current={category}
        onChange={(c) => {
          setCategory(c);
          setLimit(36);
        }}
      />
      <p className="result-count">
        {people.length} 条人物记载 · 事迹与年代按原文呈现
      </p>
      <div className="people-grid">
        {people.slice(0, limit).map((p) => (
          <button
            className="person-card"
            key={p.id}
            onClick={() => setSelected(p)}
          >
            <span className="person-category">{p.category}</span>
            <h2>{p.name}</h2>
            <p>{p.summary}</p>
            <span className="text-link">
              读人物记载 <ArrowRight size={15} />
            </span>
          </button>
        ))}
      </div>
      {!people.length && (
        <Empty
          title="没有找到相关人物"
          text="试试姓名中的一个字，或换一个类别。"
        />
      )}
      {people.length > limit && (
        <button
          className="button-outline load-more"
          onClick={() => setLimit((n) => n + 36)}
        >
          再读一些人物 <ArrowDown size={16} />
        </button>
      )}
      {selected && (
        <Modal title={selected.name} onClose={close}>
          <div className="person-detail">
            <span className="eyebrow">{selected.category} / 人物记载</span>
            <h2>{selected.name}</h2>
            <div>
              {selected.biography.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            {selected.documentId && (
              <a
                className="button-primary"
                href={`#/read/${selected.documentId}?q=${encodeURIComponent(selected.name)}`}
                onClick={close}
              >
                查看原文出处 <ArrowRight size={17} />
              </a>
            )}
            <p className="source-note">
              此处沿用原书文字，文中任官、活动年代不作为生卒年解读。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function SavedPage({ data }: { data: Archive }) {
  const [saved, setSaved] = useState<string[]>(() =>
    readLocal("xiajin-bookmarks", []),
  );
  const documents = saved
    .map((id) => data.documents.find((d) => d.id === id))
    .filter(Boolean) as ArchiveDocument[];
  function remove(id: string) {
    const next = saved.filter((s) => s !== id);
    setSaved(next);
    try {
      localStorage.setItem("xiajin-bookmarks", JSON.stringify(next));
    } catch {}
  }
  return (
    <div className="page-width narrow-page">
      <PageIntro
        index="YOUR READING SHELF"
        title="留一页，慢慢读"
        description="喜欢的篇章，收在这里。书签保存在当前手机或浏览器中。"
      />
      {!documents.length ? (
        <>
          <Empty
            title="还没有收藏的篇章"
            text="阅读时点击“书签”，就能把想再读的篇章留在这里。"
          />
          <a href="#/catalog" className="button-primary centered">
            去读村史 <ArrowRight size={17} />
          </a>
        </>
      ) : (
        <div className="saved-list">
          {documents.map((d) => (
            <article key={d.id}>
              <a href={`#/read/${d.id}`}>
                <Bookmark size={20} />
                <div>
                  <span className="eyebrow">{d.partTitle}</span>
                  <h2>{d.title}</h2>
                </div>
                <ArrowRight size={18} />
              </a>
              <button
                className="icon-button"
                aria-label={`移除${d.title}的书签`}
                onClick={() => remove(d.id)}
              >
                <X size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
function AboutPage({ data }: { data: Archive }) {
  const [copied, setCopied] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.ready.then((reg) =>
        setOffline(Boolean(reg.active)),
      );
  }, []);
  async function share() {
    try {
      const url = new URL(base, location.origin).href;
      if (navigator.share)
        await navigator.share({ title: "下津村史 · 掌上的故乡", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {}
  }
  return (
    <div className="page-width narrow-page">
      <PageIntro
        index="ABOUT THIS CHRONICLE"
        title="一本村史，一脉乡情"
        description="以数字的方式，珍存纸页里的乡土记忆。"
      />
      <section className="about-block">
        <h2>这本书，从哪里来</h2>
        <p>
          《下津村史》由潮州市湘桥区下津村委会编，二〇二〇年六月出版。本网站依据原书扫描识别后的现有电子资料，重新整理成便于手机阅读的版本。
        </p>
        <div className="about-stats">
          <span>
            <b>10</b>篇村史
          </span>
          <span>
            <b>{data.manifest.photos}</b>帧影像
          </span>
          <span>
            <b>{data.manifest.people}</b>条人物记载
          </span>
        </div>
        <p>
          从土地资源、先祖创乡，到乡村建设、人口、经济、政治、人物、文化、教育和大事记，亦保留前言与原有校对附记。
        </p>
      </section>
      <section className="about-block">
        <h2>把村史放到手机桌面</h2>
        <p>
          <b>苹果手机：</b>用 Safari 打开网站，点“分享”，选择“添加到主屏幕”。
        </p>
        <p>
          <b>安卓手机：</b>用 Chrome
          或支持此功能的浏览器打开，在菜单中选择“添加到主屏幕”或“安装应用”。不同浏览器的名称可能有所不同。
        </p>
        <p>
          首次联网完整打开后，正文资料可缓存供离线阅读；看过的照片也会缓存。全部照片建议在联网时浏览。
        </p>
        <span className={`offline-status ${offline ? "ready" : ""}`}>
          <Check size={16} />
          {offline ? "离线阅读服务已就绪" : "联网打开后自动准备离线阅读"}
        </span>
      </section>
      <section className="about-block">
        <h2>阅读与资料说明</h2>
        <p>
          字号、阅读位置和书签保存在当前设备的浏览器中；更换设备、使用无痕模式或清理浏览器数据后，这些记录不会自动同步。
        </p>
        <p>
          本网站保留现有电子版文字。扫描识别可能存在错字，部分章节或表格可能有缺漏；照片标题、年代及人物说明尚待核对。人物的记载年代按原文呈现。后期整理的《勘误与审校报告》作为校对附记保留，供核对参考。
        </p>
        <p>
          涉及姓氏源流与世系，请直接参阅原文；确切关系仍须结合原书、族谱与编纂者校核。
        </p>
      </section>
      <button className="button-primary" onClick={share}>
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        {copied ? "网站地址已复制" : "分享给乡亲"}
      </button>
    </div>
  );
}
export default function App() {
  const route = useRoute();
  const [data, setData] = useState<Archive | null>(null);
  const [error, setError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [path, search = ""] = route.split("?");
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";
  const load = useCallback(() => {
    setError(false);
    Promise.all(
      ["documents", "catalog", "photos", "people", "timeline", "manifest"].map(
        (name) =>
          fetch(`${base}data/${name}.json`).then((r) => {
            if (!r.ok) throw new Error(name);
            return r.json();
          }),
      ),
    )
      .then(([documents, catalog, photos, people, timeline, manifest]) =>
        setData({ documents, catalog, photos, people, timeline, manifest }),
      )
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!path.startsWith("/read/")) window.scrollTo(0, 0);
    document.title = `${path.startsWith("/read/") ? data?.documents.find((d) => d.id === path.slice(6))?.title || "阅读" : ({ "/": "掌上的故乡", "/catalog": "村史目录", "/photos": "影像记忆", "/timeline": "大事记", "/people": "人物记载", "/search": "全文搜索", "/saved": "我的书签", "/about": "关于村史" } as Record<string, string>)[path] || "下津"} · 下津村史`;
  }, [path, data]);
  const navigateReading = useCallback((id: string) => go(`/read/${id}`), []);
  const isReading = path.startsWith("/read/");
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        跳到正文
      </a>
      <Header route={path} />
      {!online && (
        <div className="offline-banner">当前离线 · 已缓存的内容仍可阅读</div>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className={isReading ? "reading-main" : ""}
      >
        {error ? (
          <div className="page-width">
            <Empty
              title="资料暂时没有加载成功"
              text="首次打开需要联网。请检查网络后，再试一次。"
            />
            <button className="button-primary centered" onClick={load}>
              重新加载
            </button>
          </div>
        ) : !data ? (
          <div className="archive-loading">
            <span className="brand-seal">
              下<br />津
            </span>
            <p>正在翻开村史…</p>
          </div>
        ) : path === "/" ? (
          <HomePage data={data} />
        ) : path === "/catalog" ? (
          <CatalogPage data={data} />
        ) : isReading ? (
          <Reader
            documents={data.documents}
            id={path.slice(6)}
            onNavigate={navigateReading}
            query={query}
          />
        ) : path === "/search" ? (
          <SearchPage data={data} query={query} />
        ) : path === "/photos" ? (
          <PhotosPage data={data} />
        ) : path === "/timeline" ? (
          <TimelinePage data={data} />
        ) : path === "/people" ? (
          <PeoplePage data={data} query={query} />
        ) : path === "/saved" ? (
          <SavedPage data={data} />
        ) : path === "/about" ? (
          <AboutPage data={data} />
        ) : (
          <div className="page-width">
            <Empty title="这页还没有收录" text="回到目录，重新翻开村史吧。" />
            <a href="#/catalog" className="button-primary centered">
              返回目录 <ArrowLeft size={16} />
            </a>
          </div>
        )}
      </main>
      {!isReading && <Footer />}
      <MobileNav route={path} />
    </>
  );
}
