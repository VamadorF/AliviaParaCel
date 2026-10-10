import { afterEach, describe, expect, it } from 'vitest';
import {
  EMERGENCY_NOTICE,
  NO_MEDICAL_ADVICE_NOTICE,
  SIM_LABEL,
  UNAVAILABLE_FALLBACK,
  aiNotesFor,
  assistantBubble,
  assistantContextFrom,
  assistantReply,
  getAssistantMode,
  resetAiNotes,
  saveAiSummaryNote,
  setAssistantMode,
  withSimulationLabel,
} from '@/features/patient/assistant/assistant';

const ctx = assistantContextFrom({
  name: 'Constanza Elizondo',
  checkIns: [
    { pain: 4, date: '2026-10-01', sleep: '5 h', createdAt: '2026-10-01T15:00:00.000Z' },
    { pain: 6, date: '2026-10-09', sleep: '4 h', createdAt: '2026-10-09T15:00:00.000Z' },
  ],
});

const ctxHigh = assistantContextFrom({
  name: 'Constanza Elizondo',
  checkIns: [{ pain: 9, date: '2026-10-09', createdAt: '2026-10-09T15:00:00.000Z' }],
});

const ctxEmpty = assistantContextFrom({ name: '', checkIns: [] });

function textOf(body: string): string {
  return assistantBubble(body).text;
}

afterEach(() => {
  setAssistantMode('ok');
  resetAiNotes();
});

describe('MOB-09 · asistente simulado', () => {
  it('expone los avisos literales de emergencia y de no medicación', () => {
    expect(EMERGENCY_NOTICE).toBe('Si es una emergencia, llama al 131');
    expect(NO_MEDICAL_ADVICE_NOTICE).toBe(
      'AlivIA no entrega indicaciones médicas ni de medicación',
    );
  });

  it('etiqueta cada respuesta como simulación', () => {
    const body = assistantReply('hola', ctx);
    expect(body?.startsWith(SIM_LABEL)).toBe(true);
    expect(assistantBubble(body!).label).toBe(SIM_LABEL);
    expect(textOf(body!)).not.toContain(SIM_LABEL);
  });

  it('no responde a un mensaje vacío', () => {
    expect(assistantReply('   ', ctx)).toBeNull();
  });

  it('si la IA simulada no responde, el fallback incluye el 131 y la etiqueta', () => {
    const body = assistantReply('¿qué dosis tomo?', ctx, 'unavailable');
    expect(body).toBe(withSimulationLabel(UNAVAILABLE_FALLBACK));
    expect(textOf(body!)).toContain('llama al 131');
    expect(assistantBubble(body!).unavailable).toBe(true);
    expect(textOf(body!)).not.toMatch(/receto|debes tomar|mg/);
  });

  it('el modo por defecto sigue al interruptor del mock', () => {
    expect(getAssistantMode()).toBe('ok');
    setAssistantMode('unavailable');
    expect(assistantReply('hola', ctx)).toBe(withSimulationLabel(UNAVAILABLE_FALLBACK));
    setAssistantMode('ok');
    expect(textOf(assistantReply('hola', ctx)!)).toContain('te escucho');
  });

  it('ante una emergencia indica el 131 y no se presenta como médico', () => {
    const text = textOf(assistantReply('no aguanto más', ctxHigh)!);
    expect(text).toContain('Constanza, lamento');
    expect(text).toContain('llama al 131');
    expect(text).not.toContain('Si tu dolor es 8 o más');
    expect(text).not.toMatch(/soy tu m[eé]dico|te receto|debes tomar/i);
  });

  it('rechaza indicaciones de medicación', () => {
    const text = textOf(assistantReply('¿puedo subir la dosis de la pastilla?', ctx)!);
    expect(text).toContain('No puedo darte indicaciones médicas ni de medicación');
    expect(text).not.toMatch(/mg|comprimido|te receto/i);
  });

  it('no comparte notas de evolución ni un diagnóstico', () => {
    const text = textOf(assistantReply('muéstrame mi diagnóstico y la nota de evolución', ctx)!);
    expect(text).toContain('No las comparto por este chat');
    expect(text).not.toMatch(/EVA|\/10/);
  });

  it('comenta el sueño registrado sin indicar un fármaco', () => {
    const text = textOf(assistantReply('anoche no pude dormir', ctx)!);
    expect(text).toContain('4 h');
    expect(text).toContain('cuéntaselo a tu equipo');
    const none = textOf(assistantReply('no dormí', ctxEmpty)!);
    expect(none).toContain('No tengo registros recientes de tu sueño');
  });

  it('reconoce el dolor con el último registro y no inventa uno', () => {
    expect(textOf(assistantReply('me duele la espalda', ctx)!)).toContain('6/10 (2026-10-09)');
    expect(textOf(assistantReply('me duele', ctxEmpty)!)).toContain('Aún no tengo registros de dolor');
  });

  it('avisa el 131 si el último dolor es 8 o más, sin dar una pauta', () => {
    const text = textOf(assistantReply('hoy me duele', ctxHigh)!);
    expect(text).toContain('9/10');
    expect(text).toContain('llama al 131');
    expect(text).not.toMatch(/te receto|debes tomar|mg/i);
  });

  it('escucha sin registro clínico cuando el mensaje es general', () => {
    expect(textOf(assistantReply('hola', ctx)!)).toContain('6/10');
    expect(textOf(assistantReply('hola', ctxEmpty)!)).toBe('Te escucho. Cuéntame cómo te sientes hoy.');
  });

  it('guardar el resumen crea una nota de IA en el mock, no una nota de médico', () => {
    const now = new Date('2026-10-10T18:30:00.000Z');
    const note = saveAiSummaryNote('constanza', ctx, ['Me desperté con más dolor'], now);
    expect(note.authorKind).toBe('ia');
    expect(note.author).toBe('Asistente AlivIA');
    expect(note.plan).toEqual([]);
    expect(note.date).toBe('2026-10-10');
    expect(note.createdAt).toBe('2026-10-10T18:30:00.000Z');
    expect(note.text.startsWith(SIM_LABEL)).toBe(true);
    expect(note.text).toContain('Constanza Elizondo conversó con el Asistente AlivIA');
    expect(note.text).toContain('«Me desperté con más dolor»');
    expect(note.text).toContain('EVA 6/10 el 2026-10-09');
    expect(note.author).not.toMatch(/dr\.|m[eé]dico/i);

    const older = saveAiSummaryNote('constanza', ctx, ['otro'], now);
    expect(aiNotesFor('constanza')[0]).toBe(older);
    expect(aiNotesFor('constanza')).toHaveLength(2);
    expect(aiNotesFor('otro-paciente')).toEqual([]);
  });

  it('sin mensajes igual deja constancia, sin inventar un nombre', () => {
    const note = saveAiSummaryNote('nuevo', ctxEmpty, ['  '], new Date('2026-10-10T00:00:00.000Z'));
    expect(note.authorKind).toBe('ia');
    expect(note.text).toContain('El paciente aún no escribió mensajes');
    expect(note.text).toContain('Sin check-ins registrados');
  });
});
