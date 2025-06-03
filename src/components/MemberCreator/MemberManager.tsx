"use client";
import React, { useState, useEffect } from 'react';
import { addOrUpdatePortrait, getPortraits } from '@/utils/portraitStorage';
import { PortraitConfig } from '@/types/portrait';
import { fetchRandomTraits, fetchRandomName, RANDOM_NATIONS, CAREER_STAGES } from '../MemberCreator/MemberCreatorModern';
import { generateMemberStats } from '../../utils/memberStatGenerator';

// Basic team member interface
export interface TeamMember {
  id: string;
  name: string;
  surname: string;
  countryCode: string;
  type: 'driver' | 'engineer' | 'crew_chief';
  portraitName: string;
  // Placeholders for traits and stats
  traits: string[];
  stats: Record<string, number>;
}

function getMembersFromStorage(): TeamMember[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('members');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMembersToStorage(members: TeamMember[]) {
  localStorage.setItem('members', JSON.stringify(members));
}

const MemberManager: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomCounts, setRandomCounts] = useState({ driver: 0, engineer: 0, crew_chief: 0 });
  const [generating, setGenerating] = useState(false);

  // Load members on mount
  useEffect(() => {
    setMembers(getMembersFromStorage());
  }, []);

  // Add or update member
  function handleSave(member: TeamMember) {
    let updated: TeamMember[];
    if (members.some(m => m.id === member.id)) {
      updated = members.map(m => (m.id === member.id ? member : m));
    } else {
      updated = [...members, member];
    }
    setMembers(updated);
    saveMembersToStorage(updated);
    setShowForm(false);
    setEditing(null);
  }

  // Delete member
  function handleDelete(id: string) {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    saveMembersToStorage(updated);
  }

  // Delete all members
  function deleteAllMembers() {
    localStorage.removeItem('members');
    setMembers([]);
  }

  // Start editing
  function handleEdit(member: TeamMember) {
    setEditing(member);
    setShowForm(true);
  }

  // Start adding
  function handleAdd() {
    setEditing(null);
    setShowForm(true);
  }

  async function handleGenerateRandom() {
    setShowRandomModal(true);
  }

  async function doBatchRandomGeneration() {
    setGenerating(true);
    setShowRandomModal(false);
    const { driver, engineer, crew_chief } = randomCounts;
    const total = driver + engineer + crew_chief;
    if (total === 0) { setGenerating(false); return; }

    // 1. Generate X random portraits
    const generatedPortraits: PortraitConfig[] = [];
    for (let i = 0; i < total; ++i) {
      // Use the randomizer logic from MemberCreatorModern or PortraitGeneratorPanel
      // For simplicity, just randomize config fields
      const config = {
        hair: Math.random().toString(36).slice(2, 10),
        brow: Math.random().toString(36).slice(2, 10),
        facial: '',
        hairBack: '',
        head: Math.random().toString(36).slice(2, 10),
        ears: Math.random().toString(36).slice(2, 10),
        hairColor: '#8e7355',
        skinColor: '#bc8277',
      };
      const name = `RandomPortrait_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const thumbnail = '';
      generatedPortraits.push({ name, config, thumbnail });
      await addOrUpdatePortrait({ name, config, thumbnail });
    }
    // Shuffle portraits for assignment
    const shuffledPortraits = [...generatedPortraits].sort(() => 0.5 - Math.random());
    let portraitIdx = 0;
    // 2. Generate members
    const newMembers: TeamMember[] = [];
    async function makeMember(type: 'driver' | 'engineer' | 'crew_chief') {
      const country = RANDOM_NATIONS[Math.floor(Math.random() * RANDOM_NATIONS.length)];
      const careerStage = CAREER_STAGES[Math.floor(Math.random() * CAREER_STAGES.length)];
      // Map type for stat generator
      const statGenType = type === 'crew_chief' ? 'chief' : type;
      const stats = generateMemberStats(statGenType as any);
      const traits = await fetchRandomTraits(type);
      let randomName = { name: '', surname: '' };
      try {
        randomName = await fetchRandomName(country);
      } catch {}
      const portraitName = shuffledPortraits[portraitIdx++].name;
      return {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        name: randomName.name,
        surname: randomName.surname,
        countryCode: country,
        type,
        portraitName,
        traits: traits.map(t => t.name),
        stats,
      };
    }
    for (let i = 0; i < driver; ++i) newMembers.push(await makeMember('driver'));
    for (let i = 0; i < engineer; ++i) newMembers.push(await makeMember('engineer'));
    for (let i = 0; i < crew_chief; ++i) newMembers.push(await makeMember('crew_chief'));
    // 3. Save all
    const updated = [...members, ...newMembers];
    setMembers(updated);
    saveMembersToStorage(updated);
    setGenerating(false);
  }

  // Simple form for add/edit
  function MemberForm({ member, onSave, onCancel }: { member?: TeamMember; onSave: (m: TeamMember) => void; onCancel: () => void }) {
    const [form, setForm] = useState<TeamMember>(
      member || {
        id: Math.random().toString(36).slice(2),
        name: '',
        surname: '',
        countryCode: '',
        type: 'driver',
        portraitName: '',
        traits: [],
        stats: {},
      }
    );
    return (
      <div style={{ background: '#181818', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1 }} />
          <input placeholder="Surname" value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} style={{ flex: 1 }} />
          <input placeholder="Country Code" value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))} style={{ width: 60 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TeamMember['type'] }))}>
            <option value="driver">Driver</option>
            <option value="engineer">Engineer</option>
            <option value="crew_chief">Crew Chief</option>
          </select>
          <input placeholder="Portrait Name" value={form.portraitName} onChange={e => setForm(f => ({ ...f, portraitName: e.target.value }))} style={{ flex: 1 }} />
        </div>
        {/* Placeholders for traits and stats */}
        <div style={{ marginBottom: 8, color: '#aaa' }}>[Traits and stats UI here]</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onSave(form)} style={{ background: '#444', color: '#fff', border: '1px solid #888', borderRadius: 4, padding: '4px 12px' }}>Save</button>
          <button onClick={onCancel} style={{ background: '#222', color: '#fff', border: '1px solid #888', borderRadius: 4, padding: '4px 12px' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#111', padding: 24, borderRadius: 8, marginTop: 32 }}>
      <h2>Team Members</h2>
      <button onClick={handleAdd} style={{ marginBottom: 16, background: '#444', color: '#fff', border: '1px solid #888', borderRadius: 4, padding: '4px 12px' }}>Add Member</button>
      <button onClick={handleGenerateRandom} style={{ marginBottom: 16, marginLeft: 8, background: '#fd655c', color: '#fff', border: '1px solid #b92d2a', borderRadius: 4, padding: '4px 12px' }}>Generate Random</button>
      {showRandomModal && (
        <div style={{ background: '#222', color: '#fff', padding: 24, borderRadius: 8, marginBottom: 16, zIndex: 100, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', minWidth: 320 }}>
          <h3>Generate Random Members</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
            <label>Drivers: <input type="number" min={0} value={randomCounts.driver} onChange={e => setRandomCounts(c => ({ ...c, driver: +e.target.value }))} /></label>
            <label>Engineers: <input type="number" min={0} value={randomCounts.engineer} onChange={e => setRandomCounts(c => ({ ...c, engineer: +e.target.value }))} /></label>
            <label>Crew Chiefs: <input type="number" min={0} value={randomCounts.crew_chief} onChange={e => setRandomCounts(c => ({ ...c, crew_chief: +e.target.value }))} /></label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={doBatchRandomGeneration} style={{ background: '#fd655c', color: '#fff', border: '1px solid #b92d2a', borderRadius: 4, padding: '4px 12px' }}>Generate</button>
            <button onClick={() => setShowRandomModal(false)} style={{ background: '#222', color: '#fff', border: '1px solid #888', borderRadius: 4, padding: '4px 12px' }}>Cancel</button>
          </div>
        </div>
      )}
      {generating && <div style={{ color: '#fd655c', marginBottom: 16 }}>Generating random members and portraits...</div>}
      {showForm && (
        <MemberForm
          member={editing || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.length === 0 && <div style={{ color: '#aaa' }}>No members created.</div>}
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#181818', borderRadius: 4, padding: 8 }}>
            <span style={{ flex: 2, color: '#fff' }}>{m.name} {m.surname}</span>
            <span style={{ flex: 1, color: '#aaa' }}>{m.type}</span>
            <span style={{ flex: 1, color: '#aaa' }}>{m.countryCode}</span>
            <span style={{ flex: 2, color: '#aaa' }}>{m.portraitName}</span>
            <button onClick={() => handleEdit(m)} style={{ background: '#333', color: '#fff', border: '1px solid #666', borderRadius: 3, padding: '2px 8px', fontSize: 12 }}>Edit</button>
            <button onClick={() => handleDelete(m.id)} style={{ background: '#a33', color: '#fff', border: '1px solid #a66', borderRadius: 3, padding: '2px 8px', fontSize: 12 }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberManager; 