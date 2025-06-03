import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import os from 'os';

// Helper to parse hex color to SVG
function colorToSVG(hex: string, size: number) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${hex}"/></svg>`
  );
}

// Helper to load and parse a JSON manifest
async function loadManifest(jsonPath: string) {
  const raw = await fs.readFile(jsonPath, 'utf8');
  return JSON.parse(raw);
}

// Helper to find frame info in manifest
function findFrame(manifest: any, key: string) {
  if (!key) return null;
  const lowerKey = key.toLowerCase();
  return manifest.sprites.find((s: any) => s.fileName.replace(/\.png$/i, '').toLowerCase() === lowerKey);
}

const SIZE = 256;

// Map for full-size part images (1024x1024)
const PARTS_FULLSIZE = {
  hair: { dir: 'hair/hair', prefix: 'Hair', tint: 'hair' },
  brow: { dir: 'hair/brow', prefix: 'HairBrow', tint: 'hair' },
  facial: { dir: 'hair/facial', prefix: 'HairFacial', tint: 'hair' },
  hairBack: { dir: 'hairBack', prefix: 'HairBack', tint: 'hair' },
  head: { dir: 'head', prefix: 'Head', tint: 'skin' },
  ears: { dir: 'head/ears', prefix: 'Ear', tint: 'skin' },
  neck: { dir: 'head', prefix: 'Neck', tint: 'skin' },
};

const LAYER_ORDER_SPRITE = [
  'hairBack',
  'neck',
  'ears',
  'head',
  'facial',
  'brow',
  'hair',
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url!);
    const params = url.searchParams;
    const config = {
      hair: params.get('hair') || '',
      brow: params.get('brow') || '',
      facial: params.get('facial') || '',
      hairBack: params.get('hairBack') || '',
      head: params.get('head') || '',
      ears: params.get('ears') || '',
      hairColor: params.get('hairColor') || '#8e7355',
      skinColor: params.get('skinColor') || '#bc8277',
      neck: '',
    };

    // Always use neck01 for neck
    config.neck = 'neck01';
    // Use defaults for head/ears if not provided
    if (!config.head) {
      const headManifest = await loadManifest(path.join(process.cwd(), 'public', 'assets', PARTS_FULLSIZE.head.dir, PARTS_FULLSIZE.head.prefix + '01.json'));
      const headEntry = headManifest.sprites.find((s: any) => s.fileName.toLowerCase().startsWith('head'));
      config.head = headEntry ? headEntry.fileName.replace(/\.png$/, '') : 'head01';
    }
    if (!config.ears) {
      const headManifest = await loadManifest(path.join(process.cwd(), 'public', 'assets', PARTS_FULLSIZE.head.dir, PARTS_FULLSIZE.head.prefix + '01.json'));
      const earEntry = headManifest.sprites.find((s: any) => s.fileName.toLowerCase().startsWith('ear'));
      config.ears = earEntry ? earEntry.fileName.replace(/\.png$/, '') : 'ear01';
    }

    // Store paths to temporary tinted parts
    const tempTintedPaths: string[] = [];
    for (const layer of LAYER_ORDER_SPRITE) {
      let partKey = config[layer as keyof typeof config];
      if (layer === 'neck') partKey = 'neck01';
      if (!partKey) continue;
      const partInfo = PARTS_FULLSIZE[layer as keyof typeof PARTS_FULLSIZE];
      const partNum = partKey.replace(/^[A-Za-z]+/, '');
      const fileName = `${partInfo.prefix}${partNum || '01'}.png`;
      const imagePath = path.join(process.cwd(), 'public', 'assets', partInfo.dir, fileName);
      let tint = partInfo.tint === 'hair' ? config.hairColor : config.skinColor;
      // Load the full-size part image
      const region = await sharp(imagePath)
        .resize(SIZE * 4, SIZE * 4, { kernel: sharp.kernel.lanczos3 }) // keep at 1024x1024
        .png()
        .toBuffer();
      // Tint with SVG+blend, then mask with dest-in
      const colored = await sharp(region)
        .composite([
          { input: colorToSVG(tint, SIZE * 4), blend: 'hard-light' },
        ])
        .png()
        .toBuffer();
      const tinted = await sharp(colored)
        .composite([
          { input: region, blend: 'dest-in' },
        ])
        .png()
        .toBuffer();
      // Write the tinted part to a temp file for inspection
      const tempPath = path.join(os.tmpdir(), `tinted_${layer}_${Date.now()}.png`);
      await fs.writeFile(tempPath, tinted);
      tempTintedPaths.push(tempPath);
    }
    // Remove suit as the bottom layer. Only composite the part layers.
    let finalCanvas = sharp({
      create: {
        width: SIZE * 4,
        height: SIZE * 4,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });
    const composites = [
      ...tempTintedPaths.map((p) => ({ input: p, blend: 'over' as const })),
    ];
    finalCanvas = finalCanvas.composite(composites);
    // Output the final PNG (1024x1024)
    const outBuffer = await finalCanvas.png().toBuffer();
    // Delete temporary tinted parts
    for (const p of tempTintedPaths) {
      try { await fs.unlink(p); } catch {}
    }
    return new Response(outBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Composite error:', error);
    return NextResponse.json({ error: 'Failed to composite portrait' }, { status: 500 });
  }
} 