import { describe, it, expect } from 'vitest';
import { GET } from './route.ts';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Helper to create a mock Request object with a given URL
function createRequest(url: string): Request {
  return new Request(url);
}

describe('Composite API', () => {
  it('should return a PNG image buffer for a valid config', async () => {
    const url = 'http://localhost:3000/api/portraits/composite?hair=hair01&brow=hairbrow01&facial=&hairBack=&head=head01&ears=ear01&hairColor=%238e7355&skinColor=%23bc8277';
    const req = createRequest(url);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect(buf.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(buf.length).toBeGreaterThan(1000); // Should not be empty
  });

  it('backend composite should visually match the frontend fixture', async () => {
    const url = 'http://localhost:3000/api/portraits/composite?hair=hair01&brow=hairbrow01&facial=&hairBack=&head=head01&ears=ear01&hairColor=%238e7355&skinColor=%23bc8277';
    const req = createRequest(url);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const backendBuf = Buffer.from(await res.arrayBuffer());
    // Resize backend image to 256x256 for comparison
    const backendResized = await sharp(backendBuf).resize(256, 256).png().toBuffer();
    // Load frontend fixture
    const fixturePath = path.join(__dirname, '__fixtures__', 'frontend_fixture.png');
    const frontendBuf = await fs.readFile(fixturePath);
    // Compare using pixelmatch (ESM import)
    const pixelmatch = (await import('pixelmatch')).default;
    const backendImg = await sharp(backendResized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const frontendImg = await sharp(frontendBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    console.log('Backend image size:', backendImg.info.width, backendImg.info.height);
    console.log('Frontend image size:', frontendImg.info.width, frontendImg.info.height);
    console.log('Backend image channels:', backendImg.info.channels, 'Buffer length:', backendImg.data.length);
    console.log('Frontend image channels:', frontendImg.info.channels, 'Buffer length:', frontendImg.data.length);
    expect(backendImg.info.width).toBe(frontendImg.info.width);
    expect(backendImg.info.height).toBe(frontendImg.info.height);
    const backendData = new Uint8Array(backendImg.data.buffer, backendImg.data.byteOffset, backendImg.data.byteLength);
    const frontendData = new Uint8Array(frontendImg.data.buffer, frontendImg.data.byteOffset, frontendImg.data.byteLength);
    const diffBuffer = Buffer.alloc(backendImg.info.width * backendImg.info.height * 4);
    const diffPixels = pixelmatch(
      backendData,
      frontendData,
      diffBuffer,
      backendImg.info.width,
      backendImg.info.height,
      { threshold: 0.1 }
    );
    // Allow a small number of differing pixels for antialiasing etc.
    expect(diffPixels).toBeLessThan(100);
  });
}); 