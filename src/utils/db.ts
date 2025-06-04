import Dexie, { Table } from 'dexie';

export interface Member {
  id: string;
  name: string;
  surname: string;
  country: string;
  careerStage: string;
  portraitName?: string;
  traits: { name: string; display_name: string; description: string }[];
  stats: Record<string, number>;
  cost: number;
  type: 'driver' | 'engineer' | 'crew_chief';
  decadeStartContent?: boolean;
  createdAt?: number;
}

export interface PortraitConfig {
  name: string;
  config: {
    hair: string;
    brow: string;
    facial: string;
    hairBack: string;
    head: string;
    ears: string;
    hairColor: string;
    skinColor: string;
  };
  thumbnail: string;
  fullSizeImage?: string;
  uploaded?: boolean;
}

export interface Modpack {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array of member IDs
  createdAt: number;
  updatedAt: number;
}

class GoldenLapDatabase extends Dexie {
  members!: Table<Member>;
  portraits!: Table<PortraitConfig>;
  modpacks!: Table<Modpack>;

  constructor() {
    super('goldenlap-app');
    this.version(1).stores({
      members: 'id, name, surname, type',
      portraits: 'name',
      modpacks: 'id, name, createdAt'
    });
  }
}

export const db = new GoldenLapDatabase(); 