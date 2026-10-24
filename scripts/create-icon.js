/**
 * Creates high-quality Windows ICO and PNG icons for SmartBoard Studio
 * Zero external dependencies — generates standard 32-bit RGBA BMP inside Windows ICO format.
 */

const fs = require('fs');
const path = require('path');

function createIco(size) {
  const width = size;
  const height = size;
  const bpp = 32;
  const imageSize = width * height * 4;
  const andMaskRowSize = Math.floor((width + 31) / 32) * 4;
  const andMaskSize = andMaskRowSize * height;

  // ICO header: 6 bytes
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image

  // Directory entry: 16 bytes
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(width === 256 ? 0 : width, 0);
  dirEntry.writeUInt8(height === 256 ? 0 : height, 1);
  dirEntry.writeUInt8(0, 2); // color count
  dirEntry.writeUInt8(0, 3); // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(bpp, 6); // bits per pixel

  const dibHeaderSize = 40;
  const totalImageDataSize = dibHeaderSize + imageSize + andMaskSize;
  dirEntry.writeUInt32LE(totalImageDataSize, 8); // size of image data
  dirEntry.writeUInt32LE(22, 12); // offset = 6 + 16 = 22

  // DIB Header (BITMAPINFOHEADER): 40 bytes
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0);
  dibHeader.writeInt32LE(width, 4);
  dibHeader.writeInt32LE(height * 2, 8); // double height for ICO (XOR + AND mask)
  dibHeader.writeUInt16LE(1, 12); // planes
  dibHeader.writeUInt16LE(bpp, 14); // 32 bpp
  dibHeader.writeUInt32LE(0, 16); // BI_RGB (uncompressed)
  dibHeader.writeUInt32LE(imageSize + andMaskSize, 20);
  dibHeader.writeInt32LE(2835, 24); // 72 DPI
  dibHeader.writeInt32LE(2835, 28);
  dibHeader.writeUInt32LE(0, 32);
  dibHeader.writeUInt32LE(0, 36);

  // Pixel data (BGRA, bottom-up)
  const pixelData = Buffer.alloc(imageSize);
  const cx = width / 2;
  const cy = height / 2;
  const rCorner = width * 0.22;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // DIB is bottom-up
      const actualY = height - 1 - y;
      const idx = (y * width + x) * 4;

      // Rounded rectangle test
      const dx = Math.max(0, Math.abs(x - cx) - (cx - rCorner));
      const dy = Math.max(0, Math.abs(actualY - cy) - (cy - rCorner));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= rCorner) {
        // Inside rounded rect
        // Subtle antialiasing on corner edge
        const alpha = Math.min(1, Math.max(0, rCorner - dist + 0.5));
        
        // Gradient background: deep sapphire to violet (#0f172a to #312e81)
        const t = (actualY + x) / (width + height);
        let red = Math.round(15 + t * 34);
        let green = Math.round(23 + t * 23);
        let blue = Math.round(42 + t * 87);

        // Stylus path: diagonal glowing stroke from bottom-left to top-right
        const strokeX = actualY * 0.7 + width * 0.15;
        const distFromStroke = Math.abs(x - strokeX);
        if (distFromStroke < width * 0.08 && actualY > height * 0.2 && actualY < height * 0.8) {
          const glow = 1 - distFromStroke / (width * 0.08);
          red = Math.round(red * (1 - glow) + 0 * glow);
          green = Math.round(green * (1 - glow) + 242 * glow);
          blue = Math.round(blue * (1 - glow) + 254 * glow);
        }

        // Pen tip at (width * 0.72, height * 0.75)
        const tipDx = x - width * 0.72;
        const tipDy = actualY - height * 0.75;
        const tipDist = Math.sqrt(tipDx * tipDx + tipDy * tipDy);
        if (tipDist < width * 0.06) {
          red = 255;
          green = 255;
          blue = 255;
        }

        pixelData[idx + 0] = Math.round(blue * alpha);  // B
        pixelData[idx + 1] = Math.round(green * alpha); // G
        pixelData[idx + 2] = Math.round(red * alpha);   // R
        pixelData[idx + 3] = Math.round(255 * alpha);   // A
      } else {
        // Transparent
        pixelData[idx + 0] = 0;
        pixelData[idx + 1] = 0;
        pixelData[idx + 2] = 0;
        pixelData[idx + 3] = 0;
      }
    }
  }

  // AND mask: all zeros (fully transparent handled by 32-bit alpha channel)
  const andMask = Buffer.alloc(andMaskSize, 0);

  return Buffer.concat([icoHeader, dirEntry, dibHeader, pixelData, andMask]);
}

const outDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const icoBuffer = createIco(256);
const icoPath = path.join(outDir, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`Generated icon at ${icoPath} (${icoBuffer.length} bytes)`);
