import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays } from 'date-fns';
import type { VisitStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getVisitStatus(nextVisitDate: Date | null): VisitStatus {
  if (!nextVisitDate) {
    return 'no-visits';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
  
  const visitDate = new Date(nextVisitDate);
  visitDate.setHours(0, 0, 0, 0); // Normalize visit date

  const daysUntilVisit = differenceInDays(visitDate, today);

  if (daysUntilVisit < 0) {
    return 'overdue';
  }
  if (daysUntilVisit <= 7) {
    return 'approaching';
  }
  return 'on-schedule';
}
