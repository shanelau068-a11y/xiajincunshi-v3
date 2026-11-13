import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// Only manually reviewed, explicitly stated relationships are entered below.
// This intentionally does not import the old automatically extracted tree or
// join people because their names, generation words or list positions match.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const documents = JSON.parse(
  fs.readFileSync(path.join(root, "public/data/documents.json"), "utf8"),
);
const documentMap = new Map(
  documents.map((document) => [document.id, document]),
);
const compact = (value) => value.replace(/\s+/g, "");
const people = new Map();
const relations = new Map();

function evidence(sourceDocId, start, end = start) {
  const document = documentMap.get(sourceDocId);
  assert(document, `Missing genealogy source document ${sourceDocId}`);
  const text = compact(document.text);
  const from = text.indexOf(compact(start));
  assert(from >= 0, `Missing evidence start in ${sourceDocId}: ${start}`);
  const to = text.indexOf(compact(end), from);
  assert(to >= from, `Missing evidence end in ${sourceDocId}: ${end}`);
  return { sourceDocId, quote: text.slice(from, to + compact(end).length) };
}

function person(
  key,
  name,
  { aliases = [], gender, branch, clan, generation, sourceDocId } = {},
) {
  const id = `family-${key}`;
  const existing = people.get(id);
  if (existing) {
    assert.equal(existing.name, name, `Conflicting identity ${id}`);
    existing.aliases = [...new Set([...existing.aliases, ...aliases])];
    if (sourceDocId && !existing.sourceDocIds.includes(sourceDocId))
      existing.sourceDocIds.push(sourceDocId);
    if (gender) {
      assert(!existing.gender || existing.gender === gender);
      existing.gender = gender;
    }
    if (generation) {
      assert(
        !existing.generation ||
          JSON.stringify(existing.generation) === JSON.stringify(generation),
      );
      existing.generation = generation;
    }
    return id;
  }
  assert(branch && sourceDocId, `Missing person provenance ${id}`);
  assert(documentMap.has(sourceDocId));
  const node = {
    id,
    name,
    aliases: [...new Set(aliases.filter((alias) => alias !== name))],
    branch,
    sourceDocIds: [sourceDocId],
  };
  if (gender) node.gender = gender;
  if (clan) node.clan = clan;
  if (generation) node.generation = generation;
  people.set(id, node);
  return id;
}

function edge(type, from, to, source) {
  assert(from && to && from !== to);
  assert(
    people.has(from) && people.has(to),
    `Unknown relationship person: ${from} -> ${to}`,
  );
  const ordered = type === "spouse" ? [from, to].sort() : [from, to];
  const id = `${type}:${ordered.join(":")}`;
  const relation = { id, type, from: ordered[0], to: ordered[1], ...source };
  if (!relations.has(id)) relations.set(id, relation);
  for (const nodeId of [from, to]) {
    const node = people.get(nodeId);
    if (!node.sourceDocIds.includes(source.sourceDocId))
      node.sourceDocIds.push(source.sourceDocId);
  }
}

const liu = (key, name, doc, branch = "桃坑刘氏", extra = {}) =>
  person(key, name, {
    sourceDocId: doc,
    branch,
    clan: "刘氏",
    aliases: name.startsWith("刘") ? [name.slice(1)] : [],
    ...extra,
  });
const spouse = (key, name, doc, branch, extra = {}) =>
  person(key, name, { sourceDocId: doc, branch, ...extra });
const son = (key, name, doc, branch, extra = {}) =>
  liu(key, name, doc, branch, { gender: "男", ...extra });
const daughter = (key, name, doc, branch, extra = {}) =>
  liu(key, name, doc, branch, { gender: "女", ...extra });
function parents(parentIds, childIds, source) {
  for (const p of parentIds)
    for (const c of childIds) edge("parent", p, c, source);
}
function marriage(a, b, source) {
  edge("spouse", a, b, source);
}
const taokeng = (number, character) => ({
  global: number + 124,
  taokeng: number,
  ...(character ? { character } : {}),
});

// 明示的远敬公房家支。光勉之前的支字辈未详，保留断点。
const home = "窟尾沟乡 · 远敬公房";
const modern = {};
for (const [key, name, gen, character, gender] of [
  ["guangmian", "刘光勉", 29, "光"],
  ["zongyi", "刘宗一", 30, "宗", "男"],
  ["shaoda", "刘绍达", 31, "绍", "男"],
  ["shiqian", "刘世乾", 32, "世", "男"],
  ["derong", "刘德荣", 33, "德", "男"],
  ["songzhen", "刘松镇", 33, "德", "男"],
  ["xilin", "刘锡林", 34, "裕", "男"],
  ["xilin-younger", "刘喜林", 34, "裕", "男"],
  ["yongli", "刘永利", 35, "昆", "男"],
  ["yongdan", "刘永淡", 35, "昆", "男"],
  ["ruize", "刘锐泽", 36, "启", "男"],
  ["yaohuai", "刘耀怀", 36, "启", "男"],
  ["xiongxuan", "刘雄宣", 37, "鸿", "男"],
  ["xiongming", "刘雄明", 37, "鸿", "男"],
  ["yiqi", "刘镒齐", 38, "泽", "男"],
  ["sibo", "刘思博", 38, "泽", "男"],
])
  modern[key] = liu(key, name, "d-007", home, {
    generation: taokeng(gen, character),
    gender,
  });
