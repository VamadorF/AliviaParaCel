import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const HEADER = '// Generado: no editar\n\n';
const OUT_DIR = path.join(ROOT, 'src', 'shared', 'core');

const DERIVED_SYMBOLS = [
  'PainSeriesPoint',
  'lastCaregiver',
  'patientPainSeries',
  'patientCheckIns',
  'daysSinceLastCheckIn',
  'checkInStreak',
  'localDateStr',
  'myTodayRecords',
];

function webSrcRoot() {
  for (const rel of ['../AlivIACare/src', '../../AlivIACare/src']) {
    const dir = path.resolve(ROOT, rel);
    if (fs.existsSync(path.join(dir, 'data', 'rut.ts'))) return dir;
  }
  throw new Error('No se encontró AlivIACare/src (esperado junto al repo móvil).');
}

function readWeb(rel) {
  return fs.readFileSync(path.join(webSrcRoot(), rel), 'utf8');
}

function withHeader(body) {
  const trimmed = body.replace(/^\uFEFF?/, '').trimStart();
  if (trimmed.startsWith('// Generado: no editar')) return trimmed.endsWith('\n') ? trimmed : trimmed + '\n';
  return HEADER + trimmed + (trimmed.endsWith('\n') ? '' : '\n');
}

function sliceBalancedBraces(source, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(0, i + 1);
    }
  }
  throw new Error('Llaves desbalanceadas al extraer bloque');
}

function functionBodyBraceIndex(source, fnStart) {
  let i = source.indexOf('(', fnStart);
  if (i < 0) throw new Error('Parámetros de función no encontrados');
  let depth = 0;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === ':') {
    i++;
    let typeDepth = 0;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') {
        if (typeDepth === 0) {
          let j = i - 1;
          while (j >= 0 && /\s/.test(source[j])) j--;
          const prev = j >= 0 ? source[j] : ':';
          if (prev === ':' || prev === '|') typeDepth = 1;
          else return i;
        } else typeDepth++;
      } else if (ch === '(' || ch === '<') typeDepth++;
      else if (ch === '}' || ch === ')' || ch === '>') {
        if (typeDepth > 0) typeDepth--;
      }
    }
  }
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === '{') return i;
  throw new Error('Apertura de cuerpo de función no encontrada');
}

function extractExportBlock(source, name, kind) {
  if (kind === 'function') {
    const start = source.indexOf(`export function ${name}(`);
    if (start < 0) throw new Error(`No se encontró export function ${name}`);
    const open = functionBodyBraceIndex(source, start);
    return sliceBalancedBraces(source.slice(start), open - start).trimEnd();
  }
  if (kind === 'interface') {
    const start = source.indexOf(`export interface ${name} `);
    if (start < 0) throw new Error(`No se encontró export interface ${name}`);
    const head = source.slice(start);
    const open = head.indexOf('{');
    return sliceBalancedBraces(head, open).trimEnd();
  }
  throw new Error(`Tipo de export no soportado: ${kind}`);
}

function extractBraceFunction(source, name) {
  const needle = `\nfunction ${name}(`;
  const start = source.indexOf(needle);
  if (start < 0) throw new Error(`No se encontró function ${name}`);
  const fnStart = start + 1;
  const open = functionBodyBraceIndex(source, fnStart);
  return sliceBalancedBraces(source.slice(fnStart), open - fnStart).trimEnd();
}

function extractInterface(source, name) {
  const start = source.indexOf(`export interface ${name} `);
  if (start < 0) throw new Error(`${name} no encontrado`);
  const head = source.slice(start);
  const open = head.indexOf('{');
  return sliceBalancedBraces(head, open).trimEnd();
}

function buildCheckinRow() {
  const bootstrap = readWeb('lib/bootstrap.ts');
  const blocks = ['CheckInNotes', 'GiDetail', 'MedDetailEntry', 'CheckInRow'].map((name) =>
    extractInterface(bootstrap, name),
  );
  const body = `import type { CheckInDose } from './checkin-dose';\n\n${blocks.join('\n\n')}\n`;
  return withHeader(body);
}

function buildRut() {
  return withHeader(readWeb('data/rut.ts'));
}

function buildCheckinDose() {
  return withHeader(readWeb('lib/checkin-dose.ts'));
}

function buildPain() {
  const seed = readWeb('data/seed.ts');
  const color = seed.match(/export const painColor =[^\n]+/);
  if (!color) throw new Error('painColor no encontrado en data/seed.ts');
  const labelFn = seed.match(/export function painLabel\([\s\S]*?\n\}/);
  const label = labelFn
    ? labelFn[0]
    : `export function painLabel(value: number): string {
  if (value <= 1) return 'Sin dolor';
  if (value <= 3) return 'Leve';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Fuerte';
  return 'El peor dolor';
}`;
  return withHeader(`${color[0]}\n${label}\n`);
}

function buildDerivedPatient() {
  const derived = readWeb('state/derived.ts');
  const giDaySummary = extractBraceFunction(derived, 'giDaySummary');
  const blocks = DERIVED_SYMBOLS.map((name) => {
    const kind = name === 'PainSeriesPoint' ? 'interface' : 'function';
    return extractExportBlock(derived, name, kind);
  });
  const head = blocks.slice(0, 2);
  const tail = blocks.slice(2);
  const body = `import { normalizeRut } from './rut';
import type { CheckInRow } from './checkin-row';

${head.join('\n\n')}

${giDaySummary}

${tail.join('\n\n')}
`;
  return withHeader(body);
}

const TARGETS = {
  'checkin-row.ts': buildCheckinRow,
  'rut.ts': buildRut,
  'checkin-dose.ts': buildCheckinDose,
  'pain.ts': buildPain,
  'derived-patient.ts': buildDerivedPatient,
};

function generateAll() {
  const out = {};
  for (const [file, build] of Object.entries(TARGETS)) {
    out[file] = build();
  }
  return out;
}

function writeAll(files) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT_DIR, file), content, 'utf8');
  }
}

function staleFiles(files) {
  return Object.entries(files).filter(([file, content]) => {
    const p = path.join(OUT_DIR, file);
    if (!fs.existsSync(p)) return true;
    return fs.readFileSync(p, 'utf8') !== content;
  });
}

const checkMode = process.argv.includes('--check');
const files = generateAll();
if (checkMode) {
  const stale = staleFiles(files);
  if (stale.length) {
    console.error('Copias desactualizadas en src/shared/core/:', stale.map(([f]) => f).join(', '));
    console.error('Ejecuta: npm run sync:core');
    process.exit(1);
  }
  console.log('sync-core: OK');
} else {
  writeAll(files);
  console.log('sync-core: escritos', Object.keys(files).join(', '));
}
