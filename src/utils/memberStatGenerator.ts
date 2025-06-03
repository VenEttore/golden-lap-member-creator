// Ported from gen_member_stats.py

export type MemberType = 'chief' | 'driver' | 'engineer';

const MEMBER_DISTRIBUTIONS: any = {
  chief: {
    Type: 'CrewChief',
    base: {
      Speed: { 1: 0.0667, 2: 0.0889, 3: 0.1778, 4: 0.1333, 5: 0.1778, 6: 0.2, 7: 0.0667, 8: 0.0889 },
      Skill: { 1: 0.1111, 2: 0.1333, 3: 0.1556, 4: 0.2444, 5: 0.0889, 6: 0.1333, 7: 0.0889, 8: 0.0444 },
    },
    conditional: {
      MaxSpeed: {
        1: { 3: 1.0 },
        2: { 4: 0.5, 5: 0.5 },
        3: { 4: 0.5, 5: 0.375, 6: 0.125 },
        4: { 5: 0.5, 6: 0.3333, 7: 0.1667 },
        5: { 6: 0.375, 7: 0.375, 8: 0.125, 10: 0.125 },
        6: { 7: 0.2222, 8: 0.6667, 9: 0.1111 },
        7: { 9: 0.6667, 10: 0.3333 },
        8: { 9: 0.5, 10: 0.5 },
      },
      MaxSkill: {
        1: { 3: 0.8, 4: 0.2 },
        2: { 3: 0.1667, 4: 0.5, 5: 0.1667, 8: 0.1667 },
        3: { 4: 0.4286, 5: 0.4286, 6: 0.1429 },
        4: { 5: 0.1818, 6: 0.2727, 7: 0.3636, 9: 0.0909, 10: 0.0909 },
        5: { 6: 0.75, 7: 0.25 },
        6: { 7: 0.1667, 8: 0.5, 9: 0.1667, 10: 0.1667 },
        7: { 8: 0.25, 9: 0.5, 10: 0.25 },
        8: { 10: 1.0 },
      },
    },
  },
  driver: {
    Type: 'Driver',
    groups: {
      none: {
        base: {
          Speed: { 1: 0.0787, 2: 0.1236, 3: 0.1461, 4: 0.1011, 5: 0.1910, 6: 0.1910, 7: 0.1348, 8: 0.0337 },
          Focus: { 1: 0.0562, 2: 0.1461, 3: 0.1573, 4: 0.1798, 5: 0.2022, 6: 0.1461, 7: 0.1011, 8: 0.0112 },
        },
        conditional: {
          MaxSpeed: {
            1: { 3: 0.2857, 4: 0.4286, 5: 0.1429, 6: 0.1429 },
            2: { 3: 0.0909, 4: 0.2727, 5: 0.5455, 6: 0.0909 },
            3: { 4: 0.3846, 5: 0.3077, 6: 0.1538, 7: 0.0769, 8: 0.0769 },
            4: { 5: 0.1111, 6: 0.2222, 7: 0.6667 },
            5: { 6: 0.1176, 7: 0.3529, 8: 0.5294 },
            6: { 7: 0.1176, 8: 0.7059, 9: 0.1765 },
            7: { 9: 0.6667, 10: 0.3333 },
            8: { 9: 0.6667, 10: 0.3333 },
          },
          MaxFocus: {
            1: { 3: 0.2,    4: 0.4,    6: 0.4 },
            2: { 4: 0.3846, 5: 0.4615, 6: 0.1538 },
            3: { 5: 0.2143, 6: 0.6429, 7: 0.0714, 8: 0.0714 },
            4: { 5: 0.1875, 6: 0.3750, 7: 0.3750, 8: 0.0625 },
            5: { 6: 0.1111, 7: 0.7778, 8: 0.0556, 9: 0.0556 },
            6: { 7: 0.2308, 8: 0.5385, 9: 0.2308 },
            7: { 8: 0.2222, 9: 0.5556, 10: 0.2222 },
            8: { 9: 1.0 },
          },
        },
      },
      privateer: {
        base: { Speed: { 1: 1.0 }, Focus: { 1: 0.6667, 2: 0.3333 } },
        conditional: {
          MaxSpeed: { 1: { 3: 1.0 } },
          MaxFocus: { 1: { 2: 0.5, 3: 0.5 }, 2: { 3: 1.0 } },
        },
      },
      rich: {
        base: { Speed: { 1: 1.0 }, Focus: { 1: 1.0 } },
        conditional: {
          MaxSpeed: { 1: { 2: 1.0 } },
          MaxFocus: { 1: { 2: 1.0 } },
        },
      },
    },
  },
  engineer: {
    Type: 'Engineer',
    base: {
      Expertise: { 2: 0.0667, 3: 0.1778, 4: 0.2222, 5: 0.2667, 6: 0.1778, 7: 0.0889 },
      Precision: { 2: 0.0222, 3: 0.2222, 4: 0.3111, 5: 0.2889, 6: 0.1556 },
    },
    conditional: {
      MaxExpertise: {
        2: { 4: 0.3333, 6: 0.6667 },
        3: { 4: 0.25, 5: 0.5, 6: 0.125, 7: 0.125 },
        4: { 5: 0.2, 6: 0.3, 7: 0.3, 8: 0.2 },
        5: { 6: 0.4167, 7: 0.25, 8: 0.25, 10: 0.0833 },
        6: { 7: 0.25, 8: 0.25, 9: 0.375, 10: 0.125 },
        7: { 8: 0.25, 9: 0.25, 10: 0.5 },
      },
      MaxPrecision: {
        2: { 5: 1.0 },
        3: { 4: 0.4, 5: 0.2, 6: 0.3, 7: 0.1 },
        4: { 5: 0.3571, 6: 0.3571, 7: 0.1429, 8: 0.1429 },
        5: { 6: 0.3077, 7: 0.2308, 8: 0.4615 },
        6: { 7: 0.1429, 8: 0.5714, 9: 0.1429, 10: 0.1429 },
      },
    },
  },
};