for (const [key, name, gender, aliases = []] of [
  ["yaozhen", "瑶珍", "女", ["刘瑶珍", "枫溪姑"]],
  ["meijuan", "美娟", "女", ["刘美娟", "Mui Kiang"]],
  ["meihua", "美华", "女", ["刘美华", "Kwee Huay"]],
  ["meiping", "美萍", "女", ["刘美萍", "Mui Pheng"]],
  ["meiyun", "美云", "女", ["刘美云"]],
  ["hanqiu", "汉秋", "男", ["刘汉秋", "Hang Chew"]],
  ["yuqin", "玉琴", "女", ["刘玉琴"]],
  ["yuhua", "玉花", "女", ["刘玉花"]],
  ["yushan", "玉珊", "女", ["刘玉珊"]],
  ["daihui", "戴慧", "女", ["刘戴慧"]],
  ["daihua", "岱华", "女", ["刘岱华"]],
  ["chunyu", "纯语", "女", ["刘纯语"]],
  ["yutong", "语彤", "女", ["刘语彤"]],
])
  modern[key] = liu(key, name, "d-007", home, { gender, aliases });
for (const [key, name] of [
  ["xuqingjiao", "许清娇"],
  ["liangruiyin", "梁瑞音"],
  ["huanglixiang", "黄丽香"],
  ["linqiue", "林秋娥"],
  ["liaochunling", "廖春玲"],
  ["huixuan", "惠璇"],
  ["lupeidong", "陆佩东"],
  ["kuncheng", "坤成"],
  ["jinfa", "进发"],
  ["yujia", "余家铎"],
  ["chenshaowei", "陈少伟"],
  ["jiangweiping", "江伟平"],
  ["chensimin", "陈锶敏"],
  ["zhangzhenzhao", "张振钊"],
])
  modern[key] = spouse(key, name, "d-007", home);
for (const [key, name, gender] of [
  ["qiyong", "启泳", "男"],
  ["qiyue", "启跃", "男"],
  ["guiyi", "桂宜", "女"],
  ["cuihua", "翠华", "女"],
  ["yonghua", "咏华", "男"],
  ["yukeshen", "余可申", "男"],
  ["jiaqi", "佳琪", "女"],
])
  modern[key] = person(key, name, {
    sourceDocId: "d-007",
    branch: home,
    gender,
  });
const hp = (ps, cs, start, end = start) =>
  parents(
    ps.map((k) => modern[k]),
    cs.map((k) => modern[k]),
    evidence("d-007", start, end),
  );
const hm = (a, b, start, end = start) =>
  marriage(modern[a], modern[b], evidence("d-007", start, end));
