import { addDays, subDays } from 'date-fns';
import type { Client } from './types';

const now = new Date();

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Innovate Corp',
    contact: 'contact@innovate.com',
    consultant: 'Alice Johnson',
    classification: 'A',
    lastVisitDate: subDays(now, 20),
    nextVisitDate: addDays(subDays(now, 20), 30),
    visits: [
      { id: 'v1', date: subDays(now, 20), feedback: 'Great progress on the new project.', followUp: 'Schedule a follow-up for the Q3 roadmap.' }
    ],
  },
  {
    id: '2',
    name: 'Solutions Inc.',
    contact: 'hello@solutions.io',
    consultant: 'Bob Williams',
    classification: 'B',
    lastVisitDate: subDays(now, 50),
    nextVisitDate: addDays(subDays(now, 50), 45),
    visits: [
      { id: 'v2', date: subDays(now, 50), feedback: 'Discussed new market entry strategies.', followUp: 'Prepare a report on competitor analysis.' }
    ],
  },
  {
    id: '3',
    name: 'Synergy Group',
    contact: 'info@synergy.co',
    consultant: 'Alice Johnson',
    classification: 'A',
    lastVisitDate: subDays(now, 5),
    nextVisitDate: addDays(subDays(now, 5), 30),
    visits: [
       { id: 'v3', date: subDays(now, 5), feedback: 'Reviewed quarterly performance.', followUp: 'Finalize the budget for the next quarter.' }
    ],
  },
  {
    id: '4',
    name: 'Apex Enterprises',
    contact: 'support@apex.com',
    consultant: 'Charlie Brown',
    classification: 'C',
    lastVisitDate: subDays(now, 70),
    nextVisitDate: addDays(subDays(now, 70), 60),
    visits: [
      { id: 'v4', date: subDays(now, 70), feedback: 'Onboarding session for the new team.', followUp: 'Provide training materials.' }
    ],
  },
  {
    id: '5',
    name: 'Quantum Solutions',
    contact: 'q.solutions@mail.com',
    consultant: 'Bob Williams',
    classification: 'B',
    lastVisitDate: subDays(now, 40),
    nextVisitDate: addDays(subDays(now, 40), 45),
    visits: [
      { id: 'v5', date: subDays(now, 40), feedback: 'Initial consultation and requirement gathering.', followUp: 'Draft a project proposal.' }
    ],
  },
  {
    id: '6',
    name: 'Pioneer Ltd.',
    contact: 'contact@pioneer.com',
    consultant: 'Charlie Brown',
    classification: 'A',
    lastVisitDate: null,
    nextVisitDate: null,
    visits: [],
  },
   {
    id: '7',
    name: 'NextGen Innovations',
    contact: 'info@nextgen.tech',
    consultant: 'Alice Johnson',
    classification: 'B',
    lastVisitDate: subDays(now, 44),
    nextVisitDate: addDays(subDays(now, 44), 45),
    visits: [
       { id: 'v7', date: subDays(now, 44), feedback: 'Follow-up on product demo.', followUp: 'Send over pricing details and contract.' }
    ],
  },
  {
    id: '8',
    name: 'Visionary Ventures',
    contact: 'connect@visionary.vc',
    consultant: 'Bob Williams',
    classification: 'C',
    lastVisitDate: subDays(now, 61),
    nextVisitDate: addDays(subDays(now, 61), 60),
    visits: [
      { id: 'v8', date: subDays(now, 61), feedback: 'Annual review meeting.', followUp: 'Update service agreement for the new year.' }
    ],
  },
];
