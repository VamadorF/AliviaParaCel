import { execSync } from 'node:child_process';
import {
  EXPO_ADB_USER,
  EXPO_GO_PACKAGE,
  getAdbExecutable,
} from './adb-path.mjs';

const port = process.env.EXPO_DEV_PORT ?? '8083';
const adb = getAdbExecutable();
const adbQ = `"${adb}"`;

function adbExec(args, { inherit = false, allowFail = false } = {}) {
  try {
    return execSync(`${adbQ} ${args}`, {
      encoding: 'utf8',
      stdio: inherit ? 'inherit' : 'pipe',
    });
  } catch (err) {
    if (allowFail) return err.stdout?.toString?.() ?? '';
    throw err;
  }
}

const devices = adbExec('devices');
if (!/\tdevice\s*$/m.test(devices)) {
  console.error('No hay dispositivo Android autorizado. Revisa USB y “Depuración USB”.');
  process.exit(1);
}

const installed = adbExec(
  `shell pm path --user ${EXPO_ADB_USER} ${EXPO_GO_PACKAGE}`,
  { allowFail: true },
).trim();

if (!installed.startsWith('package:')) {
  console.error(
    `\nExpo Go no está instalado en el teléfono (usuario Android ${EXPO_ADB_USER}).`,
  );
  console.error(
    'Instálalo desde Play Store: https://play.google.com/store/apps/details?id=host.exp.exponent',
  );
  console.error(
    '\nLa tecla "a" en Metro también falla (TypeError: fetch failed) si intenta descargar Expo Go sin red.',
  );
  console.error('Con Metro en marcha, vuelve a ejecutar: npm.cmd run open:android\n');
  process.exit(1);
}

adbExec(`reverse tcp:${port} tcp:${port}`, { inherit: true });

const url = `exp://127.0.0.1:${port}`;
console.log(`Abriendo Expo Go: ${url}`);

try {
  adbExec(
    `shell monkey -p ${EXPO_GO_PACKAGE} -c android.intent.category.LAUNCHER 1`,
  );
} catch {
  /* launcher opcional */
}

adbExec(
  `shell am start -a android.intent.action.VIEW -d "${url}"`,
  { inherit: true },
);
