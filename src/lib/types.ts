export type ClientClassification = 'A' | 'B' | 'C';

export type Visit = {
  id: string;
  date: Date;
  feedback: string;
  followUp: string;
};

export type Client = {
  id: string;
  name: string;
  contact: string;
  consultant: string;
  classification: ClientClassification;
  lastVisitDate: Date | null;
  nextVisitDate: Date | null;
  visits: Visit[];
};

export type VisitStatus = 'on-schedule' | 'approaching' | 'overdue' | 'no-visits';

export const classificationIntervals: Record<ClientClassification, number> = {
  A: 30, // days
  B: 45,
  C: 60,
};
