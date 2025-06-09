export type MemberType = 'driver' | 'engineer' | 'crew_chief';

export interface Trait {
  name: string;
  description: string;
  display_name: string;
  category: string;
}

export interface MemberStats {
  speed?: number;
  focus?: number;
  maxSpeed?: number;
  maxFocus?: number;
  expertise?: number;
  precision?: number;
  maxExpertise?: number;
  maxPrecision?: number;
  skill?: number;
  maxSkill?: number;
}

export interface MemberFormData {
  id?: string;
  name: string;
  surname: string;
  country: string;
  type: MemberType;
  careerStage: string;
  portraitName: string;
  traits: Trait[];
  stats: MemberStats;
  cost: number;
  decadeStartContent: boolean;
  createdAt?: number;
}

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