import type { Client, ClientClassification } from './types';

const clientsData: { name: string, unit: string, classification: ClientClassification, predefinedVisit?: string }[] = [
  { name: 'AGEX', unit: 'LONDRINA', classification: 'C' },
  { name: 'APITEC', unit: 'LONDRINA', classification: 'B' },
  { name: 'APOLO', unit: 'LONDRINA', classification: 'B' },
  { name: 'AREL', unit: 'LONDRINA', classification: 'B' },
  { name: 'ARAMES TOP', unit: 'LONDRINA', classification: 'B' },
  { name: 'ARNALDO\'S', unit: 'LONDRINA', classification: 'A' },
  { name: 'ASTER', unit: 'LONDRINA', classification: 'C' },
  { name: 'ATLANTIS', unit: 'CURITIBA', classification: 'B' },
  { name: 'ATZ', unit: 'LONDRINA', classification: 'A', predefinedVisit: '2025-08-04T10:00:00' },
  { name: 'AUTO CENTER BANDEIRANTES', unit: 'LONDRINA', classification: 'A' },
  { name: 'AVANTE', unit: 'LONDRINA', classification: 'B' },
  { name: 'AVATRON', unit: 'LONDRINA', classification: 'B' },
  { name: 'BACCARIM', unit: 'LONDRINA', classification: 'C' },
  { name: 'BERNETI INDUSTRIA', unit: 'CURITIBA', classification: 'B' },
  { name: 'BIG DOG LANCHES', unit: 'LONDRINA', classification: 'C' },
  { name: 'BROT', unit: 'LONDRINA', classification: 'B' },
  { name: 'CENTERROL', unit: 'CURITIBA', classification: 'A' },
  { name: 'CHURRASKIN', unit: 'LONDRINA', classification: 'C' },
  { name: 'CONSTRUTORA STENGE', unit: 'LONDRINA', classification: 'A', predefinedVisit: '2025-08-05T10:00:00' },
  { name: 'DEPÓSITO PRINCIPE', unit: 'LONDRINA', classification: 'B' },
  { name: 'ELETRO POLAR', unit: 'CURITIBA', classification: 'A' },
  { name: 'FUNGARI AR CONDICIONADO', unit: 'LONDRINA', classification: 'C' },
  { name: 'FIBERTECH', unit: 'LONDRINA', classification: 'C' },
  { name: 'GELOBEL', unit: 'LONDRINA', classification: 'A' },
  { name: 'GRUPO 3S ENGENHARIA', unit: 'LONDRINA', classification: 'B' },
  { name: 'ICONNECT', unit: 'LONDRINA', classification: 'B' },
  { name: 'JUMPER', unit: 'LONDRINA', classification: 'B' },
  { name: 'LILIBETY', unit: 'LONDRINA', classification: 'C' },
  { name: 'MAIS SAUDE', unit: 'LONDRINA', classification: 'A' },
  { name: 'MAST PET', unit: 'LONDRINA', classification: 'A' },
  { name: 'METALUS', unit: 'CURITIBA', classification: 'A' },
  { name: 'OYSHI', unit: 'LONDRINA', classification: 'A' },
  { name: 'PANIFICADORA 3 MARCOS', unit: 'LONDRINA', classification: 'C' },
  { name: 'PAVESI UNIFORMES', unit: 'CURITIBA', classification: 'C' },
  { name: 'PRATS', unit: 'LONDRINA', classification: 'B' },
  { name: 'PREMIER', unit: 'LONDRINA', classification: 'B' },
  { name: 'PRIMELOG', unit: 'LONDRINA', classification: 'C' },
  { name: 'RODOMIGLIO', unit: 'LONDRINA', classification: 'A' },
  { name: 'ROUTE BEER', unit: 'LONDRINA', classification: 'B' },
  { name: 'RS TRANSMISSÃO', unit: 'LONDRINA', classification: 'B' },
  { name: 'SPIRONELLI', unit: 'LONDRINA', classification: 'C' },
  { name: 'TECNOAR', unit: 'LONDRINA', classification: 'B' },
  { name: 'TICK TITOS', unit: 'LONDRINA', classification: 'B' },
  { name: 'VS GOLD', unit: 'LONDRINA', classification: 'B' },
  { name: 'YOKOZAWA', unit: 'LONDRINA', classification: 'B' },
  { name: 'ZM HOSPITALAR', unit: 'LONDRINA', classification: 'B' },
];

const getResponsavel = (unit: string): string => {
    if (unit === 'CURITIBA') {
        return 'Marcos';
    }
    // Randomly assign between Thiago and Vandreia for LONDRINA
    return Math.random() > 0.5 ? 'Thiago' : 'Vandreia';
};

export const initialClients: Client[] = clientsData.map((clientData, index) => {
    const client: Client = {
        id: `${index + 1}`,
        name: clientData.name,
        unit: clientData.unit,
        responsavel: getResponsavel(clientData.unit),
        classification: clientData.classification,
        lastVisitDate: null,
        nextVisitDate: null,
        visits: [],
    };

    if (clientData.predefinedVisit) {
        const visitDate = new Date(clientData.predefinedVisit);
        client.visits.push({
            id: crypto.randomUUID(),
            date: visitDate,
            feedback: 'Visita pré-agendada.',
            followUp: 'Realizar visita conforme agendamento.',
        });
        client.lastVisitDate = visitDate; // Treat this as the last visit to calculate the next one from it
    }

    return client;
});