hp(["guangmian"], ["zongyi"], '桃坑30世"宗"字辈：宗一', "光勉之子。");
hp(["zongyi"], ["shaoda"], '桃坑31世"绍"字辈：绍达', "宗一之子。");
hp(["shaoda"], ["shiqian"], '桃坑32世"世"字辈：世乾', "绍达之子。");
hp(["shiqian"], ["derong", "songzhen"], '桃坑32世"世"字辈：世乾', "次子松镇。");
hm("derong", "xuqingjiao", "长子德荣，配偶许清娇。");
hp(
  ["derong", "xuqingjiao"],
  ["xilin", "xilin-younger"],
  "长子德荣，配偶许清娇。",
  "次子喜林。",
);
hm(
  "xilin-younger",
  "liangruiyin",
  '桃坑34世"裕"字辈：喜林配梁瑞音',
  "次子永淡。",
);
hp(
  ["xilin-younger", "liangruiyin"],
  ["yongli", "yongdan"],
  '桃坑34世"裕"字辈：喜林配梁瑞音',
  "次子永淡。",
);
hp(["xilin"], ["yaozhen"], "锡林，生有一女：瑶珍(枫溪姑)。");
hp(
  ["yongli"],
  ["meijuan", "meihua", "meiping", "meiyun", "hanqiu"],
  "永利育有四女一男：",
  "（HangChew）。",
);
hm("yongdan", "huanglixiang", '桃坑35世"昆"字辈：永淡', "小女儿玉珊。");
hp(
  ["yongdan", "huanglixiang"],
  ["yuqin", "ruize", "yuhua", "yaohuai", "yushan"],
  '桃坑35世"昆"字辈：永淡',
  "小女儿玉珊。",
);
hm("yuqin", "kuncheng", "长女玉琴：适坤成。");
hp(
  ["yuqin", "kuncheng"],
  ["qiyong", "qiyue", "guiyi"],
  "长女玉琴：适坤成。",
  "（适江伟平）。",
);
hm("guiyi", "jiangweiping", "幺女桂宜（适江伟平）。");
hm("ruize", "linqiue", '长子锐泽（桃坑36世"启"字辈）：配偶林秋娥。');
hp(
  ["ruize", "linqiue"],
  ["xiongxuan", "daihui"],
  '长子锐泽（桃坑36世"启"字辈）：',
  "余可申。",
);
hm("xiongxuan", "huixuan", '子雄宣（桃坑37世"鸿"字辈），配偶惠璇。');
hp(
  ["xiongxuan", "huixuan"],
  ["chunyu", "yiqi"],
  "雄宣与惠璇育有：女纯语",
  '镒齐（桃坑38世"泽"字辈）。',
);
hm("daihui", "yujia", "女戴慧，适余家铎。");
hp(["daihui", "yujia"], ["yukeshen"], "女戴慧，适余家铎。育有一子余可申。");
hm("yuhua", "jinfa", "二女玉花：适进发。");
hp(
  ["yuhua", "jinfa"],
  ["cuihua", "yonghua"],
  "二女玉花：适进发。",
  "（配偶陈锶敏）。",
);
hm("yonghua", "chensimin", "子咏华（配偶陈锶敏）。");
hm("yaohuai", "liaochunling", '次子耀怀（桃坑36世"启"字辈）：配偶廖春玲。');
hp(
  ["yaohuai", "liaochunling"],
  ["xiongming", "daihua"],
  '次子耀怀（桃坑36世"启"字辈）：',
  "女岱华。",
);
hm("xiongming", "lupeidong", '子雄明（桃坑37世"鸿"字辈），配偶陆佩东。');
hp(
  ["xiongming", "lupeidong"],
  ["sibo", "yutong"],
  "雄明与陆佩东育有：",
  "女语彤。",
);
hm("yushan", "chenshaowei", "幺女玉珊：适陈少伟。");
hp(
  ["yushan", "chenshaowei"],
  ["jiaqi"],
  "幺女玉珊：适陈少伟。育有一女：佳琪",
  "（适张振钊）。",
);
hm("jiaqi", "zhangzhenzhao", "佳琪（适张振钊）。");

// 桃坑乡原文明示的近祖关系，不以连续世次自动连线。
const ancient = {};
for (const [key, name, gen] of [
  ["kejun", "刘克俊", 3],
  ["yun", "刘允", 4],
  ["yuan", "刘元", 4],
  ["liang", "刘亮", 4],
  ["fang", "刘昉", 5],
  ["jing", "刘景", 5],
  ["zi", "刘渍", 6],
  ["quan", "刘权", 7],
  ["bing", "刘炳", 8],
  ["zhenqing", "刘真庆", 9],
  ["zhenlu", "刘真禄", 9],
  ["quan-metal", "刘铨", 10],
  ["gongsun", "刘公孙", 11],
  ["jisun", "刘济孙", 11],
  ["gui", "刘桂", 12],
  ["shu", "刘枢", 12],
  ["xun", "刘勋", 13],
  ["tao", "刘焘", 13],
  ["ran", "刘然", 13],
  ["tong", "刘童", 14],
  ["chaojin", "刘潮津", 15],
  ["keng", "刘铿", 15],
  ["deshan", "刘得山", 15],
  ["jian", "刘鉴", 15],
  ["gong", "刘拱", 16],
  ["yin", "刘寅", 16],
  ["qing", "刘顷", 17],
  ["shunxing", "刘顺兴", 17],
  ["xi", "刘锡", 18],
  ["ce", "刘策", 19],
  ["huang", "刘簧", 19],
  ["lian", "刘廉", 19],
])
  ancient[key] = son(
    `ancestor-${key.replace(/ /g, "")}`,
    name,
    "d-006",
    "桃坑刘氏 · 原文近祖",
    { generation: taokeng(gen) },
  );
for (const name of ["济", "涣", "瀚", "泽", "洛", "潞", "汭", "淮"])
  ancient[name] = son(
    `jing-son-${name}`,
    `刘${name}`,
    "d-006",
    "桃坑刘氏 · 银青公房",
  );
