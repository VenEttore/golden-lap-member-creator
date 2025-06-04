import React from 'react';
import { Member } from '@/utils/memberStorage';
import MemberTableRow from './MemberTableRow';

interface MemberTableProps {
  members: Member[];
  selectedMembers: string[];
  onSelectMember: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (member: Member) => void;
  onDownload: (member: Member) => void;
  iconData: Record<string, Record<string, { display_name: string; description: string; x: number; y: number }>>;
  currentPage: number;
  rowsPerPage: number;
  sorts: Array<{ key: string, direction: 'asc' | 'desc' }>;
  onSort: (key: string, event?: React.MouseEvent) => void;
}

const CAREER_STAGE_LABELS: Record<string, string> = {
  early: 'Early Career',
  mid: 'Mid Career',
  late: 'Late Career',
  last_year: 'Last Year',
};

export default function MemberTable({
  members,
  selectedMembers,
  onSelectMember,
  onSelectAll,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  iconData,
  currentPage,
  rowsPerPage,
  sorts,
  onSort,
}: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 32 }}>
        No members found. Click &quot;Add Member&quot; to create your first team member.
      </div>
    );
  }

  // Calculate pagination
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const pageMembers = members.slice(startIdx, endIdx);

  // Helper for sort indicator
  function renderSortIndicator(key: string) {
    const idx = sorts.findIndex(s => s.key === key);
    if (idx === -1) return null;
    const dir = sorts[idx].direction;
    return (
      <span style={{ marginLeft: 2, fontWeight: 400 }}>
        {dir === 'asc' ? '▲' : '▼'}
        <span style={{ fontSize: '0.8em', marginLeft: 2, color: '#888' }}>{sorts.length > 1 ? idx + 1 : ''}</span>
      </span>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="py-2 px-2 text-left">
            <input
              type="checkbox"
              checked={selectedMembers.length === members.length}
              onChange={e => onSelectAll(e.target.checked)}
              className="mr-2"
            />
            <button type="button" onClick={e => onSort('name', e)} style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Name{renderSortIndicator('name')}
            </button>
          </th>
          <th className="py-2 px-2 text-center">
            <button type="button" onClick={e => onSort('type', e)} style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Type{renderSortIndicator('type')}
            </button>
          </th>
          <th className="py-2 px-2 text-center">
            <button type="button" onClick={e => onSort('country', e)} style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Nationality{renderSortIndicator('country')}
            </button>
          </th>
          <th className="py-2 px-2 text-center">
            <button type="button" onClick={e => onSort('careerStage', e)} style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Status{renderSortIndicator('careerStage')}
            </button>
          </th>
          <th className="py-2 px-2 text-center">Traits</th>
          <th className="py-2 px-2 text-center">
            <button type="button" onClick={e => onSort('cost', e)} style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cost{renderSortIndicator('cost')}
            </button>
          </th>
          <th style={{ display: 'none' }}>Date Added</th>
          <th className="py-2 px-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {pageMembers.map((member, idx) => (
          <MemberTableRow
            key={member.id}
            member={member}
            isSelected={selectedMembers.includes(member.id)}
            onSelect={onSelectMember}
            onEdit={onEdit}
            onDelete={onDelete}
            onPreview={onPreview}
            onDownload={onDownload}
            iconData={iconData}
            rowIndex={startIdx + idx}
            createdAt={member.createdAt}
            showStatus
            statusLabel={CAREER_STAGE_LABELS[member.careerStage] || member.careerStage}
            swapTypeAndNationality
          />
        ))}
      </tbody>
    </table>
  );
} 