function weightedChoice(choices: Record<number, number>): number {
  const entries = Object.entries(choices);
  const values = entries.map(([v]) => Number(v));
  const weights = entries.map(([, w]) => Number(w));
  const total = weights.reduce((a, b) => a + b, 0);
  const norm = weights.map(w => w / total);
  let r = Math.random();
  for (let i = 0; i < values.length; ++i) {
    if (r < norm[i]) return values[i];
    r -= norm[i];
  }
  return values[values.length - 1];
}

function transformStatsToLowercase(stats: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(stats)) {
    // Convert MaxSpeed to maxSpeed, Speed to speed, etc.
    const newKey = key.replace(/^Max/, 'max').replace(/^[A-Z]/, c => c.toLowerCase());
    result[newKey] = value;
  }
  return result;
}

export function generateMemberStats(type: MemberType, trait?: 'none' | 'privateer' | 'rich'): Record<string, number> {
  const key = type.toLowerCase();
  if (key === 'driver') {
    // Use trait-dependent logic
    let subgroup: 'none' | 'privateer' | 'rich' = 'none';
    if (trait === 'privateer' || trait === 'rich') subgroup = trait;
    const data = MEMBER_DISTRIBUTIONS.driver.groups[subgroup];
    const result: Record<string, number> = {};
    // Sample each base stat independently
    for (const baseStat in data.base) {
      result[baseStat] = weightedChoice(data.base[baseStat]);
    }
    // Sample each max stat conditioned on its base
    for (const maxStat in data.conditional) {
      const baseName = maxStat.replace(/^Max/, '');
      const baseVal = result[baseName];
      const row = data.conditional[maxStat][baseVal];
      result[maxStat] = weightedChoice(row);
    }
    return transformStatsToLowercase(result);
  } else {
    const data = MEMBER_DISTRIBUTIONS[key];
    const result: Record<string, number> = {};
    // Sample each base stat independently
    for (const baseStat in data.base) {
      result[baseStat] = weightedChoice(data.base[baseStat]);
    }
    // Sample each max stat conditioned on its base
    for (const maxStat in data.conditional) {
      const baseName = maxStat.replace(/^Max/, '');
      const baseVal = result[baseName];
      const row = data.conditional[maxStat][baseVal];
      result[maxStat] = weightedChoice(row);
    }
    return transformStatsToLowercase(result);
  }
} 