for (const name of ["模", "栻", "梓"])
  ancient[name] = son(
    `zi-son-${name}`,
    `刘${name}`,
    "d-006",
    "桃坑刘氏 · 刘渍公房",
  );
ancient.ranlao = son(
  "quan-son-ranlao",
  "刘然老",
  "d-006",
  "桃坑刘氏 · 刘权公房",
);
const ap = (p, cs, start, end = start) =>
  parents(
    [ancient[p]],
    cs.map((k) => ancient[k]),
    evidence("d-006", start, end),
  );
ap("kejun", ["yun", "yuan", "liang"], "一二七世（桃坑三世）刘克俊", "三刘亮。");
ap("yun", ["fang", "jing"], "一二八世（桃坑四世）刘允", "次刘景。");
ap(
  "jing",
  ["济", "涣", "瀚", "泽", "洛", "潞", "汭", "zi", "淮"],
  "一二九世（桃坑五世）刘景：",
  "淮九子。",
);
ap("zi", ["quan", "模", "栻", "梓"], "一三〇世（桃坑六世）刘渍", "梓四子。");
ap("quan", ["bing", "ranlao"], "一三一世（桃坑七世）刘权", "然老二子。");
ap("bing", ["zhenqing", "zhenlu"], "一三二世（桃坑八世）刘炳", "真禄二子。");
ap("zhenqing", ["quan-metal"], "一三三世（桃坑九世）刘真庆", "生铨一子。");
ap(
  "quan-metal",
  ["gongsun", "jisun"],
  "一三四世（桃坑十世）刘铨",
  "济孙二子。",
);
ap("gongsun", ["gui", "shu"], "一三五世（桃坑十一世）刘公孙", "生桂、枢二子。");
ap("shu", ["xun", "tao", "ran"], "刘枢字原丙", "焘、然三子。");
ap("xun", ["tong"], "一三七世（桃坑十三世）刘勋", "生童一子。");
ap(
  "tong",
  ["chaojin", "keng", "deshan", "jian"],
  "一三八世（桃坑十四世）刘童",
  "鉴四子。",
);
ap("chaojin", ["gong", "yin"], "一三九世（桃坑十五世）刘潮津", "寅二子。");
ap("gong", ["qing", "shunxing"], "一四〇世（桃坑十六世）刘拱", "顺兴二子。");
ap("shunxing", ["xi"], "一四一世（桃坑十七世）刘顺兴", "生锡一子。");
ap("xi", ["ce", "huang", "lian"], "一四二世（桃坑十八世）刘锡", "廉三子。");
// Only spouse links are added where several wives are recorded; the text does
// not tell us which wife gave birth to which child.
for (const [ancestorKey, surnames, start, end] of [
  [
    "jing",
    ["吴氏", "许氏", "曾氏", "詹氏"],
    "一二九世（桃坑五世）刘景：",
    "俱封为夫人。",
  ],
  ["zi", ["叶氏"], "一三〇世（桃坑六世）刘渍", "娶叶氏，"],
  ["bing", ["苏氏"], "一三二世（桃坑八世）刘炳", "妣宜人苏氏，"],
  [
    "zhenqing",
    ["陈氏", "叶氏"],
    "一三三世（桃坑九世）刘真庆",
    "妣孺人陈氏、叶氏，",
  ],
  [
    "quan-metal",
    ["李氏", "叶氏"],
    "一三四世（桃坑十世）刘铨",
    "妣县君李氏、叶氏，",
  ],
  ["gongsun", ["赵氏"], "一三五世（桃坑十一世）刘公孙", "妣郡主赵氏，"],
  ["shu", ["郑氏"], "刘枢字原丙", "妣郑氏，"],
  ["xun", ["陈氏"], "一三七世（桃坑十三世）刘勋", "妣县君陈氏，"],
  ["tong", ["李氏"], "一三八世（桃坑十四世）刘童", "妣李氏，"],
  ["gong", ["陈氏"], "一四〇世（桃坑十六世）刘拱", "妣陈氏，"],
  ["shunxing", ["吴氏"], "一四一世（桃坑十七世）刘顺兴", "妣吴氏，"],
  ["xi", ["陈氏", "吴氏"], "一四二世（桃坑十八世）刘锡", "妣陈氏、吴氏，"],
])
  for (const [i, name] of surnames.entries()) {
    const id = spouse(
      `${ancestorKey}-spouse-${i}`,
      name,
      "d-006",
      `桃坑刘氏 · ${people.get(ancient[ancestorKey]).name}配偶`,
      { gender: "女" },
    );
    marriage(ancient[ancestorKey], id, evidence("d-006", start, end));
  }

