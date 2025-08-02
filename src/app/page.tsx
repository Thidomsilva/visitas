
"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays } from 'date-fns';
import { initialClients } from "@/lib/data";
import { classificationIntervals, type Client, type Visit, type VisitStatus, ClientClassification } from "@/lib/types";
import { getVisitStatus } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Diamond, Star, CalendarClock, XCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ClientList } from "@/components/client-list";
import { ClientDetail } from "@/components/client-detail";
import { CalendarView } from "@/components/calendar-view";
import { generateSchedule } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

type FilterType = "all" | VisitStatus | `class-${ClientClassification}`;
type ViewType = "dashboard" | "calendar";
type UnitFilterType = 'all' | 'LONDRINA' | 'CURITIBA';


function DashboardSkeleton() {
  return (
     <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader onAddClient={() => {}} view="dashboard" onViewChange={() => {}}/>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
        <main className="flex-1 p-6">
           <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-6">
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
            </div>
          <Skeleton className="h-[500px]" />
        </main>
      </div>
    </div>
  )
}


function DashboardPageContent() {
  const [clients, setClients] = useState<Client[]>(() => generateSchedule(initialClients));
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<UnitFilterType>('all');
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("dashboard");

  const clientsForStats = useMemo(() => {
    return unitFilter === 'all' ? clients : clients.filter(c => c.unit === unitFilter);
  }, [clients, unitFilter]);

  const filteredClients = useMemo(() => {
    let sortedClients = [...clientsForStats].sort((a, b) => {
      // Critical clients on top
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;

      const statusA = getVisitStatus(a.nextVisitDate);
      const statusB = getVisitStatus(b.nextVisitDate);

      if (statusA === 'overdue' && statusB !== 'overdue') return -1;
      if (statusB === 'overdue' && statusA !== 'overdue') return 1;

      if (statusA === 'approaching' && statusB !== 'approaching') return -1;
      if (statusB === 'approaching' && statusA !== 'approaching') return 1;

      if (a.nextVisitDate === null) return 1;
      if (b.nextVisitDate === null) return -1;

      if(a.nextVisitDate && b.nextVisitDate) {
        return a.nextVisitDate.getTime() - b.nextVisitDate.getTime();
      }
      return 0;
    });

    if (filter !== 'all') {
      if (filter.startsWith('class-')) {
        const classification = filter.split('-')[1] as ClientClassification;
        sortedClients = sortedClients.filter(client => client.classification === classification);
      } else {
        sortedClients = sortedClients.filter(client => getVisitStatus(client.nextVisitDate) === filter);
      }
    }
    
    if (searchQuery) {
        sortedClients = sortedClients.filter(client => 
            client.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return sortedClients;

  }, [clientsForStats, filter, searchQuery]);

  useEffect(() => {
    if (view === 'dashboard' && filteredClients.length > 0 && !selectedClientId) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, selectedClientId, view]);


  useEffect(() => {
     if (view === 'dashboard' && filteredClients.length > 0 && !filteredClients.find(c => c.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0].id);
    } else if (view === 'dashboard' && filteredClients.length === 0) {
      setSelectedClientId(null);
    }
  }, [filter, clients, selectedClientId, filteredClients, searchQuery, view, unitFilter]);
  

  const handleVisitLogged = (clientId: string, visit: Visit) => {
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;
  
      const updatedClients = [...prevClients];
      const clientToUpdate = { ...updatedClients[clientIndex] };
  
      // Add the new visit and sort
      const sortedVisits = [visit, ...clientToUpdate.visits].sort((a,b) => b.date.getTime() - a.date.getTime());
      
      clientToUpdate.visits = sortedVisits;
      clientToUpdate.lastVisitDate = visit.date;

      // Regenerate the rest of the schedule from this point
      const regeneratedSchedule = generateSchedule(updatedClients, clientIndex);
  
      return regeneratedSchedule;
    });
  };

  const handleAddClient = (newClient: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits' | 'isCritical'>) => {
    const clientToAdd: Client = {
      ...newClient,
      id: crypto.randomUUID(),
      lastVisitDate: null,
      nextVisitDate: null,
      visits: [],
      isCritical: false,
    };
    const newClients = [clientToAdd, ...clients];
    // We need to regenerate the schedule with the new client
    const scheduledClients = generateSchedule(newClients);
    setClients(scheduledClients);
    setSelectedClientId(clientToAdd.id);
  }

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => {
      const newClients = prev.filter(client => client.id !== clientId);
      // Regenerate schedule after deleting
      const scheduledClients = generateSchedule(newClients);
       if (selectedClientId === clientId) {
        setSelectedClientId(scheduledClients.length > 0 ? scheduledClients[0].id : null);
      }
      return scheduledClients;
    });
  }

  const handleToggleCriticalStatus = (clientId: string) => {
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;
  
      const updatedClients = [...prevClients];
      // Create a deep copy of the client to modify
      const clientToUpdate = JSON.parse(JSON.stringify(updatedClients[clientIndex]));
  
      clientToUpdate.isCritical = !clientToUpdate.isCritical;
      
      // To force a reschedule starting from now, we set the last visit to today.
      // This will make the scheduler calculate the next visit from this point.
      clientToUpdate.lastVisitDate = new Date().toISOString();
  
      updatedClients[clientIndex] = clientToUpdate;
  
      // Regenerate the schedule for all clients, as one client's change can affect others.
      const regeneratedSchedule = generateSchedule(updatedClients, 0);
  
      return regeneratedSchedule;
    });
  }

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  const stats = useMemo(() => {
    return clientsForStats.reduce((acc, client) => {
      const status = getVisitStatus(client.nextVisitDate);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<VisitStatus, number>);
  }, [clientsForStats]);

  const classificationStats = useMemo(() => {
    return clientsForStats.reduce((acc, client) => {
      if (!acc[client.classification]) {
        acc[client.classification] = 0;
      }
      acc[client.classification]++;
      return acc;
    }, {} as Record<ClientClassification, number>);
  }, [clientsForStats]);
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(currentFilter => currentFilter === newFilter ? 'all' : newFilter);
  };
  
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader 
            onAddClient={() => setAddClientOpen(true)}
            view={view}
            onViewChange={setView}
        />
        {view === 'dashboard' ? (
          <div className="flex-1 flex overflow-hidden">
            <ClientList
              clients={filteredClients}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              filter={filter}
              onFilterChange={(value) => setFilter(value as FilterType)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              unitFilter={unitFilter}
              onUnitFilterChange={setUnitFilter}
            />
            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
             <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-6">
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-A' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-A')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classe A</CardTitle>
                  <Gem className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['A'] || 0}</div>
                  <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-B' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-B')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classe B</CardTitle>
                  <Diamond className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['B'] || 0}</div>
                   <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-C' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-C')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classe C</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['C'] || 0}</div>
                   <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'approaching' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('approaching')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitas Próximas</CardTitle>
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats['approaching'] || 0}</div>
                   <p className="text-xs text-muted-foreground">próximos 7 dias</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'overdue' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('overdue')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitas Atrasadas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats['overdue'] || 0}</div>
                   <p className="text-xs text-muted-foreground">clientes pendentes</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'on-schedule' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('on-schedule')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitas em Dia</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats['on-schedule'] || 0}</div>
                   <p className="text-xs text-muted-foreground">clientes em dia</p>
                </CardContent>
              </Card>
            </div>
            
            <ClientDetail
              client={selectedClient}
              onVisitLogged={handleVisitLogged}
              onDeleteClient={handleDeleteClient}
              onToggleCriticalStatus={handleToggleCriticalStatus}
            />

            </main>
          </div>
        ) : (
          <CalendarView
            clients={clientsForStats}
            onClientClick={(clientId) => setSelectedClientId(clientId)}
            selectedClientId={selectedClientId}
            onVisitLogged={handleVisitLogged}
            onDeleteClient={handleDeleteClient}
            onToggleCriticalStatus={handleToggleCriticalStatus}
          />
        )}
      </div>
      <AddClientDialog 
        open={isAddClientOpen}
        onOpenChange={setAddClientOpen}
        onClientAdded={handleAddClient}
      />
    </>
  );
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <DashboardSkeleton />;
  }

  return <DashboardPageContent />;
}
