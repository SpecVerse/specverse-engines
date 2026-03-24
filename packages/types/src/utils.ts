/**
 * Shared utilities used across engine packages
 */

/**
 * Pluralize an English word (naive but handles common cases).
 * Covers: -y → -ies, sibilants (-s/-x/-z/-ch/-sh) → -es, default → -s.
 */
export function pluralize(word: string): string {
  if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  return word + 's';
}