// 窟尾沟开基与大房二：只有明文子女，不将代距缺失处接成完整树。
const ku = {};
for (const [key, name, gen, char] of [
  ["yisong", "刘以松", 20, "旭"],
  ["meisong", "刘梅松", 20, "旭"],
  ["guisong", "刘桂松", 20, "旭"],
  ["yicheng", "刘益承", 22, "延"],
  ["xuan", "刘铉", 23, "禧"],
  ["lin", "刘麟", 23, "禧"],
  ["zishi", "刘子实", 24, "茂"],
  ["liyou", "刘力友", 25, "力"],
  ["lirui", "刘力瑞", 25, "力"],
  ["yibo", "刘贻伯", 26, "贻"],
  ["yitong", "刘贻统", 26, "贻"],
  ["yichuang", "刘贻创", 26, "贻"],
  ["yiguo", "刘贻国", 26, "贻"],
  ["yicao", "刘贻曹", 26, "贻"],
  ["yuanchao", "刘远朝", 27, "远"],
  ["yuanjing", "刘远敬", 27, "远"],
  ["yuanchang", "刘远长", 27, "远"],
  ["yuanhou", "刘远侯", 27, "远"],
  ["yuangao", "刘远高", 27, "远"],
  ["zhiwan", "刘支万", 28, "支"],
  ["zhiqian", "刘支千", 28, "支"],
])
  ku[key] = son(key, name, "d-007", "窟尾沟乡 · 大房二", {
    generation: taokeng(gen, char),
  });
ku.ce = ancient.ce;
people.get(ku.guisong).aliases.push("刘仰松", "仰松", "仰松公");
people.get(ku.ce).aliases.push("松山公", "刘仕政", "仕政");
const kp = (p, cs, start, end = start) =>
  parents(
    [ku[p]],
    cs.map((k) => ku[k]),
    evidence("d-007", start, end),
  );
kp(
  "ce",
  ["yisong", "meisong", "guisong"],
  '刘氏一四三世（桃坑十九世"日"字辈）刘策',
  "生以松、梅松、桂松三子。",
);
kp(
  "yicheng",
  ["xuan", "lin"],
  '桃坑22世"延"字辈刘益承字我任。',
  "生刘铉、刘麟二子。",
);
kp("xuan", ["zishi"], "刘铉字炳谨，", "生子实一子。");
kp("zishi", ["liyou", "lirui"], '桃坑24世"茂"字辈刘子实', "生力友、力瑞二子。");
kp("liyou", ["yibo", "yitong", "yichuang"], "刘力友公", "贻创三子。");
kp("lirui", ["yiguo", "yicao"], "刘力瑞公", "贻曹二子。");
kp(
  "yichuang",
  ["yuanchao", "yuanjing", "yuanchang", "yuanhou"],
  "刘贻创公扩增田产",
  "生远朝、远敬、远长、远侯四子。",
);
kp("yiguo", ["yuangao"], "刘贻国公扩增田产", "生远高一子。");
kp("yuangao", ["zhiwan", "zhiqian"], "远高公", "生支万、支千二子。");
for (const [key, name, parentKey, start, end] of [
  [
    "ce-xin",
    "辛氏",
    "ce",
    '刘氏一四三世（桃坑十九世"日"字辈）刘策',
    "公原配辛氏，继配郑氏，",
  ],
  [
    "ce-zheng",
    "郑氏",
    "ce",
    '刘氏一四三世（桃坑十九世"日"字辈）刘策',
    "公原配辛氏，继配郑氏，",
  ],
  [
    "yicheng-chen",
    "陈氏",
    "yicheng",
    '桃坑22世"延"字辈刘益承字我任。',
    "娶陈氏，",
  ],
  ["zishi-hong", "洪氏", "zishi", '桃坑24世"茂"字辈刘子实', "娶洪氏，"],
])
  marriage(
    ku[parentKey],
    spouse(
      key,
      name,
      "d-007",
      `窟尾沟乡 · ${people.get(ku[parentKey]).name}配偶`,
      { gender: "女" },
    ),
    evidence("d-007", start, end),
  );

// 巷内乡明确分支，重复姓氏配偶按家庭独立建人，不合并。
const alley = { meisong: ku.meisong };
for (const [key, name, gen, char] of [
  ["huayu", "刘化雨", 21, "伯"],
  ["biaodian", "刘标殿", 22, "延"],
  ["wendan", "刘文旦", 23, "禧"],
  ["yongtai", "刘永泰", 23, "禧"],
  ["maoxiang", "刘茂翔", 24, "茂"],
  ["gaoqin", "刘高秦", 24, "茂"],
  ["litian", "刘力添", 25, "力"],
  ["liqian", "刘力谦", 25, "力"],
  ["lizhen", "刘力真", 25, "力"],
  ["liren", "刘力任", 25, "力"],
  ["litian-field", "刘力田", 25, "力"],
  ["lier", "刘力二", 25, "力"],
  ["lisan", "刘力三", 25, "力"],
  ["lisi", "刘力四", 25, "力"],
  ["yixiang", "刘贻祥", 26, "贻"],
  ["yizheng", "刘贻铮", 26, "贻"],
])
  alley[key] = son(key, name, "d-008", "巷内乡刘氏", {
    generation: taokeng(gen, char),
  });
