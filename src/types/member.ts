export type MemberType = 'driver' | 'engineer' | 'crew_chief';

export interface Member {
  id: string;
  name: string;
  surname: string;
  country: string;
  type: MemberType;
  portraitName: string;
  traits: string[];
  stats: {
    // Driver stats
    speed?: number;
    maxSpeed?: number;
    focus?: number;
    maxFocus?: number;
    // Engineer stats
    expertise?: number;
    maxExpertise?: number;
    precision?: number;
    maxPrecision?: number;
    // Crew Chief stats
    skill?: number;
    maxSkill?: number;
  };
  careerStage: string;
  decadeStartContent: boolean;
} 