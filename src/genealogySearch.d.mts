export type SearchableGenealogyPerson = {
  id: string;
  name: string;
  aliases: string[];
  branch?: string;
  clan?: string;
};

export type BiographySearchPerson = {
  id: string;
  name: string;
  category: string;
  summary: string;
  documentId?: string | null;
};

export function findGenealogyPeople<T extends SearchableGenealogyPerson>(
  people: T[],
  term: string,
): T[];

export function findBiographyPeople<T extends BiographySearchPerson>(
  people: T[],
  term: string,
): T[];
