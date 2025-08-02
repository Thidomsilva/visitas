"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getVisitStatus } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import type { Client, Visit } from '@/lib/types';
import { User, Calendar, PlusCircle, History, Briefcase } from 'lucide-react';
import { VisitLogDialog } from './visit-log-dialog';
import { VisitHistoryDialog } from './visit-history-dialog';
import { classificationIntervals } from '@/lib/types';
import { ptBR } from 'date-fns/locale';

interface ClientCardProps {
  client: Client;
  onVisitLogged: (clientId: string, visit: Visit) => void;
}

export function ClientCard({ client, onVisitLogged }: ClientCardProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const status = getVisitStatus(client.nextVisitDate);
  const classificationInfo = `Classe ${client.classification} (${classificationIntervals[client.classification]} dias)`;

  return (
    <>
      <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className='max-w-[80%]'>
              <CardTitle className="truncate">{client.name}</CardTitle>
              <CardDescription className="truncate">{client.contact}</CardDescription>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{client.consultant}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{classificationInfo}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              Próxima: {client.nextVisitDate ? format(client.nextVisitDate, 'PPP', { locale: ptBR }) : 'N/D'}
            </span>

          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
            <History className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Histórico</span>
          </Button>
          <Button size="sm" onClick={() => setLogDialogOpen(true)}>
            <PlusCircle className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Registrar Visita</span>
          </Button>
        </CardFooter>
      </Card>
      
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
    </>
  );
}
