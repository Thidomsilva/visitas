import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Client, Visit } from '@/lib/types';
import { getVisitStatus } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { ClientTableRowActions } from './client-table-row-actions';

interface ClientTableProps {
  clients: Client[];
  onVisitLogged: (clientId: string, visit: Visit) => void;
  onDeleteClient: (clientId: string) => void;
}

export function ClientTable({ clients, onVisitLogged, onDeleteClient }: ClientTableProps) {

  if(clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground rounded-lg h-[400px]">
          <p className="text-lg font-semibold">Nenhum cliente encontrado</p>
          <p>Não há clientes que correspondam ao filtro selecionado.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Curva</TableHead>
            <TableHead>Última Visita</TableHead>
            <TableHead>Próxima Visita</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
             const status = getVisitStatus(client.nextVisitDate);
            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.contact}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
                 <TableCell>{client.consultant}</TableCell>
                <TableCell>Classe {client.classification}</TableCell>
                <TableCell>
                  {client.lastVisitDate ? format(client.lastVisitDate, 'PPP', { locale: ptBR }) : 'N/D'}
                </TableCell>
                <TableCell>
                  {client.nextVisitDate ? format(client.nextVisitDate, 'PPP', { locale: ptBR }) : 'N/D'}
                </TableCell>
                <TableCell className="text-right">
                   <ClientTableRowActions 
                      client={client} 
                      onVisitLogged={onVisitLogged} 
                      onDelete={onDeleteClient}
                    />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
