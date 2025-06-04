// Utility for managing Golden Lap members in localStorage

import { db, Member } from './db';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type { Member };

export async function getMembers(): Promise<Member[]> {
  if (typeof window === 'undefined') return [];
  return await db.members.toArray();
}

export async function saveMember(member: Member): Promise<void> {
  if (!member.id) member.id = generateId();
  await db.members.put(member);
}

export async function deleteMember(id: string): Promise<void> {
  await db.members.delete(id);
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
    // Get existing members
    const existing = await getMembers();
    const byId: Record<string, Member> = {};
    
    // Add existing members to map
    for (const m of existing) byId[m.id] = m;
    
    // Update with imported members
    for (const m of imported) byId[m.id] = m;
    
    // Bulk put all members
    await db.members.bulkPut(Object.values(byId));
  } else {
    // Clear existing and add new
    await db.members.clear();
    await db.members.bulkPut(imported);
  }
}

export async function saveMembersToStorage(members: Member[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.members.bulkPut(members);
} 