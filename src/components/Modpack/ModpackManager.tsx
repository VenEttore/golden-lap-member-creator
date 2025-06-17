import React, { useState, useEffect } from 'react';
import { Modpack } from '../../types/modpack';
import { Member } from '../../utils/memberStorage';
import { getModpacks, saveModpack, deleteModpack, exportModpack } from '../../utils/modpackStorage';
import { getMembers } from '../../utils/memberStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faDownload, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../ui/Card';
import { Toggle } from '../ui/toggle';

export default function ModpackManager() {
  const [modpacks, setModpacks] = useState<Modpack[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [modpackSearch, setModpackSearch] = useState('');
  const [selectedModpackId, setSelectedModpackId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Modpack | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const isEditing = !!draft && !!draft.id && modpacks.some(m => m.id === draft.id);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      const loadedModpacks = await getModpacks();
      const cleanedModpacks = loadedModpacks.map(modpack => ({
        ...modpack,
        members: Array.from(new Set(modpack.members)),
      }));
      for (let idx = 0; idx < cleanedModpacks.length; idx++) {
        if (cleanedModpacks[idx].members.length !== loadedModpacks[idx]?.members.length) {
          await saveModpack(cleanedModpacks[idx]);
        }
      }
      setModpacks(cleanedModpacks);
      const loadedMembers = await getMembers();
      setMembers(loadedMembers);
    })();
  }, []);

  // When selecting a modpack, load it into the draft
  useEffect(() => {
    if (selectedModpackId) {
      const modpack = modpacks.find(m => m.id === selectedModpackId);
      if (modpack) setDraft({ ...modpack });
    } else {
      setDraft(null);
    }
  }, [selectedModpackId, modpacks]);

  // When creating a new modpack
  const handleNew = () => {
    setSelectedModpackId(null);
    setDraft({
      id: Math.random().toString(36).slice(2),
      name: '',
      description: '',
      members: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setNameError(null);
    setMemberError(null);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!draft) return;
    // Validate name
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    const duplicate = modpacks.find(m => m.name === trimmedName && m.id !== draft.id);
    if (duplicate) {
      setNameError('A modpack with this name already exists');
      return;
    }
    setNameError(null);
    // Validate members (no duplicate names)
    const modpackMembers = members.filter(m => draft.members.includes(m.id));
    const nameSet = new Set<string>();
    for (const member of modpackMembers) {
      const fullName = `${member.name} ${member.surname}`.trim();
      if (nameSet.has(fullName)) {
        setMemberError('Duplicate member names are not allowed');
        return;
      }
      nameSet.add(fullName);
    }
    setMemberError(null);
    const now = Date.now();
    const updated: Modpack = {
      ...draft,
      name: trimmedName,
      updatedAt: now,
      createdAt: draft.createdAt || now,
    };
    await saveModpack(updated);
    const loaded = await getModpacks();
    setModpacks(loaded);
    setSelectedModpackId(updated.id);
  };

  // Delete
  const handleDelete = async (id: string) => {
    await deleteModpack(id);
    const loaded = await getModpacks();
    setModpacks(loaded);
    if (selectedModpackId === id) {
      setSelectedModpackId(null);
      setDraft(null);
    }
  };

  // Export
  const handleExport = async (modpack: Modpack) => {
    setDownloading(true);
    try {
      const blob = await exportModpack(modpack, {
        includePortraits: true,
        decadeStartContent: true,
        outputFormat: 'zip',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${modpack.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting modpack:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Filter modpacks by search
  const filteredModpacks = modpacks.filter(mp =>
    mp.name.toLowerCase().includes(modpackSearch.toLowerCase()) ||
    (mp.description || '').toLowerCase().includes(modpackSearch.toLowerCase())
  );

  // UI
  return (
    <div style={{ background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)', minHeight: '100vh', fontFamily: 'Figtree, Inter, sans-serif' }} className="flex flex-col min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto pt-8 pb-8 px-4">
        <div style={{ display: 'flex', flexDirection: 'row', gap: 40, alignItems: 'flex-start', minWidth: 0, width: '100%' }}>
          {/* Left: Modpack List */}
          <div style={{ flex: '0 0 340px', minWidth: 320 }}>
            <Card title="Modpacks" className="mb-4">
              <div className="flex flex-col gap-2">
                <Toggle
                  onClick={handleNew}
                  className="w-full justify-center !bg-[#fd655c] !text-white !border-[#fd655c] hover:!bg-[#b92d2a] hover:!border-[#b92d2a] mb-2"
                  style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" /> New Modpack
                </Toggle>
                <input
                  type="text"
                  value={modpackSearch}
                  onChange={e => setModpackSearch(e.target.value)}
                  placeholder="Search modpacks..."
                  className="border rounded p-2 mb-2 w-full"
                  style={{ fontSize: 16 }}
                />
                <div style={{ maxHeight: 520, overflowY: 'auto', background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: 8, boxShadow: '0 2px 8px rgba(52,79,58,0.06)' }}>
                  {filteredModpacks.length === 0 && (
                    <div style={{ color: '#aaa', padding: 16 }}>No modpacks found.</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredModpacks.map(mp => (
                      <div
                        key={mp.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedModpackId === mp.id ? '#fff5f5' : '#f8f7f4', borderRadius: 8, border: selectedModpackId === mp.id ? '2px solid #fd655c' : '1px solid #d1cfc7', padding: '8px 8px', cursor: 'pointer' }}
                        onClick={() => setSelectedModpackId(mp.id)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mp.name}</div>
                          <div style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mp.description}</div>
                        </div>
                        <button title="Export" onClick={e => { e.stopPropagation(); handleExport(mp); }} className="p-1 text-[#b92d2a] hover:text-[#fd655c]">
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button title="Edit" onClick={e => { e.stopPropagation(); setSelectedModpackId(mp.id); }} className="p-1 text-[#b92d2a] hover:text-[#fd655c]">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button title="Delete" onClick={e => { e.stopPropagation(); handleDelete(mp.id); }} className="p-1 text-[#b92d2a] hover:text-[#fd655c]">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          {/* Right: Modpack Editor */}
          <div style={{ flex: 1, minWidth: 400 }}>
            <Card title={isEditing ? 'Edit Modpack' : 'Create New Modpack'}>
              {draft ? (
                <form
                  onSubmit={e => { e.preventDefault(); handleSave(); }}
                  className="flex flex-col gap-4"
                  autoComplete="off"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Modpack Name"
                      value={draft.name}
                      onChange={e => setDraft(f => f ? { ...f, name: e.target.value } : f)}
                      className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`}
                    />
                    {nameError && <div className="text-red-500 text-sm mt-1">{nameError}</div>}
                  </div>
                  <div>
                    <textarea
                      placeholder="Description"
                      value={draft.description}
                      onChange={e => setDraft(f => f ? { ...f, description: e.target.value } : f)}
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="font-bold mb-2 text-lg">Add/Remove Members</div>
                    <div className="max-h-[340px] overflow-y-auto pr-2 flex flex-col gap-1">
                      {members.length === 0 && <div className="text-gray-500">No members available.</div>}
                      {members.map(member => {
                        const fullName = `${member.name} ${member.surname}`.trim();
                        const isSelected = draft.members.includes(member.id);
                        // Check if another selected member has the same name (excluding this member)
                        const nameTaken = draft.members.some(id => {
                          if (id === member.id) return false;
                          const other = members.find(m => m.id === id);
                          return other && `${other.name} ${other.surname}`.trim() === fullName;
                        });
                        const wouldBeDuplicate = isSelected ? false : nameTaken;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              if (wouldBeDuplicate) return;
                              setDraft(f => {
                                if (!f) return f;
                                if (f.members.includes(member.id)) {
                                  return { ...f, members: f.members.filter(id => id !== member.id) };
                                }
                                return { ...f, members: [...f.members, member.id] };
                              });
                            }}
                            className={`block w-full text-left px-3 py-2 rounded border transition-colors ${isSelected ? 'bg-[#fff5f5] border-[#fd655c]' : wouldBeDuplicate ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' : 'bg-white border-gray-200 hover:border-[#fd655c]'}`}
                            disabled={wouldBeDuplicate}
                          >
                            <span className="font-medium">{member.name} {member.surname}</span>
                            <span className="ml-2 text-xs text-gray-500">{member.type}</span>
                            {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-2 text-[#fd655c]" />}
                          </button>
                        );
                      })}
                    </div>
                    {memberError && <div className="text-red-500 text-sm mt-1">{memberError}</div>}
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#fd655c] text-white rounded hover:bg-[#b92d2a] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleNew}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-gray-500">Select a modpack to edit, or create a new one.</div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {/* UI overlay for download in progress */}
      {downloading && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.13)', backdropFilter: 'blur(7px)' }}>
          <div
            style={{
              background: '#F5F5F2',
              border: '2px solid #AA8B83',
              borderRadius: 22,
              boxShadow: '0 6px 32px rgba(52, 79, 58, 0.10)',
              fontFamily: 'Figtree, Inter, sans-serif',
              minWidth: 320,
              maxWidth: 380,
              width: '100%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
              Preparing Modpack Download...
            </div>
            <div style={{ padding: '32px 36px 24px 36px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, background: '#F5F5F2' }}>
              <div style={{ fontWeight: 600, fontSize: 17, color: '#222', marginBottom: 12, textAlign: 'center' }}>This may take a while for large modpacks with many members.</div>
              <div className="flex items-center justify-center" style={{ marginTop: 12 }}>
                <div className="animate-spin" style={{ width: 38, height: 38, border: '4px solid #ece9e2', borderTop: '4px solid #fd655c', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 