const xp = (p, cs, start, end = start) =>
  parents(
    [alley[p]],
    cs.map((k) => alley[k]),
    evidence("d-008", start, end),
  );
xp("meisong", ["huayu"], "梅松公娶徐氏，生化雨一子。");
xp("huayu", ["biaodian"], '一四五世（桃坑21世"伯"字辈）刘化雨', "生标殿一子。");
xp(
  "biaodian",
  ["wendan", "yongtai"],
  '一四六世（桃坑22世"延"字辈）刘标殿',
  "共生二子。",
);
xp(
  "wendan",
  ["maoxiang", "gaoqin"],
  '一四七世（桃坑23世"禧"字辈）刘文旦',
  "生茂翔、高秦二子。",
);
xp(
  "maoxiang",
  ["litian", "liqian", "lizhen", "liren"],
  '一四八世（桃坑24世"茂"字辈）刘茂翔',
  "力任四子。",
);
xp(
  "gaoqin",
  ["litian-field", "lier", "lisan", "lisi"],
  "刘高秦于明末",
  "力四四子。",
);
xp(
  "liqian",
  ["yixiang", "yizheng"],
  "力谦公致仕后纳林氏为妾，生贻祥、贻铮二子。",
);
for (const [key, name, husband, start, end] of [
  [
    "meisong-xu",
    "徐氏",
    "meisong",
    "梅松公娶徐氏，生化雨一子。",
    "梅松公娶徐氏，生化雨一子。",
  ],
  [
    "huayu-chen",
    "陈氏",
    "huayu",
    '一四五世（桃坑21世"伯"字辈）刘化雨',
    "娶陈氏，",
  ],
  [
    "biaodian-chen",
    "陈氏",
    "biaodian",
    '一四六世（桃坑22世"延"字辈）刘标殿',
    "娶陈氏，生文旦一子，",
  ],
  [
    "biaodian-cai",
    "蔡氏",
    "biaodian",
    '一四六世（桃坑22世"延"字辈）刘标殿',
    "续娶蔡氏，生永泰一子，",
  ],
  [
    "wendan-liang",
    "梁氏",
    "wendan",
    '一四七世（桃坑23世"禧"字辈）刘文旦',
    "娶梁氏，",
  ],
  [
    "maoxiang-liang",
    "梁氏妙贞",
    "maoxiang",
    '一四八世（桃坑24世"茂"字辈）刘茂翔',
    "妣梁氏妙贞，",
  ],
  [
    "liqian-lin",
    "林氏",
    "liqian",
    "力谦公致仕后纳林氏为妾，生贻祥、贻铮二子。",
    "力谦公致仕后纳林氏为妾，生贻祥、贻铮二子。",
  ],
]) {
  const id = spouse(
    key,
    name,
    "d-008",
    `巷内乡 · ${people.get(alley[husband]).name}配偶`,
    { gender: "女" },
  );
  alley[key] = id;
  marriage(alley[husband], id, evidence("d-008", start, end));
}
parents(
  [alley["meisong-xu"]],
  [alley.huayu],
  evidence("d-008", "梅松公娶徐氏，生化雨一子。"),
);
parents(
  [alley["huayu-chen"]],
  [alley.biaodian],
  evidence("d-008", '一四五世（桃坑21世"伯"字辈）刘化雨', "生标殿一子。"),
);
parents(
  [alley["biaodian-chen"]],
  [alley.wendan],
  evidence(
    "d-008",
    '一四六世（桃坑22世"延"字辈）刘标殿',
    "娶陈氏，生文旦一子，",
  ),
);
parents(
  [alley["biaodian-cai"]],
  [alley.yongtai],
  evidence(
    "d-008",
    '一四六世（桃坑22世"延"字辈）刘标殿',
    "续娶蔡氏，生永泰一子，",
  ),
);
parents(
  [alley["liqian-lin"]],
  [alley.yixiang, alley.yizheng],
  evidence("d-008", "力谦公致仕后纳林氏为妾，生贻祥、贻铮二子。"),
);

