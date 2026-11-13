import assert from "node:assert/strict";

export const generationSequence =
  "日旭伯延禧茂力贻远支光宗绍世德裕昆启鸿泽承先贤立新业春辉耀汉宇应运定乾坤群豪展壮志伟绩史长存桂兰恒畅懋嗣续竞鹏程建勋时作述昭著奕斯名";
export const generationRows = [...generationSequence].map(
  (character, index) => ({
    character,
    global: 143 + index,
    taokeng: 19 + index,
  }),
);
assert.equal(generationRows.length, 66);
assert.equal(generationRows.at(-1).global, 208);
assert.equal(generationRows.at(-1).taokeng, 84);

export const correctionRecords = [
  {
    id: "name-yutong-20261112",
    documentId: "d-007",
    before: "思彤",
    after: "语彤",
    description: "雄明与陆佩东之女，依用户明确校正姓名为语彤。",
    authority: "用户校正",
    date: "2026-11-12",
  },
  {
    id: "liushi-generation-20261112",
    documentId: "d-007",
    description:
      "依用户提供的辈序牌匾补全66字。日为刘氏总143世、桃坑19世；名为刘氏总208世、桃坑84世。照片的競规范为竞，保留懋、昭、奕。",
    authority: "用户提供照片并明确要求以图片为准",
    sourceImage: "media/genealogy/liushi-generation-board.jpg",
    date: "2026-11-12",
  },
];

export function applyDocumentCorrections(document) {
  if (document.id !== "d-007") return document;
  assert(document.html.includes("雄明与陆佩东育有"), "姓名校正上下文不符");
  const html = document.html
    .replace(
      /(雄明与陆佩东育有：[\s\S]*?女<strong>)思彤(<\/strong>)/u,
      "$1语彤$2",
    )
    .replace(
      /刘氏桃坑辈序：[^<]+/u,
      `刘氏桃坑辈序：${[...generationSequence].join("、")}`,
    );
  const text = document.text
    .replace(/(雄明与陆佩东育有：[^\n]*?女\s*)思彤/u, "$1语彤")
    .replace(
      /刘氏桃坑辈序：[^\n]+/u,
      `刘氏桃坑辈序：${[...generationSequence].join("、")}`,
    );
  assert(!html.includes("思彤") && !text.includes("思彤"), "旧姓名未完全校正");
  assert(html.includes("语彤") && text.includes("语彤"));
  return {
    ...document,
    html,
    text,
    correctionIds: correctionRecords.map((record) => record.id),
  };
}

export const generationData = {
  schemaVersion: 1,
  title: "刘氏桃坑辈序",
  sequence: generationSequence,
  rows: generationRows,
  sourceImage: "media/genealogy/liushi-generation-board.jpg",
  sourceDocumentId: "d-007",
  sourceNote:
    "依用户提供的刘氏辈序牌匾逐字核对。照片注“日为143世，至名字为208世”。书中另记日为桃坑19世，因此两种世次相差124。",
  transcriptionNote:
    "图片中的繁体字转换为对应简体；第196世为竞（競），193世为懋，204世为昭，206世为奕。",
  count: 66,
  startGlobal: 143,
  endGlobal: 208,
  startTaokeng: 19,
  endTaokeng: 84,
  reviewedAt: "2026-11-12",
};

export const supplementalPhotos = [
  {
    id: "xiajin-old-village-20261113",
    title: "下津村落旧影",
    category: "村貌风物",
    image: "media/photos/xiajin-old-village-20261113.jpg",
    sourcePage: "补充旧照片",
    description:
      "补充留存的村落旧照片，可见老屋、村路、池塘与远山。村史原文没有写明这一画面的具体地点，拍摄年代及地点说明待补充。",
    year: "拍摄年代未注明",
  },
  {
    id: "liushi-generation-board-20261112",
    title: "刘氏辈序牌匾",
    category: "族谱资料",
    image: "media/genealogy/liushi-generation-board.jpg",
    sourcePage: "用户补充照片 · 辈序牌匾",
    description:
      "后续补充留存的刘氏辈序牌匾原图，日为刘氏总143世至名为208世；与村史中的桃坑19世至84世对应。牌匾是辈序依据，不作为父子关系证明。",
    year: "拍摄年代未注明",
  },
];
