// Cost calculation point values from docs
const DRIVER_POINT_VALUES = [0, 1, 2, 3, 4, 5, 7, 10, 14, 18, 24];
const ENG_CREW_POINT_VALUES = [0, 1, 2, 3, 4, 6, 9, 13, 18, 24, 31];

export function calculateMemberCost(type: 'driver' | 'engineer' | 'crew_chief', stats: Record<string, number>, selectedTraits: { name: string }[]) {
  // Trait modifiers
  const hasRichParents = selectedTraits.some(t => t.name === 'RichParents');
  const hasPrivateer = selectedTraits.some(t => t.name === 'Privateer');
  if (hasRichParents && type === 'driver') return 0;

  if (type === 'driver') {
    const speed = stats.speed || 0;
    const focus = stats.focus || 0;
    const maxSpeed = stats.maxSpeed || 0;
    const maxFocus = stats.maxFocus || 0;
    const pv = DRIVER_POINT_VALUES;
    let cost = Math.ceil(pv[speed] + pv[focus] + (maxSpeed + maxFocus) / 2);
    if (hasPrivateer) cost = Math.max(0, cost - 5);
    return cost;
  } else if (type === 'engineer') {
    const expertise = stats.expertise || 0;
    const precision = stats.precision || 0;
    const maxExpertise = stats.maxExpertise || 0;
    const maxPrecision = stats.maxPrecision || 0;
    const pv = ENG_CREW_POINT_VALUES;
    return Math.ceil((pv[expertise] + pv[precision] + (maxExpertise + maxPrecision) / 2) / 2.5);
  } else if (type === 'crew_chief') {
    const speed = stats.speed || 0;
    const skill = stats.skill || 0;
    const maxSpeed = stats.maxSpeed || 0;
    const maxSkill = stats.maxSkill || 0;
    const pv = ENG_CREW_POINT_VALUES;
    return Math.ceil((pv[skill] + pv[speed] + (maxSkill + maxSpeed) / 2) / 3);
  }
  return 0;
} 