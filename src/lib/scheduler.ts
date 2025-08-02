import { addDays, subDays, isMonday, isSaturday, isSunday, format } from 'date-fns';
import { classificationIntervals, criticalInterval, type Client, type Visit } from './types';

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
  if (isSaturday(date) || isSunday(date) || isHoliday(date)) {
    return false;
  }
  if (!allowMonday && isMonday(date)) {
    return false;
  }
  return true;
}

// Function to convert client properties from JSON (string dates) to Date objects
function parseClientDates(client: Client): Client {
  return {
    ...client,
    lastVisitDate: client.lastVisitDate ? new Date(client.lastVisitDate) : null,
    nextVisitDate: client.nextVisitDate ? new Date(client.nextVisitDate) : null,
    visits: client.visits.map(visit => ({
      ...visit,
      date: new Date(visit.date)
    })),
  };
}


export function generateSchedule(clients: Client[], startIndex = 0): Client[] {
  const schedule: Record<string, number> = {}; // YYYY-MM-DD -> count
  const updatedClients = clients.map(parseClientDates); // Ensure all dates are Date objects

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

   // Pre-populate schedule with predefined and critical visits
  updatedClients.forEach(client => {
    client.visits.forEach(visit => {
      // Check if it's a pre-agreed visit
      if (visit.feedback.includes(' pré-definida') || visit.feedback.includes(' pré-agendada')) {
        const dateKey = format(visit.date, 'yyyy-MM-dd');
        schedule[dateKey] = (schedule[dateKey] || 0) + 1;
      }
    });
  });

  // Schedule visits for each client starting from the startIndex
  for (let i = startIndex; i < updatedClients.length; i++) {
    const client = updatedClients[i];
    
    let lastVisitDate: Date;
    
    // Determine the starting point for scheduling
    if (client.lastVisitDate) {
        lastVisitDate = new Date(client.lastVisitDate);
        // Clean up future auto-scheduled visits to allow for regeneration
        client.visits = client.visits.filter(v => v.date <= lastVisitDate || v.feedback.includes(' pré-definida'));
    } else {
       // This is a new client or initial schedule generation without any past date.
       // Create a fictional last visit date in the past to make the schedule start immediately.
       const interval = classificationIntervals[client.classification];
       const randomDaysPast = getRandomInt(0, interval.max);
       const baseDate = client.classification === 'A' ? new Date('2025-08-12T00:00:00') : startDate;
       lastVisitDate = subDays(baseDate, randomDaysPast);
       client.visits = client.visits.filter(v => v.feedback.includes(' pré-definida')); // Keep only predefined
    }

    let nextVisitDate = new Date(lastVisitDate);

    while (nextVisitDate <= endDate) {
      const interval = client.isCritical ? criticalInterval : classificationIntervals[client.classification];
      const daysToAdd = client.isCritical ? interval.min : getRandomInt(interval.min, interval.max);
      
      let candidateDate = addDays(lastVisitDate, daysToAdd);

      // Find the next valid date that is not full
      while (true) {
        if (candidateDate > endDate) break;

        const dateKey = format(candidateDate, 'yyyy-MM-dd');
        const isPredefined = client.visits.some(v => format(v.date, 'yyyy-MM-dd') === dateKey && v.feedback.includes(' pré-definida'));

        // Exception for critical clients or pre-defined visits - they can be scheduled on Mondays
        const allowMonday = client.isCritical || isPredefined;

        if (isValidVisitDay(candidateDate, allowMonday) && (schedule[dateKey] || 0) < 2 && !isPredefined) {
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
        const newVisit: Omit<Visit, 'id'> & { id?: string } = {
            date: nextVisitDate,
            feedback: 'Visita agendada automaticamente.',
            followUp: 'Realizar visita na data agendada.',
            registeredBy: 'Sistema',
        };
        (newVisit as Visit).id = crypto.randomUUID();
        client.visits.push(newVisit as Visit);
      }
      
      lastVisitDate = nextVisitDate;
    }

    client.visits.sort((a,b) => a.date.getTime() - b.date.getTime());
    
    // The actual last visit date is the most recent one in the past relative to today
    const today = new Date();
    today.setHours(0,0,0,0);
    const pastOrTodayVisits = client.visits.filter(v => v.date <= today);
    client.lastVisitDate = pastOrTodayVisits.length > 0 ? pastOrTodayVisits[pastOrTodayVisits.length - 1].date : null;
    
    const futureVisits = client.visits.filter(v => v.date > today);
    client.nextVisitDate = futureVisits.length > 0 ? futureVisits[0].date : null;

    updatedClients[i] = client;
  }

  return updatedClients;
}
