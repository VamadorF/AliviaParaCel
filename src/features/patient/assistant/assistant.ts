/**
 * MOB-09 · Asistente simulado.
 * No es un médico: no diagnostica ni indica medicación.
 * Las notas que genera quedan en este mock con authorKind 'ia'
 * (la ficha que ve el paciente no las muestra).
 */

export const EMERGENCY_NOTICE = 'Si es una emergencia, llama al 131';
export const NO_MEDICAL_ADVICE_NOTICE =
  'AlivIA no entrega indicaciones médicas ni de medicación';
export const SIM_LABEL = 'Respuesta simulada · modo demostración';
export const UNAVAILABLE_FALLBACK =
  'No pude responder en este momento. Si tu dolor es 8 o más o es urgente, contacta a tu centro o llama al 131.';

export type AssistantAiMode = 'ok' | 'unavailable';

let mode: AssistantAiMode = 'ok';

export function setAssistantMode(next: AssistantAiMode): void {
  mode = next;
}

export function getAssistantMode(): AssistantAiMode {
  return mode;
}

export type AssistantContext = {
  displayName: string;
  firstName: string;
  latestPain: number | null;
  latestPainOn: string | null;
  latestSleep: string | null;
};

type CheckInSnap = { pain: number; date: string; sleep?: string; createdAt?: string };

export function assistantContextFrom(input: {
  name?: string | null;
  checkIns: CheckInSnap[];
}): AssistantContext {
  const latest = [...input.checkIns].sort((a, b) =>
    (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date),
  )[0];
  const displayName = (input.name ?? '').trim();
  return {
    displayName,
    firstName: displayName.split(/\s+/)[0] ?? '',
    latestPain: latest ? latest.pain : null,
    latestPainOn: latest ? (latest.createdAt?.slice(0, 10) ?? latest.date) : null,
    latestSleep: latest?.sleep?.trim() || null,
  };
}

const URGENT_RE =
  /autolesi|suicid|quitarme la vida|matarme|no aguanto m[aá]s|emergencia|urgencia|me desmay/i;
const MED_RE = /medic|dosis|pastilla|remedio|f[aá]rmaco|receta|\btomar\b/i;
const NOTES_RE = /\bnotas?\b|evoluci[oó]n|ficha|diagn[oó]stico/i;
const SLEEP_RE = /sue[ñn]|dorm[ií]/i;
const PAIN_RE = /dolor|duele|duelen|molest/i;

function sentence(ctx: AssistantContext, body: string): string {
  if (!ctx.firstName) return body.charAt(0).toUpperCase() + body.slice(1);
  return `${ctx.firstName}, ${body}`;
}

function composeReply(message: string, ctx: AssistantContext): string {
  const m = message.toLowerCase();
  let reply: string;
  let urgent = false;
  if (URGENT_RE.test(m)) {
    urgent = true;
    reply = sentence(
      ctx,
      'lamento que estés pasando por esto. Si es una emergencia, llama al 131 o acude al servicio de urgencias más cercano. Avisa también a tu equipo tratante.',
    );
  } else if (MED_RE.test(m)) {
    reply =
      'No puedo darte indicaciones médicas ni de medicación. Consulta a tu equipo tratante antes de cambiar o tomar cualquier fármaco.';
  } else if (NOTES_RE.test(m)) {
    reply =
      'Las notas de evolución las gestiona tu equipo. No las comparto por este chat.';
  } else if (SLEEP_RE.test(m)) {
    reply = ctx.latestSleep
      ? sentence(
          ctx,
          `en tu último registro anotaste sobre tu sueño: ${ctx.latestSleep}. Si sigue costándote descansar, cuéntaselo a tu equipo.`,
        )
      : 'No tengo registros recientes de tu sueño. Puedes anotarlo en tu próximo check-in.';
  } else if (PAIN_RE.test(m)) {
    reply =
      ctx.latestPain !== null
        ? sentence(
            ctx,
            `gracias por contármelo. Tu último registro de dolor fue ${ctx.latestPain}/10${ctx.latestPainOn ? ` (${ctx.latestPainOn})` : ''}. Lo dejaré a la vista de tu equipo en tu diario.`,
          )
        : sentence(
            ctx,
            'gracias por contármelo. Aún no tengo registros de dolor tuyos; puedes hacer tu check-in para dejarlos anotados.',
          );
  } else {
    reply =
      ctx.latestPain !== null
        ? sentence(
            ctx,
            `te escucho. Tu último registro de dolor fue ${ctx.latestPain}/10. Cuéntame cómo te sientes hoy.`,
          )
        : sentence(ctx, 'te escucho. Cuéntame cómo te sientes hoy.');
  }
  if (!urgent && ctx.latestPain !== null && ctx.latestPain >= 8) {
    reply += ' Si tu dolor es 8 o más o es urgente, contacta a tu centro o llama al 131.';
  }
  return reply;
}

