import { Briefcase } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Briefcase className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold text-lg">Visitas Sagacy</span>
        </div>
      </div>
    </header>
  );
}
