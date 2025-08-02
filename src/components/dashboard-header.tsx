import { Briefcase, PlusCircle, Settings, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ViewType = "dashboard" | "calendar" | "analytics";

interface DashboardHeaderProps {
  onAddClient: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onSeedDatabase: () => void;
  isSeeding: boolean;
}

export function DashboardHeader({ onAddClient, view, onViewChange, onSeedDatabase, isSeeding }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Visitas Sagacy</span>
          </div>
          <Tabs value={view} onValueChange={(value) => onViewChange(value as ViewType)}>
            <TabsList>
              <TabsTrigger value="dashboard">Painel</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="analytics">Relatórios</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={onAddClient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
                                <span className="text-destructive">Resetar & Popular Banco</span>
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação é irreversível. Todos os clientes e visitas existentes serão permanentemente
                                    deletados. O banco de dados será então populado novamente com a lista inicial de clientes
                                    e a projeção de visitas até o final de 2025.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={onSeedDatabase} disabled={isSeeding} className="bg-destructive hover:bg-destructive/90">
                                {isSeeding ? "Processando..." : "Sim, resetar e popular"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
