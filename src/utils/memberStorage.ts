// Utility for managing Golden Lap members in localStorage

import { idbGetItem, idbSetItem, idbRemoveItem } from './idbStorage';

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
  // Add any other fields as needed
}

const STORAGE_KEY = 'goldenLapMembers';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getMembers(): Promise<Member[]> {
  if (typeof window === 'undefined') return [];
  const raw = await idbGetItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveMember(member: Member): Promise<void> {
  const members = await getMembers();
  let updated = false;
  if (!member.id) member.id = generateId();
  const newMembers = members.map(m => {
    if (m.id === member.id) {
      updated = true;
      return member;
    }
    return m;
  });
  if (!updated) newMembers.push(member);
  await idbSetItem(STORAGE_KEY, JSON.stringify(newMembers));
}

export async function deleteMember(id: string): Promise<void> {
  const members = (await getMembers()).filter(m => m.id !== id);
  await idbSetItem(STORAGE_KEY, JSON.stringify(members));
}

export async function exportMembers(): Promise<string> {
  return JSON.stringify(await getMembers(), null, 2);
}

export async function importMembers(json: string, merge = true): Promise<void> {
  let imported: Member[] = [];
  try {
    imported = JSON.parse(json);
  } catch {
    return;
  }
  if (!Array.isArray(imported)) return;
  if (merge) {
    const existing = await getMembers();
    // Merge by id, prefer imported
    const byId: Record<string, Member> = {};
    for (const m of existing) byId[m.id] = m;
    for (const m of imported) byId[m.id] = m;
    await idbSetItem(STORAGE_KEY, JSON.stringify(Object.values(byId)));
  } else {
    await idbSetItem(STORAGE_KEY, JSON.stringify(imported));
  }
}

export async function saveMembersToStorage(members: Member[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await idbSetItem('goldenLapMembers', JSON.stringify(members));
} 