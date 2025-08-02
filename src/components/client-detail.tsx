
"use client"
import type { Client, Visit } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from "./status-badge";
import { getVisitStatus } from "@/lib/utils";
import { Button } from "./ui/button";
import { PlusCircle, Trash2, AlertTriangle, User, History, Save } from "lucide-react";
import { VisitHistoryDialog } from "./visit-history-dialog";
import { useState, useMemo } from "react";
import { VisitLogDialog } from "./visit-log-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

interface ClientDetailProps {
  client: Client | null;
  onVisitLogged: (clientId: string, visit: Visit) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleCriticalStatus: (clientId: string) => void;
}

function UpcomingVisitItem({ visit, onRegister, client }: { visit: Visit, onRegister: (visitData: Omit<Visit, 'id' | 'date' | 'registeredBy'>) => void, client: Client }) {
    const [isEditing, setIsEditing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [followUp, setFollowUp] = useState('');

    const handleRegister = () => {
        if (!feedback || !followUp) {
            alert("Por favor, preencha os campos de feedback e plano de ação.");
            return;
        }
        onRegister({ feedback, followUp });
        setIsEditing(false);
        setFeedback('');
        setFollowUp('');
    }

    if (!isEditing) {
        return (
            <div className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                    <p className="font-semibold">{format(visit.date, 'PPP', { locale: ptBR })}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{visit.feedback}</p>
                </div>
                <Button onClick={() => setIsEditing(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar
                </Button>
            </div>
        )
    }

    return (
         <div className="p-4 border rounded-lg space-y-4">
             <p className="font-semibold">{format(visit.date, 'PPP', { locale: ptBR })}</p>
            <Textarea 
                placeholder="Feedback / Resumo da visita..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
            />
            <Textarea
                placeholder="Ações de Acompanhamento / Próximos passos..."
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                rows={3}
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button onClick={handleRegister}>
                    <Save className="mr-2 h-4 w-4"/>
                    Salvar Visita
                </Button>
            </div>
        </div>
    )
}


export function ClientDetail({ client, onVisitLogged, onDeleteClient, onToggleCriticalStatus }: ClientDetailProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const status = client ? getVisitStatus(client.nextVisitDate) : 'no-visits';
  
  const futureVisits = useMemo(() => {
    if (!client) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...client.visits]
      .filter(v => v.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [client]);

  const handleQuickRegister = (visitData: Omit<Visit, 'id' | 'date' | 'registeredBy'>) => {
    if (!client) return;
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      date: new Date(), // The visit happens now
      ...visitData,
      registeredBy: client.responsavel,
    };
    onVisitLogged(client.id, newVisit);
  };

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
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold">Próximas Visitas</h4>
                <Button variant="link" onClick={() => setHistoryDialogOpen(true)}>
                    <History className="mr-2 h-4 w-4"/>
                    Ver histórico completo
                </Button>
            </div>
            {futureVisits.length > 0 ? (
                <div className="space-y-4">
                    {futureVisits.slice(0, 2).map(visit => (
                        <UpcomingVisitItem
                            key={visit.id}
                            visit={visit}
                            client={client}
                            onRegister={handleQuickRegister}
                        />
                    ))}
                </div>
            ): (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                    <p>Nenhuma visita futura agendada.</p>
                     <Button variant="link" className="mt-2" onClick={() => setLogDialogOpen(true)}>Registrar uma visita agora?</Button>
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
