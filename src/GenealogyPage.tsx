import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ChevronDown,
  GitBranch,
  Info,
  Search,
  UsersRound,
} from "lucide-react";
import GenerationGuide from "./GenerationGuide";
import "./genealogy.css";

export type GenealogyPerson = {
  id: string;
  name: string;
  aliases: string[];
  gender?: "男" | "女";
  branch: string;
  clan?: string;
  generation?: { global?: number; taokeng?: number; character?: string };
  sourceDocIds: string[];
};
export type GenealogyRelation = {
  id: string;
  type: "parent" | "spouse";
  from: string;
  to: string;
  sourceDocId: string;
  quote: string;
};
export type GenealogyData = {
  schemaVersion: number;
  notice: string;
  people: GenealogyPerson[];
  relations: GenealogyRelation[];
  stats: { people: number; parents: number; spouses: number };
};
type Relative = {
  person: GenealogyPerson;
  contexts: string[];
  relations: GenealogyRelation[];
};
type RelativeLayer = { distance: number; relatives: Relative[] };
const normalName = (text: string) =>
  text
    .trim()
    .replace(/[\s·・]/g, "")
    .toLocaleLowerCase();
const originalLink = (documentId: string, term: string) =>
  `#/read/${documentId}?q=${encodeURIComponent(term)}`;
function evidenceTerm(relation: GenealogyRelation, people: GenealogyPerson[]) {
  const person = people.find((item) => item.id === relation.to);
  return (
    (person &&
      [person.name, ...person.aliases].find((name) =>
        relation.quote.includes(name),
      )) ||
    relation.quote.slice(0, 12)
  );
}

export function findGenealogyPeople(people: GenealogyPerson[], term: string) {
  const needle = normalName(term);
  if (!needle) return [];
  const names = (person: GenealogyPerson) =>
    [person.name, ...person.aliases].map(normalName);
  const score = (person: GenealogyPerson) => {
    const values = names(person);
    if (values.some((value) => value === needle)) return 0;
    if (values.some((value) => value.startsWith(needle))) return 1;
    return 2;
  };
  return people
    .filter((person) => names(person).some((value) => value.includes(needle)))
    .sort(
      (a, b) =>
        score(a) - score(b) ||
        a.name.localeCompare(b.name, "zh-CN") ||
        a.branch.localeCompare(b.branch, "zh-CN"),
    );
}

export function buildRelativeLayers(
  data: GenealogyData,
  centerId: string,
  direction: "ancestors" | "descendants",
  depth: number,
): RelativeLayer[] {
  const people = new Map(data.people.map((person) => [person.id, person]));
  const visited = new Set([centerId]);
  let frontier = [centerId];
  const layers: RelativeLayer[] = [];
  for (let distance = 1; distance <= depth; distance++) {
    const next = new Map<string, Relative>();
    for (const relation of data.relations) {
      if (relation.type !== "parent") continue;
      const sourceId = direction === "ancestors" ? relation.to : relation.from;
      const relativeId =
        direction === "ancestors" ? relation.from : relation.to;
      if (!frontier.includes(sourceId) || visited.has(relativeId)) continue;
      const person = people.get(relativeId),
        source = people.get(sourceId);
      if (!person || !source) continue;
      const role =
        direction === "ancestors"
          ? person.gender === "男"
            ? "父亲"
            : person.gender === "女"
              ? "母亲"
              : "父母之一"
          : person.gender === "男"
            ? "儿子"
            : person.gender === "女"
              ? "女儿"
              : "子女";
      const context = `${source.name}的${role}`;
      const row = next.get(relativeId) || {
        person,
        contexts: [],
        relations: [],
      };
      if (!row.contexts.includes(context)) row.contexts.push(context);
      if (!row.relations.some((item) => item.id === relation.id))
        row.relations.push(relation);
      next.set(relativeId, row);
    }
    const relatives = [...next.values()];
    relatives.forEach(({ person }) => visited.add(person.id));
    layers.push({ distance, relatives });
    frontier = relatives.map(({ person }) => person.id);
  }
  return layers;
}

function GenerationText({ person }: { person: GenealogyPerson }) {
  const generation = person.generation;
  if (
    !generation ||
    (!generation.global && !generation.taokeng && !generation.character)
  )
    return null;
  return (
    <p className="genealogy-generation">
      {generation.global && <span>刘氏{generation.global}世</span>}
      {generation.taokeng && <span>桃坑{generation.taokeng}世</span>}
      {generation.character && <span>“{generation.character}”字辈</span>}
    </p>
  );
}

