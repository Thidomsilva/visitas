import { Timestamp } from 'firebase/firestore';

export type ClientClassification = 'A' | 'B' | 'C';

export type Visit = {
  id: string;
  date: Date | Timestamp;
  feedback: string;
  followUp: string;
  registeredBy: string;
};

export type Client = {
  id: string;
  name: string;
  unit: string;
  responsavel: string;
  classification: ClientClassification;
  lastVisitDate: Date | Timestamp | null;
  nextVisitDate: Date | Timestamp | null;
  visits: Visit[];
  isCritical?: boolean;
  createdAt: Timestamp;
};

export type VisitStatus = 'on-schedule' | 'approaching' | 'overdue' | 'no-visits';

export const classificationIntervals: Record<ClientClassification, { min: number; max: number }> = {
  A: { min: 25, max: 35 },
  B: { min: 36, max: 50 },
  C: { min: 50, max: 90 },
};

export const criticalInterval = {
    min: 7,
    max: 7,
};