export function withSimulationLabel(text: string): string {
  return `${SIM_LABEL}\n\n${text}`;
}

/** `null` si el mensaje está vacío. En modo `unavailable` no hay respuesta clínica: solo el fallback del 131. */
export function assistantReply(
  message: string,
  ctx: AssistantContext,
  aiMode: AssistantAiMode = getAssistantMode(),
): string | null {
  if (!message.trim()) return null;
  if (aiMode === 'unavailable') return withSimulationLabel(UNAVAILABLE_FALLBACK);
  return withSimulationLabel(composeReply(message.trim(), ctx));
}

export function assistantBubble(body: string): {
  label: string;
  text: string;
  unavailable: boolean;
} {
  const labeled = body.startsWith(SIM_LABEL);
  const text = labeled ? body.slice(SIM_LABEL.length).replace(/^\s+/, '') : body;
  return { label: SIM_LABEL, text, unavailable: text.includes(UNAVAILABLE_FALLBACK) };
}

export type AiClinicalNote = {
  date: string;
  text: string;
  plan: string[];
  author: 'Asistente AlivIA';
  authorKind: 'ia';
  createdAt: string;
};

const notesByPatient = new Map<string, AiClinicalNote[]>();

export function resetAiNotes(): void {
  notesByPatient.clear();
}

export function aiNotesFor(patientKey: string): readonly AiClinicalNote[] {
  return notesByPatient.get(patientKey) ?? [];
}

function summaryForDoctor(ctx: AssistantContext, patientMessages: string[]): string {
  const said = patientMessages
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(-3)
    .map((m) => `«${m}»`);
  const who = ctx.displayName || 'El paciente';
  const parts = [
    `${who} conversó con el Asistente AlivIA.`,
    said.length
      ? `Mensajes recientes del paciente: ${said.join('; ')}.`
      : 'El paciente aún no escribió mensajes en esta conversación.',
    ctx.latestPain !== null
      ? `Último registro: EVA ${ctx.latestPain}/10${ctx.latestPainOn ? ` el ${ctx.latestPainOn}` : ''}.`
      : 'Sin check-ins registrados.',
  ];
  return withSimulationLabel(parts.join(' '));
}

/** Crea la nota en el mock, marcada como IA. Nunca como si la hubiera escrito un médico. */
export function saveAiSummaryNote(
  patientKey: string,
  ctx: AssistantContext,
  patientMessages: string[],
  now: Date = new Date(),
): AiClinicalNote {
  const note: AiClinicalNote = {
    date: now.toISOString().slice(0, 10),
    text: summaryForDoctor(ctx, patientMessages),
    plan: [],
    author: 'Asistente AlivIA',
    authorKind: 'ia',
    createdAt: now.toISOString(),
  };
  const prev = notesByPatient.get(patientKey) ?? [];
  notesByPatient.set(patientKey, [note, ...prev]);
  return note;
}
