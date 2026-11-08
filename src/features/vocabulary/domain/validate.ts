import type { VocabularyContent } from './types';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/** Checks a vocabulary file. `pictogramExists` is optional (warning only). */
export function validateVocabulary(
  content: VocabularyContent,
  pictogramExists?: (name: string) => boolean,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = [...content.symbols.map((s) => s.id), ...content.storedPhrases.map((p) => p.id)];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate id: ${id}`);
    seen.add(id);
  }
  const pageIds = new Set<string>();
  for (const p of content.pages) {
    if (pageIds.has(p.id)) errors.push(`duplicate page id: ${p.id}`);
    pageIds.add(p.id);
  }

  for (const page of content.pages) {
    for (const cell of page.cells) {
      if (cell !== null && !seen.has(cell)) {
        errors.push(`page ${page.id} references unknown id: ${cell}`);
      }
    }
    if (page.cells.length > 0 && page.cells[page.cells.length - 1] !== null) {
      warnings.push(`page ${page.id}: last cell is not null (adult check chip cannot show)`);
    }
  }
  for (const f of content.folders) {
    if (!seen.has(f.symbolId)) errors.push(`folder references unknown symbol: ${f.symbolId}`);
    if (!pageIds.has(f.opensPage)) errors.push(`folder opens unknown page: ${f.opensPage}`);
  }
  for (const [key, id] of Object.entries(content.coreKeys)) {
    if (!seen.has(id)) errors.push(`core key ${key} references unknown id: ${id}`);
  }
  const categories = new Set(content.symbols.map((s) => s.category));
  for (const t of content.templates) {
    if (!seen.has(t.trigger)) errors.push(`template ${t.id} trigger unknown: ${t.trigger}`);
    for (const p of t.pattern) {
      if (p !== '{slot}' && !seen.has(p)) errors.push(`template ${t.id} pattern unknown id: ${p}`);
    }
    for (const c of t.slotCategories) {
      if (!categories.has(c)) errors.push(`template ${t.id} slot category has no symbol: ${c}`);
    }
  }
  if (pictogramExists) {
    for (const s of content.symbols) {
      if (!pictogramExists(s.pictogram)) warnings.push(`missing pictogram: ${s.pictogram}`);
    }
    for (const p of content.storedPhrases) {
      if (!pictogramExists(p.pictogram)) warnings.push(`missing pictogram: ${p.pictogram}`);
    }
  }
  return { errors, warnings };
}
