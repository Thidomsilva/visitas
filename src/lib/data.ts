import type { ClientClassification } from './types';

// This file now primarily serves as a reference or for a one-time seeding script.
// The main application will read and write data from Firebase, not from here.

const clientsData: { name: string, unit: 'LONDRINA' | 'CURITIBA', classification: ClientClassification }[] = [
  // A lista de clientes foi removida para preparar para os dados de produção.
  // Os clientes agora devem ser adicionados através da interface do aplicativo.
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
