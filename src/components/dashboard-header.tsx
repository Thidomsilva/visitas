import { Briefcase, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";

interface DashboardHeaderProps {
  onAddClient: () => void;
}

export function DashboardHeader({ onAddClient }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Briefcase className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold text-lg">Visitas Sagacy</span>
        </div>
        <Button onClick={onAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>
    </header>
  );
}
