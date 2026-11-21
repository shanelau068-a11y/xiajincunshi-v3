const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[\s·・]/g, "")
    .toLocaleLowerCase();

function searchNames(person) {
  const values = new Set(
    [person.name, ...(person.aliases || [])].map(normalize).filter(Boolean),
  );
  const surname = normalize(person.clan).replace(/氏$/u, "");
  if (surname) {
    for (const alias of person.aliases || []) {
      const value = normalize(alias);
      if (value && !value.startsWith(surname)) values.add(`${surname}${value}`);
    }
  }
  return [...values];
}

function scoreNames(names, needle) {
  if (names.some((value) => value === needle)) return 0;
  if (names.some((value) => value.startsWith(needle))) return 1;
  return 2;
}

export function findGenealogyPeople(people, term) {
  const needle = normalize(term);
  if (!needle) return [];
  return people
    .filter((person) =>
      searchNames(person).some((value) => value.includes(needle)),
    )
    .sort(
      (a, b) =>
        scoreNames(searchNames(a), needle) -
          scoreNames(searchNames(b), needle) ||
        a.name.localeCompare(b.name, "zh-CN") ||
        (a.branch || "").localeCompare(b.branch || "", "zh-CN"),
    );
}

export function findBiographyPeople(people, term) {
  const needle = normalize(term);
  if (!needle) return [];
  return people
    .filter((person) => normalize(person.name).includes(needle))
    .sort(
      (a, b) =>
        scoreNames([normalize(a.name)], needle) -
          scoreNames([normalize(b.name)], needle) ||
        a.name.localeCompare(b.name, "zh-CN"),
    );
}
