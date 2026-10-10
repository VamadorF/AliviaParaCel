/**
 * DIF-04 · "Lo que te ha ayudado".
 * Cuenta acciones de alivio que el propio paciente reportó (catálogo DIF-01).
 * El porcentaje es la parte de los registros de esa acción con ese nivel.
 * Con menos de 3 registros de la acción, no hay porcentaje.
 */
import {
  OTHER_ID,
  RELIEF_LEVELS,
  attributionsOf,
  reliefLabel,
} from '@/shared/data/trigger-catalog';
import type { ReliefAction, ReliefLevel } from '@/shared/data/trigger-catalog';

/** Por debajo de esto no se muestra porcentaje. */
export const RELIEF_HELP_MIN = 3;

/**
 * Cómo se lee cada id del catálogo dentro de la frase.
 * No es otra lista de opciones: si aparece un id nuevo, el test lo pide aquí.
 */
const SPOKEN: Record<string, string> = {
  medicacion: 'tomar tu medicación',
  descanso: 'descansar mejor',
  'ejercicio-suave': 'el ejercicio suave',
  'calor-frio': 'el calor o el frío local',
  respiracion: 'la respiración o la relajación',
  estiramientos: 'los estiramientos',
  masaje: 'el masaje',
  'cuarto-oscuro': 'el cuarto oscuro y el silencio',
  hidratacion: 'la hidratación',
};

const LEVEL_TIE: readonly ReliefLevel[] = ['algo', 'mucho', 'nada'];

export type ReliefHelp = {
  id: string;
  action: string;
  text?: string;
  /** Etiqueta del catálogo (`reliefLabel`). */
  label: string;
  relief: ReliefLevel;
  /** Veces que reportó este nivel para esta acción. */
  count: number;
  /** Parte de los registros de la acción. Ausente si la acción tiene menos de 3. */
  percent?: number;
  copy: string;
};

type ReliefSource = {
  triggers?: string[];
  reliefActions?: ReliefAction[];
  why?: string[];
};

function phraseOf(action: string, label: string, text?: string): string {
  if (action === OTHER_ID) {
    const written = (text ?? '').trim() || label;
    return `«${written}»`;
  }
  return SPOKEN[action] ?? label.charAt(0).toLowerCase() + label.slice(1);
}

/** Frase de lo que la persona dijo. No recomienda ni afirma una causa. */
function reliefCopy(action: string, label: string, relief: ReliefLevel, text?: string): string {
  const name = phraseOf(action, label, text);
  if (relief === 'nada') return `Dijiste que ${name} no te alivió`;
  if (relief === 'mucho') return `Dijiste que ${name} te alivió mucho`;
  return `Dijiste que ${name} te alivió`;
}

export function reliefHelpDetail(item: { count: number; percent?: number }): string {
  const times = item.count === 1 ? '1 vez' : `${item.count} veces`;
  if (item.percent === undefined) return times;
  return `${times} · ${item.percent}% de las veces que lo registraste`;
}

function bucketKey(action: string, text?: string): string {
  return action === OTHER_ID ? `otro:${(text ?? '').trim()}` : action;
}

export function reliefHelpOf(records: readonly ReliefSource[]): ReliefHelp[] {
  const buckets = new Map<
    string,
    { action: string; text?: string; label: string; by: Record<ReliefLevel, number> }
  >();

  for (const record of records) {
    for (const action of attributionsOf(record).reliefActions) {
      if (!RELIEF_LEVELS.includes(action.relief)) continue;
      const text = action.text?.trim();
      const key = bucketKey(action.action, text);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          action: action.action,
          text: text || undefined,
          label: reliefLabel({ action: action.action, relief: action.relief, text }),
          by: { nada: 0, algo: 0, mucho: 0 },
        };
        buckets.set(key, bucket);
      }
      bucket.by[action.relief] += 1;
    }
  }

  const ranked = [...buckets.entries()].sort(([, a], [, b]) => {
    const totalA = a.by.nada + a.by.algo + a.by.mucho;
    const totalB = b.by.nada + b.by.algo + b.by.mucho;
    if (totalB !== totalA) return totalB - totalA;
    return a.label.localeCompare(b.label, 'es');
  });

  const items: ReliefHelp[] = [];
  for (const [key, bucket] of ranked) {
    const total = bucket.by.nada + bucket.by.algo + bucket.by.mucho;
    const levels = LEVEL_TIE.filter((level) => bucket.by[level] > 0).sort(
      (a, b) => bucket.by[b] - bucket.by[a] || LEVEL_TIE.indexOf(a) - LEVEL_TIE.indexOf(b),
    );
    for (const relief of levels) {
      const count = bucket.by[relief];
      const percent = total >= RELIEF_HELP_MIN ? Math.round((count * 100) / total) : undefined;
      items.push({
        id: `${key}:${relief}`,
        action: bucket.action,
        ...(bucket.text ? { text: bucket.text } : {}),
        label: bucket.label,
        relief,
        count,
        ...(percent === undefined ? {} : { percent }),
        copy: reliefCopy(bucket.action, bucket.label, relief, bucket.text),
      });
    }
  }
  return items;
}
