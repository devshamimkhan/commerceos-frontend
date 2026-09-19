export function parseBulkTagNames(value: string): string[] {
  const unwrapped = value.trim().replace(/^\[/, '').replace(/\]$/, '');
  const unique = new Map<string, string>();

  for (const part of unwrapped.split(',')) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, name);
  }

  return [...unique.values()];
}
