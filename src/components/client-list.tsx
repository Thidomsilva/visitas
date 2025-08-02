
"use client";

import { cn } from "@/lib/utils";
import { getVisitStatus } from "@/lib/utils";
import type { Client, VisitStatus } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

const statusIndicatorConfig = {
  'overdue': 'bg-red-500',
  'approaching': 'bg-yellow-500',
  'on-schedule': 'bg-green-500',
  'no-visits': 'bg-gray-400',
};

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

export function ClientList({ clients, selectedClientId, onSelectClient, filter, onFilterChange }: ClientListProps) {
  return (
    <div className="w-full max-w-xs border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
       <div className="p-4">
        <h2 className="text-xl font-bold">Clientes ({clients.length})</h2>
        <Tabs value={filter} onValueChange={onFilterChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 h-auto flex-wrap">
              <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
              <TabsTrigger value="on-schedule" className="flex-1">Em Dia</TabsTrigger>
              <TabsTrigger value="approaching" className="flex-1">Próximas</TabsTrigger>
              <TabsTrigger value="overdue" className="flex-1">Atrasadas</TabsTrigger>
              <TabsTrigger value="no-visits" className="flex-1 col-span-2">Sem Visitas</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {clients.map(client => {
            const status = getVisitStatus(client.nextVisitDate);
            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedClientId === client.id
                    ? "bg-primary text-primary-foreground shadow"
                    : "hover:bg-accent hover:text-accent-foreground bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {client.isCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <h3 className="font-semibold truncate">{client.name}</h3>
                  </div>
                   <span className={cn("w-3 h-3 rounded-full", statusIndicatorConfig[status])} title={`Status: ${status}`}></span>
                </div>
                <p className={cn(
                  "text-sm mt-1",
                   selectedClientId === client.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  Próxima visita: {client.nextVisitDate ? formatDistanceToNow(client.nextVisitDate, { addSuffix: true, locale: ptBR }) : 'Não agendada'}
                </p>
              </button>
            )
          })}
           {clients.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              <p>Nenhum cliente encontrado para este filtro.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
