
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Client } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { getVisitStatus } from '@/lib/utils';
import { Badge } from './ui/badge';

interface AnalyticsClientListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  clients: Client[];
}

export function AnalyticsClientListDialog({ open, onOpenChange, title, clients }: AnalyticsClientListDialogProps) {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
           <DialogDescription>
            Total de {clients.length} cliente(s) encontrado(s).
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4">
            {clients.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Unidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Próxima Visita</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{client.name}</span>
                          <Badge variant="outline" className="w-fit mt-1">Classe {client.classification}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{client.unit}</TableCell>
                      <TableCell>{client.responsavel}</TableCell>
                       <TableCell>
                        {client.nextVisitDate ? format(client.nextVisitDate, 'dd/MM/yy', { locale: ptBR }) : 'N/D'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getVisitStatus(client.nextVisitDate)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Nenhum cliente para exibir.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    