// Other surnames: direct statements only. No ancestors are fabricated where
// the original explicitly says records have been lost.
function named(key, name, doc, branch, gender, aliases = []) {
  return person(key, name, { sourceDocId: doc, branch, gender, aliases });
}
const otherFamilies = [
  {
    doc: "d-015",
    branch: "廖氏源流",
    father: ["liaoguangjing", "廖光景"],
    children: [
      ["liaoqiongxuan", "廖琼瑄"],
      ["liaolinxuan", "廖琳瑄"],
      ["liaoruixuan", "廖瑞瑄"],
    ],
    start: "廖光景任唐宰相，生琼瑄、琳瑄、瑞瑄三子。",
  },
  {
    doc: "d-015",
    branch: "廖氏源流",
    father: ["liaolinxuan", "廖琳瑄"],
    children: [["liao31", "廖三十一郎"]],
    start: "廖琳瑄以武功",
    end: "其次子廖三十一郎",
  },
  {
    doc: "d-015",
    branch: "廖氏源流",
    father: ["liaoqiongxuan", "廖琼瑄"],
    children: [["liao41", "廖四十一郎"]],
    start: "廖琼瑄于唐天宝二年",
    end: "其子廖四十一郎",
  },
  {
    doc: "d-015",
    branch: "廖氏源流",
    father: ["liaowenxing", "廖文兴"],
    children: [["liaohua", "廖花"]],
    start: "廖花（俗称花公）",
    end: "袭父廖文兴之职",
  },
  {
    doc: "d-016",
    branch: "廖厝 · 画门神",
    father: ["liaodamei", "廖大妹"],
    children: [["liaozhenfa", "廖振发"]],
    start: "廖大妹及儿子廖振发",
  },
  {
    doc: "d-016",
    branch: "廖厝 · 明经第",
    father: ["liaoshaolin", "廖绍林"],
    children: [["liaodefang", "廖德芳"]],
    start: "廖绍林：于晚清时期迁凤塘，长子廖德芳守祖居",
  },
  {
    doc: "d-016",
    branch: "廖厝 · 明经第",
    father: ["liaodeguang", "廖德光"],
    children: [["liaohuitong", "廖惠通"]],
    start: "廖德光长子廖惠通",
  },
  {
    doc: "d-017",
    branch: "草美乡廖氏",
    father: ["liaoxianqin-caomei", "廖先勤"],
    children: [["liaodalin", "廖大麟"]],
    start: "廖先勤于清光绪年间迁樟林，至其子廖大麟于民国初年返乡。",
  },
  {
    doc: "d-020",
    branch: "陈厝 · 阁院派",
    father: ["chencunsou", "陈存叟"],
    children: [["chenlianfeng", "陈莲峰"]],
    start: "陈莲峰因平寇乱",
    end: "尊奉其父陈存叟为一世祖",
  },
  {
    doc: "d-020",
    branch: "陈厝 · 阁院派",
    father: ["chenlianfeng", "陈莲峰"],
    children: [
      ["chenguixuan", "陈桂轩"],
      ["chenguilin", "陈桂林"],
      ["chenguishan", "陈桂山"],
    ],
    start: "陈莲峰卒于元大德二年",
    end: "三子陈桂山迁饶平火寨。",
  },
  {
    doc: "d-024",
    branch: "杜猴寨康氏",
    father: ["kangdacheng", "康大成"],
    children: [
      ["kangcailin", "康才林"],
      ["kangcaixiang", "康才香"],
    ],
    start: "康大成为一大户，生两子，长子康才林，次子康才香。",
  },
  {
    doc: "d-027",
    branch: "洪厝",
    father: ["hongmuzhen", "洪木贞"],
    children: [
      ["hongjinhan", "洪金汉"],
      ["honghanqing", "洪汉清"],
    ],
    start: "仅存洪木贞一户守居。公生金汉、汉清二子。",
  },
  {
    doc: "d-035",
    branch: "绞队井黄氏",
    father: ["huangyicheng", "黄义成"],
    children: [["huangbingsen", "黄炳森"]],
    start: "始祖黄义成",
    end: "携子黄炳森回潮州",
  },
  {
    doc: "d-044",
    branch: "海鹅头钟氏",
    father: ["zhongjinlin", "钟锦麟"],
    children: [["zhongbingyuan", "钟炳元"]],
    start: "海鹅头钟氏，始祖钟锦麟",
    end: "其子钟炳元",
  },
  {
    doc: "d-050",
    branch: "杜猴寨李氏",
    father: ["lilaoda", "李老大"],
    children: [
      ["liderong", "李得荣"],
      ["lidetian", "李得添"],
      ["lidehe", "李得和"],
    ],
    start: "甘草木生三子，长子李得荣",
    end: "次子李得添及三子李得和",
  },
  {
    doc: "d-050",
    branch: "杜猴寨李氏",
    father: ["lifumu", "李福木"],
    children: [
      ["lidemao", "李得茂"],
      ["lidexin", "李得新"],
      ["liyaji", "李亚积"],
    ],
    start: "李福木，以卖甘草货为生",
    end: "三子李亚积出武平",
  },
  {
    doc: "d-051",
    branch: "杜猴寨郭氏",
    father: ["guochunmu", "郭春木"],
    children: [["guodeqing", "郭得庆"]],
    start: "郭春木迁三房，其子孙随母姓。仅长子应征入伍时以郭得庆名字登记",
  },
];
for (const family of otherFamilies) {
  const father = named(...family.father, family.doc, family.branch);
  const children = family.children.map(([key, name]) =>
    named(key.replace(/ /g, ""), name, family.doc, family.branch, "男"),
  );
  parents(
    [father],
    children,
    evidence(family.doc, family.start, family.end || family.start),
  );
}
for (const [
  doc,
  branch,
  key,
  name,
  partnerKey,
  partnerName,
  start,
  end,
  gender,
] of [
  [
    "d-015",
    "廖氏源流",
    "liaohua",
    "廖花",
    "fengyiniang",
    "冯一娘",
    "廖花（俗称花公）",
    "花公花妈生一子廖昌",
    "女",
  ],
  [
    "d-017",
    "草美乡廖氏",
    "liaoxingke",
    "廖兴可",
    "lideyi",
    "李德宜",
    "该乡族长见廖兴可",
    "将义女李德宜许配他为妻",
    "女",
  ],
  [
    "d-044",
    "海鹅头钟氏",
    "zhongbingyuan",
    "钟炳元",
    "zhongbingyuan-wu",
    "枫溪吴氏",
    "其子钟炳元，娶妻枫溪吴氏",
    "其子钟炳元，娶妻枫溪吴氏",
    "女",
  ],
  [
    "d-055",
    "下津曾氏",
    "zengxinhan",
    "曾新汉",
    "xueqiaoyun",
    "薛巧云",
    "始祖曾新汉",
    "娶薛巧云为妻",
    "女",
  ],
]) {
  const a = named(key, name, doc, branch);
  const b = named(partnerKey, partnerName, doc, branch, gender);
  marriage(a, b, evidence(doc, start, end));
}
const liaochang = named("liaochang", "廖昌", "d-015", "廖氏源流", "男");
parents(
  ["family-liaohua", "family-fengyiniang"],
  [liaochang],
  evidence("d-015", "廖花（俗称花公）", "花公花妈生一子廖昌"),
);
const linshaozhang = named("linshaozhang", "林绍章", "d-038", "海鹅头林氏");
const huangMother = named(
  "linshaozhang-mother",
  "黄氏",
  "d-038",
  "海鹅头林氏 · 林绍章之母",
  "女",
);
parents(
  [huangMother],
  [linshaozhang],
  evidence("d-038", "始祖林绍章", "随母黄氏"),
);
people.get("family-lilaoda").aliases.push("甘草木");
people.get("family-lidexin").aliases.push("冯发新");
people.get("family-lidemao").aliases.push("阿软");
people.get("family-liaohua").aliases.push("花公");
people.get("family-fengyiniang").aliases.push("花妈");

