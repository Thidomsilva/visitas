
'use client';

import React, { useMemo, useState } from 'react';
import { DayPicker, DayProps } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { Client, Visit } from '@/lib/types';
import { getVisitStatus, cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ClientDetail } from './client-detail';

const statusIndicatorConfig = {
  'overdue': 'bg-red-200 text-red-800 border-red-400',
  'approaching': 'bg-yellow-200 text-yellow-800 border-yellow-400',
  'on-schedule': 'bg-green-200 text-green-800 border-green-400',
  'no-visits': 'bg-gray-200 text-gray-800 border-gray-400',
};


interface CalendarViewProps {
    clients: Client[];
    onClientClick: (id: string) => void;
    selectedClientId: string | null;
    onVisitLogged: (clientId: string, visit: Visit) => void;
    onDeleteClient: (clientId: string) => void;
    onToggleCriticalStatus: (clientId: string) => void;
}

function CustomDay(props: DayProps) {
    const { clientsOnThisDay, onClientClick, selectedClientId } = props.day.appContext as { 
        clientsOnThisDay: Client[], 
        onClientClick: (id: string) => void,
        selectedClientId: string | null
    };
    const dayNumber = format(props.date, 'd');

    return (
        <div className="flex flex-col h-full w-full">
            <time dateTime={props.date.toISOString()} className="self-start p-1">{dayNumber}</time>
            <ScrollArea className="flex-1 -mt-1">
                <div className="space-y-1 p-1">
                {clientsOnThisDay.map(client => {
                    const status = getVisitStatus(client.nextVisitDate);
                    return (
                    <button 
                        key={client.id}
                        onClick={() => onClientClick(client.id)}
                        className={cn(
                        "w-full text-left p-1.5 rounded-md border text-xs leading-tight transition-all",
                         statusIndicatorConfig[status],
                         selectedClientId === client.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                        )}
                    >
                        <p className="font-semibold truncate">{client.name}</p>
                        <p className="opacity-80">{client.responsavel}</p>
                    </button>
                    )
                })}
                </div>
            </ScrollArea>
        </div>
    );
}

export function CalendarView({ clients, onClientClick, selectedClientId, ...clientDetailProps }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date('2025-08-05')));
  
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  const scheduledClientsByDay = useMemo(() => {
    const map = new Map<string, Client[]>();
    clients.forEach(client => {
      client.visits.forEach(visit => {
        const dayKey = format(visit.date, 'yyyy-MM-dd');
        const existing = map.get(dayKey) || [];
        // Avoid duplicates if a client has multiple visits on the same day (shouldn't happen with current logic)
        if (!existing.some(c => c.id === client.id)) {
            map.set(dayKey, [...existing, client]);
        }
      });
    });
    return map;
  }, [clients]);

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4">
      <div className="flex-[3] bg-white rounded-lg border p-4 h-full flex flex-col">
         <DayPicker
            locale={ptBR}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="h-full w-full"
            classNames={{
                table: "h-full w-full border-collapse",
                tbody: "h-full",
                row: "h-1/6",
                cell: "h-full w-1/7 border align-top",
                day: "h-full w-full p-0"
            }}
            components={{
              Day: (props: DayProps) => {
                const dayKey = format(props.date, 'yyyy-MM-dd');
                const clientsOnThisDay = scheduledClientsByDay.get(dayKey) || [];
                const appContext = { clientsOnThisDay, onClientClick, selectedClientId };
                return <CustomDay {...props} day={{...props.day, appContext}}/>
              }
            }}
            showOutsideDays
          />
      </div>
      <div className="flex-1 h-full overflow-y-auto">
        <ClientDetail client={selectedClient} {...clientDetailProps} />
      </div>
    </div>
  );
}
