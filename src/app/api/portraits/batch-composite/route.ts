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

const SIZE = 256;
const THUMB_SIZE = 64;

const PARTS_FULLSIZE = {
  hair: { dir: 'hair/hair', prefix: 'Hair', tint: 'hair', manifest: 'HairSprite.json' },
  brow: { dir: 'hair/brow', prefix: 'HairBrow', tint: 'hair', manifest: 'HairBrowSprite.json' },
  facial: { dir: 'hair/facial', prefix: 'HairFacial', tint: 'hair', manifest: 'HairFacialSprite.json' },
  hairBack: { dir: 'hairBack', prefix: 'HairBack', tint: 'hair', manifest: 'HairBackSprite.json' },
  head: { dir: 'head', prefix: 'Head', tint: 'skin', manifest: 'HeadSprite.json' },
  ears: { dir: 'head/ears', prefix: 'Ear', tint: 'skin', manifest: 'HeadSprite.json' },
  neck: { dir: 'head', prefix: 'Neck', tint: 'skin', manifest: 'HeadSprite.json' },
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

export async function POST(req: Request) {
  if (!req.body) {
    return NextResponse.json({ error: 'No body' }, { status: 400 });
  }
  const reader = req.body.getReader();
  let body = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    body += Buffer.from(value).toString('utf8');
  }
  let configs: Record<string, unknown>[] = [];
  try {
    configs = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(configs)) {
    return NextResponse.json({ error: 'Expected array of configs' }, { status: 400 });
  }

  // SSE streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < configs.length; ++i) {
        const config = { ...configs[i] };
        config.neck = 'neck01';
        // Use defaults for head/ears if not provided
        if (!config.head) {
          const headManifest = await loadManifest(path.join(process.cwd(), 'public', 'assets', PARTS_FULLSIZE.head.dir, PARTS_FULLSIZE.head.manifest));
          const headEntry = headManifest.sprites.find((s: { fileName: string }) => s.fileName.toLowerCase().startsWith('head'));
          config.head = headEntry ? headEntry.fileName.replace(/\.png$/, '') : 'head01';
        }
        if (!config.ears) {
          const headManifest = await loadManifest(path.join(process.cwd(), 'public', 'assets', PARTS_FULLSIZE.head.dir, PARTS_FULLSIZE.head.manifest));
          const earEntry = headManifest.sprites.find((s: { fileName: string }) => s.fileName.toLowerCase().startsWith('ear'));
          config.ears = earEntry ? earEntry.fileName.replace(/\.png$/, '') : 'ear01';
        }
        // Store paths to temporary tinted parts
        const tempTintedPaths: string[] = [];
        for (const layer of LAYER_ORDER_SPRITE) {
          let partKey = config[layer as keyof typeof config] as string;
          if (layer === 'neck') partKey = 'neck01';
          if (!partKey) continue;
          const partInfo = PARTS_FULLSIZE[layer as keyof typeof PARTS_FULLSIZE];
          const partNum = partKey.replace(/^[A-Za-z]+/, '');
          const fileName = `${partInfo.prefix}${partNum || '01'}.png`;
          const imagePath = path.join(process.cwd(), 'public', 'assets', partInfo.dir, fileName);
          const tint: string = partInfo.tint === 'hair' ? (config.hairColor as string) : (config.skinColor as string);
          // Load the full-size part image
          const region = await sharp(imagePath)
            .resize(SIZE * 4, SIZE * 4, { kernel: sharp.kernel.lanczos3 })
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
          const tempPath = path.join(os.tmpdir(), `tinted_${layer}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`);
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
        // Generate thumbnail (64x64)
        const thumbBuffer = await sharp(outBuffer).resize(THUMB_SIZE, THUMB_SIZE).png().toBuffer();
        // Delete temporary tinted parts
        for (const p of tempTintedPaths) {
          try { await fs.unlink(p); } catch {}
        }
        // Encode as data URLs
        const fullSizeImage = `data:image/png;base64,${outBuffer.toString('base64')}`;
        const thumbnail = `data:image/png;base64,${thumbBuffer.toString('base64')}`;
        // Compose result
        const result = {
          name: config.name || `RandomPortrait_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          config,
          thumbnail,
          fullSizeImage,
        };
        // Stream as SSE
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
    },
  });
} 