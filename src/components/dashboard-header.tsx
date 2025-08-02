import { Briefcase, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface DashboardHeaderProps {
  onAddClient: () => void;
  view: 'dashboard' | 'calendar';
  onViewChange: (view: 'dashboard' | 'calendar') => void;
}

export function DashboardHeader({ onAddClient, view, onViewChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Visitas Sagacy</span>
          </div>
          <Tabs value={view} onValueChange={(value) => onViewChange(value as 'dashboard' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="dashboard">Visão do Painel</TabsTrigger>
              <TabsTrigger value="calendar">Visão de Calendário</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={onAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>
    </header>
  );
}
