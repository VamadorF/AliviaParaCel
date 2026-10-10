// Generado: no editar

import type { CheckInDose } from './checkin-dose';

export interface CheckInNotes { zones: string; mood: string; sleep: string }

export interface GiDetail {
  nausea?: boolean;
  vomiting?: boolean;
  bowelMovements?: number | null;
  appetite?: 'normal' | 'reducido' | 'nulo';
  reflux?: boolean;
}

export interface MedDetailEntry { name: string; percentTaken: number; adverseNotes: string }

export type ReliefLevel = 'nada' | 'algo' | 'mucho';

export interface ReliefAction { action: string; relief: ReliefLevel; text?: string }

/** Gatillantes y alivios del check-in (DIF-01). Los registros antiguos solo traen `why`. */
export interface CheckInExtensions {
  triggers?: string[];
  reliefActions?: ReliefAction[];
  /** versión del catálogo con que se clasificó el registro */
  catalogVersion?: string;
}

export interface CheckInRow {
  patientRut: string; time: string; pain: number; zones: string[]; mood: string; sleep: string; why: string[];
  medsTaken: string[]; medsDetail: MedDetailEntry[]; notes: CheckInNotes;
  doses: CheckInDose[]; adverseNote: string;
  nausea: boolean; vomiting: boolean; bowelMovements: number | null;
  giDetail: GiDetail;
  erVisit: boolean; erReason: string; erDetail: string;
  reportedBy: 'paciente' | 'cuidador'; caregiverName: string; caregiverRelation: string;  createdAt: string;
  triggers?: string[];
  reliefActions?: ReliefAction[];
  catalogVersion?: string;
}
