import { addDays, isMonday, isSaturday, isSunday, format } from 'date-fns';
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

function isValidVisitDay(date: Date) {
  return !isMonday(date) && !isSaturday(date) && !isSunday(date) && !isHoliday(date);
}

export function generateSchedule(clients: Client[], startIndex = 0): Client[] {
  const schedule: Record<string, number> = {}; // YYYY-MM-DD -> count
  const updatedClients = [...clients];

  const startDate = new Date('2025-08-05T00:00:00');
  const startDateCurveA = new Date('2025-08-12T00:00:00');
  const endDate = new Date('2025-12-31T23:59:59');

  // Populate schedule with existing visits from the initial part of the array
   for (let i = 0; i < startIndex; i++) {
    const client = updatedClients[i];
    client.visits.forEach(visit => {
        const dateKey = format(visit.date, 'yyyy-MM-dd');
        schedule[dateKey] = (schedule[dateKey] || 0) + 1;
    });
  }

  // Schedule visits for each client starting from the startIndex
  for (let i = startIndex; i < updatedClients.length; i++) {
    const client = { ...updatedClients[i] };
    
    let initialDate = client.classification === 'A' ? startDateCurveA : startDate;
    let lastVisitDate = client.lastVisitDate ? new Date(client.lastVisitDate) : initialDate;

    // Clear future visits if we are rescheduling
    if (startIndex > 0 && client.lastVisitDate) {
      client.visits = client.visits.filter(v => v.date <= client.lastVisitDate!);
    } else {
      client.visits = [];
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
      const newVisit = {
        id: crypto.randomUUID(),
        date: nextVisitDate,
        feedback: 'Visita agendada automaticamente.',
        followUp: 'Realizar visita na data agendada.',
      };
      
      client.visits.push(newVisit);
      lastVisitDate = nextVisitDate;
    }

    client.visits.sort((a,b) => a.date.getTime() - b.date.getTime());
    client.lastVisitDate = client.visits.length > 0 ? client.visits[client.visits.length - 1].date : null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    client.nextVisitDate = client.visits.find(v => v.date >= today)?.date || null;

    updatedClients[i] = client;
  }

  return updatedClients;
}