function PersonNode({
  relative,
  onSelect,
}: {
  relative: Relative;
  onSelect: (person: GenealogyPerson) => void;
}) {
  const { person } = relative;
  const firstSource =
    relative.relations[0]?.sourceDocId || person.sourceDocIds[0];
  return (
    <article className="genealogy-node">
      <button
        type="button"
        onClick={() => onSelect(person)}
        aria-label={`以${person.name}为中心查看族谱`}
      >
        <span className="genealogy-node-context">
          {relative.contexts.join("、")}
        </span>
        <h4>{person.name}</h4>
        <GenerationText person={person} />
        <span className="genealogy-node-branch">{person.branch}</span>
      </button>
      {firstSource && (
        <a
          className="genealogy-source-link"
          href={originalLink(firstSource, person.aliases[0] || person.name)}
        >
          阅读出处 <ArrowRight size={13} />
        </a>
      )}
    </article>
  );
}

const ancestorNames = [
  "",
  "父母",
  "祖父母 / 外祖父母",
  "曾祖父母 / 外曾祖父母",
];
const descendantNames = ["", "子女", "孙辈 / 外孙辈", "曾孙辈 / 外曾孙辈"];

function RelativeBand({
  layer,
  direction,
  onSelect,
}: {
  layer: RelativeLayer;
  direction: "ancestors" | "descendants";
  onSelect: (person: GenealogyPerson) => void;
}) {
  const title = (direction === "ancestors" ? ancestorNames : descendantNames)[
    layer.distance
  ];
  return (
    <section
      className={`genealogy-band genealogy-${direction}`}
      aria-label={title}
    >
      <div className="genealogy-band-heading">
        <span>
          {direction === "ancestors" ? "向上" : "向下"}
          {layer.distance}代
        </span>
        <h3>{title}</h3>
        <small>
          {layer.relatives.length > 0
            ? `${layer.relatives.length}位有据可查`
            : "资料待补"}
        </small>
      </div>
      {layer.relatives.length > 0 ? (
        <div className="genealogy-node-grid">
          {layer.relatives.map((relative) => (
            <PersonNode
              key={relative.person.id}
              relative={relative}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <p className="genealogy-no-record">
          现有资料暂未录入这一代的明确关系。
        </p>
      )}
    </section>
  );
}

export default function GenealogyPage({ query = "" }: { query?: string }) {
  const [data, setData] = useState<GenealogyData | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(false);
  const [input, setInput] = useState(query),
    [submitted, setSubmitted] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [depth, setDepth] = useState(3),
    [limit, setLimit] = useState(30);
  const graphRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`${import.meta.env.BASE_URL}data/genealogy.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load genealogy");
        return response.json();
      })
      .then((archive: GenealogyData) => {
        if (!Array.isArray(archive.people) || !Array.isArray(archive.relations))
          throw new Error("Invalid genealogy data");
        setData(archive);
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    setInput(query);
    setSubmitted(query);
    setLimit(30);
    const matches = data ? findGenealogyPeople(data.people, query) : [];
    setSelectedId(matches.length === 1 ? matches[0].id : null);
  }, [query, data]);

  const matches = useMemo(
    () => (data ? findGenealogyPeople(data.people, submitted) : []),
    [data, submitted],
  );
  const selected = data?.people.find((person) => person.id === selectedId);
  const ancestors = useMemo(
    () =>
      data && selectedId
        ? buildRelativeLayers(data, selectedId, "ancestors", depth)
        : [],
    [data, selectedId, depth],
  );
  const descendants = useMemo(
    () =>
      data && selectedId
        ? buildRelativeLayers(data, selectedId, "descendants", depth)
        : [],
    [data, selectedId, depth],
  );
  const spouseRelations = useMemo(
    () =>
      data?.relations.filter(
        (relation) =>
          relation.type === "spouse" &&
          (relation.from === selectedId || relation.to === selectedId),
      ) || [],
    [data, selectedId],
  );
  const spouses: Relative[] = useMemo(() => {
    if (!data || !selected) return [];
    return spouseRelations.flatMap((relation) => {
      const person = data.people.find(
        (candidate) =>
          candidate.id ===
          (relation.from === selected.id ? relation.to : relation.from),
      );
      return person
        ? [
            {
              person,
              contexts: [`${selected.name}的配偶`],
              relations: [relation],
            },
          ]
        : [];
    });
  }, [data, selected, spouseRelations]);
  const visibleEvidence = useMemo(() => {
    const relations = [...ancestors, ...descendants].flatMap((layer) =>
      layer.relatives.flatMap((relative) => relative.relations),
    );
    return [
      ...new Map(
        [...relations, ...spouseRelations].map((relation) => [
          relation.id,
          relation,
        ]),
      ).values(),
    ];
  }, [ancestors, descendants, spouseRelations]);
  const nameMap = useMemo(
    () => new Map(data?.people.map((person) => [person.id, person.name]) || []),
    [data],
  );

  function search(term: string) {
    const value = term.trim();
    setInput(value);
    setSubmitted(value);
    setLimit(30);
    const found = data ? findGenealogyPeople(data.people, value) : [];
    setSelectedId(found.length === 1 ? found[0].id : null);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    search(input);
  }
  function selectPerson(person: GenealogyPerson) {
    setSelectedId(person.id);
    setInput(person.name);
    setSubmitted(person.name);
    setLimit(30);
    requestAnimationFrame(() =>
      graphRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }

  const suggestions = data
    ? ["雄明", "语彤", "永淡", "刘策"].filter(
        (name) => findGenealogyPeople(data.people, name).length > 0,
      )
    : [];
  return (
    <div className="page-width genealogy-page">
      <div className="page-intro">
        <span className="eyebrow">
          FAMILY CONNECTIONS <i>/</i> 姓名查亲
        </span>
        <h1>
          循着名字，找寻家脉
          <span className="red-dot" />
        </h1>
        <p>
          输入姓名，查看有原文依据的前后三代亲属。点击家人的名字，可以继续向前后查阅。
        </p>
      </div>
      <section className="genealogy-search-area" aria-label="族谱姓名查询">
        <form className="genealogy-search-form" role="search" onSubmit={submit}>
          <Search size={20} strokeWidth={1.5} />
          <input
            aria-label="输入族谱姓名"
            placeholder="输入姓名，如雄明、语彤、永淡"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={80}
          />
          <button type="submit" disabled={loading || !data}>
            查族谱 <ArrowRight size={17} />
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="genealogy-suggestions">
            <span>试着查</span>
            {suggestions.map((name) => (
              <button key={name} type="button" onClick={() => search(name)}>
                {name}
              </button>
            ))}
          </div>
        )}
        <p className="genealogy-scope-note">
          <Info size={14} />{" "}
          仅展示资料中明确记载的关系，缺录处留白，不由姓氏或辈字推定亲属。
        </p>
      </section>
      {loading ? (
        <div className="genealogy-empty" role="status">
          <GitBranch size={32} strokeWidth={1.2} />
          <h2>正在整理家脉…</h2>
        </div>
      ) : error || !data ? (
        <div className="genealogy-empty" role="alert">
          <BookOpen size={34} strokeWidth={1.2} />
          <h2>族谱资料暂时未能打开</h2>
          <p>请检查网络后刷新；也可以先在村史原文中查找姓名。</p>
          <a
            href={`#/search?q=${encodeURIComponent(input)}`}
            className="button-outline"
          >
            搜索村史 <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <>
          {!submitted && (
            <div className="genealogy-welcome">
              <GitBranch size={35} strokeWidth={1.1} />
              <div>
                <h2>先从一个熟悉的名字开始</h2>
                <p>
                  可查全名，也可查原文中的名字简称。遇到同名人物，请按支系和出处选择。
                </p>
                <span>
                  {data.people.length}位有明确资料的人物 ·{" "}
                  {
                    data.relations.filter(
                      (relation) => relation.type === "parent",
                    ).length
                  }
                  条亲子记载
                </span>
              </div>
            </div>
          )}
          {submitted && !matches.length && (
            <div className="genealogy-empty">
              <UsersRound size={35} strokeWidth={1.1} />
              <h2>暂未找到“{submitted}”</h2>
              <p>
                可以换用全名、原文简称，或姓名中的一个字。这只表示当前关系资料尚未录入。
              </p>
              <a
                href={`#/search?q=${encodeURIComponent(submitted)}`}
                className="button-outline"
              >
                去原文里找一找 <ArrowRight size={16} />
              </a>
            </div>
          )}
          {matches.length > 0 && (
            <section className="genealogy-matches" aria-label="姓名匹配结果">
              <div className="genealogy-result-heading">
                <p>
                  找到 <strong>{matches.length}</strong> 位姓名匹配的人物
                  {matches.length > 1 ? "，请核对支系后选择" : ""}
                </p>
              </div>
              {(!selected || matches.length > 1) && (
                <div className="genealogy-match-grid">
                  {matches.slice(0, limit).map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      className={`genealogy-match ${selectedId === person.id ? "is-selected" : ""}`}
                      onClick={() => selectPerson(person)}
                    >
                      <span>
                        <b>{person.name}</b>
                        <ArrowRight size={16} />
                      </span>
                      <span className="genealogy-match-branch">
                        {person.branch || person.clan || "原文人物"}
                      </span>
                      <GenerationText person={person} />
                      <small>
                        {person.aliases.filter((alias) => alias !== person.name)
                          .length > 0
                          ? `原文称：${person.aliases.filter((alias) => alias !== person.name).join("、")}`
                          : "可点击查看亲属及原文出处"}
                      </small>
                    </button>
                  ))}
                </div>
              )}
              {matches.length > limit && (
                <button
                  type="button"
                  className="text-link genealogy-more-matches"
                  onClick={() => setLimit((value) => value + 30)}
                >
                  再看一些姓名 <ArrowDown size={15} />
                </button>
              )}
            </section>
          )}
          {selected && (
            <section
              className="genealogy-graph"
              ref={graphRef}
              aria-label={`${selected.name}的族谱关系`}
            >
              <div className="genealogy-graph-tools">
                <div>
                  <span className="eyebrow">FAMILY AT A GLANCE</span>
                  <h2>{selected.name}的家脉</h2>
                </div>
                <fieldset>
                  <legend>查看范围</legend>
                  {[1, 2, 3].map((level) => (
                    <button
                      type="button"
                      key={level}
                      aria-pressed={depth === level}
                      className={depth === level ? "active" : ""}
                      onClick={() => setDepth(level)}
                    >
                      上下{level}代
                    </button>
                  ))}
                </fieldset>
              </div>
              <p className="genealogy-graph-help">
                以本人为中心，向上、向下各查{depth}
                代；每个姓名都可以点开继续查。
              </p>
              <div className="genealogy-family-flow">
                {[...ancestors].reverse().map((layer) => (
                  <RelativeBand
                    key={`ancestor-${layer.distance}`}
                    layer={layer}
                    direction="ancestors"
                    onSelect={selectPerson}
                  />
                ))}
                <section
                  className="genealogy-center-band"
                  aria-label="本人和配偶"
                >
                  <div className="genealogy-center">
                    <span className="genealogy-center-label">
                      当前中心 · 本人
                    </span>
                    <h3>{selected.name}</h3>
                    <GenerationText person={selected} />
                    <p>{selected.branch}</p>
                    {selected.sourceDocIds[0] && (
                      <a
                        href={originalLink(
                          selected.sourceDocIds[0],
                          selected.aliases[0] || selected.name,
                        )}
                      >
                        查看本人原文 <ArrowRight size={15} />
                      </a>
                    )}
                  </div>
                  <div className="genealogy-spouses">
                    <span className="genealogy-spouse-label">配偶记载</span>
                    {spouses.length ? (
                      <div className="genealogy-node-grid">
                        {spouses.map((relative) => (
                          <PersonNode
                            key={relative.person.id}
                            relative={relative}
                            onSelect={selectPerson}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="genealogy-no-record">
                        现有资料暂未录入明确配偶关系。
                      </p>
                    )}
                  </div>
                </section>
                {descendants.map((layer) => (
                  <RelativeBand
                    key={`descendant-${layer.distance}`}
                    layer={layer}
                    direction="descendants"
                    onSelect={selectPerson}
                  />
                ))}
              </div>
              <details className="genealogy-evidence">
                <summary>
                  <span>
                    <BookOpen size={17} /> 这些关系的原文依据{" "}
                    <small>{visibleEvidence.length}条</small>
                  </span>
                  <ChevronDown size={17} />
                </summary>
                <div>
                  {visibleEvidence.length ? (
                    visibleEvidence.map((relation) => (
                      <article key={relation.id}>
                        <h3>
                          {nameMap.get(relation.from)}{" "}
                          <span>
                            {relation.type === "parent" ? "→ 子女" : "↔ 配偶"}
                          </span>{" "}
                          {nameMap.get(relation.to)}
                        </h3>
                        <p>{relation.quote}</p>
                        <a
                          href={originalLink(
                            relation.sourceDocId,
                            evidenceTerm(relation, data.people),
                          )}
                        >
                          阅读原文 <ArrowRight size={13} />
                        </a>
                      </article>
                    ))
                  ) : (
                    <p className="genealogy-no-record">
                      目前只录入了该人物的原文线索，亲属关系仍待补充。
                    </p>
                  )}
                </div>
              </details>
              <p className="genealogy-bottom-note">
                空白表示当前资料未有明确记载，不表示没有亲属。不同支系的同名人物分别保存；世次与亲属关系以各自出处为准。
              </p>
            </section>
          )}
          {data.notice && (
            <p className="genealogy-data-note">
              <Info size={15} />
              <span>{data.notice}</span>
            </p>
          )}
        </>
      )}
      <GenerationGuide />
    </div>
  );
}
