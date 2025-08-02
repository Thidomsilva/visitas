import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, isSameDay, getDay, addDays } from 'date-fns';
import type { VisitStatus, ClientClassification } from './types';
import { classificationIntervals } from "./types";
import { nationalHolidays } from "./data";

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


const holidaysDateObjects = nationalHolidays.map(holiday => {
    const [year, month, day] = holiday.split('-').map(Number);
    // Create date in UTC to avoid timezone issues
    return new Date(Date.UTC(year, month - 1, day));
});

export const isHoliday = (date: Date): boolean => {
    // Compare using UTC dates to be consistent
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return holidaysDateObjects.some(holidayDate => isSameDay(utcDate, holidayDate));
};

export const findNextBusinessDay = (date: Date): Date => {
    let nextDate = new Date(date);
    while (true) {
        const dayOfWeek = getDay(nextDate);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHolidayDate = isHoliday(nextDate);

        if (!isWeekend && !isHolidayDate) {
            return nextDate;
        }
        nextDate = addDays(nextDate, 1);
    }
};

export const calculateNextVisitDate = (lastVisit: Date, classification: ClientClassification, isCritical?: boolean): Date => {
    const criticalInterval = { min: 7, max: 7 };
    const interval = isCritical ? criticalInterval : classificationIntervals[classification];
    const daysToAdd = Math.floor(Math.random() * (interval.max - interval.min + 1)) + interval.min;
    let nextDate = addDays(lastVisit, daysToAdd);
    
    return findNextBusinessDay(nextDate);
};