// Validate source quotations, uniqueness, absence of loops and stable names.
const personList = [...people.values()];
const relationList = [...relations.values()];
for (const relation of relationList) {
  assert(
    compact(documentMap.get(relation.sourceDocId).text).includes(
      compact(relation.quote),
    ),
    `Untraceable relation ${relation.id}`,
  );
}
const descendants = new Map();
for (const relation of relationList.filter((r) => r.type === "parent")) {
  if (!descendants.has(relation.from)) descendants.set(relation.from, []);
  descendants.get(relation.from).push(relation.to);
}
function assertAcyclic(id, visiting = new Set()) {
  assert(!visiting.has(id), `Ancestry cycle at ${id}`);
  const next = new Set([...visiting, id]);
  for (const child of descendants.get(id) || []) assertAcyclic(child, next);
}
personList.forEach((p) => assertAcyclic(p.id));
assert(
  personList.every((p) => !/思彤|花公花妈|嫘祖为元/.test(p.name)),
  "Incorrect legacy person was imported",
);
const result = {
  schemaVersion: 1,
  notice:
    "按现有村史原文明确的父母、子女与配偶语句整理；未详者保留空缺，同名不自动合并。辈序本身不能推定亲子关系。",
  people: personList,
  relations: relationList,
  stats: {
    people: personList.length,
    parents: relationList.filter((r) => r.type === "parent").length,
    spouses: relationList.filter((r) => r.type === "spouse").length,
  },
};
fs.writeFileSync(
  path.join(root, "public/data/genealogy.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Genealogy: ${result.stats.people} people, ${result.stats.parents} parent links, ${result.stats.spouses} spouse links; every link has a source quotation.`,
);
