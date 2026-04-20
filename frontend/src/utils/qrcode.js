/**
 * Pure Canvas-based QR Code generator — zero dependencies.
 * Implements QR Code Model 2 with error correction level L.
 * 
 * Usage:
 *   import { generateQRCodeDataURL } from '../utils/qrcode';
 *   const dataUrl = generateQRCodeDataURL('https://example.com/scan/123456', 256);
 *   <img src={dataUrl} />
 */

// ── QR Code encoding tables ──────────────────────────────────────────────────

// Galois Field GF(256) tables
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function polyMul(a, b) {
  const result = new Uint8Array(a.length + b.length - 1);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return result;
}

function polyDiv(msg, gen) {
  const out = new Uint8Array(msg);
  for (let i = 0; i < msg.length - gen.length + 1; i++) {
    const coef = out[i];
    if (coef === 0) continue;
    for (let j = 1; j < gen.length; j++) {
      out[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return out.slice(msg.length - gen.length + 1);
}

function rsGeneratorPoly(nsym) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < nsym; i++) {
    g = polyMul(g, new Uint8Array([1, GF_EXP[i]]));
  }
  return g;
}

// ── QR version/capacity tables (byte mode, EC level L) ──────────────────────

const VERSION_CAPACITY = [
  0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
  321, 367, 425, 458, 520, 586, 644, 718, 792, 858,
];

const VERSION_EC_BLOCKS = [
  null,
  { total: 26, data: 19, ecPerBlock: 7, blocks: 1 },
  { total: 44, data: 34, ecPerBlock: 10, blocks: 1 },
  { total: 70, data: 55, ecPerBlock: 15, blocks: 1 },
  { total: 100, data: 80, ecPerBlock: 20, blocks: 1 },
  { total: 134, data: 108, ecPerBlock: 26, blocks: 1 },
  { total: 172, data: 136, ecPerBlock: 18, blocks: 2 },
  { total: 196, data: 156, ecPerBlock: 20, blocks: 2 },
  { total: 242, data: 194, ecPerBlock: 24, blocks: 2 },
  { total: 292, data: 232, ecPerBlock: 30, blocks: 2 },
  { total: 346, data: 274, ecPerBlock: 18, blocks: 4 },
];

function getVersion(dataLength) {
  for (let v = 1; v <= 10; v++) {
    if (dataLength <= VERSION_CAPACITY[v]) return v;
  }
  throw new Error('QR: Data too long for supported versions (max version 10)');
}

// ── Data encoding (byte mode) ───────────────────────────────────────────────

function encodeData(text, version) {
  const ecInfo = VERSION_EC_BLOCKS[version];
  const totalDataBytes = ecInfo.data;
  const bytes = new TextEncoder().encode(text);

  // Mode indicator (0100 = byte mode) + character count (8 bits for v1-9, 16 for v10+)
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  const ccLen = version >= 10 ? 16 : 8;
  pushBits(bytes.length, ccLen);

  for (const b of bytes) pushBits(b, 8);

  // Terminator
  const totalDataBits = totalDataBytes * 8;
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      byte = (byte << 1) | (bits[i * 8 + bit] || 0);
    }
    dataBytes[i] = byte;
  }

  return dataBytes;
}

function addErrorCorrection(dataBytes, version) {
  const ecInfo = VERSION_EC_BLOCKS[version];
  const ecPerBlock = ecInfo.ecPerBlock;
  const numBlocks = ecInfo.blocks;
  const dataPerBlock = Math.floor(dataBytes.length / numBlocks);

  const gen = rsGeneratorPoly(ecPerBlock);
  const dataBlocks = [];
  const ecBlocks = [];

  for (let b = 0; b < numBlocks; b++) {
    const start = b * dataPerBlock;
    const block = dataBytes.slice(start, start + dataPerBlock);
    dataBlocks.push(block);

    const msgPadded = new Uint8Array(block.length + ecPerBlock);
    msgPadded.set(block);
    const ec = polyDiv(msgPadded, gen);
    ecBlocks.push(ec);
  }

  // Interleave
  const result = [];
  const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }

  return new Uint8Array(result);
}

// ── Matrix placement ────────────────────────────────────────────────────────

function createMatrix(version) {
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  return matrix;
}

function setModule(matrix, row, col, value) {
  if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
    matrix[row][col] = value ? 1 : 0;
  }
}

function addFinderPattern(matrix, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const isInBorder =
        r === -1 || r === 7 || c === -1 || c === 7 ||
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const isInCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      setModule(matrix, row + r, col + c, isInBorder || isInCenter ? 0 : 0);
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const inOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setModule(matrix, row + r, col + c, inOuter || inInner ? 1 : 0);
      } else {
        setModule(matrix, row + r, col + c, 0);
      }
    }
  }
}

