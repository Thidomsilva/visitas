import { addDays, subDays, isMonday, isSaturday, isSunday, format } from 'date-fns';
import { classificationIntervals, type Client } from './types';

// Helper function to get a random integer between min and max (inclusive)
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// List of holidays in 2025 (Brazil) - format YYYY-MM-DD
const holidays = new Set([
  '2025-01-01', // Confraternização Universal
  '2025-03-03', // Carnaval
  '2025-03-04', // Carnaval
  '2025-04-18', // Paixão de Cristo
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independência do Brasil
  '2025-10-12', // Nossa Sr.a Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamação da República
  '2025-12-25', // Natal
]);

function isHoliday(date: Date) {
  return holidays.has(format(date, 'yyyy-MM-dd'));
}

function isValidVisitDay(date: Date, allowMonday = false) {
  if(allowMonday && isMonday(date)) return !isHoliday(date);
  return !isMonday(date) && !isSaturday(date) && !isSunday(date) && !isHoliday(date);
}

export function generateSchedule(clients: Client[], startIndex = 0): Client[] {
  const schedule: Record<string, number> = {}; // YYYY-MM-DD -> count
  const updatedClients = [...clients];

  const startDate = new Date('2025-08-05T00:00:00');
  const endDate = new Date('2025-12-31T23:59:59');

  // Populate schedule with existing visits from the initial part of the array
   for (let i = 0; i < startIndex; i++) {
    const client = updatedClients[i];
    client.visits.forEach(visit => {
        const dateKey = format(visit.date, 'yyyy-MM-dd');
        schedule[dateKey] = (schedule[dateKey] || 0) + 1;
    });
  }

   // Pre-populate schedule with predefined visits
  clients.forEach(client => {
    client.visits.forEach(visit => {
      if (visit.feedback === 'Visita pré-agendada.') {
        const dateKey = format(visit.date, 'yyyy-MM-dd');
        schedule[dateKey] = (schedule[dateKey] || 0) + 1;
      }
    });
  });

  // Schedule visits for each client starting from the startIndex
  for (let i = startIndex; i < updatedClients.length; i++) {
    const client = { ...updatedClients[i] };
    
    // Simulate a past "last visit" to generate a realistic schedule from the start date
    let lastVisitDate: Date;
    
    const hasPredefinedVisit = client.visits.some(v => v.feedback === 'Visita pré-agendada.');

    if (client.lastVisitDate) {
        lastVisitDate = new Date(client.lastVisitDate);
        // Clear future visits if we are rescheduling from a real visit
         if (startIndex > 0) {
            client.visits = client.visits.filter(v => v.date <= client.lastVisitDate!);
        } else if(!hasPredefinedVisit) {
            client.visits = [];
        }
    } else {
       // This is a new client or initial schedule generation.
       // Create a fictional last visit date in the past to make the schedule start immediately.
       const interval = classificationIntervals[client.classification];
       const randomDaysPast = getRandomInt(0, interval.max); // From 0 to max days ago
       const baseDate = client.classification === 'A' ? new Date('2025-08-12T00:00:00') : startDate;
       lastVisitDate = subDays(baseDate, randomDaysPast);
       if(!hasPredefinedVisit) {
         client.visits = []; // Ensure we are starting fresh if no predefined visits
       }
    }

    let nextVisitDate = new Date(lastVisitDate);

    while (nextVisitDate <= endDate) {
      const interval = classificationIntervals[client.classification];
      const daysToAdd = getRandomInt(interval.min, interval.max);
      
      let candidateDate = addDays(lastVisitDate, daysToAdd);

      // Find the next valid date that is not full
      while (true) {
        if (candidateDate > endDate) break;

        const dateKey = format(candidateDate, 'yyyy-MM-dd');
        // A predefined visit does not count towards the daily limit of automatic scheduling
        if (isValidVisitDay(candidateDate) && (schedule[dateKey] || 0) < 2) {
          schedule[dateKey] = (schedule[dateKey] || 0) + 1;
          break; // Found a valid slot
        }
        candidateDate = addDays(candidateDate, 1); // Try next day
      }

      if (candidateDate > endDate) {
        break; // No more valid slots in the period
      }

      nextVisitDate = candidateDate;
      
      // We only add the visit if it's on or after the official start date
      if(nextVisitDate >= startDate) {
        const newVisit = {
            id: crypto.randomUUID(),
            date: nextVisitDate,
            feedback: 'Visita agendada automaticamente.',
            followUp: 'Realizar visita na data agendada.',
        };
        client.visits.push(newVisit);
      }
      
      lastVisitDate = nextVisitDate;
    }

    client.visits.sort((a,b) => a.date.getTime() - b.date.getTime());
    
    // The actual last visit date is the most recent one in the past relative to today
    const today = new Date();
    today.setHours(0,0,0,0);
    const pastVisits = client.visits.filter(v => v.date < today);
    client.lastVisitDate = pastVisits.length > 0 ? pastVisits[pastVisits.length - 1].date : null;
    
    client.nextVisitDate = client.visits.find(v => v.date >= today)?.date || null;

    updatedClients[i] = client;
  }

  return updatedClients;
}
