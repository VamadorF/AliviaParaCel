import fs from 'node:fs';
import path from 'node:path';

const wingetAdbDir =
  process.env.ALIVIA_ADB_DIR ??
  path.join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft',
    'WinGet',
    'Packages',
    'Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'platform-tools',
  );

const sdkRoot =
  process.env.ANDROID_HOME ??
  path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const sdkPlatformTools = path.join(sdkRoot, 'platform-tools');

export function ensurePlatformTools() {
  if (!fs.existsSync(wingetAdbDir)) return sdkPlatformTools;
  fs.mkdirSync(sdkRoot, { recursive: true });
  if (!fs.existsSync(sdkPlatformTools)) {
    try {
      fs.symlinkSync(wingetAdbDir, sdkPlatformTools, 'junction');
    } catch {
      /* ya existe */
    }
  }
  return fs.existsSync(sdkPlatformTools) ? sdkPlatformTools : wingetAdbDir;
}

export function getAdbExecutable() {
  const dir = ensurePlatformTools();
  const adb = path.join(dir, process.platform === 'win32' ? 'adb.exe' : 'adb');
  if (!fs.existsSync(adb)) {
    throw new Error(
      'No se encontró adb. Instala Google Platform Tools: winget install Google.PlatformTools',
    );
  }
  return adb;
}

export const EXPO_GO_PACKAGE = 'host.exp.exponent';
export const EXPO_ADB_USER = process.env.EXPO_ADB_USER ?? '0';
