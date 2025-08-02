
'use client';

import React, { useMemo, useState } from 'react';
import { DayPicker, DayProps } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { Client, Visit, ClientClassification } from '@/lib/types';
import { getVisitStatus, cn, isBusinessDay } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ClientDetail } from './client-detail';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

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
    onScheduleMeeting: (clientId: string, date: Date) => void;
    onUpdateClassification: (clientId: string, newClassification: ClientClassification) => void;
}

function CustomDay(props: DayProps & { clientsOnThisDay: Client[]; onClientClick: (id: string) => void }) {
    const { date, displayMonth, clientsOnThisDay, onClientClick } = props;
    const dayNumber = format(date, 'd');
    const isOutside = props.outside;
    const isToday = isSameDay(date, new Date());
    
    return (
        <div className={cn("h-full flex flex-col", isOutside ? "text-muted-foreground/50" : "bg-card")}>
            <time dateTime={date.toISOString()} className={cn("p-1 text-right text-xs md:text-sm", isToday && "font-bold text-primary")}>
                {dayNumber}
            </time>
            <ScrollArea className="flex-1 -mt-1">
                <div className="space-y-1 p-1">
                {clientsOnThisDay.map(client => {
                    const status = getVisitStatus(client.nextVisitDate as Date | null);
                    return (
                    <button 
                        key={client.id}
                        onClick={() => onClientClick(client.id)}
                        className={cn(
                        "w-full text-left p-1 md:p-1.5 rounded-md border text-[10px] md:text-xs leading-tight transition-all",
                         statusIndicatorConfig[status],
                         'hover:shadow-md'
                        )}
                    >
                        <p className="font-semibold truncate">{client.name}</p>
                        <p className="opacity-80 hidden md:block">{client.responsavel}</p>
                    </button>
                    )
                })}
                </div>
            </ScrollArea>
        </div>
    );
}

export function CalendarView({ clients, onClientClick, selectedClientId, ...clientDetailProps }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [localSelectedClientId, setLocalSelectedClientId] = useState<string | null>(selectedClientId);

  const handleClientClick = (id: string) => {
    setLocalSelectedClientId(id);
    onClientClick(id); // Propagate to parent for potential view switching
  };
  
  const selectedClient = useMemo(() => {
    if (!localSelectedClientId) return null;
    return clients.find(c => c.id === localSelectedClientId) || null;
  }, [localSelectedClientId, clients]);

  const allVisitsByDay = useMemo(() => {
    const map = new Map<string, Client[]>();
    clients.forEach(client => {
      if (client.nextVisitDate) {
        const nextVisit = client.nextVisitDate instanceof Date ? client.nextVisitDate : client.nextVisitDate.toDate();
        const dayKey = format(nextVisit, 'yyyy-MM-dd');
        const existing = map.get(dayKey) || [];
        if (!existing.some(c => c.id === client.id)) {
            map.set(dayKey, [...existing, client]);
        }
      }
    });
    return map;
  }, [clients]);

  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  // Mobile view: show detail view on top of calendar
  if (isMobile && selectedClient) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <Button variant="ghost" onClick={() => setLocalSelectedClientId(null)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Calendário
        </Button>
        <ClientDetail client={selectedClient} {...clientDetailProps} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
      <div className="flex-1 md:flex-[3] bg-card rounded-lg border flex flex-col h-full">
         <DayPicker
            locale={ptBR}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="h-full w-full flex flex-col"
            classNames={{
              month_caption: 'p-2',
              head: 'border-b',
              head_cell: 'w-[calc(100%/7)] py-2 text-sm text-muted-foreground',
              table: 'flex-1 border-collapse w-full',
              tbody: 'h-full grid grid-rows-6',
              row: 'grid grid-cols-7 border-b last:border-b-0',
              cell: 'border-r last:border-r-0',
              day: 'h-full w-full p-0',
            }}
            components={{
              Day: (props: DayProps) => {
                const dayKey = format(props.date, 'yyyy-MM-dd');
                const clientsOnThisDay = allVisitsByDay.get(dayKey) || [];
                return <CustomDay {...props} clientsOnThisDay={clientsOnThisDay} onClientClick={handleClientClick}/>
              }
            }}
            disabled={date => !isBusinessDay(date)}
            showOutsideDays
          />
      </div>
      <div className="hidden md:block flex-1 h-full overflow-y-auto">
         {selectedClient ? (
            <ClientDetail client={selectedClient} {...clientDetailProps} />
         ) : (
            <div className="p-4 bg-card rounded-lg border h-full flex items-center justify-center text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">Cliente Selecionado</h3>
                <p className="text-sm text-muted-foreground">Clique em um cliente no calendário para ver seus detalhes aqui e registrar uma visita.</p>
              </div>
            </div>
         )}
      </div>
    </div>
  );
}
