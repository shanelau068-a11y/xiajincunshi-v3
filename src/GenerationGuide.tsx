import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import "./generation.css";

type GenerationData = {
  rows: { character: string; global: number; taokeng: number }[];
  sourceImage: string;
  sourceDocumentId: string;
  sourceNote: string;
  transcriptionNote: string;
  count: number;
};
export default function GenerationGuide() {
  const [data, setData] = useState<GenerationData | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("");
  const base = import.meta.env.BASE_URL;
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}data/generation.json`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Generation data unavailable");
        return r.json();
      })
      .then(setData)
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [base]);
  const shown =
    data?.rows.filter(
      (row) =>
        !filter ||
        row.character.includes(filter) ||
        String(row.global) === filter ||
        String(row.taokeng) === filter,
    ) || [];
  return (
    <details
      className="generation-guide"
      open={window.location.hash.includes("section=generation") || undefined}
    >
      <summary>
        <span>
          <small>GENERATION NAMES</small>
          <b>刘氏桃坑辈序核对</b>
          <em>日：总143世 / 桃坑19世 → 名：总208世 / 桃坑84世</em>
        </span>
        <ChevronDown size={19} />
      </summary>
      <div className="generation-body">
        <p className="generation-explanation">
          牌匾从“日”到“名”共66字：143 + 66 − 1 =
          208。书中“日”为桃坑19世，故两套世次相差124；“名”对应桃坑84世。
        </p>
        {failed ? (
          <p role="status">辈序资料暂未加载成功，请联网后刷新。</p>
        ) : !data ? (
          <p role="status">正在加载逐字核对表…</p>
        ) : (
          <>
            <label className="generation-filter">
              查辈字或世次
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value.trim())}
                placeholder="如：鸿、208、84"
                aria-label="查辈字或世次"
              />
            </label>
            <div className="generation-legend">
              <span>大字为辈字</span>
              <span>总：刘氏总世次</span>
              <span>桃坑：桃坑世次</span>
            </div>
            <ol className="generation-grid">
              {shown.map((row) => (
                <li key={row.global}>
                  <b>{row.character}</b>
                  <span>总 {row.global} 世</span>
                  <small>桃坑 {row.taokeng} 世</small>
                </li>
              ))}
            </ol>
            {!shown.length && (
              <p className="generation-empty">这段辈序中未找到该字或世次。</p>
            )}
            <p className="generation-note">
              {data.transcriptionNote} 辈字仅表排行，亲属关系须另据记载核对。
            </p>
            <div className="generation-source-links">
              <a
                href={`#/read/${data.sourceDocumentId}?q=${encodeURIComponent("刘氏桃坑辈序")}`}
              >
                查看书中对应文字 <ExternalLink size={13} />
              </a>
            </div>
            <details className="generation-photo">
              <summary>查看辈序牌匾原图</summary>
              <p>{data.sourceNote}</p>
              <a
                href={`${base}${data.sourceImage}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="在新窗口查看完整辈序照片"
              >
                <img
                  src={`${base}${data.sourceImage}`}
                  alt="刘氏辈序牌匾：日为143世至名为208世"
                  loading="lazy"
                />
              </a>
            </details>
          </>
        )}
      </div>
    </details>
  );
}
