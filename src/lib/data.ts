import type { ClientClassification } from './types';

const clientsData: { name: string, unit: 'LONDRINA' | 'CURITIBA', classification: ClientClassification }[] = [
  { name: 'AGEX', unit: 'LONDRINA', classification: 'C' },
  { name: 'APITEC', unit: 'LONDRINA', classification: 'B' },
  { name: 'APOLO', unit: 'LONDRINA', classification: 'B' },
  { name: 'AREL', unit: 'LONDRINA', classification: 'B' },
  { name: 'ARAMES TOP', unit: 'LONDRINA', classification: 'B' },
  { name: 'ARNALDO\'S', unit: 'LONDRINA', classification: 'A' },
  { name: 'ASTER', unit: 'LONDRINA', classification: 'C' },
  { name: 'ATLANTIS', unit: 'CURITIBA', classification: 'B' },
  { name: 'ATZ', unit: 'LONDRINA', classification: 'A' },
  { name: 'AUTO CENTER BANDEIRANTES', unit: 'LONDRINA', classification: 'A' },
  { name: 'AVANTE', unit: 'LONDRINA', classification: 'B' },
  { name: 'AVATRON', unit: 'LONDRINA', classification: 'B' },
  { name: 'BACCARIM', unit: 'LONDRINA', classification: 'C' },
  { name: 'BERNETI INDUSTRIA', unit: 'CURITIBA', classification: 'B' },
  { name: 'BIG DOG LANCHES', unit: 'LONDRINA', classification: 'C' },
  { name: 'BROT', unit: 'LONDRINA', classification: 'B' },
  { name: 'CENTERROL', unit: 'CURITIBA', classification: 'A' },
  { name: 'CHURRASKIN', unit: 'LONDRINA', classification: 'C' },
  { name: 'CONSTRUTORA STENGE', unit: 'LONDRINA', classification: 'A' },
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

export const nationalHolidays: string[] = [
    // 2024
    '2024-01-01',
    '2024-02-12',
    '2024-02-13',
    '2024-02-14',
    '2024-03-29',
    '2024-04-21',
    '2024-05-01',
    '2024-05-30',
    '2024-09-07',
    '2024-10-12',
    '2024-11-02',
    '2024-11-15',
    '2024-12-25',
    // 2025
    '2025-01-01',
    '2025-03-03',
    '2025-03-04',
    '2025-03-05',
    '2025-04-18',
    '2025-04-21',
    '2025-05-01',
    '2025-06-19',
    '2025-09-07',
    '2025-10-12',
    '2025-11-02',
    '2025-11-15',
    '2025-12-25',
];


export const getResponsavel = (unit: string, classification: ClientClassification): string => {
    if (unit === 'CURITIBA') {
        return 'Marcos';
    }

    if (unit === 'LONDRINA') {
        if (classification === 'A') {
            return 'Thiago';
        } else {
            return 'Vandreia';
        }
    }
    
    return 'Indefinido';
};

// This function can be used in a separate script to seed the database one time.
export const getInitialClientsForSeed = () => {
    return clientsData.map(clientData => {
        const responsavel = getResponsavel(clientData.unit, clientData.classification);
        return {
            ...clientData,
            responsavel,
            lastVisitDate: null,
            nextVisitDate: null,
            visits: [],
            isCritical: false,
            createdAt: new Date(),
        };
    });
};
