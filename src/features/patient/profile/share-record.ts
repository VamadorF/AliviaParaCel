import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

export const RECORD_FILE_NAME = 'alivia-ficha.json';

/** Escribe un JSON en el teléfono y lo abre con Share de React Native. */
export async function shareRecordFile(json: string) {
  let url: string | undefined;
  try {
    const file = new File(Paths.cache, RECORD_FILE_NAME);
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    url = file.uri;
  } catch {
    url = undefined;
  }
  return Share.share({
    title: 'Mi ficha AlivIA',
    message: json,
    ...(url ? { url } : {}),
  });
}
