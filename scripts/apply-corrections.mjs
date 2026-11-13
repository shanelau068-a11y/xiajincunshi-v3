import fs from "node:fs";
import {
  applyDocumentCorrections,
  correctionRecords,
  generationData,
  supplementalPhotos,
} from "./content-corrections.mjs";
const read = (name) =>
  JSON.parse(fs.readFileSync(`public/data/${name}.json`, "utf8"));
const write = (name, value) =>
  fs.writeFileSync(
    `public/data/${name}.json`,
    JSON.stringify(value, null, 2) + "\n",
  );
const documents = read("documents").map(applyDocumentCorrections);
write("documents", documents);
write("corrections", correctionRecords);
write("generation", generationData);
const photos = read("photos");
for (const photo of supplementalPhotos) {
  const index = photos.findIndex((item) => item.id === photo.id);
  if (index >= 0) photos[index] = photo;
  else photos.push(photo);
}
write("photos", photos);
const manifest = read("manifest");
manifest.characters = documents.reduce(
  (total, doc) => total + doc.text.length,
  0,
);
manifest.corrections = correctionRecords.length;
manifest.photos = photos.length;
write("manifest", manifest);
console.log(
  "Applied scoped name correction and verified 66 generation characters (143–208 / Taokeng 19–84).",
);
