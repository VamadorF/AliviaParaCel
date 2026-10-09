import type { PatientBootstrap } from '@/features/patient/types';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

const today = () => new Date().toISOString().slice(0, 10);

export function cloneBootstrap(base: PatientBootstrap): PatientBootstrap {
  return {
    ...base,
    checkIns: [...base.checkIns],
    messages: [...base.messages],
    posts: [...base.posts],
    medications: [...base.medications],
    appointment: base.appointment ? { ...base.appointment } : null,
    instruction: base.instruction ? { ...base.instruction } : null,
  };
}

export function fixtureForProfile(profile: PatientProfileKind): PatientBootstrap {
  return cloneBootstrap(profile === 'demo' ? DEMO_BOOTSTRAP : CLEAN_BOOTSTRAP);
}

export const DEMO_BOOTSTRAP: PatientBootstrap = {
  medications: [
    { id: 'm1', name: 'Paracetamol 500 mg', active: true },
    { id: 'm2', name: 'Gabapentina 300 mg', active: true },
  ],
  checkIns: [
    {
      id: 'c1',
      date: today(),
      time: '08:30',
      pain: 4.5,
      zones: ['Lumbar'],
      mood: 'Regular',
      sleep: '6 h',
      emergency: false,
      registrant: 'self',
      doses: [
        { medId: 'm1', choice: 'indicated' },
        { medId: 'm2', choice: 'indicated' },
      ],
    },
    {
      id: 'c2',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      time: '21:00',
      pain: 5,
      zones: ['Lumbar', 'Cadera'],
      mood: 'Cansada',
      sleep: '5 h',
      emergency: false,
      registrant: 'self',
      doses: [{ medId: 'm1', choice: 'indicated' }],
    },
  ],
  appointment: {
    id: 'a1',
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    doctorName: 'Dr. Jesús Fernández',
    reason: 'Control mensual',
    status: 'Pendiente',
  },
  instruction: {
    text: 'Registra el dolor antes de tomar rescate. Si supera 7 por dos días, escríbenos por AlivIA.',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  messages: [
    {
      id: 'msg1',
      from: 'alivia',
      body: 'Hola Constanza. Puedo ayudarte a entender tus registros. ¿En qué te apoyo hoy?',
      at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg2',
      from: 'team',
      body: 'Recibimos tu registro de ayer. Sigue con la pauta indicada.',
      at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  posts: [
    {
      id: 'p1',
      author: 'Ana R.',
      excerpt: '¿Alguien usa compresas térmicas en la mañana? Me ayudó a bajar la rigidez.',
      at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'p2',
      author: 'Comunidad AlivIA',
      excerpt: 'Recordatorio: registra tu dolor a la misma hora para ver tu curva con claridad.',
      at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  messagingEnabled: true,
  doctorLinked: true,
};

export const CLEAN_BOOTSTRAP: PatientBootstrap = {
  medications: [],
  checkIns: [],
  appointment: null,
  instruction: null,
  messages: [],
  posts: [
    {
      id: 'p0',
      author: 'Comunidad AlivIA',
      excerpt: 'Bienvenida. Cuando tu equipo te vincule, verás orientación personalizada aquí.',
      at: new Date().toISOString(),
    },
  ],
  messagingEnabled: false,
  doctorLinked: false,
};
