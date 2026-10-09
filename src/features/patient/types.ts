export type Medication = {
  id: string;
  name: string;
  active: boolean;
};

export type DoseChoice = 'indicated' | 'more' | 'less' | 'skipped';

export type CheckInRecord = {
  id: string;
  date: string;
  time: string;
  pain: number;
  zones: string[];
  mood?: string;
  sleep?: string;
  emergency: boolean;
  registrant: 'self' | 'caregiver';
  doses: { medId: string; choice: DoseChoice }[];
};

export type Appointment = {
  id: string;
  scheduledAt: string;
  doctorName: string;
  reason?: string;
  status: 'Pendiente' | 'Confirmada';
};

export type TeamInstruction = {
  text: string;
  date: string;
};

export type Message = {
  id: string;
  from: 'patient' | 'team' | 'alivia';
  body: string;
  at: string;
};

export type ForumPost = {
  id: string;
  author: string;
  excerpt: string;
  at: string;
};

export type PatientBootstrap = {
  medications: Medication[];
  checkIns: CheckInRecord[];
  appointment: Appointment | null;
  instruction: TeamInstruction | null;
  messages: Message[];
  posts: ForumPost[];
  messagingEnabled: boolean;
  doctorLinked: boolean;
};
