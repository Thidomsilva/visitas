"use client"

import { useState } from "react"
import { MoreHorizontal, History, PlusCircle, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Client, Visit } from "@/lib/types"
import { VisitLogDialog } from './visit-log-dialog';
import { VisitHistoryDialog } from './visit-history-dialog';

interface ClientTableRowActionsProps {
  client: Client;
  onVisitLogged: (clientId: string, visit: Visit) => void;
  onDelete: (clientId: string) => void;
}

export function ClientTableRowActions({ client, onVisitLogged, onDelete }: ClientTableRowActionsProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setLogDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Visita
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHistoryDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Ver Histórico
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus dados de visita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(client.id)} className="bg-destructive hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
