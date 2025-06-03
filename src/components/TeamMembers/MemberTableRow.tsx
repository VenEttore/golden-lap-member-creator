import React from 'react';
import { Member } from '@/utils/memberStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import PortraitThumbnailForMember from './PortraitThumbnailForMember';
import NationalityFlag from './NationalityFlag';
import TraitIconsCell from './TraitIconsCell';
import { calculateMemberCost } from '../MemberCreator/MemberCreatorModern';

interface IconData {
  [key: string]: {
    [key: string]: {
      display_name: string;
      description: string;
    };
  };
}

interface MemberTableRowProps {
  member: Member;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (member: Member) => void;
  onDownload: (member: Member) => void;
  iconData: IconData;
  rowIndex: number;
  createdAt?: number;
  showStatus?: boolean;
  statusLabel?: string;
  swapTypeAndNationality?: boolean;
}

export default function MemberTableRow({
  member,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  iconData,
  rowIndex,
  createdAt,
  showStatus,
  statusLabel,
  swapTypeAndNationality,
}: MemberTableRowProps) {
  // Alternate row color
  const bgColor = rowIndex % 2 === 0 ? '#f7f5f2' : '#fff';
  return (
    <tr className="border-b hover:bg-gray-50" style={{ background: bgColor }}>
      <td className="py-2 px-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(member.id)}
            className="mr-2"
          />
          <div className="flex items-center gap-3">
            <PortraitThumbnailForMember portraitName={member.portraitName} />
            <span>{member.name} {member.surname}</span>
          </div>
        </div>
      </td>
      {swapTypeAndNationality ? (
        <>
          <td className="py-2 px-2 text-center">
            {member.type === 'crew_chief' ? 'Crew Chief' : member.type.charAt(0).toUpperCase() + member.type.slice(1)}
          </td>
          <td className="py-2 px-2 text-center">
            <div className="flex justify-center items-center">
              <NationalityFlag country={member.country} />
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-2 px-2 text-center">
            <div className="flex justify-center items-center">
              <NationalityFlag country={member.country} />
            </div>
          </td>
          <td className="py-2 px-2 text-center">
            {member.type === 'crew_chief' ? 'Crew Chief' : member.type.charAt(0).toUpperCase() + member.type.slice(1)}
          </td>
        </>
      )}
      {showStatus && (
        <td className="py-2 px-2 text-center">
          {statusLabel || ''}
        </td>
      )}
      <td className="py-2 px-2 text-center">
        <div className="flex justify-center items-center">
          {iconData && (
            <TraitIconsCell traits={member.traits} memberType={member.type} iconData={iconData} />
          )}
        </div>
      </td>
      <td className="py-2 px-2 text-center font-semibold">
        ${calculateMemberCost(member.type, member.stats, member.traits)}
      </td>
      <td style={{ display: 'none' }}>{createdAt || ''}</td>
      <td className="py-2 px-2 text-right">
        <button
          onClick={() => onPreview(member)}
          aria-label="Preview"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#fd655c] text-white hover:bg-[#b92d2a] focus:bg-[#b92d2a] transition-colors mr-2"
          style={{ border: 'none', outline: 'none', fontSize: 18, cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button
          onClick={() => onEdit(member.id)}
          aria-label="Edit"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ece9e2] text-[#b92d2a] hover:bg-[#fd655c] hover:text-white focus:bg-[#fd655c] focus:text-white transition-colors mr-2"
          style={{ border: 'none', outline: 'none', fontSize: 18, cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button
          onClick={() => onDownload(member)}
          aria-label="Download JSON"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ece9e2] text-[#b92d2a] hover:bg-[#fd655c] hover:text-white focus:bg-[#fd655c] focus:text-white transition-colors mr-2"
          style={{ border: 'none', outline: 'none', fontSize: 18, cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faDownload} />
        </button>
        <button
          onClick={() => onDelete(member.id)}
          aria-label="Delete"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ece9e2] text-[#b92d2a] hover:bg-[#fd655c] hover:text-white focus:bg-[#fd655c] focus:text-white transition-colors"
          style={{ border: 'none', outline: 'none', fontSize: 18, cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </td>
    </tr>
  );
} 