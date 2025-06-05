// Utility to map country codes to flagcdn codes, including UK sub-nationalities
export function codeToFlagCdn(code: string): string {
  const map: Record<string, string> = {
    GBENG: 'gb-eng',
    GBSCT: 'gb-sct',
    GBWLS: 'gb-wls',
    GBNIR: 'gb-nir',
  };
  if (map[code]) return map[code];
  return code.toLowerCase();
} 