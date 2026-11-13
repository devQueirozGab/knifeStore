import test from 'node:test';
import assert from 'node:assert/strict';
import { imageExtension } from '../server/lib/image.js';
test('JPEG signature', () => assert.equal(imageExtension(Buffer.from([255,216,255,0])), 'jpg'));
test('PNG signature', () => assert.equal(imageExtension(Buffer.from([137,80,78,71,13,10,26,10])), 'png'));
test('WebP signature', () => assert.equal(imageExtension(Buffer.from('RIFFxxxxWEBP')), 'webp'));
test('AVIF brand', () => assert.equal(imageExtension(Buffer.from('xxxxftypavif')), 'avif'));
test('rejects SVG/unknown', () => assert.equal(imageExtension(Buffer.from('<svg></svg>')), null));
test('rejects non-buffer', () => assert.equal(imageExtension('image/png'), null));
