import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Visit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface VisitHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  visits: Visit[];
}

export function VisitHistoryDialog({ open, onOpenChange, clientName, visits }: VisitHistoryDialogProps) {
  const sortedVisits = [...visits].sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Visitas para {clientName}</DialogTitle>
           <DialogDescription>
            Um registro de todas as interações e acompanhamentos anteriores.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4">
            {sortedVisits.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Acompanhamento</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVisits.map((visit, index) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(visit.date, 'PPP', { locale: ptBR })}
                        {index === 0 && <Badge variant="secondary" className="ml-2">Última</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{visit.feedback}</TableCell>
                      <TableCell className="text-muted-foreground">{visit.followUp}</TableCell>
                      <TableCell className="text-muted-foreground">{visit.registeredBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Nenhum histórico de visitas disponível para este cliente.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
