
"use client"
import type { Client, Visit } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from "./status-badge";
import { getVisitStatus } from "@/lib/utils";
import { Button } from "./ui/button";
import { PlusCircle, Trash2, AlertTriangle, Calendar as CalendarIcon, History } from "lucide-react";
import { VisitHistoryDialog } from "./visit-history-dialog";
import { useState, useMemo } from "react";
import { VisitLogDialog } from "./visit-log-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

interface ClientDetailProps {
  client: Client | null;
  onVisitLogged: (clientId: string, visit: Visit) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleCriticalStatus: (clientId: string) => void;
  onScheduleMeeting: (clientId: string, date: Date) => void;
}

export function ClientDetail({ client, onVisitLogged, onDeleteClient, onToggleCriticalStatus, onScheduleMeeting }: ClientDetailProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  
  const status = useMemo(() => client ? getVisitStatus(client.nextVisitDate as Date | null) : 'no-visits', [client]);
  
  const handleLogVisit = (visit: Visit) => {
    if (!client) return;
    onVisitLogged(client.id, visit);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date && client) {
      onScheduleMeeting(client.id, date);
      setSchedulePopoverOpen(false);
    }
  };

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Card className="w-full max-w-lg text-center py-16">
          <CardHeader>
            <CardTitle>Nenhum Cliente Selecionado</CardTitle>
            <CardDescription>Selecione um cliente na lista para ver os detalhes.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex-1 w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-2xl">{client.name}</CardTitle>
                    <StatusBadge status={status} />
                    {client.isCritical && <Badge variant="destructive" className="animate-pulse">CRÍTICO</Badge>}
                </div>
                <CardDescription className="mt-1">Unidade: {client.unit}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-start md:justify-end w-full md:w-auto">
                <Button 
                    variant={client.isCritical ? "destructive" : "outline"} 
                    onClick={() => onToggleCriticalStatus(client.id)}
                    size="sm"
                >
                    <AlertTriangle className="mr-2 h-4 w-4" /> 
                    {client.isCritical ? "Remover Criticidade" : "Marcar Crítico"}
                 </Button>
                <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" /> Agendar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={client.nextVisitDate ? new Date(client.nextVisitDate) : undefined}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                 <Button variant="outline" onClick={() => setLogDialogOpen(true)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar
                 </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive-outline" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus dados de visita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">
                            Sim, excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-muted-foreground">Responsável</h4>
                <p>{client.responsavel}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-muted-foreground">Curva</h4>
                <p>Classe {client.classification}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-muted-foreground">Próxima Visita</h4>
                <p>{client.nextVisitDate ? format(client.nextVisitDate as Date, 'PPP', { locale: ptBR }) : 'N/D'}</p>
            </div>
        </div>
        <div>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold">Histórico de Visitas</h4>
                <Button variant="link" onClick={() => setHistoryDialogOpen(true)}>
                    <History className="mr-2 h-4 w-4"/>
                    Ver completo
                </Button>
            </div>
            {client.visits.length > 0 ? (
                <div className="space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {client.visits.slice(0, 5).map(visit => (
                         <div key={visit.id} className="pb-4 border-b last:border-b-0">
                           <p className="font-semibold">{format(visit.date as Date, 'PPP, HH:mm', { locale: ptBR })} <span className="text-muted-foreground font-normal">- por {visit.registeredBy}</span></p>
                           <p className="mt-2 text-sm"><strong className="text-muted-foreground">Feedback:</strong> {visit.feedback}</p>
                           <p className="mt-1 text-sm"><strong className="text-muted-foreground">Acompanhamento:</strong> {visit.followUp}</p>
                         </div>
                    ))}
                </div>
            ): (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                    <p>Nenhuma visita registrada.</p>
                     <Button variant="link" className="mt-2" onClick={() => setLogDialogOpen(true)}>Registrar a primeira visita agora?</Button>
                </div>
            )}
        </div>
      </CardContent>

      <VisitLogDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        client={client}
        onVisitLogged={(visit) => {
          handleLogVisit(visit);
          setLogDialogOpen(false);
        }}
      />
      
      <VisitHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        clientName={client.name}
        visits={client.visits}
      />
    </Card>
  )
}

    