function addTimingPatterns(matrix) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

function addAlignmentPattern(matrix, version) {
  if (version < 2) return;
  const positions = [6, version * 4 + 10];
  for (const row of positions) {
    for (const col of positions) {
      if (matrix[row][col] !== -1) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
          const isCenter = r === 0 && c === 0;
          setModule(matrix, row + r, col + c, isEdge || isCenter ? 1 : 0);
        }
      }
    }
  }
}

function reserveFormatInfo(matrix) {
  const size = matrix.length;
  for (let i = 0; i < 8; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
    if (matrix[8][size - 1 - i] === -1) matrix[8][size - 1 - i] = 0;
    if (matrix[size - 1 - i][8] === -1) matrix[size - 1 - i][8] = 0;
  }
  if (matrix[8][8] === -1) matrix[8][8] = 0;
  matrix[size - 8][8] = 1; // Dark module
}

function placeData(matrix, codewords) {
  const size = matrix.length;
  let bitIdx = 0;
  const totalBits = codewords.length * 8;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip timing column
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) / 2 | 0) % 2 === (size > 25 ? 0 : 1);
        const row = upward ? size - 1 - vert : vert;

        if (matrix[row][col] !== -1) continue;
        if (bitIdx < totalBits) {
          const byteIdx = bitIdx >> 3;
          const bitPos = 7 - (bitIdx & 7);
          matrix[row][col] = (codewords[byteIdx] >> bitPos) & 1;
          bitIdx++;
        } else {
          matrix[row][col] = 0;
        }
      }
    }
  }
}

function applyMask(matrix, maskNum) {
  const size = matrix.length;
  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ][maskNum];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Only mask data modules
      const isReserved =
        (r < 9 && c < 9) || // top-left finder
        (r < 9 && c >= size - 8) || // top-right finder
        (r >= size - 8 && c < 9) || // bottom-left finder
        (r === 6 || c === 6); // timing

      if (!isReserved && maskFn(r, c)) {
        matrix[r][c] ^= 1;
      }
    }
  }
}

function addFormatInfo(matrix, maskNum) {
  const FORMAT_BITS = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
  ];

  const formatInfo = FORMAT_BITS[maskNum]; // EC level L = 01, mask pattern
  const size = matrix.length;

  const bits = [];
  for (let i = 14; i >= 0; i--) bits.push((formatInfo >> i) & 1);

  // Horizontal: around top-left finder
  const hPositions = [0, 1, 2, 3, 4, 5, 7, 8, size - 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2];
  for (let i = 0; i < 15; i++) {
    matrix[8][hPositions[i]] = bits[i];
  }

  // Vertical: around top-left finder
  const vPositions = [size - 1, size - 2, size - 3, size - 4, size - 5, size - 6, size - 7, 8, 7, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < 15; i++) {
    matrix[vPositions[i]][8] = bits[i];
  }
}

// ── Main encoder ────────────────────────────────────────────────────────────

function encodeQR(text) {
  const version = getVersion(text.length);
  const dataBytes = encodeData(text, version);
  const codewords = addErrorCorrection(dataBytes, version);

  const matrix = createMatrix(version);
  const size = matrix.length;

  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, 0, size - 7);
  addFinderPattern(matrix, size - 7, 0);
  addTimingPatterns(matrix);
  addAlignmentPattern(matrix, version);
  reserveFormatInfo(matrix);

  placeData(matrix, codewords);
  applyMask(matrix, 0);
  addFormatInfo(matrix, 0);

  return matrix;
}

// ── Canvas rendering ────────────────────────────────────────────────────────

/**
 * Generate a QR code as a data URL.
 * @param {string} text - The text/URL to encode
 * @param {number} pixelSize - Output image size in pixels (default 256)
 * @param {string} darkColor - Dark module color (default '#000')
 * @param {string} lightColor - Light module color (default '#fff')
 * @returns {string} Data URL (image/png)
 */
export function generateQRCodeDataURL(text, pixelSize = 256, darkColor = '#000', lightColor = '#fff') {
  const matrix = encodeQR(text);
  const moduleCount = matrix.length;
  const quietZone = 4;
  const totalModules = moduleCount + quietZone * 2;
  const moduleSize = pixelSize / totalModules;

  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, pixelSize, pixelSize);

  // Modules
  ctx.fillStyle = darkColor;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] === 1) {
        const x = Math.round((c + quietZone) * moduleSize);
        const y = Math.round((r + quietZone) * moduleSize);
        const w = Math.round((c + quietZone + 1) * moduleSize) - x;
        const h = Math.round((r + quietZone + 1) * moduleSize) - y;
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
