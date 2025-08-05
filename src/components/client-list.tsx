
"use client";

import { cn } from "@/lib/utils";
import { getVisitStatus } from "@/lib/utils";
import type { Client, VisitStatus, ClientClassification } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


const statusIndicatorConfig = {
  'overdue': 'bg-red-500',
  'approaching': 'bg-yellow-500',
  'on-schedule': 'bg-green-500',
  'no-visits': 'bg-gray-400',
  'realizadas': 'bg-blue-500',
};

type FilterType = "all" | VisitStatus | `class-${ClientClassification}` | "realizadas";
type UnitFilterType = 'all' | 'LONDRINA' | 'CURITIBA';


interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  filter: FilterType;
  onFilterChange: (value: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  unitFilter: UnitFilterType;
  onUnitFilterChange: (value: UnitFilterType) => void;
}

export function ClientList({ 
  clients, 
  selectedClientId, 
  onSelectClient, 
  filter, 
  onFilterChange,
  searchQuery,
  onSearchChange,
  unitFilter,
  onUnitFilterChange
}: ClientListProps) {
  
  const getTabValue = () => {
    if (filter.startsWith('class-')) {
      return 'all'; // Don't highlight any tab if filtering by classification
    }
    return filter;
  }
  
  return (
    <div className="w-full md:max-w-xs border-b md:border-b-0 md:border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
       <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">Clientes ({clients.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Unidade</Label>
           <Select value={unitFilter} onValueChange={(val) => onUnitFilterChange(val as UnitFilterType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              <SelectItem value="LONDRINA">Londrina</SelectItem>
              <SelectItem value="CURITIBA">Curitiba</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs value={getTabValue()} onValueChange={(val) => onFilterChange(val as FilterType)} className="mt-2">
            <TabsList className="grid w-full grid-cols-4 h-auto flex-wrap">
              <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
              <TabsTrigger value="on-schedule" className="flex-1">Em Dia</TabsTrigger>
              <TabsTrigger value="approaching" className="flex-1">Próximas</TabsTrigger>
              <TabsTrigger value="overdue" className="flex-1">Atrasadas</TabsTrigger>
              <TabsTrigger value="no-visits" className="flex-1 col-span-2">Sem Visitas</TabsTrigger>
              <TabsTrigger value="realizadas" className="flex-1 col-span-2">Realizadas</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {clients.map(client => {
            const status = getVisitStatus(client.nextVisitDate as Date | null);
            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedClientId === client.id && "md:bg-primary md:text-primary-foreground md:shadow",
                  "hover:bg-accent hover:text-accent-foreground bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {client.isCritical && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" title="Cliente Crítico"/>}
                    <h3 className="font-semibold truncate">{client.name}</h3>
                  </div>
                   <span className={cn("w-3 h-3 rounded-full", statusIndicatorConfig[filter === 'realizadas' ? 'realizadas' : status])} title={`Status: ${status}`}></span>
                </div>
                <p className={cn(
                  "text-sm mt-1",
                   selectedClientId === client.id ? "md:text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  Próxima visita: {client.nextVisitDate ? formatDistanceToNow(client.nextVisitDate as Date, { addSuffix: true, locale: ptBR }) : 'Não agendada'}
                </p>
                 {client.lastVisitDate && (
                    <p className={cn(
                      "text-xs mt-1",
                      selectedClientId === client.id ? "md:text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      Última visita: {formatDistanceToNow(client.lastVisitDate as Date, { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
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
