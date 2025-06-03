import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PortraitEditorModal from './PortraitEditorModal';
import { PortraitConfig } from '@/types/portrait';
import { getPortraits, addOrUpdatePortrait } from '@/utils/portraitStorage';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';

// App style constants (matching Card/SectionHeader)
const cardBg = '#F5F5F2';
const cardBorder = '#AA8B83';
const sectionHeaderBg = '#d0cdbe';
const sectionHeaderBorder = '#d1cfc7';
const fontFamily = 'Figtree, Inter, sans-serif';
const textColor = '#222';

interface PortraitSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (portrait: PortraitConfig) => void;
}

// Helper to get cropped image as data URL (returns 1024x1024 PNG)
async function getCroppedImg(imageSrc: string, croppedAreaPixels: { x: number; y: number; width: number; height: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject();
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        1024,
        1024
      );
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

interface CropperModalProps {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

function CropperModal({ open, imageSrc, onCancel, onCropComplete }: CropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent style={{
        background: cardBg,
        border: `2px solid ${cardBorder}`,
        borderRadius: 18,
        boxShadow: `0 4px 16px rgba(52, 79, 58, 0.10)`,
        padding: 0,
        fontFamily,
        maxWidth: 600,
        minHeight: 600,
        color: textColor,
      }}>
        <DialogHeader>
          <DialogTitle asChild>
            <div style={{
              background: sectionHeaderBg,
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              borderBottom: `2px solid ${sectionHeaderBorder}`,
              marginTop: 0,
              marginBottom: 0,
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '1.18rem',
              color: textColor,
              fontFamily,
              letterSpacing: '0.01em',
            }}>Crop Portrait</div>
          </DialogTitle>
        </DialogHeader>
        <div style={{ position: 'relative', width: 400, height: 400, background: '#222', margin: '0 auto', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(52,79,58,0.10)' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_croppedArea, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
          />
        </div>
        <div style={{ margin: '24px 0 8px 0', width: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          <Slider
            value={zoom}
            min={1}
            max={4}
            step={0.01}
            onChange={(_, v) => setZoom(Number(v))}
            aria-labelledby="Zoom"
            sx={{ color: '#fd655c' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, marginBottom: 24 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 24px',
              borderRadius: 999,
              background: '#ece9e2',
              color: '#b92d2a',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              fontFamily,
              minWidth: 120,
              transition: 'background 0.15s, color 0.15s',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (croppedAreaPixels) {
                const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
                onCropComplete(cropped);
              }
            }}
            style={{
              padding: '8px 24px',
              borderRadius: 999,
              background: '#fd655c',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              fontFamily,
              minWidth: 120,
              transition: 'background 0.15s',
              cursor: 'pointer',
            }}
          >
            Confirm Crop
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortraitSelectionModal({ isOpen, onClose, onSelect }: PortraitSelectionModalProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [search, setSearch] = useState('');
  const [portraits, setPortraits] = useState<PortraitConfig[]>([]);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await getPortraits();
      setPortraits(loaded);
    })();
  }, [showEditor]);

  // Filter portraits by search
  const filteredPortraits = portraits.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle file upload
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show cropper modal
    setCropperImage(URL.createObjectURL(file));
    setShowCropper(true);
  }

  // After cropping, save portrait
  async function handleCropComplete(croppedDataUrl: string) {
    // Generate thumbnail (downscale to 64x64)
    const img = new window.Image();
    img.src = croppedDataUrl;
    await new Promise(res => (img.onload = res));
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const tctx = thumbCanvas.getContext('2d');
    if (tctx) {
      tctx.drawImage(img, 0, 0, 64, 64);
    }
    const thumbnail = thumbCanvas.toDataURL('image/png');

    // Compress to JPEG for storage (quality 0.85)
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = img.width;
    jpegCanvas.height = img.height;
    const jctx = jpegCanvas.getContext('2d');
    if (jctx) {
      jctx.drawImage(img, 0, 0, img.width, img.height);
    }
    const fullSizeImage = jpegCanvas.toDataURL('image/jpeg', 0.85);

    const portrait: PortraitConfig = {
      name: `Uploaded Portrait ${Date.now()}`,
      config: {
        hair: '', brow: '', facial: '', hairBack: '', head: '', ears: '', hairColor: '#8e7355', skinColor: '#bc8277'
      },
      thumbnail,
      fullSizeImage,
      uploaded: true
    };
    addOrUpdatePortrait(portrait);
    onSelect(portrait);
    setShowCropper(false);
    setCropperImage(null);
    onClose();
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent style={{
          background: cardBg,
          border: `2px solid ${cardBorder}`,
          borderRadius: 18,
          boxShadow: `0 4px 16px rgba(52, 79, 58, 0.10)`,
          padding: 0,
          fontFamily,
          maxHeight: '90vh',
          overflow: 'auto',
          color: textColor,
        }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle asChild>
              <div style={{
                background: sectionHeaderBg,
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderBottom: `2px solid ${sectionHeaderBorder}`,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.18rem',
                color: textColor,
                fontFamily,
                letterSpacing: '0.01em',
              }}>Select Portrait</div>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4" style={{ padding: '2rem', fontFamily, color: textColor }}>
            {/* Create New Portrait */}
            <button
              onClick={() => setShowEditor(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                borderRadius: 12, border: `2px solid ${cardBorder}`,
                background: cardBg, transition: 'background 0.15s',
                fontFamily, cursor: 'pointer', color: textColor,
              }}
              className="hover:bg-[#edeadf]"
            >
              <div className="w-12 h-12 rounded-full bg-[#d1cfc7] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg" style={{ color: textColor }}>Create New Portrait</h3>
                <p className="text-gray-700" style={{ color: textColor, opacity: 0.8 }}>Use the portrait generator to create a custom portrait</p>
              </div>
            </button>

            {/* Use Existing Portrait */}
            <button
              onClick={() => setShowGallery(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                borderRadius: 12, border: `2px solid ${cardBorder}`,
                background: cardBg, transition: 'background 0.15s',
                fontFamily, cursor: 'pointer', color: textColor,
              }}
              className="hover:bg-[#edeadf]"
            >
              <div className="w-12 h-12 rounded-full bg-[#d1cfc7] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg" style={{ color: textColor }}>Use Existing Portrait</h3>
                <p className="text-gray-700" style={{ color: textColor, opacity: 0.8 }}>Choose from your previously created portraits</p>
              </div>
            </button>

            {/* Upload Custom Image */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: 16,
              borderRadius: 12, border: `2px solid ${cardBorder}`,
              background: cardBg, transition: 'background 0.15s',
              fontFamily, cursor: 'pointer', color: textColor,
            }} className="hover:bg-[#edeadf]">
              <div className="w-12 h-12 rounded-full bg-[#d1cfc7] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg" style={{ color: textColor }}>Upload Custom Image</h3>
                <p className="text-gray-700" style={{ color: textColor, opacity: 0.8 }}>Upload your own portrait image</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Portrait Editor Modal */}
      <PortraitEditorModal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={(portrait) => {
          onSelect(portrait);
          setShowEditor(false);
          setPortraits(portraits);
          onClose();
        }}
      />

      {/* Portrait Gallery Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent style={{
          background: cardBg,
          border: `2px solid ${cardBorder}`,
          borderRadius: 18,
          boxShadow: `0 4px 16px rgba(52, 79, 58, 0.10)`,
          padding: 0,
          fontFamily,
          maxHeight: '90vh',
          overflow: 'auto',
          color: textColor,
        }} className="max-w-4xl">
          <DialogHeader>
            <DialogTitle asChild>
              <div style={{
                background: sectionHeaderBg,
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderBottom: `2px solid ${sectionHeaderBorder}`,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.18rem',
                color: textColor,
                fontFamily,
                letterSpacing: '0.01em',
              }}>Select Existing Portrait</div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4" style={{ fontFamily, color: textColor }}>
            <input
              type="text"
              placeholder="Search portraits..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
              style={{ fontFamily, color: textColor }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPortraits.map(portrait => (
                <button
                  key={portrait.name}
                  onClick={() => {
                    onSelect(portrait);
                    setShowGallery(false);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 p-2 rounded hover:bg-[#edeadf] transition-colors"
                  style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, color: textColor }}
                >
                  <Image
                    src={portrait.fullSizeImage || portrait.thumbnail}
                    alt={portrait.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-2 border-[#AA8B83]"
                    style={{ 
                      background: '#e5e5e5',
                      width: '6rem',
                      height: '6rem'
                    }}
                  />
                  <span className="text-sm font-medium"
                    style={{
                      fontFamily,
                      color: textColor,
                      display: 'block',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '6.5rem',
                    }}
                  >{portrait.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cropper Modal for uploads */}
      {showCropper && cropperImage && (
        <CropperModal
          open={showCropper}
          imageSrc={cropperImage}
          onCancel={() => { setShowCropper(false); setCropperImage(null); }}
          onCropComplete={croppedDataUrl => {
            if (croppedDataUrl) handleCropComplete(croppedDataUrl);
          }}
        />
      )}
    </>
  );
} 