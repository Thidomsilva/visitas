
"use client"
import type { Client, Visit } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from "./status-badge";
import { getVisitStatus } from "@/lib/utils";
import { Button } from "./ui/button";
import { PlusCircle, Trash2, AlertTriangle } from "lucide-react";
import { VisitHistoryDialog } from "./visit-history-dialog";
import { useState } from "react";
import { VisitLogDialog } from "./visit-log-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";

interface ClientDetailProps {
  client: Client | null;
  onVisitLogged: (clientId: string, visit: Visit) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleCriticalStatus: (clientId: string) => void;
}

export function ClientDetail({ client, onVisitLogged, onDeleteClient, onToggleCriticalStatus }: ClientDetailProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Card className="w-full max-w-lg text-center py-16">
          <CardHeader>
            <CardTitle>Nenhum Cliente Selecionado</CardTitle>
            <CardDescription>Selecione um cliente na lista à esquerda para ver os detalhes.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const status = getVisitStatus(client.nextVisitDate);
  const sortedVisits = [...client.visits].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <div className="flex items-center gap-4">
                    <CardTitle className="text-2xl">{client.name}</CardTitle>
                    <StatusBadge status={status} />
                    {client.isCritical && <Badge variant="destructive" className="animate-pulse">CRÍTICO</Badge>}
                </div>
                <CardDescription className="mt-1">Unidade: {client.unit}</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant={client.isCritical ? "destructive" : "outline"} 
                    onClick={() => onToggleCriticalStatus(client.id)}
                >
                    <AlertTriangle className="mr-2 h-4 w-4" /> 
                    {client.isCritical ? "Remover Criticidade" : "Marcar como Crítico"}
                 </Button>
                 <Button variant="outline" onClick={() => setLogDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar Visita
                 </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive-outline">
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
                <p>{client.nextVisitDate ? format(client.nextVisitDate, 'PPP', { locale: ptBR }) : 'N/D'}</p>
            </div>
        </div>
        <div>
            <h4 className="text-lg font-semibold mb-2">Histórico Recente</h4>
            {sortedVisits.length > 0 ? (
                <div className="space-y-4">
                    {sortedVisits.slice(0, 2).map(visit => (
                        <div key={visit.id} className="p-4 border rounded-lg">
                            <p className="font-semibold">{format(visit.date, 'PPP', { locale: ptBR })}</p>
                            <p className="text-muted-foreground mt-1 text-sm">{visit.feedback}</p>
                        </div>
                    ))}
                     {sortedVisits.length > 2 && (
                         <Button variant="link" onClick={() => setHistoryDialogOpen(true)}>Ver histórico completo</Button>
                     )}
                </div>
            ): (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                    <p>Nenhuma visita registrada ainda.</p>
                </div>
            )}
        </div>
      </CardContent>

      <VisitLogDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        client={client}
        onVisitLogged={(visit) => {
          onVisitLogged(client.id, visit);
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
