import type {
  CheckInRecord,
  ConsentAction,
  ConsentEvent,
  PatientBootstrap,
} from '@/features/patient/types';

/** Versión vigente del texto de consentimiento de tratamiento de datos (espejo de `CONSENT_VERSION` web, PAC-02). */
export const CONSENT_VERSION = '1.0';

export type ConsentView = {
  /** true = el paciente acepta que sus registros se almacenen y se compartan con su equipo. */
  granted: boolean;
  version: string;
  /** Fecha ISO del último cambio; `null` si nunca hubo uno (no se inventa una fecha). */
  since: string | null;
};

/** Sin registro se asume aceptado (se otorga al registrarse), pero sin fecha. */
export function consentOf(data: Pick<PatientBootstrap, 'consent'>): ConsentView {
  const c = data.consent;
  if (!c) return { granted: true, version: CONSENT_VERSION, since: null };
  return { granted: c.status === 'aceptado', version: c.version, since: c.updatedAt };
}

/** Historial del más reciente al más antiguo. */
export function consentHistoryOf(data: Pick<PatientBootstrap, 'consentHistory'>): ConsentEvent[] {
  return [...(data.consentHistory ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function nextEventId(history: ConsentEvent[]): string {
  const max = history.reduce((m, e) => {
    const n = Number(e.id.replace(/^consent-/, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `consent-${max + 1}`;
}

/**
 * Acepta o revoca. Actualiza el estado vigente y agrega un evento con la fecha real (`at`, ISO).
 * Si ya está en ese estado devuelve el mismo objeto (sin evento duplicado).
 */
export function applyConsent(
  data: PatientBootstrap,
  action: ConsentAction,
  at: string,
  version: string = CONSENT_VERSION,
): PatientBootstrap {
  if (data.consent?.status === action) return data;
  const history = data.consentHistory ?? [];
  const event: ConsentEvent = { id: nextEventId(history), action, version, createdAt: at };
  return {
    ...data,
    consent: { status: action, version, updatedAt: at },
    consentHistory: [event, ...history],
  };
}

/** Registros anteriores a MOB-06 no traen la marca y cuentan como compartidos. */
export function isSharedWithTeam(record: Pick<CheckInRecord, 'sharedWithTeam'>): boolean {
  return record.sharedWithTeam !== false;
}

/** Marca el check-in según el consentimiento vigente: revocado = solo en el teléfono. */
export function stampSharing(record: CheckInRecord, data: Pick<PatientBootstrap, 'consent'>): CheckInRecord {
  return { ...record, sharedWithTeam: consentOf(data).granted };
}
