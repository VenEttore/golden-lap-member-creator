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

export async function saveMembersToStorage(members: Member[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.members.bulkPut(members);
} 