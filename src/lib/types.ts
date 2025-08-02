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
  createdAt: Timestamp | Date;
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

export function deserializeClient(client: Client): Client {
    const toDate = (timestamp: any): Date | null => {
        if (!timestamp) return null;
        if (timestamp instanceof Date) return timestamp;
        // Firestore Timestamps have a toDate() method
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        // Fallback for string or number representations
        const d = new Date(timestamp);
        return isNaN(d.getTime()) ? null : d;
    };
    
    return {
        ...client,
        lastVisitDate: toDate(client.lastVisitDate),
        nextVisitDate: toDate(client.nextVisitDate),
        // Ensure createdAt is always a Date object, defaulting to now if missing
        createdAt: toDate(client.createdAt) || new Date(),
        visits: Array.isArray(client.visits) ? client.visits.map(v => ({ ...v, date: toDate(v.date) as Date })) : [],
    };
}
