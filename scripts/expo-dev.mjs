import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensurePlatformTools } from './adb-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const sdkPlatformTools = ensurePlatformTools();

const pathSep = process.platform === 'win32' ? ';' : ':';
const pathAdd = sdkPlatformTools;

const sdkRoot = path.dirname(sdkPlatformTools);

const env = {
  ...process.env,
  ANDROID_HOME: sdkRoot,
  ANDROID_SDK_ROOT: sdkRoot,
  PATH: pathAdd ? `${pathAdd}${pathSep}${process.env.PATH ?? ''}` : process.env.PATH,
};

const port = process.env.EXPO_DEV_PORT ?? '8083';
const useTunnel =
  process.env.ALIVIA_EXPO_TUNNEL === '1' || process.argv.includes('--tunnel');

function adbReverse(p) {
  const adb = path.join(sdkPlatformTools, process.platform === 'win32' ? 'adb.exe' : 'adb');
  if (!fs.existsSync(adb)) return;
  try {
    const list = execSync(`"${adb}" devices`, { encoding: 'utf8' });
    if (!/\tdevice\s*$/m.test(list)) return;
    execSync(`"${adb}" reverse tcp:${p} tcp:${p}`, { stdio: 'ignore' });
  } catch {
    /* sin dispositivo */
  }
}

adbReverse(port);

const expoArgs = ['start', '--port', port];
if (useTunnel) expoArgs.push('--tunnel');

console.log(
  `\n1) Instala Expo Go en el teléfono (Play Store) si aún no lo tienes.\n` +
    `2) USB: npm.cmd run open:android  ·  manual: exp://127.0.0.1:${port}\n` +
    `3) Wi‑Fi: escanea el QR (exp://192.168.x.x:${port})\n` +
    `No uses la tecla "a": sin Expo Go intenta descargar el APK y suele fallar (fetch failed). Túnel: npm.cmd run dev:tunnel\n`,
);

const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const child = spawn(process.execPath, [expoCli, ...expoArgs], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
