import type { Appointment, PatientBootstrap } from '@/features/patient/types';
import { CATALOG_VERSION } from '@/shared/data/trigger-catalog';
import type { PatientProfileKind } from '@/shared/mocks/users.mock';

const today = () => new Date().toISOString().slice(0, 10);

function copyAppointment(appointment: Appointment | null): Appointment | null {
  if (!appointment) return null;
  if (!appointment.preConsult) return { ...appointment };
  return { ...appointment, preConsult: { ...appointment.preConsult } };
}

export function cloneBootstrap(base: PatientBootstrap): PatientBootstrap {
  return {
    ...base,
    checkIns: [...base.checkIns],
    messages: [...base.messages],
    posts: base.posts.map((post) => ({ ...post })),
    ...(base.forumReports
      ? { forumReports: base.forumReports.map((report) => ({ ...report })) }
      : {}),
    medications: [...base.medications],
    appointment: copyAppointment(base.appointment),
    instruction: base.instruction
      ? { ...base.instruction, id: base.instruction.id > 0 ? base.instruction.id : 1 }
      : null,
    instructionHistory: base.instructionHistory?.map((row) => ({ ...row })),
    instructionAcks: base.instructionAcks?.map((ack) => ({ ...ack })),
    consent: base.consent ? { ...base.consent } : undefined,
    consentHistory: base.consentHistory ? [...base.consentHistory] : undefined,
    clinic: base.clinic ? { ...base.clinic } : base.clinic,
    team: base.team?.map((member) => ({ ...member })),
    linkRequests: base.linkRequests?.map((request) => ({ ...request })),
  };
}

export function fixtureForProfile(profile: PatientProfileKind): PatientBootstrap {
  return cloneBootstrap(profile === 'demo' ? DEMO_BOOTSTRAP : CLEAN_BOOTSTRAP);
}

export const DEMO_BOOTSTRAP: PatientBootstrap = {
  medications: [
    {
      id: 'm1',
      name: 'Paracetamol',
      concentration: '500 mg',
      form: 'Comprimido',
      quantity: '1 comprimido',
      route: 'Oral',
      frequency: 'Cada 8 horas',
      duration: 'Uso continuo',
      status: 'activo',
    },
    {
      id: 'm2',
      name: 'Gabapentina',
      concentration: '300 mg',
      form: 'Cápsula',
      quantity: '1 cápsula',
      route: 'Oral',
      frequency: 'Cada noche',
      duration: '60 días',
      status: 'activo',
    },
    {
      id: 'm3',
      name: 'Tramadol',
      concentration: '50 mg',
      form: 'Cápsula',
      quantity: '1 cápsula',
      route: 'Oral',
      frequency: 'Cada 12 horas',
      duration: '14 días',
      status: 'suspendido',
    },
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
      triggers: ['mala-noche'],
      reliefActions: [
        { action: 'calor-frio', relief: 'mucho' },
        { action: 'ejercicio-suave', relief: 'algo' },
      ],
      catalogVersion: CATALOG_VERSION,
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
      // Registro antiguo: solo `why`. Se conserva así a propósito (DIF-01, compatibilidad).
      why: ['😰 Estrés', 'Calor o frío local'],
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
    id: 2,
    text: 'Registra el dolor antes de tomar rescate. Si supera 7 por dos días, escríbenos por AlivIA.',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  instructionHistory: [
    {
      id: 1,
      text: 'Mantén la pauta de gabapentina en la noche. No dupliques dosis de rescate.',
      date: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
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
      id: 'p3',
      author: 'Constanza E.',
      excerpt: 'Caminé diez minutos después del almuerzo y el dolor bajó un poco.',
      at: new Date(Date.now() - 86400000).toISOString(),
      // Sin panel de admin: el fixture deja esta publicación ocultada para que Constanza la vea.
      hidden: true,
    },
    {
      id: 'p1',
      author: 'Ana R.',
      excerpt: '¿Alguien usa compresas térmicas en la mañana? Me ayudó a bajar la rigidez.',
      at: new Date(Date.now() - 2 * 86400000).toISOString(),
      topicTag: 'Fibromialgia',
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
  // Red de Constanza en los fixtures web: ALIVIAMVP (teléfono de esa clínica).
  clinic: {
    name: 'ALIVIAMVP',
    phone: '+56 2 2555 0100',
  },
  // Misma ficha que la web: patología, contacto y los médicos ya vinculados (sin vencimiento).
  // Dra. Invitada Soto acaba de aceptar (CLI-08). El vínculo es temporal: el perfil muestra la fecha.
  pathology: 'Fibromialgia + Depresión',
  email: 'constanza@correo.cl',
  phone: '',
  photoUri: null,
  team: [
    { id: '12345678-5', name: 'Dr. Jesús Fernández', specialty: 'Especialista en Dolor Crónico' },
    { id: '13456789-9', name: 'Dra. Constanza Elizondo', specialty: 'Reumatología' },
    {
      id: '20333444-3',
      name: 'Dra. Invitada Soto',
      specialty: 'Neurología',
      expiresAt: new Date(Date.now() + 18 * 86400000).toISOString(),
      newlyAccepted: true,
    },
  ],
  // La web siembra la bandeja vacía. Esta solicitud deja aprobar o rechazar en el mock.
  // El vencimiento viene en el fixture: la pantalla solo lo muestra si está.
  linkRequests: [
    {
      id: 'req-javier',
      requesterName: 'Dr. Javier Fernández',
      requesterRut: '15678234-3',
      requesterRole: 'medico',
      specialty: 'Algología',
      status: 'Pendiente',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
  ],
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
  // Paciente nuevo sin clínica en la red: no hay teléfono de centro.
  pathology: null,
  email: 'nuevo.paciente@test.cl',
  phone: '',
  photoUri: null,
  team: [],
  linkRequests: [],
};
