'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_DATASET = path.resolve(__dirname, '../src/tests/fixtures/scanner-gold/index.json');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function toPosix(relPath = '') {
  return String(relPath || '').split(path.sep).join('/');
}

function walkImageFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      out.push(absolute);
    }
  }
  return out.sort();
}

function ensureDataset(datasetPath) {
  if (!fs.existsSync(datasetPath)) {
    fs.mkdirSync(path.dirname(datasetPath), { recursive: true });
    fs.writeFileSync(datasetPath, JSON.stringify({
      version: 2,
      description: 'Courier scanner gold dataset.',
      pipeline: {
        collection: {
          method: 'manual-upload',
          command: 'node scripts/scanner-dataset-collect.js <imageDir> [datasetPath]',
        },
        labeling: {
          requiredStatus: 'verified',
          verifierRole: 'ops-qc',
        },
        storage: {
          localDir: 'backend/src/tests/fixtures/scanner-gold',
          objectStoreEnv: 'SCANNER_DATASET_BUCKET',
          objectStorePrefixEnv: 'SCANNER_DATASET_PREFIX',
        },
      },
      cases: [],
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
}

function makeCaseId(fileRel, index) {
  const stem = path.basename(fileRel, path.extname(fileRel)).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  return `${stem || 'scanner-case'}-${index + 1}`;
}

function main() {
  const imageDirArg = process.argv[2];
  if (!imageDirArg) {
    throw new Error('Usage: node scripts/scanner-dataset-collect.js <imageDir> [datasetPath]');
  }

  const imageDir = path.resolve(imageDirArg);
  if (!fs.existsSync(imageDir)) {
    throw new Error(`Image directory not found: ${imageDir}`);
  }
  const datasetPath = path.resolve(process.argv[3] || DEFAULT_DATASET);
  const datasetDir = path.dirname(datasetPath);
  const dataset = ensureDataset(datasetPath);
  dataset.cases = Array.isArray(dataset.cases) ? dataset.cases : [];

  const existingFiles = new Set(dataset.cases.map((item) => String(item.file || '').trim()).filter(Boolean));
  const imageFiles = walkImageFiles(imageDir);
  const added = [];

  imageFiles.forEach((absolutePath, index) => {
    const relFromDataset = toPosix(path.relative(datasetDir, absolutePath));
    if (!relFromDataset || existingFiles.has(relFromDataset)) return;

    const row = {
      id: makeCaseId(relFromDataset, index),
      file: relFromDataset,
      courier: '',
      expectedAwb: '',
      expectedAwbPattern: '',
      source: {
        method: 'manual-upload',
        collectedAt: new Date().toISOString(),
      },
      label: {
        status: 'pending',
        reviewedBy: '',
        verifiedAt: '',
        notes: '',
      },
    };
    dataset.cases.push(row);
    added.push(row.file);
  });

  dataset.cases.sort((a, b) => String(a.file || '').localeCompare(String(b.file || '')));
  fs.writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(JSON.stringify({
    datasetPath,
    imageDir,
    discoveredImages: imageFiles.length,
    addedCases: added.length,
    skippedExisting: imageFiles.length - added.length,
    added,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

