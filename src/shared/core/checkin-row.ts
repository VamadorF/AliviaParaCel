// Generado: no editar

export interface CheckInRow {
  patientRut: string; time: string; pain: number; zones: string[]; mood: string; sleep: string; why: string[];
  medsTaken: string[]; medsDetail: MedDetailEntry[]; notes: CheckInNotes;
  doses: CheckInDose[]; adverseNote: string;
  nausea: boolean; vomiting: boolean; bowelMovements: number | null;
  giDetail: GiDetail;
  erVisit: boolean; erReason: string; erDetail: string;
  reportedBy: 'paciente' | 'cuidador'; caregiverName: string; caregiverRelation: string;
  createdAt: string;
}
