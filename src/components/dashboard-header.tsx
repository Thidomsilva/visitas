import { Briefcase, PlusCircle, Settings, LogOut } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";

type ViewType = "dashboard" | "calendar" | "analytics";

interface DashboardHeaderProps {
  onAddClient: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onSeedDatabase: () => void;
  isSeeding: boolean;
}

export function DashboardHeader({ onAddClient, view, onViewChange, onSeedDatabase, isSeeding }: DashboardHeaderProps) {
  const { logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg hidden md:inline">Visitas Sagacy</span>
          </div>
          <Tabs value={view} onValueChange={(value) => onViewChange(value as ViewType)}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="dashboard">Painel</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="analytics">Relatórios</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={onAddClient} size="sm">
              <PlusCircle className="mr-0 md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Adicionar Cliente</span>
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
                     <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
