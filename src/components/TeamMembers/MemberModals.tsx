import React from 'react';
import { Member } from '@/utils/memberStorage';
import { Modpack } from '@/types/modpack';
import MemberPreviewModal from '../MemberCreator/MemberPreviewModal';
import { calculateMemberCost } from '../MemberCreator/MemberCreatorModern';

interface MemberModalsProps {
  previewMember: Member | null;
  previewPortraitUrl: string | null;
  onClosePreview: () => void;
  showModpackDialog: boolean;
  onCloseModpackDialog: () => void;
  onCreateModpack: (name: string, description: string) => void;
  modpacks: Modpack[];
  onAddToExistingModpack: (modpack: Modpack) => void;
  showBatchDeleteDialog: boolean;
  onCloseBatchDeleteDialog: () => void;
  onConfirmBatchDelete: () => void;
  modpackMemberError?: string | null;
}

export default function MemberModals({
  previewMember,
  previewPortraitUrl,
  onClosePreview,
  showModpackDialog,
  onCloseModpackDialog,
  onCreateModpack,
  modpacks,
  onAddToExistingModpack,
  showBatchDeleteDialog,
  onCloseBatchDeleteDialog,
  onConfirmBatchDelete,
  modpackMemberError,
}: MemberModalsProps) {
  return (
    <>
      {/* Preview Modal */}
      {previewMember && (
        <MemberPreviewModal
          open={!!previewMember}
          onClose={onClosePreview}
          name={previewMember.name}
          surname={previewMember.surname}
          country={previewMember.country}
          careerStage={previewMember.careerStage}
          portraitUrl={previewPortraitUrl}
          portraitName={previewMember.portraitName}
          traits={previewMember.traits}
          stats={previewMember.stats}
          cost={calculateMemberCost(previewMember.type, previewMember.stats, previewMember.traits)}
          type={previewMember.type}
          decadeStartContent={previewMember.decadeStartContent}
        />
      )}

      {/* Modpack Dialog */}
      {showModpackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            style={{
              background: '#F5F5F2',
              border: '2px solid #AA8B83',
              borderRadius: 22,
              boxShadow: '0 6px 32px rgba(52, 79, 58, 0.10)',
              fontFamily: 'Figtree, Inter, sans-serif',
              maxWidth: 400,
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'visible',
              padding: 0,
              position: 'relative',
            }}
          >
            {/* Section header bar */}
            <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
              Add to Modpack
            </div>
            {/* Close X button */}
            <button
              onClick={onCloseModpackDialog}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#fd655c',
                border: '2px solid #fff',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff',
                fontWeight: 900,
                zIndex: 20,
                boxShadow: '0 2px 8px rgba(214, 72, 67, 0.13)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              aria-label="Close"
              onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
              onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
            >
              ×
            </button>
            <div style={{ padding: '32px 36px 24px 36px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, background: '#F5F5F2' }}>
              {modpackMemberError && (
                <div style={{ color: '#fd655c', fontWeight: 600, marginBottom: 12, fontSize: 16, textAlign: 'center' }}>{modpackMemberError}</div>
              )}
              <div className="flex gap-2 mb-4 w-full">
                <button
                  onClick={() => {
                    const name = (document.getElementById('modpackName') as HTMLInputElement).value;
                    const description = (document.getElementById('modpackDescription') as HTMLTextAreaElement).value;
                    onCreateModpack(name, description);
                  }}
                  className="flex-1 !bg-[#fd655c] !text-white !border-[#fd655c] hover:!bg-[#b92d2a] hover:!border-[#b92d2a] px-4 py-2 rounded font-bold transition-colors"
                  style={{ minWidth: 0, fontSize: 17, fontWeight: 700 }}
                >
                  Create New Modpack
                </button>
                <button
                  onClick={onCloseModpackDialog}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-bold"
                  style={{ fontSize: 17, fontWeight: 700 }}
                >
                  Cancel
                </button>
              </div>
              <div className="mb-4 w-full">
                <input
                  type="text"
                  placeholder="Modpack Name"
                  className="w-full p-2 border rounded"
                  id="modpackName"
                  style={{ fontSize: 16, color: '#222', background: '#fff' }}
                />
              </div>
              <div className="mb-4 w-full">
                <textarea
                  placeholder="Description"
                  className="w-full p-2 border rounded"
                  rows={3}
                  id="modpackDescription"
                  style={{ fontSize: 16, color: '#222', background: '#fff' }}
                />
              </div>
              <div className="border-t pt-4 w-full">
                <h4 className="font-semibold mb-2" style={{ fontSize: 15, color: '#333' }}>Or add to existing modpack:</h4>
                <div className="max-h-48 overflow-y-auto">
                  {modpacks.map(modpack => (
                    <button
                      key={modpack.id}
                      onClick={() => onAddToExistingModpack(modpack)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded flex justify-between items-center"
                      style={{ fontSize: 15 }}
                    >
                      <span>{modpack.name}</span>
                      <span className="text-sm text-gray-500">{modpack.members.length} members</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Dialog */}
      {showBatchDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.13)', backdropFilter: 'blur(7px)' }}>
          <div
            style={{
              background: '#F5F5F2',
              border: '2px solid #AA8B83',
              borderRadius: 22,
              boxShadow: '0 6px 32px rgba(52, 79, 58, 0.10)',
              fontFamily: 'Figtree, Inter, sans-serif',
              maxWidth: 400,
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'visible',
              padding: 0,
              position: 'relative',
            }}
          >
            {/* Section header bar */}
            <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
              Delete Selected Members
            </div>
            {/* Close X button */}
            <button
              onClick={onCloseBatchDeleteDialog}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#fd655c',
                border: '2px solid #fff',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff',
                fontWeight: 900,
                zIndex: 20,
                boxShadow: '0 2px 8px rgba(214, 72, 67, 0.13)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              aria-label="Close"
              onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
              onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
            >
              ×
            </button>
            <div style={{ padding: '32px 36px 24px 36px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, background: '#F5F5F2' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#222', marginBottom: 12, textAlign: 'center' }}>Are you sure you want to delete the selected members?</div>
              <div style={{ color: '#444', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>This action cannot be undone.</div>
              <div className="flex justify-end gap-2 w-full">
                <button
                  onClick={onConfirmBatchDelete}
                  style={{
                    padding: '10px 32px',
                    borderRadius: 999,
                    background: '#fd655c',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.01em',
                    boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
                    border: 'none',
                    marginTop: 0,
                    marginBottom: 2,
                    transition: 'background 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                    display: 'block',
                    textAlign: 'center',
                    minWidth: 120,
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
                  onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
                  onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
                  onBlur={e => (e.currentTarget.style.background = '#fd655c')}
                >
                  Delete
                </button>
                <button
                  onClick={onCloseBatchDeleteDialog}
                  style={{
                    padding: '10px 32px',
                    borderRadius: 999,
                    background: '#ece9e2',
                    color: '#333',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.01em',
                    border: 'none',
                    marginTop: 0,
                    marginBottom: 2,
                    transition: 'background 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                    display: 'block',
                    textAlign: 'center',
                    minWidth: 120,
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#d1cfc7')}
                  onMouseOut={e => (e.currentTarget.style.background = '#ece9e2')}
                  onFocus={e => (e.currentTarget.style.background = '#d1cfc7')}
                  onBlur={e => (e.currentTarget.style.background = '#ece9e2')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 