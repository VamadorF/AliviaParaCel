/** COM-05 · Seudónimo opcional con RUT real para moderación. */

export function communityDisplayName(input: {
  author: string;
  displayAlias?: string;
}): string {
  const alias = input.displayAlias?.trim();
  return alias || input.author;
}

export function sanitizeAlias(raw: string): string {
  return raw.trim().slice(0, 32);
}
