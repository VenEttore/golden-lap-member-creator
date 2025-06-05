// Utility for weighted random selection of career stage
export function weightedCareerStage(type: 'driver' | 'engineer' | 'crew_chief'): string {
  const tables: Record<string, { value: string, weight: number }[]> = {
    crew_chief: [
      { value: 'early', weight: 0.31 },
      { value: 'mid', weight: 0.444 },
      { value: 'late', weight: 0.244 },
      { value: 'last_year', weight: 0.001 },
    ],
    driver: [
      { value: 'early', weight: 0.658 },
      { value: 'mid', weight: 0.333 },
      { value: 'late', weight: 0.007 },
      { value: 'last_year', weight: 0.001 },
    ],
    engineer: [
      { value: 'early', weight: 0.51 },
      { value: 'mid', weight: 0.289 },
      { value: 'late', weight: 0.2 },
      { value: 'last_year', weight: 0.001 },
    ],
  };
  const table = tables[type];
  const total = table.reduce((sum, { weight }) => sum + weight, 0);
  let r = Math.random() * total;
  for (const { value, weight } of table) {
    if (r < weight) return value;
    r -= weight;
  }
  return table[table.length - 1].value;
} 